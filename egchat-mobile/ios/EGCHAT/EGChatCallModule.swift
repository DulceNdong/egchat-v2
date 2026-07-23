/**
 * EGChatCallBridge.swift
 * Lógica CallKit — sin imports de React Native
 * El bridge RN vive en EGChatCallModule.m
 */

import CallKit
import AVFoundation

@objc(EGChatCallBridge)
class EGChatCallBridge: NSObject, CXProviderDelegate {

  private let provider: CXProvider
  private let callController = CXCallController()
  private var activeCallUUID: UUID?
  private var activeCallId: String?

  // Callbacks para eventos hacia JS (se setean desde el .m via bridge)
  @objc var onCallAnswered: RCTResponseSenderBlock?
  @objc var onCallRejected: RCTResponseSenderBlock?
  @objc var onCallMuted:    RCTResponseSenderBlock?

  // EventEmitter para enviar eventos a JS
  private weak var eventEmitter: RCTEventEmitter?

  @objc static func moduleName() -> String { "EGChatCallModule" }
  @objc static func requiresMainQueueSetup() -> Bool { false }

  override init() {
    let cfg = CXProviderConfiguration()
    cfg.localizedName            = "EGCHAT"
    cfg.supportsVideo            = true
    cfg.maximumCallGroups        = 1
    cfg.maximumCallsPerCallGroup = 1
    cfg.supportedHandleTypes     = [.generic]
    cfg.ringtoneSound            = "notification.wav"
    provider = CXProvider(configuration: cfg)
    super.init()
    provider.setDelegate(self, queue: nil)
  }

  // MARK: - Métodos exportados a JS

  @objc func showIncomingCall(_ callerName: String,
                               callerAvatar: String,
                               callId: String,
                               isVideo: Bool) {
    let uuid = UUID()
    activeCallUUID = uuid
    activeCallId   = callId
    let update = CXCallUpdate()
    update.remoteHandle        = CXHandle(type: .generic, value: callerName)
    update.localizedCallerName = callerName
    update.hasVideo            = isVideo
    update.supportsHolding     = false
    provider.reportNewIncomingCall(with: uuid, update: update) { error in
      if let e = error { print("[CallKit] incoming error: \(e)") }
    }
  }

  @objc func dismissIncomingCall() {
    guard let uuid = activeCallUUID else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    activeCallUUID = nil
  }

  @objc func answerCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    callController.request(CXTransaction(action: CXAnswerCallAction(call: uuid))) { _ in }
  }

  @objc func rejectCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    callController.request(CXTransaction(action: CXEndCallAction(call: uuid))) { _ in }
    activeCallUUID = nil
  }

  @objc func endCall(_ callId: String) {
    guard let uuid = activeCallUUID else { return }
    callController.request(CXTransaction(action: CXEndCallAction(call: uuid))) { _ in }
    activeCallUUID = nil
    activeCallId   = nil
  }

  // MARK: - CXProviderDelegate

  func providerDidReset(_ provider: CXProvider) {
    activeCallUUID = nil
    activeCallId   = nil
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    let s = AVAudioSession.sharedInstance()
    try? s.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
    try? s.setActive(true)
    action.fulfill()
    EGChatNativeEvents.shared.send("callAnswered", body: ["callId": activeCallId ?? ""])
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    action.fulfill()
    EGChatNativeEvents.shared.send("callRejected", body: ["callId": activeCallId ?? ""])
    activeCallUUID = nil
    activeCallId   = nil
  }

  func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
    action.fulfill()
    EGChatNativeEvents.shared.send("callMuted", body: ["muted": action.isMuted])
  }

  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    try? audioSession.setActive(true)
  }

  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
  }
}
