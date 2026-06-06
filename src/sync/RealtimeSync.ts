/**
 * RealtimeSync.ts
 *
 * Capa WebSocket sobre el SyncManager existente.
 * - Conecta WebSocket al autenticar
 * - Procesa eventos push del servidor (new_message, chat_updated, wallet_updated…)
 * - El polling existente pasa a 60s de fallback si WS no está disponible
 * - Si WS cae, el SyncManager sigue funcionando con polling
 *
 * CÓMO USAR:
 *   import { initRealtime, destroyRealtime } from './RealtimeSync';
 *   initRealtime(token);     // tras login
 *   destroyRealtime();       // en logout
 */

import * as WSClient from './WebSocketClient';
import {
  MessageRepository,
  ConversationRepository,
  WalletRepository,
  type Message,
} from '../db/index';
import { syncChatMessages } from './SyncManager';

let initialized = false;

// ── Inicializar Realtime ──────────────────────────────────────────

export function initRealtime(authToken: string): void {
  if (initialized) {
    WSClient.reset(authToken);
    return;
  }
  initialized = true;

  // Conectar WebSocket
  WSClient.connect(authToken);

  // Exponer subscribe/unsubscribe en window para que App.tsx los llame
  (window as any).__subscribeToChat = (chatId: string) => WSClient.subscribeChat(chatId);
  (window as any).__unsubscribeFromChat = (chatId: string) => WSClient.unsubscribeChat(chatId);

  // ── Handlers de eventos del servidor ─────────────────────────

  // Nuevo mensaje recibido en tiempo real — notificar UI inmediatamente
  WSClient.on('new_message', async (data) => {
    if (!data?.chatId || !data?.message) return;
    // Disparar recarga inmediata en App.tsx (entrega instantánea sin polling)
    window.dispatchEvent(
      new CustomEvent('egchat:messages-updated', { detail: { chatId: data.chatId } })
    );
    window.dispatchEvent(new CustomEvent('egchat:conversations-updated'));
    try {
      const m = data.message;
      const msg: Message = {
        id:              m.id?.toString(),
        server_id:       m.id?.toString(),
        conversation_id: data.chatId,
        sender_id:       m.sender_id?.toString(),
        text:            m.text ?? null,
        type:            m.type ?? 'text',
        file_url:        m.file_url ?? null,
        file_name:       m.file_name ?? null,
        file_size:       m.file_size ?? null,
        thumbnail_url:   m.thumbnail_url ?? null,
        image_url:       m.type === 'image' ? m.file_url : null,
        audio_url:       m.type === 'audio' ? m.file_url : null,
        video_url:       m.type === 'video' ? m.file_url : null,
        call_type:       m.call_type ?? null,
        call_status:     m.call_status ?? null,
        call_duration:   m.call_duration ?? null,
        reply_to:        m.reply_to ?? null,
        status:          'delivered',
        created_at:      m.created_at ? new Date(m.created_at).getTime() : Date.now(),
        synced:          1,
        retries:         0,
        deleted_for_me:  0,
      };
      await MessageRepository.upsert(msg);

      // Actualizar último mensaje de la conversación
      await ConversationRepository.updateLastMessage(
        data.chatId,
        m.text ?? '',
        msg.created_at
      );

      // Notificar a la UI
      window.dispatchEvent(
        new CustomEvent('egchat:messages-updated', { detail: { chatId: data.chatId } })
      );
      window.dispatchEvent(new CustomEvent('egchat:conversations-updated'));
    } catch (err) {
      console.warn('[Realtime] Error guardando mensaje:', err);
    }
  });

  // Chat actualizado (último mensaje, unread count)
  WSClient.on('chat_updated', async (data) => {
    if (!data?.chat?.id) return;
    try {
      await ConversationRepository.upsert({
        id:              data.chat.id?.toString(),
        title:           data.chat.title ?? data.chat.name ?? '',
        avatar_url:      data.chat.avatar_url ?? '',
        last_message:    data.chat.last_message ?? '',
        last_message_at: data.chat.last_message_at ?? Date.now(),
        unread_count:    data.chat.unread_count ?? 0,
        type:            data.chat.type ?? 'individual',
        synced:          1,
      });
      window.dispatchEvent(new CustomEvent('egchat:conversations-updated'));
    } catch {}
  });

  // Estado de mensaje actualizado (sent → delivered → read)
  WSClient.on('message_status', async (data) => {
    if (!data?.messageId || !data?.status) return;
    try {
      await MessageRepository.updateStatus(data.messageId, data.status);
      window.dispatchEvent(
        new CustomEvent('egchat:messages-updated', { detail: { chatId: data.chatId } })
      );
    } catch {}
  });

  // Balance de wallet actualizado
  WSClient.on('wallet_updated', async (data) => {
    if (typeof data?.balance !== 'number') return;
    try {
      const token = localStorage.getItem('token') || '';
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId  = payload.id?.toString() || payload.sub?.toString();
      if (userId) {
        await WalletRepository.saveBalance(userId, data.balance);
        window.dispatchEvent(
          new CustomEvent('egchat:wallet-updated', { detail: { balance: data.balance } })
        );
      }
    } catch {}
  });

  // Usuario online
  WSClient.on('user_online', (data) => {
    window.dispatchEvent(
      new CustomEvent('egchat:user-online', { detail: { userId: data.userId } })
    );
  });

  // Usuario offline
  WSClient.on('user_offline', (data) => {
    window.dispatchEvent(
      new CustomEvent('egchat:user-offline', { detail: { userId: data.userId } })
    );
  });

  // Indicador de escritura
  WSClient.on('typing', (data) => {
    window.dispatchEvent(
      new CustomEvent('egchat:typing', { detail: data })
    );
  });

  // Reconexión → re-sincronizar conversaciones
  WSClient.on('connected', () => {
    console.log('[Realtime] WebSocket conectado — sincronizando...');
    window.dispatchEvent(new CustomEvent('egchat-online'));
  });

  WSClient.on('disconnected', () => {
    console.log('[Realtime] WebSocket desconectado — modo polling fallback');
  });

  console.log('[Realtime] Inicializado');
}

// ── Destruir (logout) ─────────────────────────────────────────────

export function destroyRealtime(): void {
  WSClient.disconnect();
  initialized = false;
}

// ── Helpers públicos ──────────────────────────────────────────────

/** Suscribir al chat activo (para recibir mensajes en tiempo real) */
export function subscribeToChat(chatId: string): void {
  WSClient.subscribeChat(chatId);
}

/** Desuscribir de un chat (al salir de la vista) */
export function unsubscribeFromChat(chatId: string): void {
  WSClient.unsubscribeChat(chatId);
}

/** Enviar indicador de escritura */
export function sendTypingIndicator(chatId: string, isTyping: boolean): void {
  WSClient.sendTyping(chatId, isTyping);
}

/** Estado actual de la conexión WebSocket */
export function getRealtimeStatus() {
  return WSClient.getStatus();
}
