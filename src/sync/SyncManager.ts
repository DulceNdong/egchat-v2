/**
 * SyncManager.ts  —  FASE 4: Sistema Offline-First
 *
 * Responsabilidades:
 *  1. Detectar conexión / reconexión
 *  2. Leer primero de SQLite, mostrar datos inmediatamente
 *  3. Sincronizar en background con el servidor
 *  4. Actualizar la UI cuando llegan cambios
 *  5. Resolver conflictos (last-write-wins por updated_at)
 *  6. Reintentos automáticos con backoff exponencial
 *  7. Cola persistente que sobrevive reinicios
 */

import {
  MessageRepository,
  ConversationRepository,
  WalletRepository,
  ContactRepository,
  UserRepository,
  SyncQueueRepository,
  type Message,
  type Conversation,
} from '../db/index';

// ── Constantes ────────────────────────────────────────────────────

const API_BASE    = (import.meta as any).env?.VITE_API_URL
                    ?? 'https://egchat-api.onrender.com';
const BATCH_SIZE  = 20;
const MAX_RETRIES = 5;
const RETRY_MS    = [5_000, 15_000, 30_000, 60_000, 120_000] as const;
const POLL_MS     = 30_000;

// ── Tipos públicos ────────────────────────────────────────────────

export interface SyncState {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  lastSyncAt:   number | null;
  error:        string | null;
}

type SyncListener = (state: SyncState) => void;

// ── Estado interno ────────────────────────────────────────────────

let state: SyncState = {
  isOnline: navigator.onLine, isSyncing: false,
  pendingCount: 0, lastSyncAt: null, error: null,
};

const listeners = new Set<SyncListener>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

// ── Helpers ───────────────────────────────────────────────────────

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn(state));
}

function getToken(): string {
  return localStorage.getItem('token')
      || localStorage.getItem('egchat_token_backup')
      || '';
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const ctrl  = new AbortController();
  const tid   = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(tid);
  }
}

// ── Sincronización de Chats ───────────────────────────────────────

async function syncConversations(): Promise<void> {
  try {
    const data = await apiFetch<any[]>('/chats');
    if (!Array.isArray(data)) return;

    const convs: Conversation[] = data.map((c: any) => ({
      id:              c.id?.toString(),
      type:            c.type === 'group' ? 'group' : 'individual',
      title:           c.name || c.title || '',
      avatar_url:      c.avatar_url || '',
      last_message:    c.last_message?.text || '',
      last_message_at: c.last_message?.created_at
                         ? new Date(c.last_message.created_at).getTime()
                         : Date.now(),
      unread_count:    c.unread_count || 0,
      archived:        c.archived ? 1 : 0,
      favorite:        c.is_favorite ? 1 : 0,
      created_at:      c.created_at ? new Date(c.created_at).getTime() : Date.now(),
      updated_at:      Date.now(),
      synced:          1,
    }));

    await ConversationRepository.upsertBatch(convs);
    window.dispatchEvent(new CustomEvent('egchat:conversations-updated'));
  } catch (err: any) {
    console.warn('[Sync] Error sincronizando chats:', err.message);
  }
}

// ── Sincronización de Mensajes de un Chat ─────────────────────────

async function syncMessages(chatId: string): Promise<void> {
  try {
    const data = await apiFetch<any[]>(`/chats/${chatId}/messages?page=1&limit=50`);
    if (!Array.isArray(data)) return;

    const messages: Message[] = data.map((m: any) => ({
      id:              m.id?.toString(),
      server_id:       m.id?.toString(),
      conversation_id: chatId,
      sender_id:       m.sender_id?.toString(),
      text:            m.text || null,
      type:            m.type || 'text',
      file_url:        m.file_url || null,
      file_name:       m.file_name || null,
      file_size:       m.file_size || null,
      thumbnail_url:   m.thumbnail_url || null,
      image_url:       m.type === 'image' ? m.file_url : null,
      audio_url:       m.type === 'audio' ? m.file_url : null,
      video_url:       m.type === 'video' ? m.file_url : null,
      call_type:       m.call_type || null,
      call_status:     m.call_status || null,
      call_duration:   m.call_duration || null,
      reply_to:        m.reply_to || null,
      status:          m.status || 'delivered',
      created_at:      new Date(m.created_at).getTime(),
      synced:          1,
      retries:         0,
      deleted_for_me:  0,
    }));

    await MessageRepository.upsertBatch(messages);
    window.dispatchEvent(
      new CustomEvent('egchat:messages-updated', { detail: { chatId } })
    );
  } catch (err: any) {
    console.warn('[Sync] Error sincronizando mensajes:', err.message);
  }
}

