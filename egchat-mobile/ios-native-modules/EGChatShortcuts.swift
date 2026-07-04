import UIKit

/**
 * EGChat — Atajos de icono iOS (UIApplicationShortcutItem)
 * Mantén pulsado el icono de EGChat para ver acciones rápidas.
 *
 * Instalación (Mac/Xcode):
 * 1. Copiar este archivo a ios/EGChat/
 * 2. En AppDelegate.mm añadir:
 *
 *   - (void)application:(UIApplication *)application
 *     performActionForShortcutItem:(UIApplicationShortcutItem *)shortcutItem
 *     completionHandler:(void (^)(BOOL))completionHandler {
 *       [EGChatShortcuts handleShortcut:shortcutItem];
 *       completionHandler(YES);
 *   }
 *
 * 3. Llamar [EGChatShortcuts registerShortcuts] en applicationDidBecomeActive
 */
@objc class EGChatShortcuts: NSObject {

  /// Registra los shortcuts estáticos en el sistema
  @objc static func registerShortcuts() {
    let newChat = UIApplicationShortcutItem(
      type: "com.egchat.app.new_chat",
      localizedTitle: "Nuevo chat",
      localizedSubtitle: nil,
      icon: UIApplicationShortcutIcon(systemImageName: "bubble.left.and.bubble.right.fill"),
      userInfo: ["action": "new-chat" as NSSecureCoding]
    )

    let stories = UIApplicationShortcutItem(
      type: "com.egchat.app.stories",
      localizedTitle: "Historias",
      localizedSubtitle: nil,
      icon: UIApplicationShortcutIcon(systemImageName: "circle.grid.3x3.fill"),
      userInfo: ["action": "stories" as NSSecureCoding]
    )

    let qrScan = UIApplicationShortcutItem(
      type: "com.egchat.app.qr_scan",
      localizedTitle: "Escanear QR",
      localizedSubtitle: nil,
      icon: UIApplicationShortcutIcon(systemImageName: "qrcode.viewfinder"),
      userInfo: ["action": "qr-scanner" as NSSecureCoding]
    )

    UIApplication.shared.shortcutItems = [newChat, stories, qrScan]
  }

  /// Maneja el shortcut seleccionado y navega via deep link
  @objc static func handleShortcut(_ shortcut: UIApplicationShortcutItem) {
    guard let action = shortcut.userInfo?["action"] as? String else { return }
    let urlString = "egchat://\(action)"
    if let url = URL(string: urlString) {
      UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
  }
}
