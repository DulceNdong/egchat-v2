import Foundation
import PushKit
import React

@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter, PKPushRegistryDelegate {

  private var voipRegistry: PKPushRegistry?

  @objc static let shared = EGChatPushKitModule()

  // ── Llamado desde AppDelegate cuando llega token VoIP ────────────
  @objc static func emitTokenUpdated(_ token: String) {
    shared.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  // ── Llamado desde AppDelegate cuando llega llamada entrante ──────
  @objc static func emitIncomingCall(_ payload: [String: Any]) {
    shared.sendEvent(withName: "voipPushReceived", body: payload)
  }

  @objc func registerVoIP() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      if self.voipRegistry != nil { return }
      let registry = PKPushRegistry(queue: DispatchQueue.main)
      registry.delegate = self
      registry.desiredPushTypes = [.voIP]
      self.voipRegistry = registry
    }
  }

  // ── Llamado desde AppDelegate cuando llega token VoIP ────────────
  @objc static func emitTokenUpdated(_ token: String) {
    shared.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  // ── Llamado desde AppDelegate cuando llega llamada entrante ──────
  @objc static func emitIncomingCall(_ payload: [String: Any]) {
    shared.sendEvent(withName: "voipPushReceived", body: payload)
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    guard type == .voIP else { return }
    let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
    EGChatPushKitModule.emitTokenUpdated(token)
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didInvalidatePushTokenFor type: PKPushType
  ) {
    EGChatPushKitModule.emitTokenUpdated("")
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    guard type == .voIP else { completion(); return }
    let dict = payload.dictionaryPayload as? [String: Any] ?? [:]
    EGChatPushKitModule.emitIncomingCall(dict)
    completion()
  }

  override func supportedEvents() -> [String] {
    return ["voipTokenUpdated", "voipPushReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
}
