import UserNotifications
import Intents
import UIKit

/**
 * EGChat — Notification Service Extension (mejorada)
 *
 * Mejoras sobre WhatsApp/iMessage:
 * 1. Avatar circular del remitente con borde verde EGCHAT
 * 2. Miniatura real del mensaje (foto/video/audio/documento)
 * 3. Communication Notification (iOS 15+) — foto en el banner sin expandir
 * 4. Acciones rápidas: Responder y Marcar como leído
 * 5. Color de acento verde EGCHAT en todo el sistema
 */
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    // Color verde EGCHAT
    private let egchatGreen = UIColor(red: 0.0, green: 0.784, blue: 0.627, alpha: 1.0)

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        guard let content = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        let avatarUrlString = content.userInfo["imageUrl"]    as? String
                           ?? content.userInfo["senderAvatar"] as? String
                           ?? ""
        let messageImageUrl = content.userInfo["messageImageUrl"] as? String ?? ""
        let senderName      = content.userInfo["senderName"]  as? String ?? content.title
        let senderId        = content.userInfo["senderId"]    as? String ?? "unknown"
        let chatId          = content.userInfo["chatId"]      as? String ?? ""
        let messageType     = content.userInfo["messageType"] as? String ?? "text"

        // 4. Registrar categoría con acciones rápidas
        registerNotificationCategory()

        // Asignar categoría para las acciones
        content.categoryIdentifier = "EGCHAT_MESSAGE"

        // Descargar avatar en paralelo con la imagen del mensaje
        let group = DispatchGroup()
        var avatarImage: UIImage? = nil
        var messageImage: UIImage? = nil

        group.enter()
        downloadImage(urlString: avatarUrlString) { img in
            avatarImage = img
            group.leave()
        }

        // Solo descargar imagen del mensaje si es de tipo imagen o video
        if !messageImageUrl.isEmpty && (messageType == "image" || messageType == "video") {
            group.enter()
            downloadImage(urlString: messageImageUrl) { img in
                messageImage = img
                group.leave()
            }
        }

        group.notify(queue: .global()) { [weak self] in
            guard let self = self else { return }

            // 1. Avatar circular con borde verde EGCHAT
            let styledAvatar = avatarImage.map { self.makeStyledAvatar($0) }

            // 2. Adjuntar miniatura del mensaje (imagen/video) o ícono del tipo
            let attachmentImage = messageImage ?? self.makeMessageTypeIcon(messageType: messageType)
            if let attachImage = attachmentImage {
                self.attachImage(attachImage, identifier: "message_preview", to: content)
            }

            // Adjuntar avatar también como attachment secundario
            if let av = styledAvatar {
                self.attachImage(av, identifier: "avatar", to: content, append: true)
            }

            // 3. Communication Notification (iOS 15+)
            if #available(iOS 15.0, *) {
                self.elevateToCommunication(
                    content: content,
                    senderName: senderName,
                    senderId: senderId,
                    chatId: chatId,
                    avatarImage: styledAvatar,
                    completion: contentHandler
                )
            } else {
                contentHandler(content)
            }
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let content = bestAttemptContent, let handler = contentHandler {
            handler(content)
        }
    }

    // ── 1. Avatar circular con borde verde EGCHAT ────────────────────────────

    private func makeStyledAvatar(_ image: UIImage) -> UIImage {
        let size: CGFloat = 120
        let borderWidth: CGFloat = 4
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
        return renderer.image { ctx in
            let rect = CGRect(x: 0, y: 0, width: size, height: size)
            let innerRect = rect.insetBy(dx: borderWidth, dy: borderWidth)

            // Fondo verde EGCHAT (borde)
            egchatGreen.setFill()
            ctx.cgContext.fillEllipse(in: rect)

            // Clip circular para el avatar
            let avatarPath = UIBezierPath(ovalIn: innerRect)
            avatarPath.addClip()

            // Dibujar avatar
            image.draw(in: innerRect)
        }
    }

    // ── 2. Icono visual por tipo de mensaje ──────────────────────────────────

    private func makeMessageTypeIcon(messageType: String) -> UIImage? {
        // Solo generar ícono para tipos no-texto cuando no hay imagen real
        let emoji: String
        switch messageType {
        case "audio":    emoji = "🎤"
        case "video":    emoji = "🎥"
        case "file":     emoji = "📄"
        case "location": emoji = "📍"
        case "contact":  emoji = "👤"
        case "sticker":  emoji = "😊"
        case "gif":      emoji = "GIF"
        default: return nil  // texto: no añadir ícono extra
        }

        let size: CGFloat = 80
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
        return renderer.image { ctx in
            // Fondo verde EGCHAT
            egchatGreen.setFill()
            UIBezierPath(roundedRect: CGRect(x: 0, y: 0, width: size, height: size), cornerRadius: 16).fill()

            // Emoji centrado
            let attrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 40)]
            let str = emoji as NSString
            let strSize = str.size(withAttributes: attrs)
            let origin = CGPoint(x: (size - strSize.width) / 2, y: (size - strSize.height) / 2)
            str.draw(at: origin, withAttributes: attrs)
        }
    }

    // ── Adjuntar imagen al contenido ─────────────────────────────────────────

    private func attachImage(_ image: UIImage, identifier: String, to content: UNMutableNotificationContent, append: Bool = false) {
        let tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(identifier)_\(UUID().uuidString).jpg")
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else { return }
        try? jpeg.write(to: tmp)
        guard let attachment = try? UNNotificationAttachment(
            identifier: identifier,
            url: tmp,
            options: [UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"]
        ) else { return }

        if append {
            content.attachments.append(attachment)
        } else {
            content.attachments = [attachment]
        }
    }

    // ── 3. Communication Notification (iOS 15+) ──────────────────────────────

    @available(iOS 15.0, *)
    private func elevateToCommunication(
        content: UNMutableNotificationContent,
        senderName: String,
        senderId: String,
        chatId: String,
        avatarImage: UIImage?,
        completion: @escaping (UNNotificationContent) -> Void
    ) {
        var inImage: INImage? = nil
        if let img = avatarImage, let jpeg = img.jpegData(compressionQuality: 0.85) {
            inImage = INImage(imageData: jpeg)
        }

        let senderHandle = INPersonHandle(value: senderId, type: .unknown)
        let sender = INPerson(
            personHandle: senderHandle,
            nameComponents: nil,
            displayName: senderName,
            image: inImage,
            contactIdentifier: nil,
            customIdentifier: senderId,
            isMe: false,
            suggestionType: .none
        )

        let meHandle = INPersonHandle(value: "me", type: .unknown)
        let me = INPerson(
            personHandle: meHandle,
            nameComponents: nil,
            displayName: nil,
            image: nil,
            contactIdentifier: nil,
            customIdentifier: "me",
            isMe: true,
            suggestionType: .none
        )

        let intent = INSendMessageIntent(
            recipients: [me],
            outgoingMessageType: .outgoingMessageText,
            content: content.body,
            speakableGroupName: nil,
            conversationIdentifier: chatId.isEmpty ? senderId : chatId,
            serviceName: "EGChat",
            sender: sender,
            attachments: nil
        )

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate { _ in }

        do {
            let updated = try content.updating(from: intent)
            completion(updated)
        } catch {
            completion(content)
        }
    }

    // ── 4. Registrar categoría con acciones rápidas ──────────────────────────

    private func registerNotificationCategory() {
        // Acción: Responder inline (sin abrir la app)
        let replyAction = UNTextInputNotificationAction(
            identifier: "REPLY_ACTION",
            title: "Responder",
            options: [],
            textInputButtonTitle: "Enviar",
            textInputPlaceholder: "Escribe un mensaje..."
        )

        // Acción: Marcar como leído
        let readAction = UNNotificationAction(
            identifier: "MARK_READ_ACTION",
            title: "Marcar como leído",
            options: []
        )

        let category = UNNotificationCategory(
            identifier: "EGCHAT_MESSAGE",
            actions: [replyAction, readAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])
    }

    // ── Descarga de imagen ───────────────────────────────────────────────────

    private func downloadImage(urlString: String, completion: @escaping (UIImage?) -> Void) {
        guard !urlString.isEmpty, let url = URL(string: urlString) else {
            completion(nil); return
        }
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 8
        URLSession(configuration: config).dataTask(with: url) { data, _, _ in
            guard let data = data else { completion(nil); return }
            completion(UIImage(data: data))
        }.resume()
    }
}
