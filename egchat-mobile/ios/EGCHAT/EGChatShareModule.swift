import Foundation
import React

/**
 * EGChat — Share Module
 * Guarda datos en App Group para que la Share Extension pueda acceder a ellos.
 * App Group: group.com.jallzstores.egchat
 */
@objc(EGChatShareModule)
class EGChatShareModule: RCTEventEmitter {

  private static let appGroupId = "group.com.jallzstores.egchat"
  private static let sharedKey  = "egchat_shared_content"
  private static let chatsKey   = "egchat_recent_chats"
  private static let tokenKey   = "egchat_auth_token"

  // ── API para React Native ────────────────────────────────────────────────

  @objc func getSharedContent(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: Self.appGroupId)
    guard let raw  = defaults?.string(forKey: Self.sharedKey),
          let data = raw.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      resolve(nil); return
    }
    defaults?.removeObject(forKey: Self.sharedKey)
    resolve(json)
  }

  @objc func clearSharedContent() {
    UserDefaults(suiteName: Self.appGroupId)?.removeObject(forKey: Self.sharedKey)
  }

  @objc func saveRecentChats(_ chatsJson: String) {
    let defaults = UserDefaults(suiteName: Self.appGroupId)
    defaults?.set(chatsJson, forKey: Self.chatsKey)
    defaults?.synchronize()
  }

  @objc func saveAuthToken(_ token: String) {
    let defaults = UserDefaults(suiteName: Self.appGroupId)
    defaults?.set(token, forKey: Self.tokenKey)
    defaults?.synchronize()
  }

  // ── RCTEventEmitter ──────────────────────────────────────────────────────

  override func supportedEvents() -> [String] { ["sharedContent"] }
  override static func requiresMainQueueSetup() -> Bool { false }
  @objc override func addListener(_ eventName: String)  { super.addListener(eventName) }
  @objc override func removeListeners(_ count: Double)  { super.removeListeners(count) }
}
