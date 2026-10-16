import UserNotifications
import Intents
import UIKit

/**
 * EGChat — Notification Service Extension
 *
 * Se activa automáticamente cuando llega un push con "mutable-content": 1
 * Descarga el avatar del remitente y eleva la notificación a
 * Communication Notification (iOS 15+) para mostrar la foto en el banner.
 *
 * Bundle ID: com.jallzstores.egchat.EGChatNotifService
 */
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

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

        let avatarUrlString = content.userInfo["imageUrl"] as? String
                           ?? content.userInfo["senderAvatar"] as? String
                           ?? ""
        let senderName      = content.userInfo["senderName"] as? String ?? content.title
        let senderId        = content.userInfo["senderId"]   as? String ?? "unknown"
        let chatId          = content.userInfo["chatId"]     as? String ?? ""

        downloadImage(urlString: avatarUrlString) { avatarImage in
            // 1. Adjuntar imagen al preview expandido
            if let avatarImage = avatarImage {
                self.attachImage(avatarImage, to: content)
            }

            // 2. Communication Notification (iOS 15+) — foto en el banner sin expandir
            if #available(iOS 15.0, *) {
                self.elevateToCommunication(
                    content: content,
                    senderName: senderName,
                    senderId: senderId,
                    chatId: chatId,
                    avatarImage: avatarImage,
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

    // ── Helpers ──────────────────────────────────────────────────────────────

    private func downloadImage(urlString: String, completion: @escaping (UIImage?) -> Void) {
        guard !urlString.isEmpty, let url = URL(string: urlString) else {
            completion(nil); return
        }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { completion(nil); return }
            completion(UIImage(data: data))
        }.resume()
    }

    private func attachImage(_ image: UIImage, to content: UNMutableNotificationContent) {
        let tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString + ".jpg")
        guard let jpeg = image.jpegData(compressionQuality: 0.8) else { return }
        try? jpeg.write(to: tmp)
        if let attachment = try? UNNotificationAttachment(
            identifier: "avatar",
            url: tmp,
            options: [UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"]
        ) {
            content.attachments = [attachment]
        }
    }

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
        if let img = avatarImage, let jpeg = img.jpegData(compressionQuality: 0.8) {
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
}
