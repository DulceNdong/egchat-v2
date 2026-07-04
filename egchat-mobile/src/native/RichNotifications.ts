/**
 * EGChat — Notificaciones ricas nativas
 * Android: MessagingStyle con avatar + BigPicture para fotos
 * iOS: UNNotificationServiceExtension (se activa automáticamente)
 *
 * Uso:
 *   import { RichNotifications } from '../native/RichNotifications';
 *   RichNotifications.show({ chatId, senderName, messageText, messageType, imageUrl });
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatRichNotification } = NativeModules;
const isAndroid = Platform.OS === 'android';

export interface RichNotifPayload {
  chatId: string;
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'file';
  imageUrl?: string;
  isGroup?: boolean;
  groupName?: string;
}

export const RichNotifications = {
  /**
   * Muestra una notificación rica.
   * En Android: llama al módulo nativo Kotlin con MessagingStyle.
   * En iOS: el push payload ya incluye mutable-content=1, la extensión
   *         UNNotificationServiceExtension la enriquece automáticamente.
   */
  show(payload: RichNotifPayload) {
    if (!isAndroid || !EGChatRichNotification) return;

    const notifId = Math.abs(hashCode(payload.chatId));
    EGChatRichNotification.showMessageNotification({
      notifId,
      chatId: payload.chatId,
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar || '',
      messageText: payload.messageText,
      messageType: payload.messageType || 'text',
      imageUrl: payload.imageUrl || '',
      isGroup: payload.isGroup || false,
      groupName: payload.groupName || '',
    });
  },

  dismiss(chatId: string) {
    if (!isAndroid || !EGChatRichNotification) return;
    EGChatRichNotification.dismissNotification(Math.abs(hashCode(chatId)));
  },

  dismissAll() {
    if (!isAndroid || !EGChatRichNotification) return;
    EGChatRichNotification.dismissAllNotifications();
  },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}
