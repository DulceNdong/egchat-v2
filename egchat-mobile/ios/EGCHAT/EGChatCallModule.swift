import Foundation
import CallKit
import AVFoundation
import React

/**
 * EGChatCallModule — CallKit iOS
 *
 * Responsabilidades:
 *  1. Mostrar la pantalla nativa de llamada entrante (teléfono cerrado/bloqueado)
 *  2. Gestionar respuesta/rechazo/fin desde la UI nativa de iOS
 *  3. Gestionar AVAudioSession para audio WebRTC
 *  4. Emitir eventos a React Native: callAnswered, callRejected, callEnded,
 *     audioInterrupted, audioRouteChanged
 *
 * Flujo con teléfono cerrado (como WhatsApp):
 *  PushKit push → EGChatPushKitModule → EGChatCallModule.showIncomingCall()
 *  → CXProvider reportNewIncomingCall() → iOS muestra UI nativa de llamada
 *  → Usuario acepta → callAnswered emitido → JS navega a /call/[callId]
 */
@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter {

  // ── Singleton ────────────────────────────────────────────────────
  @objc static let shared = EGChatCallModule()

  // ── CallKit ──────────────────────────────────────────────────────
  private lazy var provider: CXProvider = {
    let config = CXProviderConfiguration()
    config.supportsVideo              = true
    config.maximumCallsPerCallGroup   = 1
    config.maximumCallGroups          = 1
    config.supportedHandleTypes       = [.generic]
    config.includesCallsInRecents     = true
    config.iconTemplateImageData      = UIImage(named: "CallKitIcon")?.pngData()
    let p = CXProvider(configuration: config)
    p.setDelegate(self, queue: .main)
    return p
  }()

  private let callController = CXCallController()

  // ── Estado activo ────────────────────────────────────────────────
  private var activeCallUUID: UUID?
  private var activeCallId:   String?
  private var isCallActive    = false

  // ── RCTEventEmitter ─────────────────────────────────────────────
  override func supportedEvents() -> [String] {
    return [
      "callAnswered",
      "callRejected",
      "callEnded",
      "audioInterrupted",
      "audioRouteChanged",
    ]
  }

  override static func requiresMainQueueSetup() -> Bool { return true }

  // ════════════════════════════════════════════════════════════════
  // MARK: — API pública (llamada desde JS y desde PushKitModule)
  // ════════════════════════════════════════════════════════════════

  /**
   * Muestra la pantalla nativa de llamada entrante.
   * DEBE llamarse desde didReceiveIncomingPushWith (Apple lo exige).
   */
  @objc func showIncomingCall(
    _ callerName: String,
    callerAvatar: String,
    callId: String,
    isVideo: Bool
  ) {
    let uuid = UUID()
    activeCallUUID = uuid
    activeCallId   = callId

    let update = CXCallUpdate()
    update.remoteHandle        = CXHandle(type: .generic, value: callerName)
    update.localizedCallerName = callerName
    update.hasVideo            = isVideo
    update.supportsGrouping    = false
    update.supportsUngrouping  = false
    update.supportsHolding     = false
    update.supportsDTMF        = false

    provider.reportNewIncomingCall(with: uuid, update: update) { error in
      if let err = error {
        print("[CallKit] reportNewIncomingCall error: \(err.localizedDescription)")
      }
    }

    // Observar interrupciones y cambios de ruta de audio
    registerAudioObservers()
  }

  /** Cierra la UI de llamada entrante (si el usuario rechazó desde la app) */
  @objc func dismissIncomingCall() {
    guard let uuid = activeCallUUID else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup()
  }

  /** Notifica a CallKit que el usuario contestó desde dentro de la app */
  @objc func answerCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    let action = CXAnswerCallAction(call: uuid)
    let transaction = CXTransaction(action: action)
    callController.request(transaction) { error in
      if let err = error {
        print("[CallKit] answerCall error: \(err.localizedDescription)")
      }
    }
  }

  /** Notifica a CallKit que el usuario rechazó desde dentro de la app */
  @objc func rejectCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    let action = CXEndCallAction(call: uuid)
    let transaction = CXTransaction(action: action)
    callController.request(transaction) { _ in }
    cleanup()
  }

  /** Notifica a CallKit que la llamada terminó */
  @objc func endCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup()
  }

  // ════════════════════════════════════════════════════════════════
  // MARK: — Audio Session
  // ════════════════════════════════════════════════════════════════

  private func configureAudioSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(
        .playAndRecord,
        mode: .voiceChat,
        options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
      )
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      print("[CallKit] AVAudioSession error: \(error.localizedDescription)")
    }
  }

  private func deactivateAudioSession() {
    do {
      try AVAudioSession.sharedInstance().setActive(
        false,
        options: .notifyOthersOnDeactivation
      )
    } catch {
      print("[CallKit] deactivateAudioSession error: \(error.localizedDescription)")
    }
  }

  // ════════════════════════════════════════════════════════════════
  // MARK: — Observers de audio
  // ════════════════════════════════════════════════════════════════

  private var audioObserversRegistered = false

  private func registerAudioObservers() {
    guard !audioObserversRegistered else { return }
    audioObserversRegistered = true

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioInterruption(_:)),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleRouteChange(_:)),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }

  private func removeAudioObservers() {
    guard audioObserversRegistered else { return }
    audioObserversRegistered = false
    NotificationCenter.default.removeObserver(
      self,
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    NotificationCenter.default.removeObserver(
      self,
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }

  @objc private func handleAudioInterruption(_ notification: Notification) {
    guard
      let info = notification.userInfo,
      let typeVal = info[AVAudioSessionInterruptionTypeKey] as? UInt,
      let type = AVAudioSession.InterruptionType(rawValue: typeVal)
    else { return }

    let interrupted = (type == .began)
    sendEvent(withName: "audioInterrupted", body: [
      "interrupted": interrupted,
      "callId": activeCallId ?? "",
    ])
  }

  @objc private func handleRouteChange(_ notification: Notification) {
    let output = AVAudioSession.sharedInstance()
      .currentRoute.outputs.first?.portName ?? "unknown"
    sendEvent(withName: "audioRouteChanged", body: [
      "route": output,
      "callId": activeCallId ?? "",
    ])
  }

  // ════════════════════════════════════════════════════════════════
  // MARK: — Limpieza interna
  // ════════════════════════════════════════════════════════════════

  private func cleanup() {
    activeCallUUID = nil
    activeCallId   = nil
    isCallActive   = false
    removeAudioObservers()
    deactivateAudioSession()
  }
}

// ════════════════════════════════════════════════════════════════
// MARK: — CXProviderDelegate
// ════════════════════════════════════════════════════════════════
extension EGChatCallModule: CXProviderDelegate {

  // CallKit listo — configurar audio
  func providerDidReset(_ provider: CXProvider) {
    cleanup()
  }

  // Usuario pulsó "Aceptar" en la pantalla nativa de iOS
  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    configureAudioSession()
    isCallActive = true
    action.fulfill()
    sendEvent(withName: "callAnswered", body: activeCallId ?? "")
  }

  // Usuario pulsó "Rechazar" en la pantalla nativa de iOS
  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    action.fulfill()
    if isCallActive {
      sendEvent(withName: "callEnded", body: activeCallId ?? "")
    } else {
      sendEvent(withName: "callRejected", body: activeCallId ?? "")
    }
    cleanup()
  }

  // CallKit activa el audio (después de que el usuario acepta)
  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    do {
      try audioSession.setActive(true)
    } catch {
      print("[CallKit] didActivate error: \(error.localizedDescription)")
    }
  }

  // CallKit desactiva el audio
  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    do {
      try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      print("[CallKit] didDeactivate error: \(error.localizedDescription)")
    }
  }
}
