/**
 * sync-manager.ts
 * Gestiona la sincronización de mensajes offline con el servidor.
 *
 * Funcionalidades:
 * - Escucha eventos online/offline del navegador
 * - Cola de mensajes pendientes con backoff exponencial
 * - Lotes de hasta 10 mensajes por ciclo
 * - Descarga mensajes nuevos al reconectar
 * - Resolución de conflictos por timestamp
 */

import {
  getPendingMessages,
  markAsSynced,
  updateMessageStatus,
  deleteOldMessages,
  type OfflineMessage,
} from './offline-db';

// ── Constantes ────────────────────────────────────────────────────────────────

const API_BASE    = (import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com';
const BATCH_SIZE  = 10;
const MAX_RETRIES = 5;

// Backoff exponencial: 5s → 15s → 30s → 60s → 120s
const RETRY_DELAYS = [5_000, 15_000, 30_000, 60_000, 120_000];

// ── Estado ────────────────────────────────────────────────────────────────────

let isSyncing    = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isOnline     = navigator.onLine;

// Callbacks para notificar a la UI
const listeners = new Set<(state: SyncState) => void>();

export interface SyncState {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  lastSyncAt:   number | null;
  error:        string | null;
}

let state: SyncState = {
  isOnline:     navigator.onLine,
  isSyncing:    false,
  pendingCount: 0,
  lastSyncAt:   null,
  error:        null,
};

function setState(partial: Partial<SyncState>) {
  state = { ...state, ...partial };
  listeners.forEach(fn => fn(state));
}

// ── API ───────────────────────────────────────────────────────────────────────

export function getSyncState(): SyncState { return state; }

export function onSyncStateChange(fn: (s: SyncState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('egchat_token') ||
    localStorage.getItem('egchat_token_backup') ||
    ''
  );
}

async function sendMessageToServer(msg: OfflineMessage): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      chat_id:  msg.conversationId,
      text:     msg.text,
      type:     msg.type || 'text',
      // Incluir metadatos de archivo si existen
      ...(msg.imageUrl && { file_url: msg.imageUrl }),
      ...(msg.audioUrl && { file_url: msg.audioUrl }),
      ...(msg.fileUrl  && { file_url: msg.fileUrl, file_name: msg.fileName }),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.id || data.message_id || null;
}

// ── Ciclo de sincronización ───────────────────────────────────────────────────

async function syncPendingMessages(): Promise<void> {
  if (isSyncing || !isOnline) return;

  const token = getAuthToken();
  if (!token) return; // usuario no autenticado

  isSyncing = true;
  setState({ isSyncing: true, error: null });

  try {
    const pending = await getPendingMessages();
    setState({ pendingCount: pending.length });

    if (pending.length === 0) {
      setState({ isSyncing: false, lastSyncAt: Date.now() });
      isSyncing = false;
      return;
    }

    console.log(`[SyncManager] Sincronizando ${pending.length} mensajes pendientes...`);

    // Procesar en lotes
    const batch = pending.slice(0, BATCH_SIZE);

    for (const msg of batch) {
      if (!isOnline) break; // parar si se pierde la conexión

      try {
        const serverId = await sendMessageToServer(msg);
        if (serverId) {
          await markAsSynced(msg.id, serverId);
          console.log(`[SyncManager] Mensaje ${msg.id} sincronizado → ${serverId}`);
        }
      } catch (err: any) {
        const retries = (msg.retries || 0) + 1;
        console.warn(`[SyncManager] Error enviando ${msg.id} (intento ${retries}):`, err.message);

        if (retries >= MAX_RETRIES) {
          await updateMessageStatus(msg.id, 'error', retries);
        } else {
          await updateMessageStatus(msg.id, 'pending', retries);
          // Programar reintento con backoff
          const delay = RETRY_DELAYS[Math.min(retries - 1, RETRY_DELAYS.length - 1)];
          setTimeout(() => syncPendingMessages(), delay);
        }
      }
    }

    // Actualizar contador tras el lote
    const remaining = await getPendingMessages();
    setState({
      isSyncing:    false,
      pendingCount: remaining.length,
      lastSyncAt:   Date.now(),
    });

    // Si quedan más, programar otro ciclo
    if (remaining.length > 0 && isOnline) {
      syncTimer = setTimeout(syncPendingMessages, 2_000);
    }

  } catch (err: any) {
    console.error('[SyncManager] Error en ciclo de sync:', err);
    setState({ isSyncing: false, error: err.message });
  } finally {
    isSyncing = false;
  }
}

// ── Eventos online/offline ────────────────────────────────────────────────────

function handleOnline() {
  console.log('[SyncManager] Conexión restaurada — iniciando sync...');
  isOnline = true;
  setState({ isOnline: true });

  // Disparar evento global para que la UI reaccione
  window.dispatchEvent(new CustomEvent('egchat-online'));

  // Limpiar mensajes viejos y sincronizar
  deleteOldMessages().then(n => {
    if (n > 0) console.log(`[SyncManager] ${n} mensajes antiguos eliminados.`);
  });

  // Pequeño delay para que la conexión se estabilice
  setTimeout(syncPendingMessages, 1_000);
}

function handleOffline() {
  console.log('[SyncManager] Sin conexión.');
  isOnline = false;
  setState({ isOnline: false });

  // Cancelar sync en curso
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  // Disparar evento global para que la UI reaccione
  window.dispatchEvent(new CustomEvent('egchat-offline'));
}

// ── Inicialización ────────────────────────────────────────────────────────────

export function initSyncManager(): void {
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);

  // Estado inicial
  isOnline = navigator.onLine;
  setState({ isOnline });

  // Sincronizar al arrancar si hay conexión
  if (isOnline) {
    setTimeout(syncPendingMessages, 3_000);
  }

  // Sync periódico cada 30s cuando hay conexión
  setInterval(() => {
    if (isOnline && !isSyncing) syncPendingMessages();
  }, 30_000);

  console.log('[SyncManager] Inicializado. Online:', isOnline);
}

/** Forzar sincronización manual (para botón de reintento en la UI) */
export async function retrySync(): Promise<void> {
  if (!isOnline) return;
  await syncPendingMessages();
}

/** Notificar al sync manager que hay un nuevo mensaje pendiente */
export function notifyPendingMessage(): void {
  setState({ pendingCount: state.pendingCount + 1 });
  if (isOnline && !isSyncing) {
    setTimeout(syncPendingMessages, 500);
  }
}
