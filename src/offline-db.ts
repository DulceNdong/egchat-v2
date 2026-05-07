/**
 * offline-db.ts
 * ─────────────────────────────────────────────────────────────────
 * Capa de persistencia offline para EGCHAT.
 *
 * Estrategia:
 *  - Intenta usar @capacitor-community/sqlite cuando corre en Android/iOS
 *  - Cae automáticamente a IndexedDB (idb-keyval) en web/PWA
 *
 * Tablas:
 *  conversations  — lista de chats con último mensaje y contador no leídos
 *  messages       — mensajes con flag `synced` (0 = pendiente, 1 = enviado)
 * ─────────────────────────────────────────────────────────────────
 */

// ── Tipos ─────────────────────────────────────────────────────────

export interface OfflineConversation {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  last_message: string;
  last_message_time: string; // ISO string
  unread_count: number;
  updated_at: string;
}

export interface OfflineMessage {
  id: string;               // UUID local o del servidor
  conversation_id: string;
  sender_id: string;
  text?: string;
  media_url?: string;
  file_type?: string;
  type: string;             // 'text' | 'image' | 'file' | ...
  timestamp: string;        // ISO string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  synced: 0 | 1;            // 0 = pendiente de enviar al servidor
  retry_count: number;      // intentos de reenvío
  local_id?: string;        // ID temporal antes de confirmar con servidor
}

// ── Detección de plataforma ───────────────────────────────────────

const isNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

// ══════════════════════════════════════════════════════════════════
// BACKEND: IndexedDB (funciona en web, PWA y Capacitor OTA)
// ══════════════════════════════════════════════════════════════════

const DB_NAME = 'egchat_offline';
const DB_VERSION = 1;

let _idb: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_idb) return Promise.resolve(_idb);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // ── conversations ──────────────────────────────────────────
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // ── messages ───────────────────────────────────────────────
      if (!db.objectStoreNames.contains('messages')) {
        const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('conversation_id', 'conversation_id', { unique: false });
        msgStore.createIndex('synced', 'synced', { unique: false });
        msgStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _idb = (e.target as IDBOpenDBRequest).result;
      resolve(_idb);
    };

    req.onerror = () => reject(req.error);
  });
}

/** Wrapper genérico para transacciones IDB */
function idbTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openIDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

