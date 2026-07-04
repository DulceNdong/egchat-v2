/**
 * EGChat — Widget de pantalla de inicio
 * Android: AppWidgetProvider con RemoteViews
 * iOS: WidgetKit (requiere Swift/Xcode — ver ios-native-modules/README.md)
 *
 * Llamar updateWidget() después de cargar los chats para mantener
 * el widget sincronizado con los últimos mensajes no leídos.
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatWidgetModule } = NativeModules;
const isAndroid = Platform.OS === 'android';

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
   * Llamar cada vez que cambia la lista de chats.
   */
  update(chats: WidgetChat[]) {
    if (!isAndroid || !EGChatWidgetModule) return;
    const top3 = chats
      .filter(c => c.unread > 0)
      .sort((a, b) => b.unread - a.unread)
      .slice(0, 3);

    // Si hay menos de 3 con no leídos, completar con los más recientes
    if (top3.length < 3) {
      const rest = chats.filter(c => !top3.find(t => t.id === c.id)).slice(0, 3 - top3.length);
      top3.push(...rest);
    }

    const unreadTotal = chats.reduce((sum, c) => sum + (c.unread || 0), 0);
    EGChatWidgetModule.updateWidget(JSON.stringify(top3), unreadTotal);
  },

  /** Limpia el widget al cerrar sesión */
  clear() {
    if (!isAndroid || !EGChatWidgetModule) return;
    EGChatWidgetModule.clearWidget();
  },
};
