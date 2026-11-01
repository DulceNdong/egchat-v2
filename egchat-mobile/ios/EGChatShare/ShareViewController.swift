import UIKit
import Social
import UniformTypeIdentifiers

/**
 * EGChat — Share Extension
 * Carga los chats directamente desde la API del servidor.
 * Diseño con colores y estilo de la app EGCHAT.
 */

private let APP_GROUP   = "group.com.jallzstores.egchat"
private let SHARED_KEY  = "egchat_shared_content"
private let TOKEN_KEY   = "egchat_auth_token"
private let API_BASE    = "https://egchat-api-xlxj.onrender.com"
private let EGCHAT_GREEN = UIColor(red: 0.0, green: 0.784, blue: 0.627, alpha: 1.0)
private let BG_COLOR     = UIColor(red: 0.071, green: 0.086, blue: 0.106, alpha: 1.0)
private let CARD_COLOR   = UIColor(red: 0.11, green: 0.13, blue: 0.16, alpha: 1.0)
private let TEXT_COLOR   = UIColor.white
private let SUB_COLOR    = UIColor(white: 1, alpha: 0.45)

struct EGChatItem {
    let id: String
    let name: String
    let avatarUrl: String
    let lastMessage: String
    let isGroup: Bool
}

class ShareViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, UISearchBarDelegate {

    private var sharedContent: [String: Any]? = nil
    private var chats: [EGChatItem] = []
    private var filtered: [EGChatItem] = []
    private var isLoading = true

