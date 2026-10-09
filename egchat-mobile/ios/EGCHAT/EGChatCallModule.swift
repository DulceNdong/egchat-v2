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

  func emit(_ name: String, body: Any) {
    if let module = EGChatCallModule.eventSink {
      module.sendEvent(withName: name, body: body)
    } else {
      pendingEvents.append((name, body))
    }
  }

  func flushPendingEvents() {
    guard let module = EGChatCallModule.eventSink else { return }
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
    emit("callAnswered", body: activeCallId ?? "")
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    let callId = activeCallId ?? ""
    let wasActive = isCallActive
    action.fulfill()
    emit(wasActive ? "callEnded" : "callRejected", body: callId)
    cleanup()
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) { configureAudioSession() }
  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) { deactivateAudioSession() }
}

@objc(EGChatCallModule)
class EGChatCallModule: RCTEventEmitter {
  static weak var eventSink: EGChatCallModule?

  override init() {
    super.init()
    Self.eventSink = self
  }

  override func startObserving() {
    Self.eventSink = self
    EGChatCallCoordinator.shared.flushPendingEvents()
  }

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
}
