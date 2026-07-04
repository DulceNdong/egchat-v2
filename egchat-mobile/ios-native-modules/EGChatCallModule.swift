import Foundation
import CallKit
import AVFoundation

/**
 * EGChat — Módulo nativo de llamadas iOS (CallKit)
 * Registrar en AppDelegate.mm:
 *   [EGChatCallModule sharedInstance];  // inicializar el provider
 *
 * Expone a React Native exactamente la misma API que el módulo Android:
 *   showIncomingCall, dismissIncomingCall, answerCall, rejectCall, endCall
 */
@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter {

  private var provider: CXProvider?
  private var callController = CXCallController()
  private var currentCallUUID: UUID?
  private var pendingCallId: String?

  static let shared = EGChatCallModule()

  override init() {
    super.init()
    let config = CXProviderConfiguration()
    config.localizedName = "EGChat"
    config.supportsVideo = true
    config.maximumCallsPerCallGroup = 1
    config.supportedHandleTypes = [.generic]
    // Icono de la app en la pantalla de llamada
    config.iconTemplateImageData = UIImage(named: "AppIcon")?.pngData()
    config.ringtoneSound = "notification.wav" // suena al recibir llamada

    provider = CXProvider(configuration: config)
    provider?.setDelegate(self, queue: nil)
  }

  // ── API expuesta a React Native ──────────────────────────────────

  @objc func showIncomingCall(
    _ callerName: String,
    callerAvatar: String,
    callId: String,
    isVideo: Bool
  ) {
    let uuid = UUID()
    currentCallUUID = uuid
    pendingCallId = callId

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerName)
    update.localizedCallerName = callerName
    update.hasVideo = isVideo
    update.supportsHolding = false
    update.supportsGrouping = false

    provider?.reportNewIncomingCall(with: uuid, update: update) { error in
      if let error = error {
        print("EGChat CallKit error: \(error.localizedDescription)")
      }
    }
  }

  @objc func dismissIncomingCall() {
    guard let uuid = currentCallUUID else { return }
    provider?.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    currentCallUUID = nil
    pendingCallId = nil
  }

  @objc func endCall(_ callId: String) {
    dismissIncomingCall()
    sendEvent(withName: "callEnded", body: callId)
  }

  @objc func answerCall(_ callId: String) {
    dismissIncomingCall()
    sendEvent(withName: "callAnswered", body: callId)
  }

  @objc func rejectCall(_ callId: String) {
    guard let uuid = currentCallUUID else { return }
    let action = CXEndCallAction(call: uuid)
    let transaction = CXTransaction(action: action)
    callController.request(transaction) { _ in }
    currentCallUUID = nil
    pendingCallId = nil
    sendEvent(withName: "callRejected", body: callId)
  }

  // ── RCTEventEmitter ─────────────────────────────────────────────

  override func supportedEvents() -> [String] {
    return ["callAnswered", "callRejected", "callEnded"]
  }

  override static func requiresMainQueueSetup() -> Bool { return false }
}

// ── CXProviderDelegate ───────────────────────────────────────────

extension EGChatCallModule: CXProviderDelegate {

  func providerDidReset(_ provider: CXProvider) {
    currentCallUUID = nil
    pendingCallId = nil
  }

  // El usuario toca "Aceptar" en la pantalla de llamada de iOS
  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    // Configurar audio para la llamada
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playAndRecord, mode: .voiceChat)
    try? session.setActive(true)

    action.fulfill()

    if let callId = pendingCallId {
      sendEvent(withName: "callAnswered", body: callId)
    }
  }

  // El usuario toca "Rechazar" o desliza para silenciar
  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    action.fulfill()
    if let callId = pendingCallId {
      sendEvent(withName: "callRejected", body: callId)
    }
    currentCallUUID = nil
    pendingCallId = nil
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    // Audio activado — la llamada puede sonar
  }

  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    try? audioSession.setActive(false)
  }
}
