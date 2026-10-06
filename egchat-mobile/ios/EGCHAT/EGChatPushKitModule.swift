import Foundation
import PushKit
import React

/**
 * EGChatPushKitModule — Recibe pushes VoIP y despierta la app.
 *
 * Flujo con teléfono cerrado/bloqueado:
 *  1. Servidor envía push VoIP al token del dispositivo
 *  2. iOS despierta la app en background en <0.5s (incluso si estaba cerrada)
 *  3. pushRegistry didReceiveIncomingPushWith se ejecuta
 *  4. INMEDIATAMENTE se llama EGChatCallModule.shared.showIncomingCall()
 *     → iOS muestra la pantalla nativa de llamada (como WhatsApp/FaceTime)
 *  5. El payload también se emite a JS para que prepare el WebRTC
 *
 * CRÍTICO (Apple policy):
 *  - En didReceiveIncomingPushWith se DEBE reportar la llamada a CXProvider
 *    antes de llamar completion(). Si no se hace, iOS puede matar la app
 *    y eventualmente revocar el permiso de VoIP push.
 */
@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter, PKPushRegistryDelegate {

  private var voipRegistry: PKPushRegistry?

  // ── Singleton accesible desde AppDelegate ────────────────────────
  @objc static let shared = EGChatPushKitModule()

  // ── Llamado desde AppDelegate cuando llega token VoIP ────────────
  @objc static func emitTokenUpdated(_ token: String) {
    shared.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  // ── Llamado desde AppDelegate cuando llega llamada entrante ──────
  @objc static func emitIncomingCall(_ payload: [String: Any]) {
    shared.sendEvent(withName: "voipPushReceived", body: payload)
  }

  // ── Inicializar PushKit registry ─────────────────────────────────
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

  // ── PKPushRegistryDelegate ───────────────────────────────────────

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    guard type == .voIP else { return }
    let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
    print("[EGChatPushKit] VoIP token actualizado: \(token.prefix(12))...")
    EGChatPushKitModule.emitTokenUpdated(token)
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didInvalidatePushTokenFor type: PKPushType
  ) {
    print("[EGChatPushKit] Token VoIP invalidado")
    EGChatPushKitModule.emitTokenUpdated("")
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    guard type == .voIP else { completion(); return }

    // Convertir [AnyHashable: Any] → [String: Any]
    let rawDict = payload.dictionaryPayload
    var dict: [String: Any] = [:]
    for (key, value) in rawDict {
      if let strKey = key as? String {
        dict[strKey] = value
      }
    }

    // Extraer datos del llamante del payload
    let aps      = dict["aps"] as? [String: Any] ?? [:]
    let callId   = aps["callId"]     as? String ?? dict["callId"]     as? String ?? UUID().uuidString
    let caller   = aps["callerName"] as? String ?? dict["callerName"] as? String ?? "EGCHAT"
    let avatar   = aps["callerAvatar"] as? String ?? dict["callerAvatar"] as? String ?? ""
    let rawType  = aps["callType"]   as? String ?? dict["callType"]   as? String ?? "audio"
    let isVideo  = (rawType == "video")

    print("[EGChatPushKit] Llamada entrante — caller: \(caller), callId: \(callId), video: \(isVideo)")

    // ⚠️ CRÍTICO: Apple exige reportar la llamada a CallKit AQUÍ,
    //    antes de llamar completion(). No puede ser diferido.
    EGChatCallModule.shared.showIncomingCall(
      caller,
      callerAvatar: avatar,
      callId: callId,
      isVideo: isVideo
    )

    // Construir payload completo para JS
    var body: [String: Any] = [
      "callId":     callId,
      "callerName": caller,
      "callType":   rawType,
    ]
    if let offer = dict["offer"] as? [String: Any] { body["offer"] = offer }
    if let offerStr = dict["offer"] as? String { body["offer"] = offerStr }
    if let targetUserId = dict["targetUserId"] as? String { body["targetUserId"] = targetUserId }
    if let chatId = dict["chatId"] as? String { body["chatId"] = chatId }

    // Emitir a JS para preparar WebRTC
    EGChatPushKitModule.emitIncomingCall(body)

    completion()
  }

  // ── RCTEventEmitter ─────────────────────────────────────────────

  override func supportedEvents() -> [String] {
    return ["voipTokenUpdated", "voipPushReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
}
