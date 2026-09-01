/**
 * EGChat — Widget de pantalla de inicio
 * Android: AppWidgetProvider (EGChatWidgetModule.kt)
 * iOS:     WidgetKit — EGChatWidget.swift + EGChatWidgetModule.swift
 *
 * Llamar update() después de cargar los chats para mantener
 * el widget sincronizado con los últimos mensajes no leídos.
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatWidgetModule } = NativeModules;

// Disponible en Android y iOS (ambos exponen EGChatWidgetModule)
const isAvailable = !!EGChatWidgetModule && Platform.OS !== 'web';

export interface WidgetChat {
  id: string;
  name: string;
  lastMsg: string;
  unread: number;
  avatar?: string;
}

export const HomeWidget = {
  /**
   * Actualiza el widget con los últimos chats.
   * Llamar cada vez que cambia la lista de chats o hay nuevos mensajes.
   */
  update(chats: WidgetChat[]) {
    if (!isAvailable) return;

    // Priorizar chats con no leídos, completar con recientes hasta 3
    const withUnread = chats
      .filter(c => c.unread > 0)
      .sort((a, b) => b.unread - a.unread)
      .slice(0, 3);

    const top3 =
      withUnread.length < 3
        ? [
            ...withUnread,
            ...chats
              .filter(c => !withUnread.find(t => t.id === c.id))
              .slice(0, 3 - withUnread.length),
          ]
        : withUnread;

    const unreadTotal = chats.reduce((sum, c) => sum + (c.unread || 0), 0);

    EGChatWidgetModule.updateWidget(JSON.stringify(top3), unreadTotal);
  },

  /** Limpia el widget al cerrar sesión. */
  clear() {
    if (!isAvailable) return;
    EGChatWidgetModule.clearWidget();
  },
};