// ── Sincronización del Wallet ─────────────────────────────────────

async function syncWallet(userId: string): Promise<void> {
  try {
    // Saldo
    const balRes = await apiFetch<{ balance: number }>('/wallet/balance');
    if (typeof balRes.balance === 'number') {
      await WalletRepository.saveBalance(userId, balRes.balance);
      window.dispatchEvent(
        new CustomEvent('egchat:wallet-updated', { detail: { balance: balRes.balance } })
      );
    }

    // Transacciones recientes (última página)
    const txRes = await apiFetch<{ transactions: any[] }>('/wallet/transactions?page=1&limit=50');
    if (Array.isArray(txRes.transactions)) {
      await WalletRepository.upsertBatch(
        txRes.transactions.map((t: any) => ({
          id:           t.id?.toString(),
          server_id:    t.id?.toString(),
          user_id:      userId,
          type:         t.type || 'payment',
          amount:       t.amount || 0,
          balance_after: t.balance_after ?? null,
          description:  t.description || null,
          reference:    t.reference || null,
          status:       t.status || 'completed',
          method:       t.method || null,
          destination:  t.destination || null,
          created_at:   new Date(t.created_at || t.date).getTime(),
          synced:       1,
        }))
      );
    }
  } catch (err: any) {
    console.warn('[Sync] Error sincronizando wallet:', err.message);
  }
}

// ── Sincronización de Contactos ───────────────────────────────────

async function syncContacts(userId: string): Promise<void> {
  try {
    const data = await apiFetch<any[]>('/contacts');
    if (!Array.isArray(data)) return;

    // Upsert usuarios referenciados
    const users = data
      .filter((c: any) => c.user)
      .map((c: any) => ({
        id:         c.user.id?.toString(),
        phone:      c.user.phone || '',
        full_name:  c.user.full_name || null,
        avatar_url: c.user.avatar_url || null,
        created_at: Date.now(),
        updated_at: Date.now(),
        synced:     1,
      }));
    if (users.length) await UserRepository.upsertBatch(users as any);

    // Upsert contactos
    await ContactRepository.upsertBatch(
      data.map((c: any) => ({
        id:               c.id?.toString(),
        user_id:          userId,
        contact_user_id:  c.contact_user_id?.toString() || c.user?.id?.toString(),
        nickname:         c.nickname || null,
        blocked:          c.blocked ? 1 : 0,
        favorite:         c.is_favorite ? 1 : 0,
        created_at:       new Date(c.created_at).getTime(),
        updated_at:       Date.now(),
        synced:           1,
      }))
    );
    window.dispatchEvent(new CustomEvent('egchat:contacts-updated'));
  } catch (err: any) {
    console.warn('[Sync] Error sincronizando contactos:', err.message);
  }
}

// ── Flush de Cola Offline (mensajes pendientes → servidor) ────────

