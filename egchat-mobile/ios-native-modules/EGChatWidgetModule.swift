import Foundation
import WidgetKit
import SwiftUI

/**
 * EGChat — Widget de pantalla de inicio (WidgetKit iOS 14+)
 *
 * Muestra los últimos 3 chats con mensajes no leídos directamente
 * en la pantalla de inicio (widget pequeño, mediano y grande).
 *
 * Requiere en Xcode:
 *   1. File → New → Target → Widget Extension → "EGChatWidget"
 *      - Include Live Activity: ✓ (para reutilizar EGChatLiveActivity.swift)
 *   2. Añadir App Group: group.com.reddington120.egchat
 *      - En target EGChat: Signing & Capabilities → App Groups → + group.com.reddington120.egchat
 *      - En target EGChatWidget: mismo App Group
 *   3. Copiar este archivo al target EGChatWidget
 *
 * ── Módulo React Native (EGChatWidgetModule) ─────────────────────
 * La parte JS ya existe en src/native/HomeWidget.ts.
 * Este archivo implementa tanto el módulo RN (para actualizar datos)
 * como la vista SwiftUI del widget.
 */

// ══════════════════════════════════════════════════════════════════
// MARK: — Modelo de datos compartido (App Group)
// ══════════════════════════════════════════════════════════════════

private let APP_GROUP = "group.com.reddington120.egchat"
private let WIDGET_DATA_KEY = "egchat_widget_chats"
private let WIDGET_UNREAD_KEY = "egchat_widget_unread"

struct WidgetChatEntry: Codable, Identifiable {
  let id: String
  let name: String
  let lastMsg: String
  let unread: Int
  let avatar: String?
}

// Leer/guardar datos via UserDefaults compartido (App Group)
func readWidgetChats() -> [WidgetChatEntry] {
  guard
    let suite = UserDefaults(suiteName: APP_GROUP),
    let data  = suite.data(forKey: WIDGET_DATA_KEY),
    let chats = try? JSONDecoder().decode([WidgetChatEntry].self, from: data)
  else { return [] }
  return chats
}

func saveWidgetChats(_ chats: [WidgetChatEntry], unread: Int) {
  guard
    let suite = UserDefaults(suiteName: APP_GROUP),
    let data  = try? JSONEncoder().encode(chats)
  else { return }
  suite.set(data,   forKey: WIDGET_DATA_KEY)
  suite.set(unread, forKey: WIDGET_UNREAD_KEY)
}

// ══════════════════════════════════════════════════════════════════
// MARK: — Módulo React Native
// ══════════════════════════════════════════════════════════════════

@objc(EGChatWidgetModule)
class EGChatWidgetModule: NSObject {

  /// Actualiza el widget con los últimos chats.
  /// - Parameters:
  ///   - chatsJSON: Array de chats serializado en JSON string
  ///   - unreadTotal: Total de mensajes no leídos para el badge
  @objc func updateWidget(_ chatsJSON: String, unreadTotal: Int) {
    guard
      let data  = chatsJSON.data(using: .utf8),
      let chats = try? JSONDecoder().decode([WidgetChatEntry].self, from: data)
    else { return }

    saveWidgetChats(chats, unread: unreadTotal)

    // Recargar todas las timelines del widget
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  /// Limpia el widget al cerrar sesión.
  @objc func clearWidget() {
    saveWidgetChats([], unread: 0)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}

// ══════════════════════════════════════════════════════════════════
// MARK: — Widget SwiftUI (va en el target EGChatWidget)
// ══════════════════════════════════════════════════════════════════

// Timeline Entry
@available(iOS 14.0, *)
struct EGChatWidgetEntry: TimelineEntry {
  let date: Date
  let chats: [WidgetChatEntry]
  let unreadTotal: Int
}

// Timeline Provider
@available(iOS 14.0, *)
struct EGChatWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> EGChatWidgetEntry {
    EGChatWidgetEntry(date: .now, chats: [
      WidgetChatEntry(id: "1", name: "María",   lastMsg: "Hola, ¿cómo estás?", unread: 2, avatar: nil),
      WidgetChatEntry(id: "2", name: "Grupo EG", lastMsg: "¿Mañana quedamos?",  unread: 5, avatar: nil),
    ], unreadTotal: 7)
  }

  func getSnapshot(in context: Context, completion: @escaping (EGChatWidgetEntry) -> Void) {
    let chats = readWidgetChats()
    let unread = UserDefaults(suiteName: APP_GROUP)?.integer(forKey: WIDGET_UNREAD_KEY) ?? 0
    completion(EGChatWidgetEntry(date: .now, chats: chats, unreadTotal: unread))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<EGChatWidgetEntry>) -> Void) {
    let chats  = readWidgetChats()
    let unread = UserDefaults(suiteName: APP_GROUP)?.integer(forKey: WIDGET_UNREAD_KEY) ?? 0
    let entry  = EGChatWidgetEntry(date: .now, chats: chats, unreadTotal: unread)
    // Actualizar cada 15 minutos o cuando la app actualice via WidgetCenter
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: .now) ?? .now
    completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
  }
}

