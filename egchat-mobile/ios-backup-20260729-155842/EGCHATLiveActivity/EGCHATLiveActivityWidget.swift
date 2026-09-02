/**
 * EGChat — Widget UI para Live Activity / Dynamic Island
 * Define la apariencia en:
 *   - Dynamic Island (compacta, expandida, minimal)
 *   - Pantalla bloqueada (banner)
 *
 * Requiere iOS 16.2+
 */

import ActivityKit
import WidgetKit
import SwiftUI

// Importamos los atributos definidos en el módulo principal
// (compartidos via target membership en Xcode)

@available(iOS 16.2, *)
struct EGCHATLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: EGChatCallActivityAttributes.self) { context in
      // ── Pantalla bloqueada / banner ───────────────────────────
      LockScreenView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        // ── Isla expandida (usuario toca la isla) ──────────────
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 8) {
            Image(systemName: context.attributes.isVideo ? "video.fill" : "phone.fill")
              .foregroundColor(.green)
              .font(.system(size: 18))
            Text(context.attributes.callerName)
              .font(.system(size: 15, weight: .semibold))
              .foregroundColor(.white)
              .lineLimit(1)
          }
          .padding(.leading, 8)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.state.durationFormatted)
            .font(.system(size: 15, weight: .medium).monospacedDigit())
            .foregroundColor(.green)
            .padding(.trailing, 8)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(spacing: 24) {
            // Botón colgar
            Link(destination: URL(string: "egchat://call/end/\(context.attributes.callId)")!) {
              HStack(spacing: 6) {
                Image(systemName: "phone.down.fill")
                Text("Colgar")
                  .font(.system(size: 13, weight: .medium))
              }
              .foregroundColor(.white)
              .padding(.horizontal, 16)
              .padding(.vertical, 8)
              .background(Color.red)
              .cornerRadius(20)
            }
            // Botón volver a la app
            Link(destination: URL(string: "egchat://call/open/\(context.attributes.callId)")!) {
              HStack(spacing: 6) {
                Image(systemName: "arrow.up.right.square.fill")
                Text("Abrir")
                  .font(.system(size: 13, weight: .medium))
              }
              .foregroundColor(.white)
              .padding(.horizontal, 16)
              .padding(.vertical, 8)
              .background(Color(red: 0, green: 0.78, blue: 0.63))
              .cornerRadius(20)
            }
          }
          .padding(.bottom, 8)
        }
      } compactLeading: {
        // ── Isla compacta izquierda ────────────────────────────
        Image(systemName: context.attributes.isVideo ? "video.fill" : "phone.fill")
          .foregroundColor(.green)
          .font(.system(size: 12))
      } compactTrailing: {
        // ── Isla compacta derecha (contador) ──────────────────
        Text(context.state.durationFormatted)
          .font(.system(size: 12, weight: .medium).monospacedDigit())
          .foregroundColor(.green)
      } minimal: {
        // ── Minimal (cuando hay otra actividad) ───────────────
        Image(systemName: "phone.fill")
          .foregroundColor(.green)
          .font(.system(size: 12))
      }
      .widgetURL(URL(string: "egchat://call/open/\(context.attributes.callId)"))
      .keylineTint(.green)
    }
  }
}

// MARK: - Vista pantalla bloqueada

@available(iOS 16.2, *)
struct LockScreenView: View {
  let context: ActivityViewContext<EGChatCallActivityAttributes>

  var body: some View {
    HStack(spacing: 12) {
      // Icono EGCHAT
      ZStack {
        Circle()
          .fill(
            LinearGradient(
              colors: [Color(red: 0, green: 0.78, blue: 0.63),
                       Color(red: 0, green: 0.71, blue: 0.9)],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
          .frame(width: 44, height: 44)
        Image(systemName: context.attributes.isVideo ? "video.fill" : "phone.fill")
          .foregroundColor(.white)
          .font(.system(size: 20))
      }

      // Info de llamada
      VStack(alignment: .leading, spacing: 2) {
        Text(context.attributes.callerName)
          .font(.system(size: 15, weight: .semibold))
          .foregroundColor(.white)
          .lineLimit(1)
        HStack(spacing: 4) {
          Text(context.attributes.isVideo ? "Videollamada" : "Llamada de voz")
            .font(.system(size: 12))
            .foregroundColor(.white.opacity(0.7))
          Text("·")
            .foregroundColor(.white.opacity(0.4))
          Text(context.state.durationFormatted)
            .font(.system(size: 12).monospacedDigit())
            .foregroundColor(.green)
        }
      }

      Spacer()

      // Botón colgar compacto
      Link(destination: URL(string: "egchat://call/end/\(context.attributes.callId)")!) {
        ZStack {
          Circle()
            .fill(Color.red)
            .frame(width: 36, height: 36)
          Image(systemName: "phone.down.fill")
            .foregroundColor(.white)
            .font(.system(size: 14))
        }
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .background(Color.black.opacity(0.85))
    .cornerRadius(16)
  }
}

// MARK: - Entry Point del Widget Bundle

@available(iOS 16.2, *)
@main
struct EGCHATLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    EGCHATLiveActivityWidget()
  }
}
