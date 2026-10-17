import Foundation
import React

/**
 * EGChat — Share Module nativo
 * Guarda datos en el App Group compartido entre la app principal y la Share Extension.
 * App Group: group.com.jallzstores.egchat
 *
 * Métodos expuestos a JS:
 *  - saveRecentChats(json)  → guarda la lista de chats para que la Share Extension los muestre
 *  - saveAuthToken(token)   → guarda el token para que la Share Extension llame a la API
 *  - getSharedContent()     → lee el contenido que la Share Extension guardó
 *  - clearSharedContent()   → limpia el contenido después de procesarlo
 */
@objc(EGChatShareModule)
final class EGChatShareModule: NSObject, RCTBridgeModule {

  static func moduleName() -> String! { "EGChatShareModule" }
  static func requiresMainQueueSetup() -> Bool { false }

  private let appGroupId = "group.com.jallzstores.egchat"
  private var hasListeners = false

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  // ── Guardar chats recientes ───────────────────────────────────────────────

  @objc func saveRecentChats(_ chatsJson: String) {
    defaults?.set(chatsJson, forKey: "egchat_recent_chats")
    defaults?.synchronize()
  }

  // ── Guardar token de autenticación ────────────────────────────────────────

  @objc func saveAuthToken(_ token: String) {
    defaults?.set(token, forKey: "egchat_auth_token")
    defaults?.synchronize()
  }

  // ── Leer contenido compartido por la Share Extension ─────────────────────

  @objc func getSharedContent(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard
      let raw  = defaults?.string(forKey: "egchat_shared_content"),
      let data = raw.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      resolve(nil); return
    }
    defaults?.removeObject(forKey: "egchat_shared_content")
    defaults?.synchronize()
    resolve(json)
  }

  // ── Limpiar contenido pendiente ──────────────────────────────────────────

  @objc func clearSharedContent() {
    defaults?.removeObject(forKey: "egchat_shared_content")
    defaults?.synchronize()
  }
}
prb
