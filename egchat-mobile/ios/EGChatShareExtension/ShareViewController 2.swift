import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension
 * Captura contenido compartido desde otras apps y lo guarda en el App Group.
 * App Group: group.com.egchat.app  |  Clave: "pendingSharedContent"
 */
class ShareViewController: UIViewController {

    private let appGroupId = "group.com.egchat.app"
    private let appScheme  = "egchat://share"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        processSharedContent()
    }

    // ── Procesamiento ──────────────────────────────────────────────────────────

    private func processSharedContent() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else { cancel(); return }

        if attachments.count > 1 {
            processMultipleItems(attachments)
        } else if let provider = attachments.first {
            processSingleProvider(provider)
        } else {
            cancel()
        }
    }

    private func processSingleProvider(_ provider: NSItemProvider) {
        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] item, _ in
                guard let self = self else { return }
                if let url = item as? URL {
                    self.saveAndOpen(["type": "image", "uri": url.absoluteString, "mimeType": "image/jpeg"])
                } else if let image = item as? UIImage,
                          let data = image.jpegData(compressionQuality: 0.85) {
                    let savedURL = self.saveDataToAppGroup(data, ext: "jpg")
                    self.saveAndOpen(["type": "image", "uri": savedURL?.absoluteString ?? "", "mimeType": "image/jpeg"])
                } else { self.cancel() }
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { [weak self] item, _ in
                guard let self = self, let url = item as? URL else { self?.cancel(); return }
                self.saveAndOpen(["type": "video", "uri": url.absoluteString, "mimeType": "video/mp4"])
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.audio.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.audio.identifier) { [weak self] item, _ in
                guard let self = self, let url = item as? URL else { self?.cancel(); return }
                self.saveAndOpen(["type": "audio", "uri": url.absoluteString, "mimeType": "audio/mpeg"])
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, _ in
                guard let self = self else { return }
                let text = (item as? URL)?.absoluteString ?? ""
                self.saveAndOpen(["type": "text", "text": text])
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] item, _ in
                guard let self = self else { return }
                self.saveAndOpen(["type": "text", "text": (item as? String) ?? ""])
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.data.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.data.identifier) { [weak self] item, _ in
                guard let self = self, let url = item as? URL else { self?.cancel(); return }
                self.saveAndOpen(["type": "file", "uri": url.absoluteString, "mimeType": "application/octet-stream"])
            }
        } else {
            cancel()
        }
    }

    private func processMultipleItems(_ providers: [NSItemProvider]) {
        var files: [[String: String]] = []
        let group = DispatchGroup()

        for provider in providers {
            group.enter()
            if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                provider.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] item, _ in
                    defer { group.leave() }
                    guard let self = self else { return }
                    if let url = item as? URL {
                        files.append(["type": "image", "uri": url.absoluteString, "mimeType": "image/jpeg"])
                    } else if let image = item as? UIImage,
                              let data = image.jpegData(compressionQuality: 0.85),
                              let savedURL = self.saveDataToAppGroup(data, ext: "jpg") {
                        files.append(["type": "image", "uri": savedURL.absoluteString, "mimeType": "image/jpeg"])
                    }
                }
            } else if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
                provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { [weak self] item, _ in
                    defer { group.leave() }
                    guard let self = self else { return }
                    if let url = item as? URL {
                        files.append(["type": "video", "uri": url.absoluteString, "mimeType": "video/mp4"])
                    }
                    _ = self
                }
            } else {
                group.leave()
            }
        }

        group.notify(queue: .main) { [weak self] in
            guard let self = self else { return }
            if files.isEmpty { self.cancel() }
            else if files.count == 1 { self.saveAndOpen(files[0]) }
            else { self.saveAndOpen(["type": "multiple", "files": self.encodeFiles(files)]) }
        }
    }

    // ── Persistencia ──────────────────────────────────────────────────────────

    private func saveAndOpen(_ content: [String: String]) {
        if let defaults = UserDefaults(suiteName: appGroupId),
           let data = try? JSONSerialization.data(withJSONObject: content),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: "pendingSharedContent")
            defaults.synchronize()
        }
        openMainApp()
    }

    private func saveDataToAppGroup(_ data: Data, ext: String) -> URL? {
        guard let container = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else { return nil }
        let url = container.appendingPathComponent("shared_\(UUID().uuidString).\(ext)")
        try? data.write(to: url)
        return url
    }

    private func encodeFiles(_ files: [[String: String]]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: files),
              let str = String(data: data, encoding: .utf8) else { return "[]" }
        return str
    }

    // ── Navegación ────────────────────────────────────────────────────────────

    private func openMainApp() {
        guard let url = URL(string: appScheme) else {
            extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        var responder: UIResponder? = self
        while responder != nil {
            if let app = responder as? UIApplication {
                app.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }

    private func cancel() {
        extensionContext?.cancelRequest(withError: NSError(
            domain: "com.egchat.share", code: -1,
            userInfo: [NSLocalizedDescriptionKey: "No se pudo procesar el contenido"]
        ))
    }
}
