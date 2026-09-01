import Foundation
import ActivityKit
import React

/**
 * EGChat — Live Activity module (main app target)
 * Controla la barra de llamada en Dynamic Island / pantalla bloqueada.
 *
 * Los AppIntents (botones colgar/silenciar) deben estar en un Widget Extension
 * target separado — no en el main app. Aquí solo controlamos el estado desde JS.
 *
 * El Widget Extension se añade en Xcode: File → New Target → Widget Extension.
 */

// ── Atributos de la Live Activity ────────────────────────────────
@available(iOS 16.2, *)
struct EGChatCallAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var callerName: String
    var duration: Int
    var isVideo: Bool
    var status: String
  }
  var callId: String
}

// ── React Native Module ───────────────────────────────────────────
@objc(EGChatLiveActivityModule)
class EGChatLiveActivityModule: NSObject {

  private var durationTimer: Timer?
  private var durationSeconds = 0

  // Almacenamos la actividad como Any para evitar el @available
  // en la declaración de la clase (que rompería ObjC)
  private var _activity: Any?

  @objc func startCallActivity(_ callId: String,
                                callerName: String,
                                isVideo: Bool) {
    if #available(iOS 16.2, *) {
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

      let attrs = EGChatCallAttributes(callId: callId)
      let state = EGChatCallAttributes.ContentState(
        callerName: callerName,
        duration: 0,
        isVideo: isVideo,
        status: "calling"
      )
      do {
        let activity = try Activity<EGChatCallAttributes>.request(
          attributes: attrs,
          contentState: state,
          pushType: nil
        )
        _activity = activity
        startDurationTimer()
      } catch {
        // Live Activity no disponible — silencioso
      }
    }
  }

  @objc func updateCallActivity(_ seconds: Int) {
    if #available(iOS 16.2, *) {
      guard let activity = _activity as? Activity<EGChatCallAttributes> else { return }
      Task {
        let newState = EGChatCallAttributes.ContentState(
          callerName: activity.content.state.callerName,
          duration: seconds,
          isVideo: activity.content.state.isVideo,
          status: "active"
        )
        await activity.update(using: newState)
      }
    }
  }

  @objc func endCallActivity() {
    stopDurationTimer()
    if #available(iOS 16.2, *) {
      guard let activity = _activity as? Activity<EGChatCallAttributes> else { return }
      Task {
        await activity.end(dismissalPolicy: .immediate)
        self._activity = nil
      }
    }
  }

  private func startDurationTimer() {
    durationSeconds = 0
    DispatchQueue.main.async {
      self.durationTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
        guard let self = self else { return }
        self.durationSeconds += 1
        self.updateCallActivity(self.durationSeconds)
      }
    }
  }

  private func stopDurationTimer() {
    durationTimer?.invalidate()
    durationTimer = nil
    durationSeconds = 0
  }
}
