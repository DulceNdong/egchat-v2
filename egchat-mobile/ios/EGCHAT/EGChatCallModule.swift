import Foundation
import React
import CallKit
import UserNotifications
import AVFoundation

/// Puente nativo para llamadas entrantes/salientes
///
/// Gestiona:
///   - CallKit (CXProvider) para UI nativa de llamada
///   - AVAudioSession: configuración, interrupciones, cambios de ruta
///   - Interrupciones telefónicas: pausa/reanuda audio automáticamente
///   - Cambios de ruta: Bluetooth, auriculares, altavoz
///
/// REGLA APPLE: reportNewIncomingCall DEBE llamarse dentro del callback
/// didReceiveIncomingPushWith del AppDelegate, NO desde JS.
/// Por eso exponemos reportIncomingCallFromPush como método ESTÁTICO.
///
/// Eventos emitidos al JS:
///   - "callAnswered"       (callId: String)
///   - "callRejected"       (callId: String)
///   - "callEnded"          (callId: String)
///   - "audioInterrupted"   ({ interrupted: Bool, callId: String })
///   - "audioRouteChanged"  ({ route: String, callId: String })

@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter, CXProviderDelegate {

  // Strong reference — el módulo no debe ser recolectado antes de recibir el push VoIP
  @objc static var shared: EGChatCallModule?

  private var provider:       CXProvider?
  private var callController = CXCallController()
  private var activeCallUUID: UUID?
  private var callIdMap:      [UUID: String] = [:]

  // Para reportar desde AppDelegate antes de que el módulo esté listo
  private static var pendingIncomingPayload: [String: Any]? = nil

  // Observers de AVAudioSession
  private var audioInterruptionObserver: Any?
  private var audioRouteChangeObserver:  Any?

  override init() {
    super.init()
    EGChatCallModule.shared = self

    let config                          = CXProviderConfiguration()
    config.supportsVideo                = true
    config.maximumCallsPerCallGroup     = 1
    config.supportedHandleTypes        = [.generic]
    if let icon = UIImage(named: "CallKitIcon") {
      config.iconTemplateImageData = icon.pngData()
    }

    provider = CXProvider(configuration: config)
    provider?.setDelegate(self, queue: nil)

    // Registrar observers de AVAudioSession
    registerAudioSessionObservers()

    // Entregar payload pendiente (llegó antes de que JS iniciara)
    if let pending = EGChatCallModule.pendingIncomingPayload {
      EGChatCallModule.pendingIncomingPayload = nil
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        EGChatPushKitModule.emitIncomingCall(pending)
      }
    }
  }

  deinit {
    unregisterAudioSessionObservers()
  }

  // ── Eventos soportados ───────────────────────────────────────────
  override func supportedEvents() -> [String]! {
    return ["callAnswered", "callRejected", "callEnded", "audioInterrupted", "audioRouteChanged"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
  override var methodQueue: DispatchQueue! { return .main }

  // ══════════════════════════════════════════════════════════════════
  // reportIncomingCallFromPush — llamado desde AppDelegate
  // Debe ejecutarse DENTRO del callback PushKit (requisito Apple).
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
      instance.reportIncomingCallNow(
        callerName: callerName, callId: callId, isVideo: isVideo, completion: completion
      )
    } else {
      // Módulo aún no inicializado — usar provider temporal
      let config                      = CXProviderConfiguration()
      config.supportsVideo            = true
      config.supportedHandleTypes    = [.generic]
      let tempProvider = CXProvider(configuration: config)
      let uuid = UUID()
      let update = CXCallUpdate()
      update.remoteHandle        = CXHandle(type: .generic, value: callerName)
      update.hasVideo            = isVideo
      update.localizedCallerName = callerName
      update.supportsHolding     = false
      update.supportsDTMF        = false
      update.supportsGrouping    = false
      update.supportsUngrouping  = false

      tempProvider.reportNewIncomingCall(with: uuid, update: update) { _ in
        completion()
      }
      EGChatCallModule.pendingIncomingPayload = dict
    }
  }

  // ── Reportar llamada con instancia activa ────────────────────────
  private func reportIncomingCallNow(
    callerName: String,
    callId: String,
    isVideo: Bool,
    completion: @escaping () -> Void
  ) {
    // Guard anti-duplicado
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

  // ── showIncomingCall (desde JS, app abierta) ─────────────────────
  @objc func showIncomingCall(
    _ callerName: String,
    callerAvatar: String,
    callId: String,
    isVideo: Bool
  ) {
    reportIncomingCallNow(callerName: callerName, callId: callId, isVideo: isVideo, completion: {})
  }

  @objc func dismissIncomingCall() {
    guard let uuid = activeCallUUID else { return }
    provider?.reportCall(with: uuid, endedAt: nil, reason: .answeredElsewhere)
  }

  @objc func answerCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    let action = CXAnswerCallAction(call: uuid)
    callController.requestTransaction(with: action) { _ in }
  }

  @objc func rejectCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    let action = CXEndCallAction(call: uuid)
    callController.requestTransaction(with: action) { _ in }
  }

  @objc func endCall(_ callId: String) {
    guard let uuid = callIdMap.first(where: { $0.value == callId })?.key else { return }
    provider?.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    callIdMap.removeValue(forKey: uuid)
    if activeCallUUID == uuid { activeCallUUID = nil }
  }

  // ══════════════════════════════════════════════════════════════════
  // AVAudioSession — Interrupciones y cambios de ruta
  // ══════════════════════════════════════════════════════════════════

  private func registerAudioSessionObservers() {
    let nc = NotificationCenter.default

    // Interrupciones (llamada telefónica entrante, alarma, Siri, etc.)
    audioInterruptionObserver = nc.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object:  nil,
      queue:   .main
    ) { [weak self] notification in
      self?.handleAudioInterruption(notification)
    }

    // Cambios de ruta (BT conectado/desconectado, auriculares, altavoz)
    audioRouteChangeObserver = nc.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object:  nil,
      queue:   .main
    ) { [weak self] notification in
      self?.handleAudioRouteChange(notification)
    }
  }

  private func unregisterAudioSessionObservers() {
    if let obs = audioInterruptionObserver {
      NotificationCenter.default.removeObserver(obs)
      audioInterruptionObserver = nil
    }
    if let obs = audioRouteChangeObserver {
      NotificationCenter.default.removeObserver(obs)
      audioRouteChangeObserver = nil
    }
  }

  /// Interrupción de audio (llamada telefónica, alarma, etc.)
  private func handleAudioInterruption(_ notification: Notification) {
    guard
      let info     = notification.userInfo,
      let typeVal  = info[AVAudioSessionInterruptionTypeKey] as? UInt,
      let type     = AVAudioSession.InterruptionType(rawValue: typeVal)
    else { return }

    let callId = activeCallUUID.flatMap { callIdMap[$0] } ?? ""

    switch type {
    case .began:
      // Interrupción comenzó — pausar audio de la llamada
      print("[EGChatCallModule] AVAudioSession interrupción comenzó")
      sendEvent(withName: "audioInterrupted", body: ["interrupted": true, "callId": callId])

    case .ended:
      // Interrupción terminó — reanudar si el sistema lo permite
      if let optVal = info[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optVal)
        if options.contains(.shouldResume) {
          let session = AVAudioSession.sharedInstance()
          try? session.setActive(true, options: .notifyOthersOnDeactivation)
          print("[EGChatCallModule] AVAudioSession reanudada tras interrupción")
        }
      }
      sendEvent(withName: "audioInterrupted", body: ["interrupted": false, "callId": callId])

    @unknown default:
      break
    }
  }

  /// Cambio de ruta de audio (BT, auriculares, altavoz)
  private func handleAudioRouteChange(_ notification: Notification) {
    guard
      let info    = notification.userInfo,
      let reason  = info[AVAudioSessionRouteChangeReasonKey] as? UInt
    else { return }

    let session    = AVAudioSession.sharedInstance()
    let outputs    = session.currentRoute.outputs
    let routeDesc  = outputs.map { $0.portType.rawValue }.joined(separator: ",")
    let callId     = activeCallUUID.flatMap { callIdMap[$0] } ?? ""

    print("[EGChatCallModule] Ruta de audio cambiada → \(routeDesc), razón: \(reason)")
    sendEvent(withName: "audioRouteChanged", body: ["route": routeDesc, "callId": callId, "reason": reason])
  }

  // ══════════════════════════════════════════════════════════════════
  // CXProviderDelegate
  // ══════════════════════════════════════════════════════════════════

  func providerDidReset(_ provider: CXProvider) {
    callIdMap.removeAll()
    activeCallUUID = nil
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(
        .playAndRecord,
        mode:    .voiceChat,
        options: [.allowBluetooth, .allowBluetoothA2DP]
      )
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      print("[EGChatCallModule] AVAudioSession error en answer: \(error)")
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
    do {
      try audioSession.setCategory(
        .playAndRecord,
        mode:    .voiceChat,
        options: [.allowBluetooth, .allowBluetoothA2DP]
      )
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      print("[EGChatCallModule] didActivate AVAudioSession error: \(error)")
    }
  }

  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
  }
}
