import UserNotifications
import Intents
import UIKit

/**
 * EGChat — UNNotificationServiceExtension
 * Intercepta notificaciones push ANTES de mostrarlas para:
 *   1. Adjuntar la foto circular del remitente (UNNotificationAttachment)
 *   2. Elevarla a "Communication Notification" (INSendMessageIntent)
 *      → iOS muestra la foto del remitente + ícono EGCHAT debajo, igual que
 *      iMessage/WhatsApp, y la notificación aparece en el hilo de SharePlay.
 *
 * El payload push debe incluir:
 *   "mutable-content": 1          ← OBLIGATORIO para que iOS llame a esta extensión
 *   "imageUrl": "https://..."     ← avatar del remitente
 *   "senderName": "Nombre"        ← nombre del remitente
 *   "senderId": "uuid"            ← ID único del remitente
 *   "chatId": "uuid"              ← ID del chat (para deep-link)
 */
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let content = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // 1. Descargar la foto del remitente
        let avatarUrlString = content.userInfo["imageUrl"] as? String ?? ""
        let senderName      = content.userInfo["senderName"] as? String ?? content.title
        let senderId        = content.userInfo["senderId"]   as? String ?? "unknown"
        let chatId          = content.userInfo["chatId"]     as? String ?? ""

        downloadAvatar(urlString: avatarUrlString) { avatarImage in
            // 2. Adjuntar imagen a la notificación (se muestra en la preview expandida)
            if let avatarImage = avatarImage {
                self.attachImage(avatarImage, to: content)
            }

            // 3. Elevar a Communication Notification (iOS 15+)
            //    → foto del remitente DENTRO del banner (esquina inferior del ícono),
            //    igual que WhatsApp/iMessage, sin necesidad de expandir.
            if #available(iOS 15.0, *) {
                self.elevateToCommunicationNotification(
                    content: content,
                    senderName: senderName,
                    senderId: senderId,
                    chatId: chatId,
                    avatarImage: avatarImage
                ) { elevated in
                    contentHandler(elevated)
                }
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

    private func downloadAvatar(urlString: String, completion: @escaping (UIImage?) -> Void) {
        guard !urlString.isEmpty, let url = URL(string: urlString) else {
            completion(nil); return
        }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { completion(nil); return }
            completion(UIImage(data: data))
        }.resume()
    }

    private func attachImage(_ image: UIImage, to content: UNMutableNotificationContent) {
        let tmpDir  = FileManager.default.temporaryDirectory
        let tmpFile = tmpDir.appendingPathComponent(UUID().uuidString + ".jpg")
        guard let jpeg = image.jpegData(compressionQuality: 0.8) else { return }
        try? jpeg.write(to: tmpFile)
        if let attachment = try? UNNotificationAttachment(
            identifier: "avatar",
            url: tmpFile,
            options: [UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"]
        ) {
            content.attachments = [attachment]
        }
    }

    @available(iOS 15.0, *)
    private func elevateToCommunicationNotification(
        content: UNMutableNotificationContent,
        senderName: String,
        senderId: String,
        chatId: String,
        avatarImage: UIImage?,
        completion: @escaping (UNNotificationContent) -> Void
    ) {
        // Construir el INPerson (remitente)
        var personImage: INImage? = nil
        if let img = avatarImage, let jpeg = img.jpegData(compressionQuality: 0.8) {
            personImage = INImage(imageData: jpeg)
        }

        let senderHandle = INPersonHandle(value: senderId, type: .unknown)
        let sender = INPerson(
            personHandle: senderHandle,
            nameComponents: nil,
            displayName: senderName,
            image: personImage,
            contactIdentifier: nil,
            customIdentifier: senderId,
            isMe: false,
            suggestionType: .none
        )

        // El destinatario (el usuario actual — se marca con isMe: true)
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

        // Crear el intent de mensaje
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

        // Donar el intent (mejora Siri Suggestions y permite SharePlay)
        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate { _ in }

        // Actualizar la notificación con el intent
        do {
            let updated = try content.updating(from: intent)
            completion(updated)
        } catch {
            // Si falla el upgrade, entregar la notificación enriquecida sin intent
            completion(content)
        }
    }
}
