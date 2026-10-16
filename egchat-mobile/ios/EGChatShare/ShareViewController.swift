import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension (iOS)
 *
 * Aparece en el Share Sheet del sistema cuando el usuario comparte
 * fotos, videos, links o texto desde cualquier app.
 *
 * INSTALACIÓN EN XCODE (pasos manuales — no automatizable via Expo):
 * 1. Xcode → File → New → Target → Share Extension → nombre: "EGChatShare"
 * 2. Copiar este archivo a ios/EGChatShare/ShareViewController.swift
 * 3. Target EGChatShare → Signing & Capabilities → App Groups → añadir:
 *    "group.com.egchat.app"
 * 4. Target principal EGCHAT → Signing & Capabilities → App Groups → añadir:
 *    "group.com.egchat.app"
 * 5. Target EGChatShare → Info.plist → NSExtension → NSExtensionActivationRule:
 *    Cambiar por NSExtensionActivationSupportsImageWithMaxCount = 10
 *    + NSExtensionActivationSupportsWebURLWithMaxCount = 1
 *    + NSExtensionActivationSupportsText = true
 * 6. App Group identifier para UserDefaults ya está en este archivo como
 *    "group.com.egchat.app"
 *
 * RESULTADO: EGCHAT aparece en el share sheet del sistema con sus contactos
 * recientes (la selección del chat se hace dentro de la app al abrirse).
 */

private let APP_GROUP = "group.com.egchat.app"
private let SHARED_KEY = "egchat_shared_content"
private let APP_SCHEME = "egchat-share://open"

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // No mostramos UI propia — procesamos y abrimos la app directamente
        extractSharedContent { [weak self] json in
            guard let self = self else { return }
            if let json = json {
                self.saveToAppGroup(json)
            }
            DispatchQueue.main.async {
                self.openMainApp()
            }
        }
    }

    // ── Extraer el contenido compartido ──────────────────────────────────────

    private func extractSharedContent(completion: @escaping ([String: Any]?) -> Void) {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments   = extensionItem.attachments, !attachments.isEmpty
        else {
            completion(nil); return
        }

        // Intentar imagen primero, luego video, luego URL, luego texto
        let provider = attachments.first!

        // Imagen
        let imageType = UTType.image.identifier
        if provider.hasItemConformingToTypeIdentifier(imageType) {
            provider.loadItem(forTypeIdentifier: imageType, options: nil) { item, _ in
                var uri: String? = nil
                if let url = item as? URL    { uri = url.absoluteString }
                if let img = item as? UIImage, let data = img.pngData() {
                    let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".png")
                    try? data.write(to: tmp)
                    uri = tmp.absoluteString
                }
                completion(uri.map { ["type": "image", "uri": $0, "mimeType": "image/jpeg"] })
            }
            return
        }

        // Video
        let videoType = UTType.movie.identifier
        if provider.hasItemConformingToTypeIdentifier(videoType) {
            provider.loadItem(forTypeIdentifier: videoType, options: nil) { item, _ in
                let uri = (item as? URL)?.absoluteString
                completion(uri.map { ["type": "video", "uri": $0, "mimeType": "video/mp4"] })
            }
            return
        }

        // URL / link
        let urlType = UTType.url.identifier
        if provider.hasItemConformingToTypeIdentifier(urlType) {
            provider.loadItem(forTypeIdentifier: urlType, options: nil) { item, _ in
                let text = (item as? URL)?.absoluteString ?? (item as? String) ?? ""
                completion(["type": "text", "text": text])
            }
            return
        }

        // Texto plano
        let textType = UTType.plainText.identifier
        if provider.hasItemConformingToTypeIdentifier(textType) {
            provider.loadItem(forTypeIdentifier: textType, options: nil) { item, _ in
                let text = item as? String ?? ""
                completion(["type": "text", "text": text])
            }
            return
        }

        completion(nil)
    }

    // ── Guardar en App Group (la app principal lo lee al abrirse) ─────────────

    private func saveToAppGroup(_ json: [String: Any]) {
        guard let data   = try? JSONSerialization.data(withJSONObject: json),
              let string = String(data: data, encoding: .utf8)
        else { return }
        UserDefaults(suiteName: APP_GROUP)?.set(string, forKey: SHARED_KEY)
        UserDefaults(suiteName: APP_GROUP)?.synchronize()
    }

    // ── Abrir la app principal via URL scheme ─────────────────────────────────

    private func openMainApp() {
        guard let url = URL(string: APP_SCHEME) else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        // Abrir EGCHAT
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url)
                break
            }
            responder = responder?.next
        }
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
