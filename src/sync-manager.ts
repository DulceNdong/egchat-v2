/**
 * sync-manager.ts
 * ─────────────────────────────────────────────────────────────────
 * Gestiona la sincronización de mensajes pendientes con el servidor.
 *
 * Funcionalidades:
 *  - Escucha el evento 'online' del navegador
 *  - Cola de mensajes pendientes con reintentos (backoff exponencial)
 *  - Descarga mensajes nuevos desde el servidor al reconectar
 *  - Resolución de conflictos (gana el mensaje más reciente)
 * ─────────────────────────────────────────────────────────────────
 */

import {
  getPendingMessages,
  markAsSynced,
  incrementRetryCount,
  saveMessageOffline,
  saveConversation,
  OfflineMessage,
  OfflineConversation,
} from './offline-db';

// ── Configuración ─────────────────────────────────────────────────

const API_BASE =
  ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(
    /\/api$/,
    ''
  ) + '/api';

// Backoff exponencial: intento 0→5s, 1→15s, 2→30s
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000];

// Tamaño del lote al enviar mensajes pendientes
const BATCH_SIZE = 10;

// ── Estado interno ────────────────────────────────────────────────

let _isSyncing = false;
let _syncListenersAttached = false;

// Callbacks que la UI puede registrar para recibir eventos
type SyncEventType = 'sync-start' | 'sync-end' | 'message-synced' | 'sync-error';
const _listeners: Map<SyncEventType, Set<(data?: any) => void>> = new Map();

function emit(event: SyncEventType, data?: any) {
  _listeners.get(event)?.forEach((fn) => fn(data));
}

export function onSyncEvent(event: SyncEventType, fn: (data?: any) => void) {
  if (!_listeners.has(event)) _listeners.set(event, new Set());
  _listeners.get(event)!.add(fn);
  return () => _listeners.get(event)!.delete(fn); // devuelve función para desuscribirse
}

// ── Helpers ───────────────────────────────────────────────────────

function getToken(): string {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('egchat_token_backup') ||
    ''
  );
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Envío de un mensaje individual con reintentos ─────────────────

async function sendMessageToServer(
  msg: OfflineMessage,
  attempt = 0
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/chats/${msg.conversation_id}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        text: msg.text,
        type: msg.type,
        media_url: msg.media_url,
        file_type: msg.file_type,
        // Incluir ID local para que el servidor pueda deduplicar
        client_message_id: msg.id,
      }),
    });

    if (res.ok) {
      const serverMsg = await res.json();
      // Marcar como sincronizado y actualizar con el ID del servidor
      await markAsSynced(msg.id, serverMsg.id || serverMsg.message_id);
      emit('message-synced', { localId: msg.id, serverId: serverMsg.id });
      return true;
    }

    // 409 Conflict = el servidor ya tiene este mensaje (deduplicación)
    if (res.status === 409) {
      await markAsSynced(msg.id);
      return true;
    }

    // Error del servidor — reintentar si quedan intentos
    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      return sendMessageToServer(msg, attempt + 1);
    }

    // Agotados los reintentos
    await incrementRetryCount(msg.id);
    return false;
  } catch (err) {
    // Error de red
    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      return sendMessageToServer(msg, attempt + 1);
    }
    await incrementRetryCount(msg.id);
    console.error('[SyncManager] Error enviando mensaje:', msg.id, err);
    return false;
  }
}

// ── Sincronización de mensajes pendientes ─────────────────────────

/**
 * Obtiene todos los mensajes con synced=0 y los envía al servidor
 * en lotes de BATCH_SIZE, con backoff exponencial por mensaje.
 */
export async function syncPendingMessages(): Promise<void> {
  if (_isSyncing) return; // evitar ejecuciones paralelas
  if (!navigator.onLine) return;

  const pending = await getPendingMessages();
  if (pending.length === 0) return;

  _isSyncing = true;
  emit('sync-start', { count: pending.length });

  try {
    // Procesar en lotes
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);

      // Enviar el lote en paralelo
      await Promise.allSettled(
        batch
          .filter((m) => m.retry_count < 3) // omitir mensajes con demasiados fallos
          .map((m) => sendMessageToServer(m))
      );

      // Pequeña pausa entre lotes para no saturar la red
      if (i + BATCH_SIZE < pending.length) {
        await sleep(500);
      }
    }
  } finally {
    _isSyncing = false;
    emit('sync-end');
  }
}

// ── Descarga de conversaciones nuevas ────────────────────────────

/**
 * Descarga las conversaciones actualizadas desde el servidor
 * y las guarda en la base de datos local.
 */
