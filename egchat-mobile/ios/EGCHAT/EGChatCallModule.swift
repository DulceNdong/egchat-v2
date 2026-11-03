import Foundation
import CallKit
import AVFoundation
import UIKit
import React

/** CallKit puede despertar la app antes de que React Native esté listo. */
final class EGChatCallCoordinator: NSObject, CXProviderDelegate {
  static let shared = EGChatCallCoordinator()

  private lazy var provider: CXProvider = {
    let configuration = CXProviderConfiguration()
    configuration.supportsVideo = true
    configuration.maximumCallsPerCallGroup = 1
    configuration.maximumCallGroups = 1
    configuration.supportedHandleTypes = [.generic]
    configuration.includesCallsInRecents = true
    configuration.iconTemplateImageData = UIImage(named: "CallKitIcon")?.pngData()
    let provider = CXProvider(configuration: configuration)
    provider.setDelegate(self, queue: .main)
    return provider
  }()

  private let callController = CXCallController()
  private var activeCallUUID: UUID?
  private var activeCallId: String?
  private var isCallActive = false
  private var audioObserversRegistered = false
  private var pendingEvents: [(String, Any)] = []

  /// CallKit puede contestar con JavaScript dormido (push VoIP con la app
  /// cerrada). La acción se guarda aquí para que la app la reenvíe al servidor
  /// al arrancar; si no, la UI de sistema queda conectada y el llamante sigue
  /// sonando hasta que caduca la llamada.
  static let pendingAnswerKey = "EGChatPendingAnsweredCall"
  // 5 min: coincide con el TTL del answer pendiente en JavaScript. Con la app
  // cerrada el usuario puede abrir EGCHAT varios minutos después de contestar.
  private static let pendingAnswerTTLms: Double = 300_000

  func takePendingAnsweredCall() -> String? {
    guard let stored = UserDefaults.standard.dictionary(forKey: Self.pendingAnswerKey),
          let callId = stored["callId"] as? String,
          let ts = stored["ts"] as? Double,
          Date().timeIntervalSince1970 * 1000 - ts < Self.pendingAnswerTTLms
    else { return nil }
    UserDefaults.standard.removeObject(forKey: Self.pendingAnswerKey)
    return callId
  }

  private func clearPendingAnsweredCall() {
    UserDefaults.standard.removeObject(forKey: Self.pendingAnswerKey)
  }

  func reportIncomingCall(callerName: String, callerAvatar: String, callId: String, isVideo: Bool) {
    let uuid = UUID()
    activeCallUUID = uuid
    activeCallId = callId

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerName)
    update.localizedCallerName = callerName
    update.hasVideo = isVideo
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsHolding = false
    update.supportsDTMF = false