/** Obtener todos los registros de un store con un índice opcional */
function idbGetAll<T>(
  storeName: string,
  indexName?: string,
  query?: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return openIDB().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const source = indexName ? store.index(indexName) : store;
        const req = query ? source.getAll(query) : source.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

// ══════════════════════════════════════════════════════════════════
// API PÚBLICA
// ══════════════════════════════════════════════════════════════════

/**
 * Inicializa la base de datos offline.
 * Llama esto una vez al arrancar la app (en main.tsx o App.tsx).
 */
export async function initOfflineDB(): Promise<void> {
  try {
    await openIDB();
    console.log('[OfflineDB] IndexedDB inicializado correctamente');
  } catch (err) {
    console.error('[OfflineDB] Error al inicializar:', err);
    throw err;
  }
}

// ── Conversaciones ────────────────────────────────────────────────

/**
 * Guarda o actualiza una conversación en local.
 */
export async function saveConversation(conv: OfflineConversation): Promise<void> {
  await idbTx<IDBValidKey>('conversations', 'readwrite', (store) =>
    store.put(conv)
  );
}

/**
 * Devuelve todas las conversaciones ordenadas por updated_at desc.
 */
export async function getAllConversations(): Promise<OfflineConversation[]> {
  const all = await idbGetAll<OfflineConversation>('conversations');
  return all.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Actualiza el contador de no leídos de una conversación.
 */
export async function updateUnreadCount(
  conversationId: string,
  count: number
): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');
    const getReq = store.get(conversationId);
    getReq.onsuccess = () => {
      const conv = getReq.result as OfflineConversation | undefined;
      if (conv) {
        conv.unread_count = count;
        store.put(conv);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ── Mensajes ──────────────────────────────────────────────────────

/**
 * Guarda un mensaje localmente.
 * Si no hay internet, lo marca como synced=0 (pendiente).
 */
export async function saveMessageOffline(
  message: Omit<OfflineMessage, 'synced' | 'retry_count'> & {
    synced?: 0 | 1;
    retry_count?: number;
  }
): Promise<void> {
  const isOnline = navigator.onLine;

  const record: OfflineMessage = {
    ...message,
    synced: message.synced ?? (isOnline ? 1 : 0),
    retry_count: message.retry_count ?? 0,
    status: message.status ?? (isOnline ? 'sent' : 'pending'),
  };

  await idbTx<IDBValidKey>('messages', 'readwrite', (store) =>
    store.put(record)
  );

  // Actualizar último mensaje en la conversación
  const convs = await idbGetAll<OfflineConversation>('conversations');
  const conv = convs.find((c) => c.id === message.conversation_id);
  if (conv) {
    conv.last_message = message.text || (message.media_url ? '📎 Archivo' : '');
    conv.last_message_time = message.timestamp;
    conv.updated_at = message.timestamp;
    await saveConversation(conv);
  }
}

/**
 * Recupera los mensajes de una conversación, ordenados por timestamp.
 * @param conversationId  ID del chat
 * @param limit           Máximo de mensajes a devolver (0 = todos)
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50
): Promise<OfflineMessage[]> {
  const all = await idbGetAll<OfflineMessage>(
    'messages',
    'conversation_id',
    IDBKeyRange.only(conversationId)
  );

  const sorted = all.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return limit > 0 ? sorted.slice(-limit) : sorted;
}

/**
 * Devuelve todos los mensajes que aún no se han enviado al servidor.
 */
export async function getPendingMessages(): Promise<OfflineMessage[]> {
  return idbGetAll<OfflineMessage>('messages', 'synced', IDBKeyRange.only(0));
}

/**
 * Marca un mensaje como sincronizado con el servidor.
 * Opcionalmente actualiza el ID local con el ID real del servidor.
 */
export async function markAsSynced(
  localId: string,
  serverId?: string
): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const getReq = store.get(localId);

    getReq.onsuccess = () => {
      const msg = getReq.result as OfflineMessage | undefined;
      if (msg) {
        msg.synced = 1;
        msg.status = 'sent';
        if (serverId && serverId !== localId) {
          // Eliminar el registro con ID local y crear uno con ID del servidor
          store.delete(localId);
          msg.id = serverId;
          msg.local_id = localId;
        }
        store.put(msg);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Incrementa el contador de reintentos de un mensaje fallido.
 */
export async function incrementRetryCount(messageId: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const getReq = store.get(messageId);
    getReq.onsuccess = () => {
      const msg = getReq.result as OfflineMessage | undefined;
      if (msg) {
        msg.retry_count = (msg.retry_count || 0) + 1;
        if (msg.retry_count >= 3) {
          msg.status = 'failed';
        }
        store.put(msg);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Actualiza el estado visual de un mensaje (pending → sent → delivered → read).
 */
export async function updateMessageStatus(
  messageId: string,
  status: OfflineMessage['status']
): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const getReq = store.get(messageId);
    getReq.onsuccess = () => {
      const msg = getReq.result as OfflineMessage | undefined;
      if (msg) {
        msg.status = status;
        store.put(msg);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Elimina mensajes más antiguos que `daysToKeep` días.
 * Útil para liberar espacio en dispositivos con poca memoria.
 */
export async function deleteOldMessages(daysToKeep = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffISO = cutoff.toISOString();

  const all = await idbGetAll<OfflineMessage>('messages');
  const toDelete = all.filter(
    (m) => m.timestamp < cutoffISO && m.synced === 1
  );

  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    let deleted = 0;
    toDelete.forEach((m) => {
      store.delete(m.id);
      deleted++;
    });
    tx.oncomplete = () => resolve(deleted);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Limpia toda la base de datos offline (útil al cerrar sesión).
 */
export async function clearOfflineDB(): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['conversations', 'messages'], 'readwrite');
    tx.objectStore('conversations').clear();
    tx.objectStore('messages').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
