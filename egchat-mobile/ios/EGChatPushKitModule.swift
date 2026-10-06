import Foundation
import PushKit
import React

/**
 * EGChat — PushKit VoIP Module
 * Recibe llamadas entrantes aunque la app esté cerrada o en background.
 *
 * Requiere en Xcode:
 *   Target → Signing & Capabilities → Background Modes → Voice over IP ✓
 *
 * Flujo:
 *   1. App arranca → JS llama PushKit.register()
 *   2. iOS entrega token VoIP → módulo sube a /api/push/register-voip-token
 *   3. Llamada entrante → PushKit despierta la app (<0.5s)
 *   4. Módulo emite 'voipPushReceived' → JS navega a /call/[callId]
 *   5. CallKit muestra UI nativa de llamada
 *
 * IMPORTANTE: Apple exige que en didReceiveIncomingPushWith se reporte
 * una llamada a CXProvider INMEDIATAMENTE (antes del return), de lo contrario
 * la app puede ser terminada por el sistema. Este módulo delega esa
 * responsabilidad a EGChatCallModule.shared.showIncomingCall().
 */
@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter, PKPushRegistryDelegate {

  private var voipRegistry: PKPushRegistry?

  // ── Singleton accesible desde AppDelegate ────────────────────────
  @objc static let shared = EGChatPushKitModule()

  // ── Inicializar PushKit registry ─────────────────────────────────
  @objc func registerVoIP() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      if self.voipRegistry != nil { return } // ya registrado
      let registry = PKPushRegistry(queue: DispatchQueue.main)
      registry.delegate = self
      registry.desiredPushTypes = [.voIP]
      self.voipRegistry = registry
    }
  }

  // ── PKPushRegistryDelegate ───────────────────────────────────────

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    guard type == .voIP else { return }

    // Convertir token a string hex
    let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
    print("[EGChatPushKit] VoIP token: \(token.prefix(12))...")

    // Notificar a JS para que lo suba al servidor
    sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didInvalidatePushTokenFor type: PKPushType
  ) {
    print("[EGChatPushKit] Token VoIP invalidado")
    sendEvent(withName: "voipTokenUpdated", body: ["token": ""])
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    guard type == .voIP else { completion(); return }

    let dict    = payload.dictionaryPayload
    let aps     = dict["aps"] as? [String: Any] ?? dict
    let callId  = aps["callId"]     as? String ?? dict["callId"]     as? String ?? UUID().uuidString
    let caller  = aps["callerName"] as? String ?? dict["callerName"] as? String ?? "Desconocido"
    let rawType = aps["callType"]   as? String ?? dict["callType"]   as? String ?? "audio"
    let isVideo = (rawType == "video")

    print("[EGChatPushKit] Llamada entrante — caller: \(caller), id: \(callId)")

    // ⚠️ Apple exige reportar la llamada a CallKit ANTES de llamar completion()
    // Si no hay CallKit disponible, la app puede ser terminada.
    EGChatCallModule.shared.showIncomingCall(
      caller,
      callerAvatar: "",
      callId: callId,
      isVideo: isVideo
    )

    // Construir payload para JS
    var body: [String: Any] = [
      "callId":     callId,
      "callerName": caller,
      "callType":   rawType,
    ]
    if let offer = dict["offer"] as? [String: Any] { body["offer"] = offer }
    if let targetUserId = dict["targetUserId"] as? String { body["targetUserId"] = targetUserId }

    // Emitir a JS (para navegación y UI)
    sendEvent(withName: "voipPushReceived", body: body)

    completion()
  }

  // ── RCTEventEmitter ─────────────────────────────────────────────

  override func supportedEvents() -> [String] {
    return ["voipTokenUpdated", "voipPushReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
}

// ── Objective-C bridge (EGChatPushKitModule.m) ─────────────────────
// Necesitas crear un archivo .m separado o añadir esto al .m existente:
//
// #import <React/RCTBridgeModule.h>
// #import <React/RCTEventEmitter.h>
// @interface RCT_EXTERN_MODULE(EGChatPushKitModule, RCTEventEmitter)
// RCT_EXTERN_METHOD(registerVoIP)
// @end
