/**
 * offline-db.ts
 * Base de datos local IndexedDB para EGCHAT.
 * Almacena mensajes y conversaciones para acceso offline.
 *
 * Tablas:
 *   conversations — lista de chats con último mensaje
 *   messages      — mensajes individuales con estado de sincronización
 */

const DB_NAME    = 'egchat_offline';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface OfflineMessage {
  id: string;                          // ID local (puede ser 'local-timestamp' antes de sync)
  serverId?: string;                   // ID del servidor tras sincronizar
  conversationId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'video' | 'contact' | 'location';
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: number;                   // timestamp ms
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  synced: boolean;                     // true = confirmado por el servidor
  retries: number;                     // intentos de envío fallidos
}

export interface OfflineConversation {
  id: string;
  type: 'individual' | 'group';
  title: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
  updatedAt: number;
}

// ── Inicialización ────────────────────────────────────────────────────────────

export async function initOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Tabla conversations
      if (!database.objectStoreNames.contains('conversations')) {
        const convStore = database.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Tabla messages
      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
        msgStore.createIndex('createdAt',      'createdAt',      { unique: false });
        msgStore.createIndex('synced',         'synced',         { unique: false });
        msgStore.createIndex('status',         'status',         { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('[OfflineDB] Inicializada correctamente.');
      resolve();
    };

    request.onerror = (event) => {
      console.error('[OfflineDB] Error al abrir:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ── Helper: obtener store ─────────────────────────────────────────────────────

function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
  if (!db) throw new Error('[OfflineDB] Base de datos no inicializada.');
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// ── Mensajes ──────────────────────────────────────────────────────────────────

/** Guarda o actualiza un mensaje en IndexedDB */
export async function saveMessageOffline(msg: OfflineMessage): Promise<void> {
  if (!db) return;
  const store = getStore('messages', 'readwrite');
  await promisify(store.put(msg));
}

/** Obtiene todos los mensajes de una conversación, ordenados por fecha */
export async function getConversationMessages(conversationId: string): Promise<OfflineMessage[]> {
  if (!db) return [];
  const store = getStore('messages');
  const index = store.index('conversationId');
  const msgs  = await promisify<OfflineMessage[]>(index.getAll(conversationId));
  return msgs.sort((a, b) => a.createdAt - b.createdAt);
}

/** Obtiene todos los mensajes pendientes de sincronizar */
export async function getPendingMessages(): Promise<OfflineMessage[]> {
  if (!db) return [];
  const store = getStore('messages');
  const index = store.index('synced');
  const all   = await promisify<OfflineMessage[]>(index.getAll(false));
  // Solo los que tienen status pending o error (no los que ya están en tránsito)
  return all.filter(m => m.status === 'pending' || m.status === 'error');
}

/** Marca un mensaje como sincronizado con el servidor */
export async function markAsSynced(localId: string, serverId: string): Promise<void> {
  if (!db) return;
  const store = getStore('messages', 'readwrite');
  const msg   = await promisify<OfflineMessage>(store.get(localId));
  if (msg) {
    msg.synced   = true;
    msg.serverId = serverId;
    msg.status   = 'sent';
    await promisify(store.put(msg));
  }
}

/** Actualiza el estado de un mensaje */
export async function updateMessageStatus(
  id: string,
  status: OfflineMessage['status'],
  retries?: number
): Promise<void> {
  if (!db) return;
  const store = getStore('messages', 'readwrite');
  const msg   = await promisify<OfflineMessage>(store.get(id));
  if (msg) {
    msg.status = status;
    if (retries !== undefined) msg.retries = retries;
    await promisify(store.put(msg));
  }
}

/** Elimina mensajes antiguos ya sincronizados (limpieza periódica) */
export async function deleteOldMessages(olderThanMs = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  if (!db) return 0;
  const cutoff = Date.now() - olderThanMs;
  const store  = getStore('messages', 'readwrite');
  const all    = await promisify<OfflineMessage[]>(store.getAll());
  let deleted  = 0;
  for (const msg of all) {
    if (msg.synced && msg.createdAt < cutoff) {
      await promisify(store.delete(msg.id));
      deleted++;
    }
  }
  return deleted;
}

// ── Conversaciones ────────────────────────────────────────────────────────────

/** Guarda o actualiza una conversación */
export async function saveConversationOffline(conv: OfflineConversation): Promise<void> {
  if (!db) return;
  const store = getStore('conversations', 'readwrite');
  await promisify(store.put(conv));
}

/** Obtiene todas las conversaciones ordenadas por fecha */
export async function getAllConversations(): Promise<OfflineConversation[]> {
  if (!db) return [];
  const store = getStore('conversations');
  const all   = await promisify<OfflineConversation[]>(store.getAll());
  return all.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

/** Actualiza el último mensaje de una conversación */
export async function updateConversationLastMessage(
  conversationId: string,
  lastMessage: string,
  lastMessageAt: number
): Promise<void> {
  if (!db) return;
  const store = getStore('conversations', 'readwrite');
  const conv  = await promisify<OfflineConversation>(store.get(conversationId));
  if (conv) {
    conv.lastMessage   = lastMessage;
    conv.lastMessageAt = lastMessageAt;
    conv.updatedAt     = Date.now();
    await promisify(store.put(conv));
  }
}

/** Limpia toda la base de datos (al hacer logout) */
export async function clearOfflineDB(): Promise<void> {
  if (!db) return;
  const tx = db.transaction(['conversations', 'messages'], 'readwrite');
  tx.objectStore('conversations').clear();
  tx.objectStore('messages').clear();
  console.log('[OfflineDB] Base de datos limpiada.');
}
