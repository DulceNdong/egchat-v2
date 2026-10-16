import UIKit
import Social
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension
 * Guarda el contenido en App Group y muestra feedback al usuario.
 * La app principal lo consume al abrirse via deep link.
 *
 * App Group: group.com.jallzstores.egchat
 */

private let APP_GROUP  = "group.com.jallzstores.egchat"
private let SHARED_KEY = "egchat_shared_content"

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.06, green: 0.08, blue: 0.10, alpha: 1.0)

        extractSharedContent { [weak self] json in
            guard let self = self else { return }
            if let json = json {
                self.saveToAppGroup(json)
            }
            DispatchQueue.main.async {
                self.showSuccessAndOpen(hasContent: json != nil)
            }
        }
    }

    // ── Extraer contenido ────────────────────────────────────────────────────

    private func extractSharedContent(completion: @escaping ([String: Any]?) -> Void) {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let provider = item.attachments?.first
        else { completion(nil); return }

        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                var uri: String? = nil
                if let url = item as? URL { uri = url.absoluteString }
                else if let img = item as? UIImage, let data = img.jpegData(compressionQuality: 0.85) {
                    let tmp = FileManager.default.temporaryDirectory
                        .appendingPathComponent(UUID().uuidString + ".jpg")
                    try? data.write(to: tmp)
                    uri = tmp.absoluteString
                }
                completion(uri.map { ["type": "image", "uri": $0, "mimeType": "image/jpeg"] })
            }
            return
        }

        if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { item, _ in
                let uri = (item as? URL)?.absoluteString
                completion(uri.map { ["type": "video", "uri": $0, "mimeType": "video/mp4"] })
            }
            return
        }

        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.url.identifier) { item, _ in
                let text = (item as? URL)?.absoluteString ?? (item as? String) ?? ""
                completion(["type": "text", "text": text])
            }
            return
        }

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

    // ── Mostrar feedback y abrir EGCHAT ──────────────────────────────────────

    private func showSuccessAndOpen(hasContent: Bool) {
        // Ícono check
        let icon = UILabel()
        icon.text = "✓"
        icon.font = .systemFont(ofSize: 48, weight: .bold)
        icon.textColor = UIColor(red: 0.0, green: 0.78, blue: 0.63, alpha: 1.0)
        icon.textAlignment = .center
        icon.translatesAutoresizingMaskIntoConstraints = false

        // Texto
        let label = UILabel()
        label.text = hasContent ? "Listo para compartir en EGCHAT" : "Abre EGCHAT para continuar"
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.textColor = .white
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false

        // Botón abrir
        let button = UIButton(type: .system)
        button.setTitle("Abrir EGCHAT", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 16, weight: .semibold)
        button.backgroundColor = UIColor(red: 0.0, green: 0.78, blue: 0.63, alpha: 1.0)
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 24
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(openEGChat), for: .touchUpInside)

        // Botón cancelar
        let cancel = UIButton(type: .system)
        cancel.setTitle("Cancelar", for: .normal)
        cancel.titleLabel?.font = .systemFont(ofSize: 14)
        cancel.setTitleColor(UIColor.white.withAlphaComponent(0.5), for: .normal)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        cancel.addTarget(self, action: #selector(cancelShare), for: .touchUpInside)

        view.addSubview(icon)
        view.addSubview(label)
        view.addSubview(button)
        view.addSubview(cancel)

        NSLayoutConstraint.activate([
            icon.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            icon.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -60),

            label.topAnchor.constraint(equalTo: icon.bottomAnchor, constant: 16),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),

            button.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 32),
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.widthAnchor.constraint(equalToConstant: 220),
            button.heightAnchor.constraint(equalToConstant: 48),

            cancel.topAnchor.constraint(equalTo: button.bottomAnchor, constant: 16),
            cancel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }

    @objc private func openEGChat() {
        // Abrir EGCHAT via URL scheme usando responder chain
        guard let url = URL(string: "egchat-share://open") else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        // En iOS 16+ podemos usar open(_:options:completionHandler:) via responder chain
        var responder: UIResponder? = self
        while let r = responder {
            if let app = r as? UIApplication {
                app.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = r.next
        }
        // Fallback: usar openURL selector
        let sel = sel_registerName("openURL:")
        var found = false
        var resp: UIResponder? = self
        while let r = resp {
            if r.responds(to: Selector(("openURL:"))) {
                r.perform(Selector(("openURL:")), with: url)
                found = true
                break
            }
            resp = r.next
        }
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    @objc private func cancelShare() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