export async function syncConversations(): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const res = await fetch(`${API_BASE}/chats`, {
      headers: authHeaders(),
    });

    if (!res.ok) return;

    const serverChats: any[] = await res.json();

    for (const chat of serverChats) {
      const otherParticipant = chat.participants?.find(
        (p: any) => p.user_id !== chat.participants?.[0]?.user_id
      );

      const conv: OfflineConversation = {
        id: chat.id,
        contact_name:
          chat.type === 'private'
            ? otherParticipant?.full_name || 'Usuario'
            : chat.name || 'Grupo',
        contact_avatar:
          chat.avatar_url || otherParticipant?.avatar_url,
        last_message:
          chat.last_message?.text ||
          (chat.last_message?.type === 'image' ? '📷 Foto' : '') ||
          '',
        last_message_time:
          chat.last_message?.created_at || chat.updated_at,
        unread_count: chat.unread_count || 0,
        updated_at: chat.updated_at,
      };

      await saveConversation(conv);
    }
  } catch (err) {
    console.warn('[SyncManager] Error sincronizando conversaciones:', err);
  }
}

// ── Descarga de mensajes nuevos ───────────────────────────────────

/**
 * Descarga mensajes nuevos desde el servidor para una conversación.
 * Usa el timestamp del último mensaje local como punto de partida.
 */
export async function syncMessagesForConversation(
  conversationId: string,
  since?: string
): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const sinceParam = since
      ? `&since=${encodeURIComponent(since)}`
      : '';

    const res = await fetch(
      `${API_BASE}/chats/${conversationId}/messages?limit=100${sinceParam}`,
      { headers: authHeaders() }
    );

    if (!res.ok) return;

    const serverMessages: any[] = await res.json();

    for (const msg of serverMessages) {
      await saveMessageOffline({
        id: msg.id,
        conversation_id: conversationId,
        sender_id: msg.sender_id,
        text: msg.text,
        media_url: msg.file_url,
        file_type: msg.file_type,
        type: msg.type || 'text',
        timestamp: msg.created_at,
        status: msg.status || 'delivered',
        synced: 1, // ya está en el servidor
      });
    }
  } catch (err) {
    console.warn('[SyncManager] Error descargando mensajes:', err);
  }
}

// ── Resolución de conflictos ──────────────────────────────────────

/**
 * Compara un mensaje local con la versión del servidor.
 * Gana el más reciente (last-write-wins).
 * Devuelve el mensaje que debe usarse.
 */
export function detectConflicts(
  localMessage: OfflineMessage,
  serverMessage: { id: string; text?: string; updated_at?: string; created_at: string }
): OfflineMessage {
  const localTime = new Date(localMessage.timestamp).getTime();
  const serverTime = new Date(
    serverMessage.updated_at || serverMessage.created_at
  ).getTime();

  if (serverTime >= localTime) {
    // El servidor tiene la versión más reciente — usar la del servidor
    return {
      ...localMessage,
      id: serverMessage.id,
      text: serverMessage.text,
      timestamp: serverMessage.updated_at || serverMessage.created_at,
      synced: 1,
      status: 'delivered',
    };
  }

  // El local es más reciente — mantener el local pero marcarlo para reenvío
  return {
    ...localMessage,
    synced: 0,
  };
}

// ── Inicialización del listener de conectividad ───────────────────

/**
 * Registra los listeners de online/offline.
 * Llama esto UNA VEZ al arrancar la app.
 */
export function initSyncManager(): void {
  if (_syncListenersAttached) return;
  _syncListenersAttached = true;

  // Al recuperar conexión → sincronizar todo
  window.addEventListener('online', async () => {
    console.log('[SyncManager] Conexión recuperada — sincronizando...');
    // Pequeña espera para que la red se estabilice
    await sleep(1_500);
    await syncConversations();
    await syncPendingMessages();
  });

  // Al perder conexión → solo loguear (la UI lo maneja con offline-ui.ts)
  window.addEventListener('offline', () => {
    console.log('[SyncManager] Sin conexión — mensajes se guardarán localmente');
  });

  // Sincronización periódica cada 2 minutos cuando hay conexión
  setInterval(async () => {
    if (navigator.onLine) {
      await syncPendingMessages();
    }
  }, 2 * 60 * 1_000);

  // Sincronización inicial al cargar (por si había pendientes de sesión anterior)
  if (navigator.onLine) {
    setTimeout(async () => {
      await syncConversations();
      await syncPendingMessages();
    }, 3_000); // esperar 3s a que la app termine de inicializarse
  }

  console.log('[SyncManager] Inicializado');
}