async function flushQueue(): Promise<void> {
  if (isSyncing || !state.isOnline) return;
  isSyncing = true;
  setState({ isSyncing: true, error: null });

  try {
    // 1. Mensajes pendientes de SQLite
    const pending = await MessageRepository.getPending();
    setState({ pendingCount: pending.length });

    const batch = pending.slice(0, BATCH_SIZE);

    for (const msg of batch) {
      if (!state.isOnline) break;
      try {
        const res = await apiFetch<any>(
          `/chats/${msg.conversation_id}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({
              text:      msg.text,
              type:      msg.type,
              file_url:  msg.file_url || msg.image_url || msg.audio_url || msg.video_url,
              reply_to:  msg.reply_to,
            }),
          }
        );
        const serverId = res?.id?.toString() ?? res?.message_id?.toString();
        if (serverId) {
          await MessageRepository.markSynced(msg.id, serverId);
        }
      } catch {
        const retries = (msg.retries || 0) + 1;
        if (retries >= MAX_RETRIES) {
          await MessageRepository.updateStatus(msg.id, 'error', retries);
        } else {
          await MessageRepository.updateStatus(msg.id, 'pending', retries);
          const delay = RETRY_MS[Math.min(retries - 1, RETRY_MS.length - 1)];
          setTimeout(flushQueue, delay);
        }
      }
    }

    // 2. Cola de sincronización general
    const queueItems = await SyncQueueRepository.dequeue(BATCH_SIZE);
    for (const item of queueItems) {
      if (!state.isOnline) break;
      try {
        const payload = JSON.parse(item.payload);
        await _processQueueItem(item.entity_type, item.action, payload);
        await SyncQueueRepository.complete(item.id);
      } catch {
        await SyncQueueRepository.fail(item.id);
      }
    }

    // Limpiar exhaustos
    await SyncQueueRepository.pruneExhausted(MAX_RETRIES);

    const remaining = await MessageRepository.getPending();
    setState({
      isSyncing:    false,
      pendingCount: remaining.length,
      lastSyncAt:   Date.now(),
    });

    if (remaining.length > 0 && state.isOnline) {
      syncTimer = setTimeout(flushQueue, 2_000);
    }
  } catch (err: any) {
    setState({ isSyncing: false, error: err.message });
  } finally {
    isSyncing = false;
  }
}

async function _processQueueItem(
  entityType: string,
  action: string,
  payload: any
): Promise<void> {
  switch (entityType) {
    case 'contact':
      if (action === 'delete') {
        await apiFetch(`/contacts/${payload.id}`, { method: 'DELETE' });
      }
      break;
    case 'conversation':
      if (action === 'update' && payload.archived !== undefined) {
        await apiFetch(`/chats/${payload.id}/archive`, { method: 'PUT', body: '{}' });
      }
      break;
    case 'profile':
      if (action === 'update') {
        await apiFetch('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      }
      break;
    default:
      break;
  }
}

// ── Sync completo al reconectar ───────────────────────────────────

async function fullSync(userId: string): Promise<void> {
  if (!state.isOnline || !userId) return;
  try {
    // Paralelo: chats + wallet + contactos
    await Promise.allSettled([
      syncConversations(),
      syncWallet(userId),
      syncContacts(userId),
    ]);
    // Mensajes pendientes de la cola
    await flushQueue();
    // Limpiar mensajes viejos
    await MessageRepository.pruneOld(7);
    setState({ lastSyncAt: Date.now(), error: null });
    console.log('[SyncManager] Sync completo OK');
  } catch (err: any) {
    setState({ error: err.message });
  }
}

// ── Eventos online / offline ──────────────────────────────────────

function handleOnline(): void {
  setState({ isOnline: true, error: null });
  window.dispatchEvent(new CustomEvent('egchat-online'));
  // Pequeño delay para que la red se estabilice
  setTimeout(() => {
    const uid = _currentUserId();
    if (uid) fullSync(uid);
  }, 1_500);
}

function handleOffline(): void {
  setState({ isOnline: false });
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
  window.dispatchEvent(new CustomEvent('egchat-offline'));
}

function _currentUserId(): string {
  try {
    const token = getToken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id?.toString() || payload.sub?.toString() || '';
  } catch { return ''; }
}

// ── API Pública ───────────────────────────────────────────────────

/** Inicializar el SyncManager (llamar una vez al autenticar) */
export function initSyncManager(): void {
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  setState({ isOnline: navigator.onLine });

  // Sync inicial
  if (navigator.onLine) {
    setTimeout(() => {
      const uid = _currentUserId();
      if (uid) fullSync(uid);
    }, 3_000);
  }

  // Polling cada 30s
  pollTimer = setInterval(() => {
    if (state.isOnline && !isSyncing) {
      const uid = _currentUserId();
      if (uid) syncConversations();
    }
  }, POLL_MS);

  console.log('[SyncManager] Inicializado. Online:', navigator.onLine);
}

/** Detener el SyncManager (llamar al hacer logout) */
export function destroySyncManager(): void {
  window.removeEventListener('online',  handleOnline);
  window.removeEventListener('offline', handleOffline);
  if (syncTimer)  clearTimeout(syncTimer);
  if (pollTimer)  clearInterval(pollTimer);
  syncTimer = pollTimer = null;
}

/** Forzar sync manual (botón de reintento en UI) */
export async function forceSync(): Promise<void> {
  const uid = _currentUserId();
  if (!uid || !state.isOnline) return;
  await fullSync(uid);
}

/** Sincronizar mensajes de un chat específico */
export async function syncChatMessages(chatId: string): Promise<void> {
  if (!state.isOnline) return;
  await syncMessages(chatId);
}

/** Encolar un mensaje offline para envío posterior */
export async function enqueuePendingMessage(msg: Message): Promise<void> {
  await MessageRepository.upsert(msg);
  setState({ pendingCount: state.pendingCount + 1 });
  if (state.isOnline && !isSyncing) {
    setTimeout(flushQueue, 500);
  }
}

/** Obtener estado actual de sincronización */
export function getSyncState(): SyncState { return state; }

/** Suscribirse a cambios de estado */
export function onSyncStateChange(fn: SyncListener): () => void {
  listeners.add(fn);
  fn(state); // emitir estado actual inmediatamente
  return () => listeners.delete(fn);
}

// Re-exportar para compatibilidad con código existente
export const retrySync = forceSync;