// ── Vistas ─────────────────────────────────────────────────────────

@available(iOS 14.0, *)
struct EGChatWidgetSmallView: View {
  let entry: EGChatWidgetEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      // Header
      HStack {
        Image(systemName: "message.fill")
          .foregroundColor(Color(red: 0, green: 0.78, blue: 0.63))
          .font(.caption)
        Text("EGCHAT")
          .font(.caption2.bold())
          .foregroundColor(.primary)
        Spacer()
        if entry.unreadTotal > 0 {
          Text("\(min(entry.unreadTotal, 99))")
            .font(.caption2.bold())
            .foregroundColor(.white)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(Color(red: 0, green: 0.78, blue: 0.63))
            .clipShape(Capsule())
        }
      }

      // Último chat
      if let first = entry.chats.first {
        VStack(alignment: .leading, spacing: 2) {
          Text(first.name)
            .font(.caption.bold())
            .lineLimit(1)
          Text(first.lastMsg)
            .font(.caption2)
            .foregroundColor(.secondary)
            .lineLimit(2)
        }
      } else {
        Text("Sin mensajes nuevos")
          .font(.caption2)
          .foregroundColor(.secondary)
      }
      Spacer()
    }
    .padding(12)
    .widgetURL(URL(string: "egchat://open"))
  }
}

@available(iOS 14.0, *)
struct EGChatWidgetMediumView: View {
  let entry: EGChatWidgetEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack {
        Image(systemName: "message.fill")
          .foregroundColor(Color(red: 0, green: 0.78, blue: 0.63))
        Text("EGChat")
          .font(.subheadline.bold())
        Spacer()
        if entry.unreadTotal > 0 {
          Text("\(min(entry.unreadTotal, 99)) nuevos")
            .font(.caption.bold())
            .foregroundColor(Color(red: 0, green: 0.78, blue: 0.63))
        }
      }
      .padding(.horizontal, 14)
      .padding(.top, 10)
      .padding(.bottom, 6)

      Divider().padding(.horizontal, 14)

      // Lista de chats
      ForEach(entry.chats.prefix(3)) { chat in
        Link(destination: URL(string: "egchat://chat/\(chat.id)")!) {
          HStack(spacing: 10) {
            // Avatar placeholder
            ZStack {
              Circle()
                .fill(Color(red: 0, green: 0.78, blue: 0.63).opacity(0.2))
                .frame(width: 32, height: 32)
              Text(String(chat.name.prefix(1)).uppercased())
                .font(.caption.bold())
                .foregroundColor(Color(red: 0, green: 0.78, blue: 0.63))
            }

            VStack(alignment: .leading, spacing: 1) {
              Text(chat.name)
                .font(.caption.bold())
                .lineLimit(1)
              Text(chat.lastMsg)
                .font(.caption2)
                .foregroundColor(.secondary)
                .lineLimit(1)
            }

            Spacer()

            if chat.unread > 0 {
              Text("\(chat.unread)")
                .font(.caption2.bold())
                .foregroundColor(.white)
                .frame(minWidth: 18, minHeight: 18)
                .background(Color(red: 0, green: 0.78, blue: 0.63))
                .clipShape(Circle())
            }
          }
          .padding(.horizontal, 14)
          .padding(.vertical, 5)
        }
      }

      if entry.chats.isEmpty {
        HStack {
          Spacer()
          Text("Abre EGChat para ver tus mensajes")
            .font(.caption2)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.center)
            .padding()
          Spacer()
        }
      }

      Spacer()
    }
  }
}

// Widget principal
@available(iOS 14.0, *)
struct EGChatWidget: Widget {
  let kind = "EGChatWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EGChatWidgetProvider()) { entry in
      if #available(iOS 17.0, *) {
        EGChatWidgetMediumView(entry: entry)
          .containerBackground(.fill.tertiary, for: .widget)
      } else {
        EGChatWidgetMediumView(entry: entry)
          .background(Color(.systemBackground))
      }
    }
    .configurationDisplayName("EGChat")
    .description("Tus últimas conversaciones.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// Entry point del bundle de widgets
@available(iOS 14.0, *)
@main
struct EGChatWidgetBundle: WidgetBundle {
  var body: some Widget {
    EGChatWidget()
    // EGChatCallActivityView() ← añadir cuando Live Activity esté integrado
  }
}
