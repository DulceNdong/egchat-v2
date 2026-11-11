/**
 * EGChatLiveActivityBridge.swift
 * Live Activity / Dynamic Island para llamadas activas
 * Requiere iOS 16.2+. En versiones anteriores no hace nada.
 * Mapeado a "EGChatLiveActivityModule" en JS
 */

import Foundation

@objc(EGChatLiveActivityBridge)
class EGChatLiveActivityBridge: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private var callStartDate: Date?
  private var updateTimer: Timer?

  // MARK: - startCallActivity

  @objc func startCallActivity(
    _ callId: String,
    callerName: String,
    isVideo: Bool
  ) {
    callStartDate = Date()
    if #available(iOS 16.2, *) {
      EGChatActivityManager.shared.start(callId: callId,
                                         callerName: callerName,
                                         isVideo: isVideo)
    }
    // Timer que actualiza el contador cada segundo
    DispatchQueue.main.async { [weak self] in
      self?.updateTimer?.invalidate()
      self?.updateTimer = Timer.scheduledTimer(withTimeInterval: 1.0,
                                               repeats: true) { [weak self] _ in
        guard let start = self?.callStartDate else { return }
        let elapsed = Int(Date().timeIntervalSince(start))
        if #available(iOS 16.2, *) {
          EGChatActivityManager.shared.update(seconds: elapsed)
        }
      }
    }
  }

  // MARK: - updateCallActivity

  @objc func updateCallActivity(_ seconds: Double) {
    if #available(iOS 16.2, *) {
      EGChatActivityManager.shared.update(seconds: Int(seconds))
    }
  }

  // MARK: - endCallActivity

  @objc func endCallActivity() {
    updateTimer?.invalidate()
    updateTimer   = nil
    callStartDate = nil
    if #available(iOS 16.2, *) {
      EGChatActivityManager.shared.end()
    }
  }
}

// MARK: - ActivityManager (solo iOS 16.2+)

#if canImport(ActivityKit)
import ActivityKit

// Atributos de la Live Activity — compartidos con EGCHATLiveActivityWidget
@available(iOS 16.2, *)
struct EGChatCallActivityAttributes: ActivityAttributes {
  let callId: String
  let callerName: String
  let isVideo: Bool

  struct ContentState: Codable, Hashable {
    var durationSeconds: Int
    var isOnHold: Bool

    var durationFormatted: String {
      String(format: "%02d:%02d", durationSeconds / 60, durationSeconds % 60)
    }
  }
}

@available(iOS 16.2, *)
final class EGChatActivityManager {
  static let shared = EGChatActivityManager()
  private var activity: Activity<EGChatCallActivityAttributes>?

  func start(callId: String, callerName: String, isVideo: Bool) {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    let attrs   = EGChatCallActivityAttributes(callId: callId,
                                               callerName: callerName,
                                               isVideo: isVideo)
    let state   = EGChatCallActivityAttributes.ContentState(durationSeconds: 0,
                                                            isOnHold: false)
    let content = ActivityContent(state: state, staleDate: nil)
    do {
      activity = try Activity.request(attributes: attrs,
                                      content: content,
                                      pushType: nil)
    } catch {
      print("[LiveActivity] Error al iniciar: \(error)")
    }
  }

  func update(seconds: Int) {
    guard let a = activity else { return }
    let state   = EGChatCallActivityAttributes.ContentState(durationSeconds: seconds,
                                                            isOnHold: false)
    let content = ActivityContent(state: state, staleDate: nil)
    Task { await a.update(content) }
  }

  func end() {
    guard let a = activity else { return }
    let state   = EGChatCallActivityAttributes.ContentState(durationSeconds: 0,
                                                            isOnHold: false)
    let content = ActivityContent(state: state, staleDate: nil)
    Task { await a.end(content, dismissalPolicy: .immediate) }
    activity = nil
  }
}
#endif
