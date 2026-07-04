import Foundation
import ActivityKit
import SwiftUI

/**
 * EGChat — Live Activity iOS 16.2+
 * Muestra una barra dinámica durante llamadas activas con:
 *   - Nombre del contacto
 *   - Duración de la llamada (actualizada cada segundo)
 *   - Botón colgar desde la Dynamic Island / pantalla bloqueada
 *
 * Instalación (Mac/Xcode):
 * 1. Crear nuevo Widget Extension Target: "EGChatLiveActivity"
 * 2. Copiar este archivo al nuevo target
 * 3. En Info.plist del target principal añadir:
 *      NSSupportsLiveActivities = YES
 *      NSSupportsLiveActivitiesFrequentUpdates = YES
 * 4. Llamar desde AppDelegate o RCT Module según estado de llamada
 */

// ── Atributos de la actividad ─────────────────────────────────────
@available(iOS 16.2, *)
struct EGChatCallAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var callerName: String
    var duration: Int        // segundos transcurridos
    var isVideo: Bool
    var status: String       // "calling" | "active" | "ended"
  }

  var callId: String
}

// ── Widget View (Dynamic Island + Pantalla bloqueada) ─────────────
@available(iOS 16.2, *)
struct EGChatCallActivityView: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: EGChatCallAttributes.self) { context in
      // Vista en pantalla bloqueada
      LockScreenCallView(state: context.state)
    } dynamicIsland: { context in
      DynamicIsland {
        // Región expandida (usuario desliza hacia abajo)
        DynamicIslandExpandedRegion(.leading) {
          Label {
            Text(context.state.callerName)
              .font(.headline)
              .foregroundColor(.white)
          } icon: {
            Image(systemName: context.state.isVideo ? "video.fill" : "phone.fill")
              .foregroundColor(.green)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(formatDuration(context.state.duration))
            .font(.subheadline.monospacedDigit())
            .foregroundColor(.green)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(spacing: 20) {
            // Botón silenciar
            Button(intent: MuteCallIntent()) {
              Image(systemName: "mic.slash.fill")
                .font(.title2)
                .foregroundColor(.white)
            }
            .tint(.gray)
            // Botón colgar
            Button(intent: EndCallIntent()) {
              Image(systemName: "phone.down.fill")
                .font(.title2)
                .foregroundColor(.white)
            }
            .tint(.red)
          }
          .padding(.bottom, 8)
        }
      } compactLeading: {
        Image(systemName: "phone.fill")
          .foregroundColor(.green)
          .font(.caption)
      } compactTrailing: {
        Text(formatDuration(context.state.duration))
          .font(.caption.monospacedDigit())
          .foregroundColor(.green)
      } minimal: {
        Image(systemName: "phone.fill")
          .foregroundColor(.green)
      }
    }
  }

  private func formatDuration(_ s: Int) -> String {
    "\(String(format: "%02d", s/60)):\(String(format: "%02d", s%60))"
  }
}

// Vista pantalla bloqueada
@available(iOS 16.2, *)
struct LockScreenCallView: View {
  let state: EGChatCallAttributes.ContentState

  var body: some View {
    HStack {
      Image(systemName: state.isVideo ? "video.fill" : "phone.fill")
        .foregroundColor(.green)
        .font(.title2)
      VStack(alignment: .leading) {
        Text(state.callerName).font(.headline).foregroundColor(.white)
        Text(formatDuration(state.duration))
          .font(.subheadline.monospacedDigit())
          .foregroundColor(.green)
      }
      Spacer()
      Button(intent: EndCallIntent()) {
        Image(systemName: "phone.down.fill")
          .foregroundColor(.white)
          .padding(10)
          .background(Color.red)
          .clipShape(Circle())
      }
    }
    .padding()
    .background(Color.black.opacity(0.85))
    .cornerRadius(14)
  }

  private func formatDuration(_ s: Int) -> String {
    "\(String(format: "%02d", s/60)):\(String(format: "%02d", s%60))"
  }
}

// ── React Native Module para controlar desde JS ───────────────────
@objc(EGChatLiveActivityModule)
@available(iOS 16.2, *)
class EGChatLiveActivityModule: NSObject {

  private var activity: Activity<EGChatCallAttributes>?
  private var durationTimer: Timer?
  private var durationSeconds = 0

  @objc func startCallActivity(_ callId: String,
                                callerName: String,
                                isVideo: Bool) {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

    let attrs   = EGChatCallAttributes(callId: callId)
    let state   = EGChatCallAttributes.ContentState(
      callerName: callerName,
      duration: 0,
      isVideo: isVideo,
      status: "calling"
    )

    do {
      activity = try Activity.request(
        attributes: attrs,
        contentState: state,
        pushType: nil
      )
      startDurationTimer()
    } catch {}
  }

  @objc func updateCallActivity(_ seconds: Int) {
    guard let activity = activity else { return }
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

  @objc func endCallActivity() {
    stopDurationTimer()
    Task {
      await activity?.end(dismissalPolicy: .immediate)
      activity = nil
    }
  }

  private func startDurationTimer() {
    durationSeconds = 0
    durationTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
      guard let self = self else { return }
      self.durationSeconds += 1
      self.updateCallActivity(self.durationSeconds)
    }
  }

  private func stopDurationTimer() {
    durationTimer?.invalidate()
    durationTimer = nil
    durationSeconds = 0
  }
}

// Intents para botones (requieren App Intents framework iOS 16+)
@available(iOS 16.0, *)
struct EndCallIntent: AppIntent {
  static var title: LocalizedStringResource = "Colgar"
  func perform() async throws -> some IntentResult {
    NotificationCenter.default.post(name: .init("EGChatEndCall"), object: nil)
    return .result()
  }
}

@available(iOS 16.0, *)
struct MuteCallIntent: AppIntent {
  static var title: LocalizedStringResource = "Silenciar"
  func perform() async throws -> some IntentResult {
    NotificationCenter.default.post(name: .init("EGChatMuteCall"), object: nil)
    return .result()
  }
}
