import UIKit
import Social
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension
 * Recibe contenido compartido desde otras apps (fotos, videos, links, texto)
 * y lo pasa a la app principal via App Group.
 *
 * App Group: group.com.jallzstores.egchat
 */

private let APP_GROUP  = "group.com.jallzstores.egchat"
private let SHARED_KEY = "egchat_shared_content"
private let APP_SCHEME = "egchat-share://open"

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        extractSharedContent { [weak self] json in
            guard let self = self else { return }
            if let json = json { self.saveToAppGroup(json) }
            DispatchQueue.main.async { self.openMainApp() }
        }
    }

    // ── Extraer contenido ────────────────────────────────────────────────────

    private func extractSharedContent(completion: @escaping ([String: Any]?) -> Void) {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let provider = item.attachments?.first
        else { completion(nil); return }

        // Imagen
        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                var uri: String? = nil
                if let url = item as? URL { uri = url.absoluteString }
                else if let img = item as? UIImage, let data = img.pngData() {
                    let tmp = FileManager.default.temporaryDirectory
                        .appendingPathComponent(UUID().uuidString + ".png")
                    try? data.write(to: tmp)
                    uri = tmp.absoluteString
                }
                completion(uri.map { ["type": "image", "uri": $0, "mimeType": "image/jpeg"] })
            }
            return
        }

        // Video
        if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { item, _ in
                let uri = (item as? URL)?.absoluteString
                completion(uri.map { ["type": "video", "uri": $0, "mimeType": "video/mp4"] })
            }
            return
        }

        // URL / link
        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.url.identifier) { item, _ in
                let text = (item as? URL)?.absoluteString ?? (item as? String) ?? ""
                completion(["type": "text", "text": text])
            }
            return
        }

        // Texto plano
        if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { item, _ in
                let text = item as? String ?? ""
                completion(["type": "text", "text": text])
            }
            return
        }

        completion(nil)
    }

    // ── Guardar en App Group ─────────────────────────────────────────────────

    private func saveToAppGroup(_ json: [String: Any]) {
        guard let data   = try? JSONSerialization.data(withJSONObject: json),
              let string = String(data: data, encoding: .utf8)
        else { return }
        let defaults = UserDefaults(suiteName: APP_GROUP)
        defaults?.set(string, forKey: SHARED_KEY)
        defaults?.synchronize()
    }

    // ── Abrir la app principal ───────────────────────────────────────────────

    private func openMainApp() {
        guard let url = URL(string: APP_SCHEME) else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        var responder: UIResponder? = self
        while responder != nil {
            if let app = responder as? UIApplication {
                app.open(url)
                break
            }
            responder = responder?.next
        }
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
