import Foundation
import React
import CallKit
import UserNotifications
import AVFoundation

/// Puente nativo para llamadas entrantes/salientes
///
/// iOS: usa CallKit (CXProvider) para mostrar la UI nativa de llamada.
///
/// REGLA APPLE: reportNewIncomingCall DEBE llamarse dentro del callback
/// didReceiveIncomingPushWith del AppDelegate, NO desde JS.
/// Por eso exponemos reportIncomingCallFromPush como método ESTÁTICO
/// que AppDelegate invoca directamente, sin esperar a que JS esté listo.
///
/// Eventos emitidos al JS:
///   - "callAnswered"  (callId: String)
///   - "callRejected"  (callId: String)
///   - "callEnded"     (callId: String)

@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter, CXProviderDelegate {

  // Singleton para que AppDelegate pueda invocar métodos de instancia
  @objc static weak var shared: EGChatCallModule?

  private var provider: CXProvider?
  private var callController = CXCallController()
  private var activeCallUUID: UUID?
  private var callIdMap: [UUID: String] = [:]   // UUID ↔ callId string

  // Payload pendiente recibido vía PushKit antes de que JS estuviera listo.
  // Se entrega a JS en cuanto el módulo está disponible.
  private static var pendingIncomingPayload: [String: Any]? = nil

  override init() {
    super.init()
    EGChatCallModule.shared = self

    let config = CXProviderConfiguration()
    config.supportsVideo           = true
    config.maximumCallsPerCallGroup = 1
    config.supportedHandleTypes   = [.generic]
    if let icon = UIImage(named: "CallKitIcon") {
      config.iconTemplateImageData = icon.pngData()
    }
    provider = CXProvider(configuration: config)
    provider?.setDelegate(self, queue: nil)

    // Entregar payload pendiente (llegó antes de que JS iniciara)
    if let pending = EGChatCallModule.pendingIncomingPayload {
      EGChatCallModule.pendingIncomingPayload = nil
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        EGChatPushKitModule.emitIncomingCall(pending)
      }
    }
  }

  // ── Eventos soportados ───────────────────────────────────────────
  override func supportedEvents() -> [String]! {
    return ["callAnswered", "callRejected", "callEnded"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
  override var methodQueue: DispatchQueue! { return .main }

  // ══════════════════════════════════════════════════════════════════
  // MÉTODO ESTÁTICO — llamado desde AppDelegate.pushRegistry()
  //
  // Apple exige que reportNewIncomingCall se invoque dentro del callback
  // PushKit, no segundos después desde JS. Este método se llama
  // DIRECTAMENTE desde AppDelegate sin depender del bridge de React Native.
  // ══════════════════════════════════════════════════════════════════
  @objc static func reportIncomingCallFromPush(
    _ dict: [String: Any],
    completion: @escaping () -> Void
  ) {
    let callerName = (dict["callerName"] as? String)
                  ?? (dict["caller_name"] as? String)
                  ?? "EGChat"
    let callId     = (dict["callId"] as? String)
                  ?? (dict["call_id"] as? String)
                  ?? UUID().uuidString
    let isVideo    = (dict["callType"] as? String) == "video"
                  || (dict["call_type"] as? String) == "video"

    if let instance = EGChatCallModule.shared {
      // Módulo ya disponible → reportar inmediatamente
      instance.reportIncomingCallNow(
        callerName: callerName,
        callId:     callId,
        isVideo:    isVideo,
        completion: completion
      )
    } else {
      // Módulo aún no inicializado (JS no arrancó).
      // Crear un provider temporal SOLO para cumplir con Apple:
      // reportNewIncomingCall DEBE llamarse en este callback.
      let config = CXProviderConfiguration()
      config.supportsVideo = true
      config.supportedHandleTypes = [.generic]
      let tempProvider = CXProvider(configuration: config)
      let uuid = UUID()
      let update = CXCallUpdate()
      update.remoteHandle = CXHandle(type: .generic, value: callerName)
      update.hasVideo     = isVideo
      update.localizedCallerName = callerName
      update.supportsHolding     = false
      update.supportsDTMF        = false
      update.supportsGrouping    = false
      update.supportsUngrouping  = false

      tempProvider.reportNewIncomingCall(with: uuid, update: update) { error in
        if let error = error {
          print("[EGChatCallModule] reportIncomingCallFromPush (temp) error: \(error)")
        }
        completion()
      }

      // Guardar payload para cuando el módulo se inicialice
      EGChatCallModule.pendingIncomingPayload = dict
    }
  }

  // ── Reportar llamada entrante con la instancia activa ────────────
  private func reportIncomingCallNow(
    callerName: String,
    callId: String,
    isVideo: Bool,
    completion: @escaping () -> Void
  ) {
    // Guard: evitar llamadas duplicadas para el mismo callId
    if callIdMap.values.contains(callId) {
      print("[EGChatCallModule] Llamada duplicada ignorada: \(callId)")
      completion()
      return
    }

    let uuid = UUID()
    callIdMap[uuid] = callId
    activeCallUUID  = uuid

    let update = CXCallUpdate()
    update.remoteHandle        = CXHandle(type: .generic, value: callerName)
    update.hasVideo            = isVideo
    update.localizedCallerName = callerName
    update.supportsHolding     = false
    update.supportsDTMF        = false
    update.supportsGrouping    = false
    update.supportsUngrouping  = false

    provider?.reportNewIncomingCall(with: uuid, update: update) { error in
      if let error = error {
        print("[EGChatCallModule] reportNewIncomingCall error: \(error.localizedDescription)")
      }
      completion()
    }
  }

  // ── showIncomingCall (llamado desde JS cuando la app ya está abierta) ──
  // Solo usado para mostrar CallKit desde la pantalla de llamada.
  // NO para el flujo de PushKit (ese usa reportIncomingCallFromPush).
  @objc func showIncomingCall(
    _ callerName: String,
    callerAvatar: String,
    callId: String,
    isVideo: Bool
  ) {
    reportIncomingCallNow(
      callerName: callerName,
      callId:     callId,
      isVideo:    isVideo,
      completion: {}
    )
  }

  // ── dismissIncomingCall ──────────────────────────────────────────
  @objc func dismissIncomingCall() {
    guard let uuid = activeCallUUID else { return }
    provider?.reportCall(with: uuid, endedAt: nil, reason: .answeredElsewhere)
  }

  // ── answerCall ───────────────────────────────────────────────────
  @objc func answerCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    let action = CXAnswerCallAction(call: uuid)
    callController.requestTransaction(with: action) { _ in }
  }

  // ── rejectCall ───────────────────────────────────────────────────
  @objc func rejectCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    let action = CXEndCallAction(call: uuid)
    callController.requestTransaction(with: action) { _ in }
  }

  // ── endCall ──────────────────────────────────────────────────────
  @objc func endCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    provider?.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    callIdMap.removeValue(forKey: uuid)
    if activeCallUUID == uuid { activeCallUUID = nil }
  }

  // ══════════════════════════════════════════════════════════════════
  // CXProviderDelegate
  // ══════════════════════════════════════════════════════════════════

  func providerDidReset(_ provider: CXProvider) {
    callIdMap.removeAll()
    activeCallUUID = nil
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    // Configurar AVAudioSession para la llamada
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(
        .playAndRecord,
        mode: .voiceChat,
        options: [.allowBluetooth, .allowBluetoothA2DP]
      )
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      print("[EGChatCallModule] AVAudioSession error: \(error)")
    }

    if let callId = callIdMap[action.callUUID] {
      sendEvent(withName: "callAnswered", body: callId)
    }
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    if let callId = callIdMap[action.callUUID] {
      sendEvent(withName: "callRejected", body: callId)
      sendEvent(withName: "callEnded",    body: callId)
      callIdMap.removeValue(forKey: action.callUUID)
    }
    if activeCallUUID == action.callUUID { activeCallUUID = nil }
    action.fulfill()
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    try? audioSession.setActive(true, options: .notifyOthersOnDeactivation)
  }

  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
  }
}
