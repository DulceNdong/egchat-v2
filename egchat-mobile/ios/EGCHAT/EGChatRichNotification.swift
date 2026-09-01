import Foundation
import UserNotifications
import UIKit

/**
 * EGChat — Notificaciones ricas iOS
 * Añade imagen del remitente y miniatura de foto adjunta a las notificaciones.
 *
 * En iOS las notificaciones ricas se manejan via UNNotificationServiceExtension
 * (una extensión separada del target principal). Este módulo provee la lógica
 * compartida y un RCT module para control desde JS.
 */
@objc(EGChatRichNotification)
class EGChatRichNotification: NSObject {

  /// Modifica el contenido de una notificación añadiendo imagen del avatar
  static func enrichNotification(
    _ content: UNMutableNotificationContent,
    completion: @escaping (UNMutableNotificationContent) -> Void
  ) {
    // Obtener URL de imagen del payload
    guard let imageUrlString = content.userInfo["imageUrl"] as? String,
          let imageUrl = URL(string: imageUrlString) else {
      completion(content)
      return
    }

    // Descargar imagen y adjuntarla
    URLSession.shared.dataTask(with: imageUrl) { data, _, _ in
      guard let data = data,
            let image = UIImage(data: data) else {
        completion(content)
        return
      }

      // Guardar temporalmente
      let tmpDir = FileManager.default.temporaryDirectory
      let tmpFile = tmpDir.appendingPathComponent(UUID().uuidString + ".jpg")
      if let jpegData = image.jpegData(compressionQuality: 0.8) {
        try? jpegData.write(to: tmpFile)
      }

      if let attachment = try? UNNotificationAttachment(
        identifier: "image",
        url: tmpFile,
        options: [UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"]
      ) {
        content.attachments = [attachment]
      }

      completion(content)
    }.resume()
  }
}
