/**
 * MessageRepository.ts
 * CRUD para mensajes individuales.
 * Prioriza lectura de SQLite, con soporte completo para
 * mensajes pendientes, multimedia y búsqueda fulltext.
 */

import { query, run, executeBatch } from '../database';

export interface Message {
  id: string;
  server_id?: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'contact' | 'location' | 'call';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  call_type?: string;
  call_status?: string;
  call_duration?: number;
  reply_to?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  created_at: number;
  synced: number;
  retries: number;
  deleted_for_me: number;
}

const PAGE_SIZE = 50;

export const MessageRepository = {

  /** Obtener mensajes de una conversación (paginados) */
  async getByConversation(
    conversationId: string,
    page = 1,
    pageSize = PAGE_SIZE
  ): Promise<Message[]> {
    const offset = (page - 1) * pageSize;
    const rows = await query(
      `SELECT * FROM messages
       WHERE conversation_id = ? AND deleted_for_me = 0
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, pageSize, offset]
    );
    // Devolver en orden cronológico ascendente
    return (rows as Message[]).reverse();
  },

  /** Obtener mensajes pendientes de sincronizar (para offline queue) */
  async getPending(): Promise<Message[]> {
    return query(
      `SELECT * FROM messages
       WHERE synced = 0 AND status IN ('pending','error')
       ORDER BY created_at ASC`,
      []
    ) as Promise<Message[]>;
  },

  /** Insertar o actualizar un mensaje */
  async upsert(msg: Partial<Message> & { id: string; conversation_id: string; sender_id: string }): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO messages
        (id, server_id, conversation_id, sender_id, text, type,
         file_url, file_name, file_size, thumbnail_url,
         image_url, audio_url, video_url,
         call_type, call_status, call_duration,
         reply_to, status, created_at, synced, retries, deleted_for_me)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         server_id     = excluded.server_id,
         status        = excluded.status,
         synced        = excluded.synced,
         retries       = excluded.retries,
         deleted_for_me = excluded.deleted_for_me`,
      [
        msg.id,
        msg.server_id    ?? null,
        msg.conversation_id,
        msg.sender_id,
        msg.text         ?? null,
        msg.type         ?? 'text',
        msg.file_url     ?? null,
        msg.file_name    ?? null,
        msg.file_size    ?? null,
        msg.thumbnail_url ?? null,
        msg.image_url    ?? null,
        msg.audio_url    ?? null,
        msg.video_url    ?? null,
        msg.call_type    ?? null,
        msg.call_status  ?? null,
        msg.call_duration ?? null,
        msg.reply_to     ?? null,
        msg.status       ?? 'pending',
        msg.created_at   ?? now,
        msg.synced       ?? 0,
        msg.retries      ?? 0,
        msg.deleted_for_me ?? 0,
      ]
    );
  },

  /** Batch upsert eficiente para sincronización masiva */
  async upsertBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const now = Date.now();
    const statements = messages.map(msg => ({
      sql: `INSERT INTO messages
              (id, server_id, conversation_id, sender_id, text, type,
               file_url, file_name, file_size, thumbnail_url,
               image_url, audio_url, video_url,
               call_type, call_status, call_duration,
               reply_to, status, created_at, synced, retries, deleted_for_me)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              status = CASE WHEN messages.status = 'pending' THEN excluded.status ELSE messages.status END,
              synced = excluded.synced,
              server_id = COALESCE(excluded.server_id, messages.server_id)`,
      params: [
        msg.id, msg.server_id ?? null,
        msg.conversation_id, msg.sender_id,
        msg.text ?? null, msg.type ?? 'text',
        msg.file_url ?? null, msg.file_name ?? null,
        msg.file_size ?? null, msg.thumbnail_url ?? null,
        msg.image_url ?? null, msg.audio_url ?? null,
        msg.video_url ?? null, msg.call_type ?? null,
        msg.call_status ?? null, msg.call_duration ?? null,
        msg.reply_to ?? null, msg.status ?? 'delivered',
        msg.created_at ?? now, msg.synced ?? 1,
        msg.retries ?? 0, msg.deleted_for_me ?? 0,
      ],
    }));
    await executeBatch(statements);
  },

  /** Marcar como sincronizado tras confirmar con el servidor */
  async markSynced(localId: string, serverId: string): Promise<void> {
    await run(
      `UPDATE messages SET synced = 1, server_id = ?, status = 'sent' WHERE id = ?`,
      [serverId, localId]
    );
  },

  /** Actualizar estado de un mensaje */
  async updateStatus(id: string, status: Message['status'], retries?: number): Promise<void> {
    if (retries !== undefined) {
      await run(
        `UPDATE messages SET status = ?, retries = ? WHERE id = ?`,
        [status, retries, id]
      );
    } else {
      await run(`UPDATE messages SET status = ? WHERE id = ?`, [status, id]);
    }
  },

  /** Marcar todos los mensajes de una conversación como leídos */
  async markAllRead(conversationId: string): Promise<void> {
    await run(
      `UPDATE messages SET status = 'read'
       WHERE conversation_id = ? AND status != 'read' AND synced = 1`,
      [conversationId]
    );
  },

  /** Borrar mensaje solo para mí */
  async deleteForMe(id: string): Promise<void> {
    await run(`UPDATE messages SET deleted_for_me = 1 WHERE id = ?`, [id]);
  },

  /** Borrar mensaje para todos */
  async deleteForAll(id: string): Promise<void> {
    await run(`DELETE FROM messages WHERE id = ?`, [id]);
  },

  /** Búsqueda de mensajes por texto */
  async search(term: string, conversationId?: string): Promise<Message[]> {
    const like = `%${term}%`;
    if (conversationId) {
      return query(
        `SELECT * FROM messages
         WHERE conversation_id = ? AND text LIKE ? AND deleted_for_me = 0
         ORDER BY created_at DESC LIMIT 100`,
        [conversationId, like]
      ) as Promise<Message[]>;
    }
    return query(
      `SELECT * FROM messages
       WHERE text LIKE ? AND deleted_for_me = 0
       ORDER BY created_at DESC LIMIT 100`,
      [like]
    ) as Promise<Message[]>;
  },

  /** Limpiar mensajes antiguos ya sincronizados (más de 7 días) */
  async pruneOld(daysOld = 7): Promise<number> {
    const cutoff = Date.now() - daysOld * 86_400_000;
    const result = await run(
      `DELETE FROM messages WHERE synced = 1 AND created_at < ? AND deleted_for_me = 0`,
      [cutoff]
    );
    return result.changes;
  },
};
