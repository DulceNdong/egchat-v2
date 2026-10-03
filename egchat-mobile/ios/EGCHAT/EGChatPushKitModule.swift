import Foundation
import React

/// Puente nativo PushKit → JS
///
/// CORRECCIÓN vs versión anterior:
/// - shared era `weak` → podía ser recolectado antes de recibir el push.
/// - Ahora es `strong` con ciclo de vida explícito gestionado por el propio init/deinit.
/// - Se añade cola de eventos pendientes para cuando JS aún no está escuchando.
///
/// Emite:
///   - "voipTokenUpdated"  { token: String }
///   - "voipPushReceived"  { callId, callerName, callerAvatar, callType, offer }

@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter {

  // Strong reference — garantiza que el módulo no es recolectado
  // antes de recibir el push VoIP.
  @objc static var shared: EGChatPushKitModule? = nil

  // Cola de eventos pendientes (llegaron antes de que JS registrara listeners)
  private static var pendingTokenEvent: String? = nil
  private static var pendingCallEvents: [[String: Any]] = []

  override init() {
    super.init()
    EGChatPushKitModule.shared = self

    // Entregar eventos que llegaron antes de que JS estuviera listo
    if let token = EGChatPushKitModule.pendingTokenEvent {
      EGChatPushKitModule.pendingTokenEvent = nil
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        self.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
      }
    }

    let pending = EGChatPushKitModule.pendingCallEvents
    if !pending.isEmpty {
      EGChatPushKitModule.pendingCallEvents = []
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        for body in pending {
          self.sendEvent(withName: "voipPushReceived", body: body)
        }
      }
    }
  }

  override func supportedEvents() -> [String]! {
    return ["voipTokenUpdated", "voipPushReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool { return false }

  // ── Llamados desde AppDelegate ───────────────────────────────────

  static func emitTokenUpdated(_ token: String) {
    if let instance = shared {
      instance.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
    } else {
      // Encolar para entregar cuando el módulo esté listo
      pendingTokenEvent = token
    }
  }

  static func emitIncomingCall(_ payload: [String: Any]) {
    let data = payload["data"] as? [String: Any] ?? payload
    let body: [String: Any] = [
      "callId":       data["callId"]       ?? data["call_id"]       ?? "",
      "callerName":   data["callerName"]   ?? data["caller_name"]   ?? "EGChat",
      "callerAvatar": data["callerAvatar"] ?? data["caller_avatar"] ?? "",
      "callType":     data["callType"]     ?? data["call_type"]     ?? "audio",
      "offer":        data["offer"]        ?? NSNull(),
    ]

    if let instance = shared {
      instance.sendEvent(withName: "voipPushReceived", body: body)
    } else {
      // Encolar — se entregará cuando EGChatPushKitModule.init() se ejecute
      // Máximo 3 eventos en cola para no acumular indefinidamente
      if pendingCallEvents.count < 3 {
        pendingCallEvents.append(body)
      }
    }
  }

  // ── Método expuesto al JS ─────────────────────────────────────────
  // El registro real lo hace AppDelegate; este método existe para
  // que NativeModules.EGChatPushKitModule.registerVoIP() no falle desde JS.
  @objc func registerVoIP() {
    // No-op: el registro lo gestiona AppDelegate
  }
}
