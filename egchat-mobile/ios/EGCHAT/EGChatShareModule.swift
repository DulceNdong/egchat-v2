import Foundation

/**
 * EGChat — Share Module nativo
 * Guarda datos en el App Group compartido entre la app principal y la Share Extension.
 * App Group: group.com.jallzstores.egchat
 */
@objc(EGChatShareModule)
final class EGChatShareModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private let appGroupId = "group.com.jallzstores.egchat"

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  @objc func saveRecentChats(_ chatsJson: String) {
    defaults?.set(chatsJson, forKey: "egchat_recent_chats")
    defaults?.synchronize()
  }

  @objc func saveAuthToken(_ token: String) {
    defaults?.set(token, forKey: "egchat_auth_token")
    defaults?.synchronize()
  }

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

  @objc func clearSharedContent() {
    defaults?.removeObject(forKey: "egchat_shared_content")
    defaults?.synchronize()
  }
}
