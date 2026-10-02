import Foundation
import React
import CallKit
import UserNotifications
import AVFoundation

/// Puente nativo para llamadas entrantes/salientes
/// iOS: usa CallKit (CXProvider) para mostrar la UI nativa de llamada
/// Eventos emitidos al JS:
///   - "callAnswered"  (callId: String)
///   - "callRejected"  (callId: String)
///   - "callEnded"     (callId: String)
@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter, CXProviderDelegate {

  private var provider: CXProvider?
  private var callController = CXCallController()
  private var activeCallUUID: UUID?
  private var callIdMap: [UUID: String] = [:]   // UUID ↔ callId string

  override init() {
    super.init()
    let config = CXProviderConfiguration()
    config.supportsVideo           = true
    config.maximumCallsPerCallGroup = 1
    config.supportedHandleTypes   = [.generic]
    if let icon = UIImage(named: "CallKitIcon") {
      config.iconTemplateImageData = icon.pngData()
    }
    provider = CXProvider(configuration: config)
    provider?.setDelegate(self, queue: nil)
  }

  // ── Eventos soportados ───────────────────────────────────────────
  override func supportedEvents() -> [String]! {
    return ["callAnswered", "callRejected", "callEnded"]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }
  override var methodQueue: DispatchQueue! { return .main }

  // ── showIncomingCall ─────────────────────────────────────────────
  @objc func showIncomingCall(
    _ callerName: String,
    callerAvatar: String,
    callId: String,
    isVideo: Bool
  ) {
    let uuid = UUID()
    callIdMap[uuid] = callId
    activeCallUUID  = uuid

    let update = CXCallUpdate()
    update.remoteHandle         = CXHandle(type: .generic, value: callerName)
    update.hasVideo             = isVideo
    update.localizedCallerName  = callerName
    update.supportsHolding      = false
    update.supportsDTMF         = false
    update.supportsGrouping     = false
    update.supportsUngrouping   = false

    provider?.reportNewIncomingCall(with: uuid, update: update) { error in
      if let error = error {
        print("[EGChatCallModule] Error reporting incoming call: \(error)")
      }
    }
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

  // ── CXProviderDelegate ───────────────────────────────────────────

  func providerDidReset(_ provider: CXProvider) {
    callIdMap.removeAll()
    activeCallUUID = nil
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    // Configurar sesión de audio para la llamada
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
    try? session.setActive(true)

    if let callId = callIdMap[action.callUUID] {
      sendEvent(withName: "callAnswered", body: callId)
    }
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    if let callId = callIdMap[action.callUUID] {
      // Distinguir rechazo (antes de conectar) de fin de llamada
      sendEvent(withName: "callRejected", body: callId)
      sendEvent(withName: "callEnded",    body: callId)
      callIdMap.removeValue(forKey: action.callUUID)
    }
    if activeCallUUID == action.callUUID { activeCallUUID = nil }
    action.fulfill()
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    try? audioSession.setActive(true)
  }

  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    try? audioSession.setActive(false)
  }
}