    provider.reportNewIncomingCall(with: uuid, update: update) { error in
      if let error { print("[CallKit] reportNewIncomingCall error: \(error.localizedDescription)") }
    }
    registerAudioObservers()
  }

  func dismissIncomingCall() {
    guard let uuid = activeCallUUID else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup()
  }

  func answerCall() {
    guard let uuid = activeCallUUID else { return }
    // Lo pide JavaScript, así que el answer se enviará al servidor desde JS.
    clearPendingAnsweredCall()
    callController.request(CXTransaction(action: CXAnswerCallAction(call: uuid))) { error in
      if let error { print("[CallKit] answerCall error: \(error.localizedDescription)") }
    }
  }

  func rejectCall() {
    guard let uuid = activeCallUUID else { return }
    callController.request(CXTransaction(action: CXEndCallAction(call: uuid))) { _ in }
  }

  func endCall() {
    guard let uuid = activeCallUUID else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup()
  }

  /// Corta el timbre desde un push sin levantar JavaScript, pero solo si la
  /// llamada sigue sin conectar. Si en esta máquina ya se contestó, el aviso de
  /// "contestada" del servidor no debe tumbar la llamada viva.
  func endRingingCall(matching callId: String) {
    guard let uuid = activeCallUUID, activeCallId == callId else { return }
    // `isCallActive` se pone al aceptar la llamada y se vacía en cleanup(), así que
    // false equivale a «sigue timbrando». No existe `CXCallController.call(at:)`,
    // y consultar el estado real de la llamada requiere un fetch asíncrono.
    guard !isCallActive else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup()
  }

  /** El evento solo sirve si el JS tiene listeners activos; si no, se encola. */
  private var hasListener: Bool { EGChatCallModule.eventSink?.isObserving == true }

  func emit(_ name: String, body: Any) {
    if hasListener, let module = EGChatCallModule.eventSink {
      module.sendEvent(withName: name, body: body)
    } else {
      pendingEvents.append((name, body))
    }
  }

  func flushPendingEvents() {
    guard hasListener, let module = EGChatCallModule.eventSink else { return }
    let events = pendingEvents
    pendingEvents.removeAll()
    events.forEach { module.sendEvent(withName: $0.0, body: $0.1) }
  }

  private func configureAudioSession() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker])
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch { print("[CallKit] AVAudioSession error: \(error.localizedDescription)") }
  }

  private func deactivateAudioSession() {
    do { try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }
    catch { print("[CallKit] deactivateAudioSession error: \(error.localizedDescription)") }
  }

  private func registerAudioObservers() {
    guard !audioObserversRegistered else { return }
    audioObserversRegistered = true
    NotificationCenter.default.addObserver(self, selector: #selector(handleAudioInterruption(_:)), name: AVAudioSession.interruptionNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRouteChange(_:)), name: AVAudioSession.routeChangeNotification, object: nil)
  }

  private func removeAudioObservers() {
    guard audioObserversRegistered else { return }
    audioObserversRegistered = false
    NotificationCenter.default.removeObserver(self, name: AVAudioSession.interruptionNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
  }

  @objc private func handleAudioInterruption(_ notification: Notification) {
    guard let value = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: value) else { return }
    emit("audioInterrupted", body: ["interrupted": type == .began, "callId": activeCallId ?? ""])
  }

  @objc private func handleRouteChange(_ notification: Notification) {
    let route = AVAudioSession.sharedInstance().currentRoute.outputs.first?.portName ?? "unknown"
    emit("audioRouteChanged", body: ["route": route, "callId": activeCallId ?? ""])
  }

  private func cleanup() {
    activeCallUUID = nil
    activeCallId = nil
    isCallActive = false
    removeAudioObservers()
    deactivateAudioSession()
  }

  func providerDidReset(_ provider: CXProvider) { cleanup() }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    configureAudioSession()
    isCallActive = true
    action.fulfill()
    // Si JavaScript no está escuchando, la aceptación se queda solo en CallKit:
    // el llamante nunca se entera. Guardarla permite reenviarla al arrancar el JS.
    if let callId = activeCallId, !hasListener {
      UserDefaults.standard.set(
        ["callId": callId, "ts": Date().timeIntervalSince1970 * 1000],
        forKey: Self.pendingAnswerKey
      )
    }
    emit("callAnswered", body: activeCallId ?? "")
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    let callId = activeCallId ?? ""
    let wasActive = isCallActive
    action.fulfill()
    clearPendingAnsweredCall()
    emit(wasActive ? "callEnded" : "callRejected", body: callId)
    cleanup()
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) { configureAudioSession() }
  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) { deactivateAudioSession() }
}

@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter {
  static weak var eventSink: EGChatCallModule?
  private(set) var isObserving = false

  override init() {
    super.init()
    // Solo se designa el destino de los eventos; la cola se vacía en
    // startObserving, cuando el JS ya tiene listeners.
    Self.eventSink = self
  }

  override func startObserving() {
    isObserving = true
    Self.eventSink = self
    EGChatCallCoordinator.shared.flushPendingEvents()
  }

  override func stopObserving() { isObserving = false }

  override func supportedEvents() -> [String] {
    ["callAnswered", "callRejected", "callEnded", "audioInterrupted", "audioRouteChanged"]
  }

  override static func requiresMainQueueSetup() -> Bool { true }

  @objc func showIncomingCall(_ callerName: String, callerAvatar: String, callId: String, isVideo: Bool) {
    EGChatCallCoordinator.shared.reportIncomingCall(callerName: callerName, callerAvatar: callerAvatar, callId: callId, isVideo: isVideo)
  }

  @objc func dismissIncomingCall() { EGChatCallCoordinator.shared.dismissIncomingCall() }
  @objc func answerCall(_ callId: String) { EGChatCallCoordinator.shared.answerCall() }
  @objc func rejectCall(_ callId: String) { EGChatCallCoordinator.shared.rejectCall() }
  @objc func endCall(_ callId: String) { EGChatCallCoordinator.shared.endCall() }

  /// Llamada que el usuario contestó en CallKit sin que el JS estuviera activo.
  @objc func consumePendingAnsweredCall(_ resolve: @escaping RCTPromiseResolveBlock,
                                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(EGChatCallCoordinator.shared.takePendingAnsweredCall())
  }
}
