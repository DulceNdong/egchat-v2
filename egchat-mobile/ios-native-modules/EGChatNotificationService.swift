import UserNotifications

/**
 * EGChat — UNNotificationServiceExtension
 * Intercepta notificaciones push ANTES de mostrarlas para añadir la imagen.
 *
 * Instrucciones de instalación (Mac/Xcode):
 * 1. File → New → Target → Notification Service Extension → nombre: "EGChatNotifService"
 * 2. Reemplazar el NotificationService.swift generado con este archivo
 * 3. En el target EGChatNotifService → General → verificar que comparte el mismo
 *    App Group que el target principal (si usas shared storage)
 *
 * El payload de la notificación debe incluir:
 *   "mutable-content": 1   (para que iOS llame a esta extensión)
 *   "imageUrl": "https://..."
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

        // Enriquecer con imagen
        EGChatRichNotification.enrichNotification(content) { enriched in
            contentHandler(enriched)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Tiempo agotado — mostrar notificación sin imagen
        if let content = bestAttemptContent,
           let handler = contentHandler {
            handler(content)
        }
    }
}
