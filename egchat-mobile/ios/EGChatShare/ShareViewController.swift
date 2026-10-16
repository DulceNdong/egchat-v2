import UIKit
import Social
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension
 * Muestra los chats recientes directamente dentro de la extensión,
 * sin necesidad de abrir la app principal.
 * Guarda el contenido en App Group para que la app lo consuma al abrirse.
 */

private let APP_GROUP  = "group.com.jallzstores.egchat"
private let SHARED_KEY = "egchat_shared_content"

// ── Modelo mínimo de chat ────────────────────────────────────────────────────
struct EGChat {
    let id: String
    let name: String
    let avatarUrl: String
}

class ShareViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {

    private var sharedContent: [String: Any]? = nil
    private var chats: [EGChat] = []
    private var filteredChats: [EGChat] = []

    private let headerView   = UIView()
    private let titleLabel   = UILabel()
    private let previewLabel = UILabel()
    private let searchField  = UITextField()
    private let tableView    = UITableView()
    private let loadingView  = UIActivityIndicatorView(style: .large)
    private let cancelBtn    = UIButton(type: .system)

    // EGCHAT color
    private let accent = UIColor(red: 0.0, green: 0.78, blue: 0.63, alpha: 1.0)
    private let bg     = UIColor(red: 0.06, green: 0.08, blue: 0.10, alpha: 1.0)

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        extractContent { [weak self] json in
            self?.sharedContent = json
            DispatchQueue.main.async {
                self?.previewLabel.text = self?.describeContent(json)
            }
        }
        loadChatsFromAppGroup()
    }

    // ── UI ───────────────────────────────────────────────────────────────────

    private func setupUI() {
        view.backgroundColor = bg

        // Header
        headerView.backgroundColor = UIColor(white: 1, alpha: 0.05)
        headerView.translatesAutoresizingMaskIntoConstraints = false

        titleLabel.text = "Compartir en EGChat"
        titleLabel.font = .systemFont(ofSize: 17, weight: .bold)
        titleLabel.textColor = .white
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        previewLabel.text = "Cargando..."
        previewLabel.font = .systemFont(ofSize: 12)
        previewLabel.textColor = accent
        previewLabel.translatesAutoresizingMaskIntoConstraints = false

        cancelBtn.setTitle("✕", for: .normal)
        cancelBtn.setTitleColor(UIColor(white: 1, alpha: 0.5), for: .normal)
        cancelBtn.titleLabel?.font = .systemFont(ofSize: 18)
        cancelBtn.translatesAutoresizingMaskIntoConstraints = false
        cancelBtn.addTarget(self, action: #selector(cancel), for: .touchUpInside)

        // Búsqueda
        searchField.placeholder = "Buscar chat..."
        searchField.backgroundColor = UIColor(white: 1, alpha: 0.07)
        searchField.layer.cornerRadius = 10
        searchField.textColor = .white
        searchField.tintColor = accent
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: 12, height: 0))
        searchField.leftView = paddingView
        searchField.leftViewMode = .always
        searchField.attributedPlaceholder = NSAttributedString(
            string: "Buscar chat...",
            attributes: [.foregroundColor: UIColor(white: 1, alpha: 0.3)]
        )
        searchField.addTarget(self, action: #selector(searchChanged), for: .editingChanged)
        searchField.translatesAutoresizingMaskIntoConstraints = false

        // Tabla
        tableView.backgroundColor = .clear
        tableView.separatorColor = UIColor(white: 1, alpha: 0.06)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(ChatCell.self, forCellReuseIdentifier: "cell")
        tableView.translatesAutoresizingMaskIntoConstraints = false

        // Loading
        loadingView.color = accent
        loadingView.translatesAutoresizingMaskIntoConstraints = false
        loadingView.startAnimating()

        headerView.addSubview(titleLabel)
        headerView.addSubview(previewLabel)
        headerView.addSubview(cancelBtn)
        view.addSubview(headerView)
        view.addSubview(searchField)
        view.addSubview(tableView)
        view.addSubview(loadingView)

        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 72),

            cancelBtn.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            cancelBtn.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -16),
            cancelBtn.widthAnchor.constraint(equalToConstant: 36),
            cancelBtn.heightAnchor.constraint(equalToConstant: 36),

            titleLabel.topAnchor.constraint(equalTo: headerView.topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: cancelBtn.leadingAnchor, constant: -8),

            previewLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 2),
            previewLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
            previewLabel.trailingAnchor.constraint(equalTo: titleLabel.trailingAnchor),

            searchField.topAnchor.constraint(equalTo: headerView.bottomAnchor, constant: 10),
            searchField.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            searchField.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            searchField.heightAnchor.constraint(equalToConstant: 38),

            tableView.topAnchor.constraint(equalTo: searchField.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            loadingView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    // ── Cargar chats desde el App Group (escritos por la app principal) ──────

    private func loadChatsFromAppGroup() {
        // La app principal guarda un JSON con los chats recientes en el App Group
        // cada vez que abre la lista de chats
        let defaults = UserDefaults(suiteName: APP_GROUP)
        if let raw = defaults?.string(forKey: "egchat_recent_chats"),
           let data = raw.data(using: .utf8),
           let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            chats = arr.compactMap { dict -> EGChat? in
                guard let id = dict["id"] as? String,
                      let name = dict["name"] as? String else { return nil }
                return EGChat(id: id, name: name, avatarUrl: dict["avatar"] as? String ?? "")
            }
            filteredChats = chats
            DispatchQueue.main.async {
                self.loadingView.stopAnimating()
                self.loadingView.isHidden = true
                self.tableView.reloadData()
            }
        } else {
            // No hay chats cacheados — mostrar mensaje
            DispatchQueue.main.async {
                self.loadingView.stopAnimating()
                self.loadingView.isHidden = true
                self.showNoChatsCached()
            }
        }
    }

    private func showNoChatsCached() {
        let label = UILabel()
        label.text = "Abre EGCHAT primero para\nver tus chats aquí"
        label.numberOfLines = 2
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 15)
        label.textColor = UIColor(white: 1, alpha: 0.35)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
        ])
    }

    // ── TableView ────────────────────────────────────────────────────────────

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        filteredChats.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! ChatCell
        cell.configure(with: filteredChats[indexPath.row], accent: accent)
        return cell
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat { 68 }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let chat = filteredChats[indexPath.row]
        sendToChat(chat)
    }

    // ── Enviar al chat seleccionado ──────────────────────────────────────────

    private func sendToChat(_ chat: EGChat) {
        guard let content = sharedContent else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        // Añadir chatId al contenido
        var contentWithChat = content
        contentWithChat["targetChatId"] = chat.id
        contentWithChat["targetChatName"] = chat.name

        // Guardar en App Group
        if let data = try? JSONSerialization.data(withJSONObject: contentWithChat),
           let string = String(data: data, encoding: .utf8) {
            UserDefaults(suiteName: APP_GROUP)?.set(string, forKey: SHARED_KEY)
            UserDefaults(suiteName: APP_GROUP)?.synchronize()
        }

        // Intentar abrir la app
        if let url = URL(string: "egchat-share://open") {
            extensionContext?.open(url) { [weak self] _ in
                self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        } else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    // ── Búsqueda ─────────────────────────────────────────────────────────────

    @objc private func searchChanged() {
        let q = searchField.text?.lowercased() ?? ""
        filteredChats = q.isEmpty ? chats : chats.filter { $0.name.lowercased().contains(q) }
        tableView.reloadData()
    }

    @objc private func cancel() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    // ── Extraer contenido compartido ─────────────────────────────────────────

    private func extractContent(completion: @escaping ([String: Any]?) -> Void) {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let provider = item.attachments?.first
        else { completion(nil); return }

        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                var uri: String? = nil
                if let url = item as? URL { uri = url.absoluteString }
                else if let img = item as? UIImage, let data = img.jpegData(compressionQuality: 0.85) {
                    let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jpg")
                    try? data.write(to: tmp)
                    uri = tmp.absoluteString
                }
                completion(uri.map { ["type": "image", "uri": $0, "mimeType": "image/jpeg"] })
            }; return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { item, _ in
                let uri = (item as? URL)?.absoluteString
                completion(uri.map { ["type": "video", "uri": $0, "mimeType": "video/mp4"] })
            }; return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.url.identifier) { item, _ in
                let text = (item as? URL)?.absoluteString ?? (item as? String) ?? ""
                completion(["type": "text", "text": text])
            }; return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { item, _ in
                completion(["type": "text", "text": item as? String ?? ""])
            }; return
        }
        completion(nil)
    }

    private func describeContent(_ json: [String: Any]?) -> String {
        guard let type = json?["type"] as? String else { return "" }
        switch type {
        case "image": return "📷 Foto"
        case "video": return "🎥 Video"
        case "text":  return "\"\((json?["text"] as? String ?? "").prefix(40))\""
        default:      return "Archivo"
        }
    }
}

