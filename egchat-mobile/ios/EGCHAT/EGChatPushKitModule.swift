import Foundation
import PushKit
import React

/** PushKit vive a nivel de aplicación, no a nivel del ciclo de JavaScript. */
final class EGChatPushKitCoordinator: NSObject, PKPushRegistryDelegate {
  static let shared = EGChatPushKitCoordinator()

  private var registry: PKPushRegistry?
  private var pendingToken: String?
  private var currentVoipToken: String?
  private var pendingCalls: [[String: Any]] = []

  func start() {
    DispatchQueue.main.async {
      guard self.registry == nil else { return }
      let registry = PKPushRegistry(queue: .main)
      registry.delegate = self
      registry.desiredPushTypes = [.voIP]
      self.registry = registry
    }
  }

  func currentToken() -> String? { currentVoipToken }

  func attach(_ module: EGChatPushKitModule) {
    EGChatPushKitModule.eventSink = module
    flushPendingEvents()
  }

  private func emitToken(_ token: String) {
    if let module = EGChatPushKitModule.eventSink {
      module.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
    } else { pendingToken = token }
  }

  private func emitCall(_ call: [String: Any]) {
    if let module = EGChatPushKitModule.eventSink {
      module.sendEvent(withName: "voipPushReceived", body: call)
    } else { pendingCalls.append(call) }
  }

  private func flushPendingEvents() {
    guard let module = EGChatPushKitModule.eventSink else { return }
    if let token = pendingToken {
      module.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
      pendingToken = nil
    }
    let calls = pendingCalls
    pendingCalls.removeAll()
    calls.forEach { module.sendEvent(withName: "voipPushReceived", body: $0) }
  }

  func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else { return }
    let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
    print("[EGChatPushKit] VoIP token actualizado")
    currentVoipToken = token
    emitToken(token)
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    currentVoipToken = nil
    emitToken("")
  }

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    guard type == .voIP else { completion(); return }
    let dictionary = payload.dictionaryPayload.reduce(into: [String: Any]()) { result, item in
      if let key = item.key as? String { result[key] = item.value }
    }
    let aps = dictionary["aps"] as? [String: Any] ?? [:]
    let callId = (dictionary["callId"] as? String) ?? (aps["callId"] as? String) ?? UUID().uuidString
    let callerName = (dictionary["callerName"] as? String) ?? (aps["callerName"] as? String) ?? "EGCHAT"
    let callerAvatar = (dictionary["callerAvatar"] as? String) ?? ""
    let callType = (dictionary["callType"] as? String) ?? (aps["callType"] as? String) ?? "audio"

    EGChatCallCoordinator.shared.reportIncomingCall(callerName: callerName, callerAvatar: callerAvatar, callId: callId, isVideo: callType == "video")
    var event: [String: Any] = ["callId": callId, "callerName": callerName, "callerAvatar": callerAvatar, "callType": callType]
    ["offer", "targetUserId", "chatId"].forEach { key in if let value = dictionary[key] { event[key] = value } }
    emitCall(event)
    completion()
  }
}

@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter {
  static weak var eventSink: EGChatPushKitModule?

  override init() {
    super.init()
    EGChatPushKitCoordinator.shared.attach(self)
  }

  override func startObserving() { EGChatPushKitCoordinator.shared.attach(self) }
  override func supportedEvents() -> [String] { ["voipTokenUpdated", "voipPushReceived"] }
  override static func requiresMainQueueSetup() -> Bool { true }

  @objc func registerVoIP() {
    EGChatPushKitCoordinator.shared.start()
    EGChatPushKitCoordinator.shared.attach(self)
  }

  @objc func getCurrentVoIPToken(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(EGChatPushKitCoordinator.shared.currentToken())
  }
}