    // UI
    private let headerBg    = UIView()
    private let logoLabel   = UILabel()
    private let subtitleLbl = UILabel()
    private let previewRow  = UIView()
    private let previewIcon = UILabel()
    private let previewLbl  = UILabel()
    private let closeBtn    = UIButton(type: .system)
    private let searchBar   = UISearchBar()
    private let tableView   = UITableView()
    private let spinner     = UIActivityIndicatorView(style: .medium)
    private let emptyLabel  = UILabel()
    private let divider     = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        extractContent { [weak self] json in
            self?.sharedContent = json
            DispatchQueue.main.async { self?.updatePreview(json) }
        }
        loadChats()
    }

    // ── UI Setup ─────────────────────────────────────────────────────────────

    private func setupUI() {
        view.backgroundColor = BG_COLOR

        // Header con gradiente
        headerBg.backgroundColor = UIColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 1.0)
        headerBg.translatesAutoresizingMaskIntoConstraints = false

        // Logo EGCHAT
        logoLabel.text = "EGChat"
        logoLabel.font = .systemFont(ofSize: 20, weight: .bold)
        logoLabel.textColor = EGCHAT_GREEN
        logoLabel.translatesAutoresizingMaskIntoConstraints = false

        subtitleLbl.text = "Compartir con..."
        subtitleLbl.font = .systemFont(ofSize: 13)
        subtitleLbl.textColor = SUB_COLOR
        subtitleLbl.translatesAutoresizingMaskIntoConstraints = false

        // Botón cerrar
        let closeConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let closeIcon = UIImage(systemName: "xmark", withConfiguration: closeConfig)
        closeBtn.setImage(closeIcon?.withTintColor(SUB_COLOR, renderingMode: .alwaysOriginal), for: .normal)
        closeBtn.backgroundColor = UIColor(white: 1, alpha: 0.08)
        closeBtn.layer.cornerRadius = 16
        closeBtn.translatesAutoresizingMaskIntoConstraints = false
        closeBtn.addTarget(self, action: #selector(cancel), for: .touchUpInside)

        // Preview del contenido a compartir
        previewRow.backgroundColor = UIColor(red: 0.0, green: 0.784, blue: 0.627, alpha: 0.1)
        previewRow.layer.cornerRadius = 10
        previewRow.translatesAutoresizingMaskIntoConstraints = false

        previewIcon.font = .systemFont(ofSize: 16)
        previewIcon.translatesAutoresizingMaskIntoConstraints = false

        previewLbl.font = .systemFont(ofSize: 13, weight: .medium)
        previewLbl.textColor = EGCHAT_GREEN
        previewLbl.translatesAutoresizingMaskIntoConstraints = false

        // Separador
        divider.backgroundColor = UIColor(white: 1, alpha: 0.06)
        divider.translatesAutoresizingMaskIntoConstraints = false

        // Search bar estilo EGCHAT
        searchBar.placeholder = "Buscar chat o persona..."
        searchBar.barTintColor = BG_COLOR
        searchBar.backgroundColor = BG_COLOR
        searchBar.searchBarStyle = .minimal
        searchBar.delegate = self
        if let tf = searchBar.value(forKey: "searchField") as? UITextField {
            tf.backgroundColor = UIColor(white: 1, alpha: 0.06)
            tf.textColor = TEXT_COLOR
            tf.tintColor = EGCHAT_GREEN
            tf.attributedPlaceholder = NSAttributedString(
                string: "Buscar chat o persona...",
                attributes: [.foregroundColor: SUB_COLOR]
            )
            // Icono de búsqueda en verde
            if let icon = tf.leftView as? UIImageView {
                icon.tintColor = SUB_COLOR
            }
        }
        searchBar.translatesAutoresizingMaskIntoConstraints = false

        // Tabla
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(EGChatShareCell.self, forCellReuseIdentifier: "cell")
        tableView.contentInset = UIEdgeInsets(top: 4, left: 0, bottom: 24, right: 0)
        tableView.translatesAutoresizingMaskIntoConstraints = false

        // Spinner
        spinner.color = EGCHAT_GREEN
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()

        // Empty state
        emptyLabel.text = "No se encontraron chats"
        emptyLabel.textColor = SUB_COLOR
        emptyLabel.font = .systemFont(ofSize: 15)
        emptyLabel.textAlignment = .center
        emptyLabel.isHidden = true
        emptyLabel.translatesAutoresizingMaskIntoConstraints = false

        // Agregar vistas
        previewRow.addSubview(previewIcon)
        previewRow.addSubview(previewLbl)
        headerBg.addSubview(logoLabel)
        headerBg.addSubview(subtitleLbl)
        headerBg.addSubview(closeBtn)
        headerBg.addSubview(previewRow)
        view.addSubview(headerBg)
        view.addSubview(divider)
        view.addSubview(searchBar)
        view.addSubview(tableView)
        view.addSubview(spinner)
        view.addSubview(emptyLabel)

        NSLayoutConstraint.activate([
            headerBg.topAnchor.constraint(equalTo: view.topAnchor),
            headerBg.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerBg.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            closeBtn.topAnchor.constraint(equalTo: headerBg.topAnchor, constant: 16),
            closeBtn.trailingAnchor.constraint(equalTo: headerBg.trailingAnchor, constant: -16),
            closeBtn.widthAnchor.constraint(equalToConstant: 32),
            closeBtn.heightAnchor.constraint(equalToConstant: 32),

            logoLabel.topAnchor.constraint(equalTo: headerBg.topAnchor, constant: 18),
            logoLabel.leadingAnchor.constraint(equalTo: headerBg.leadingAnchor, constant: 20),

            subtitleLbl.topAnchor.constraint(equalTo: logoLabel.bottomAnchor, constant: 2),
            subtitleLbl.leadingAnchor.constraint(equalTo: logoLabel.leadingAnchor),

            previewRow.topAnchor.constraint(equalTo: subtitleLbl.bottomAnchor, constant: 12),
            previewRow.leadingAnchor.constraint(equalTo: headerBg.leadingAnchor, constant: 16),
            previewRow.trailingAnchor.constraint(equalTo: headerBg.trailingAnchor, constant: -16),
            previewRow.heightAnchor.constraint(equalToConstant: 36),
            previewRow.bottomAnchor.constraint(equalTo: headerBg.bottomAnchor, constant: -12),

            previewIcon.centerYAnchor.constraint(equalTo: previewRow.centerYAnchor),
            previewIcon.leadingAnchor.constraint(equalTo: previewRow.leadingAnchor, constant: 12),

            previewLbl.centerYAnchor.constraint(equalTo: previewRow.centerYAnchor),
            previewLbl.leadingAnchor.constraint(equalTo: previewIcon.trailingAnchor, constant: 8),
            previewLbl.trailingAnchor.constraint(equalTo: previewRow.trailingAnchor, constant: -12),

            divider.topAnchor.constraint(equalTo: headerBg.bottomAnchor),
            divider.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            divider.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            divider.heightAnchor.constraint(equalToConstant: 1),

            searchBar.topAnchor.constraint(equalTo: divider.bottomAnchor, constant: 8),
            searchBar.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8),
            searchBar.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -8),

            tableView.topAnchor.constraint(equalTo: searchBar.bottomAnchor, constant: 4),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: 40),

            emptyLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emptyLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: 40),
            emptyLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            emptyLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
        ])
    }

    private func updatePreview(_ json: [String: Any]?) {
        guard let json = json else { return }
        let type = json["type"] as? String ?? "text"
        switch type {
        case "image":
            previewIcon.text = "🖼"
            previewLbl.text  = "Foto"
        case "video":
            previewIcon.text = "🎬"
            previewLbl.text  = "Video"
        case "text":
            previewIcon.text = "💬"
            previewLbl.text  = (json["text"] as? String)?.prefix(50).description ?? "Texto"
        case "file":
            previewIcon.text = "📄"
            previewLbl.text  = "Archivo"
        default:
            previewIcon.text = "📎"
            previewLbl.text  = "Contenido"
        }
    }

    // ── Cargar chats desde la API ────────────────────────────────────────────

    private func loadChats() {
        // 1. Intentar desde App Group (cache local)
        let defaults = UserDefaults(suiteName: APP_GROUP)
        if let raw = defaults?.string(forKey: "egchat_recent_chats"),
           let data = raw.data(using: .utf8),
           let arr  = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            parseChats(arr)
            return
        }

        // 2. Fallback: cargar desde la API directamente
        guard let token = defaults?.string(forKey: TOKEN_KEY) ?? getTokenFromKeychain(),
              let url = URL(string: "\(API_BASE)/api/chats") else {
            showEmpty("Abre EGChat primero para ver tus chats")
            return
        }

        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 10

        URLSession.shared.dataTask(with: req) { [weak self] data, _, err in
            guard let self = self else { return }
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                self.parseChats(json)
            } else {
                self.showEmpty("No se pudieron cargar los chats")
            }
        }.resume()
    }

    private func parseChats(_ arr: [[String: Any]]) {
        chats = arr.compactMap { dict -> EGChatItem? in
            guard let id = dict["id"] as? String else { return nil }
            let type    = dict["type"] as? String ?? "private"
            let isGroup = type == "group"
            let name    = (dict["name"] as? String) ?? "Chat"
            let avatar  = (dict["avatar_url"] as? String) ?? (dict["avatar"] as? String) ?? ""
            let last    = (dict["last_message"] as? [String: Any])?["text"] as? String ?? ""
            // Para chats privados intentar sacar nombre del participante
            let chatName: String
            if !isGroup, let parts = dict["participants"] as? [[String: Any]] {
                let other = parts.first { ($0["user_id"] as? String) != nil }
                chatName = other?["full_name"] as? String
                    ?? (other?["users"] as? [String: Any])?["full_name"] as? String
                    ?? name
            } else {
                chatName = name
            }
            return EGChatItem(id: id, name: chatName, avatarUrl: avatar, lastMessage: last, isGroup: isGroup)
        }
        filtered = chats
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.spinner.stopAnimating()
            self.spinner.isHidden = true
            self.tableView.reloadData()
            if self.chats.isEmpty { self.showEmpty("No tienes chats todavía") }
        }
    }

    private func showEmpty(_ msg: String) {
        DispatchQueue.main.async { [weak self] in
            self?.spinner.stopAnimating()
            self?.spinner.isHidden = true
            self?.emptyLabel.text = msg
            self?.emptyLabel.isHidden = false
        }
    }

    private func getTokenFromKeychain() -> String? {
        // Intentar leer el token desde UserDefaults estándar (AsyncStorage de RN)
        // AsyncStorage de React Native usa un archivo SQLite en el sandbox de la app
        // pero la extensión no puede acceder a él — solo podemos leer del App Group
        return nil
    }

    // ── TableView ────────────────────────────────────────────────────────────

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        filtered.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! EGChatShareCell
        cell.configure(with: filtered[indexPath.row])
        return cell
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat { 72 }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        sendToChat(filtered[indexPath.row])
    }

    // ── Búsqueda ─────────────────────────────────────────────────────────────

    func searchBar(_ searchBar: UISearchBar, textDidChange text: String) {
        filtered = text.isEmpty ? chats : chats.filter {
            $0.name.lowercased().contains(text.lowercased())
        }
        tableView.reloadData()
        emptyLabel.isHidden = !filtered.isEmpty || isLoading
    }

    // ── Enviar al chat ────────────────────────────────────────────────────────

    private func sendToChat(_ chat: EGChatItem) {
        guard var content = sharedContent else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        content["targetChatId"]   = chat.id
        content["targetChatName"] = chat.name

        if let data = try? JSONSerialization.data(withJSONObject: content),
           let str  = String(data: data, encoding: .utf8) {
            UserDefaults(suiteName: APP_GROUP)?.set(str, forKey: SHARED_KEY)
            UserDefaults(suiteName: APP_GROUP)?.synchronize()
        }

        if let url = URL(string: "egchat-share://open") {
            extensionContext?.open(url) { [weak self] _ in
                self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        } else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    // ── Extraer contenido compartido ─────────────────────────────────────────

    private func extractContent(completion: @escaping ([String: Any]?) -> Void) {
        guard let item     = extensionContext?.inputItems.first as? NSExtensionItem,
              let provider = item.attachments?.first else { completion(nil); return }

        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                var uri: String? = nil
                if let url = item as? URL { uri = url.absoluteString }
                else if let img = item as? UIImage, let data = img.jpegData(compressionQuality: 0.85) {
                    let tmp = FileManager.default.temporaryDirectory
                        .appendingPathComponent(UUID().uuidString + ".jpg")
                    try? data.write(to: tmp); uri = tmp.absoluteString
                }
                completion(uri.map { ["type": "image", "uri": $0, "mimeType": "image/jpeg"] })
            }; return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.movie.identifier) { item, _ in
                completion((item as? URL).map { ["type": "video", "uri": $0.absoluteString, "mimeType": "video/mp4"] })
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

    @objc private func cancel() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}

// ── Celda de chat ─────────────────────────────────────────────────────────────

class EGChatShareCell: UITableViewCell {

    private let avatarView   = UIImageView()
    private let initialLabel = UILabel()
    private let groupBadge   = UIView()
    private let groupIcon    = UILabel()
    private let nameLabel    = UILabel()
    private let lastMsgLabel = UILabel()
    private let sendIcon     = UIImageView()
    private var currentUrl   = ""

    private let egchatGreen = UIColor(red: 0.0, green: 0.784, blue: 0.627, alpha: 1.0)

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        backgroundColor = .clear
        selectionStyle  = .default

        let sel = UIView()
        sel.backgroundColor = UIColor(white: 1, alpha: 0.05)
        selectedBackgroundView = sel

        // Avatar
        avatarView.layer.cornerRadius = 26
        avatarView.clipsToBounds      = true
        avatarView.contentMode        = .scaleAspectFill
        avatarView.backgroundColor    = UIColor(red: 0.0, green: 0.784, blue: 0.627, alpha: 0.2)
        avatarView.translatesAutoresizingMaskIntoConstraints = false

        // Initial fallback
        initialLabel.font          = .systemFont(ofSize: 20, weight: .semibold)
        initialLabel.textColor     = egchatGreen
        initialLabel.textAlignment = .center
        initialLabel.translatesAutoresizingMaskIntoConstraints = false

        // Group badge
        groupBadge.backgroundColor  = UIColor(red: 0.31, green: 0.27, blue: 0.9, alpha: 1.0)
        groupBadge.layer.cornerRadius = 8
        groupBadge.layer.borderWidth  = 1.5
        groupBadge.layer.borderColor  = UIColor(red: 0.071, green: 0.086, blue: 0.106, alpha: 1.0).cgColor
        groupBadge.translatesAutoresizingMaskIntoConstraints = false
        groupBadge.isHidden = true

        groupIcon.font      = .systemFont(ofSize: 9, weight: .bold)
        groupIcon.textColor = .white
        groupIcon.text      = "G"
        groupIcon.textAlignment = .center
        groupIcon.translatesAutoresizingMaskIntoConstraints = false

        // Name
        nameLabel.font      = .systemFont(ofSize: 15, weight: .semibold)
        nameLabel.textColor = .white
        nameLabel.translatesAutoresizingMaskIntoConstraints = false

        // Last message
        lastMsgLabel.font      = .systemFont(ofSize: 12)
        lastMsgLabel.textColor = UIColor(white: 1, alpha: 0.4)
        lastMsgLabel.translatesAutoresizingMaskIntoConstraints = false

        // Send icon
        let config   = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        let imgSend  = UIImage(systemName: "arrow.up.circle.fill", withConfiguration: config)
        sendIcon.image         = imgSend?.withTintColor(egchatGreen, renderingMode: .alwaysOriginal)
        sendIcon.contentMode   = .scaleAspectFit
        sendIcon.translatesAutoresizingMaskIntoConstraints = false

        groupBadge.addSubview(groupIcon)
        avatarView.addSubview(initialLabel)
        contentView.addSubview(avatarView)
        contentView.addSubview(groupBadge)
        contentView.addSubview(nameLabel)
        contentView.addSubview(lastMsgLabel)
        contentView.addSubview(sendIcon)

        NSLayoutConstraint.activate([
            avatarView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            avatarView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            avatarView.widthAnchor.constraint(equalToConstant: 52),
            avatarView.heightAnchor.constraint(equalToConstant: 52),

            initialLabel.centerXAnchor.constraint(equalTo: avatarView.centerXAnchor),
            initialLabel.centerYAnchor.constraint(equalTo: avatarView.centerYAnchor),

            groupBadge.bottomAnchor.constraint(equalTo: avatarView.bottomAnchor, constant: 2),
            groupBadge.trailingAnchor.constraint(equalTo: avatarView.trailingAnchor, constant: 2),
            groupBadge.widthAnchor.constraint(equalToConstant: 16),
            groupBadge.heightAnchor.constraint(equalToConstant: 16),

            groupIcon.centerXAnchor.constraint(equalTo: groupBadge.centerXAnchor),
            groupIcon.centerYAnchor.constraint(equalTo: groupBadge.centerYAnchor),

            sendIcon.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            sendIcon.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            sendIcon.widthAnchor.constraint(equalToConstant: 28),
            sendIcon.heightAnchor.constraint(equalToConstant: 28),

            nameLabel.leadingAnchor.constraint(equalTo: avatarView.trailingAnchor, constant: 12),
            nameLabel.trailingAnchor.constraint(equalTo: sendIcon.leadingAnchor, constant: -8),
            nameLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),

            lastMsgLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            lastMsgLabel.trailingAnchor.constraint(equalTo: nameLabel.trailingAnchor),
            lastMsgLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 3),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(with chat: EGChatItem) {
        nameLabel.text    = chat.name
        lastMsgLabel.text = chat.lastMessage.isEmpty ? (chat.isGroup ? "Grupo" : "Chat privado") : chat.lastMessage
        groupBadge.isHidden = !chat.isGroup
        initialLabel.text   = String(chat.name.prefix(1)).uppercased()
        avatarView.image    = nil
        currentUrl          = chat.avatarUrl

        if !chat.avatarUrl.isEmpty, let url = URL(string: chat.avatarUrl) {
            let urlToLoad = chat.avatarUrl
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                guard let self = self, self.currentUrl == urlToLoad,
                      let data = data, let img = UIImage(data: data) else { return }
                DispatchQueue.main.async {
                    self.avatarView.image = img
                    self.initialLabel.removeFromSuperview()
                }
            }.resume()
        }
    }
}