// ── Celda de chat ────────────────────────────────────────────────────────────

class ChatCell: UITableViewCell {
    private let avatarView = UIImageView()
    private let nameLabel  = UILabel()
    private let sendBtn    = UIButton(type: .system)

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        backgroundColor = .clear
        selectionStyle = .default
        let bg = UIView()
        bg.backgroundColor = UIColor(white: 1, alpha: 0.04)
        selectedBackgroundView = bg

        avatarView.layer.cornerRadius = 24
        avatarView.clipsToBounds = true
        avatarView.backgroundColor = UIColor(red: 0.0, green: 0.78, blue: 0.63, alpha: 0.3)
        avatarView.contentMode = .scaleAspectFill
        avatarView.translatesAutoresizingMaskIntoConstraints = false

        nameLabel.font = .systemFont(ofSize: 15, weight: .medium)
        nameLabel.textColor = .white
        nameLabel.translatesAutoresizingMaskIntoConstraints = false

        contentView.addSubview(avatarView)
        contentView.addSubview(nameLabel)

        NSLayoutConstraint.activate([
            avatarView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            avatarView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            avatarView.widthAnchor.constraint(equalToConstant: 48),
            avatarView.heightAnchor.constraint(equalToConstant: 48),

            nameLabel.leadingAnchor.constraint(equalTo: avatarView.trailingAnchor, constant: 12),
            nameLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            nameLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(with chat: EGChat, accent: UIColor) {
        nameLabel.text = chat.name
        // Inicial como fallback
        let initial = UILabel()
        initial.text = String(chat.name.prefix(1)).uppercased()
        initial.font = .systemFont(ofSize: 20, weight: .bold)
        initial.textColor = .white
        initial.textAlignment = .center
        initial.frame = avatarView.bounds
        initial.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        avatarView.subviews.forEach { $0.removeFromSuperview() }
        avatarView.addSubview(initial)

        if !chat.avatarUrl.isEmpty, let url = URL(string: chat.avatarUrl) {
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                guard let data = data, let img = UIImage(data: data) else { return }
                DispatchQueue.main.async {
                    self?.avatarView.image = img
                    initial.removeFromSuperview()
                }
            }.resume()
        }
    }
}
