import Foundation
import React

/// Puente nativo para VoIP PushKit → JS
/// Emite dos eventos al lado JS:
///   - "voipTokenUpdated"  { token: String }
///   - "voipPushReceived"  { callId, callerName, callerAvatar, callType, offer }
@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter {

  // Singleton para que AppDelegate pueda emitir eventos
  static weak var shared: EGChatPushKitModule?

  override init() {
    super.init()
    EGChatPushKitModule.shared = self
  }

  // ── Eventos soportados ───────────────────────────────────────────
  override func supportedEvents() -> [String]! {
    return ["voipTokenUpdated", "voipPushReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool { return false }

  // ── Llamados desde AppDelegate ───────────────────────────────────

  static func emitTokenUpdated(_ token: String) {
    shared?.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  static func emitIncomingCall(_ payload: [String: Any]) {
    let data = payload["data"] as? [String: Any] ?? payload
    let body: [String: Any] = [
      "callId":      data["callId"]      ?? data["call_id"]      ?? "",
      "callerName":  data["callerName"]  ?? data["caller_name"]  ?? "EGChat",
      "callerAvatar":data["callerAvatar"] ?? data["caller_avatar"] ?? "",
      "callType":    data["callType"]    ?? data["call_type"]    ?? "audio",
      "offer":       data["offer"]       ?? NSNull(),
    ]
    shared?.sendEvent(withName: "voipPushReceived", body: body)
  }

  // ── Métodos expuestos al JS (requeridos por la interfaz PushKit.ts) ──

  @objc func registerVoIP() {
    // El registro lo hace AppDelegate — este método es no-op en el lado nativo
    // pero debe existir para que NativeModules.EGChatPushKitModule.registerVoIP() no falle
  }
}
