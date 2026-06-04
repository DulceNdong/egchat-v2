/**
 * ConversationRepository.ts
 * CRUD para conversaciones (chats individuales y grupos).
 * Lee primero de SQLite, sincroniza en background con el backend.
 */

import { query, run, executeBatch } from '../database';

export interface Conversation {
  id: string;
  type: 'individual' | 'group';
  title: string;
  avatar_url: string;
  last_message: string;
  last_message_at: number;
  unread_count: number;
  archived: number;
  favorite: number;
  created_at: number;
  updated_at: number;
  synced: number;
}

export const ConversationRepository = {

  /** Obtener todas las conversaciones, ordenadas por más reciente */
  async getAll(includeArchived = false): Promise<Conversation[]> {
    const sql = includeArchived
      ? `SELECT * FROM conversations ORDER BY last_message_at DESC`
      : `SELECT * FROM conversations WHERE archived = 0 ORDER BY last_message_at DESC`;
    return query(sql) as Promise<Conversation[]>;
  },

  /** Obtener conversaciones archivadas */
  async getArchived(): Promise<Conversation[]> {
    return query(
      `SELECT * FROM conversations WHERE archived = 1 ORDER BY last_message_at DESC`
    ) as Promise<Conversation[]>;
  },

  /** Obtener una conversación por ID */
  async getById(id: string): Promise<Conversation | null> {
    const rows = await query(
      `SELECT * FROM conversations WHERE id = ? LIMIT 1`, [id]
    );
    return (rows[0] as Conversation) ?? null;
  },

  /** Guardar o actualizar una conversación */
  async upsert(conv: Partial<Conversation> & { id: string }): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO conversations
        (id, type, title, avatar_url, last_message, last_message_at,
         unread_count, archived, favorite, created_at, updated_at, synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         type            = excluded.type,
         title           = excluded.title,
         avatar_url      = excluded.avatar_url,
         last_message    = excluded.last_message,
         last_message_at = excluded.last_message_at,
         unread_count    = excluded.unread_count,
         archived        = excluded.archived,
         favorite        = excluded.favorite,
         updated_at      = excluded.updated_at,
         synced          = excluded.synced`,
      [
        conv.id,
        conv.type          ?? 'individual',
        conv.title         ?? '',
        conv.avatar_url    ?? '',
        conv.last_message  ?? '',
        conv.last_message_at ?? now,
        conv.unread_count  ?? 0,
        conv.archived      ?? 0,
        conv.favorite      ?? 0,
        conv.created_at    ?? now,
        now,
        conv.synced        ?? 1,
      ]
    );
  },

  /** Insertar múltiples conversaciones en batch (para sync inicial) */
  async upsertBatch(conversations: Array<Partial<Conversation> & { id: string }>): Promise<void> {
    if (conversations.length === 0) return;
    const now = Date.now();
    const statements = conversations.map(conv => ({
      sql: `INSERT INTO conversations
              (id, type, title, avatar_url, last_message, last_message_at,
               unread_count, archived, favorite, created_at, updated_at, synced)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              type = excluded.type, title = excluded.title,
              avatar_url = excluded.avatar_url,
              last_message = excluded.last_message,
              last_message_at = excluded.last_message_at,
              unread_count = excluded.unread_count,
              archived = excluded.archived,
              favorite = excluded.favorite,
              updated_at = excluded.updated_at,
              synced = excluded.synced`,
      params: [
        conv.id, conv.type ?? 'individual', conv.title ?? '',
        conv.avatar_url ?? '', conv.last_message ?? '',
        conv.last_message_at ?? now, conv.unread_count ?? 0,
        conv.archived ?? 0, conv.favorite ?? 0,
        conv.created_at ?? now, now, conv.synced ?? 1,
      ],
    }));
    await executeBatch(statements);
  },

  /** Actualizar el último mensaje de una conversación */
  async updateLastMessage(id: string, text: string, at: number): Promise<void> {
    await run(
      `UPDATE conversations SET last_message = ?, last_message_at = ?, updated_at = ? WHERE id = ?`,
      [text, at, Date.now(), id]
    );
  },

  /** Incrementar/resetear contador de no leídos */
  async setUnreadCount(id: string, count: number): Promise<void> {
    await run(
      `UPDATE conversations SET unread_count = ?, updated_at = ? WHERE id = ?`,
      [count, Date.now(), id]
    );
  },

  /** Archivar o desarchivar */
  async setArchived(id: string, archived: boolean): Promise<void> {
    await run(
      `UPDATE conversations SET archived = ?, updated_at = ? WHERE id = ?`,
      [archived ? 1 : 0, Date.now(), id]
    );
  },

  /** Marcar / desmarcar favorito */
  async setFavorite(id: string, favorite: boolean): Promise<void> {
    await run(
      `UPDATE conversations SET favorite = ?, updated_at = ? WHERE id = ?`,
      [favorite ? 1 : 0, Date.now(), id]
    );
  },

  /** Eliminar una conversación y sus mensajes */
  async delete(id: string): Promise<void> {
    await run(`DELETE FROM messages       WHERE conversation_id = ?`, [id]);
    await run(`DELETE FROM conversations WHERE id = ?`, [id]);
  },

  /** Buscar conversaciones por título */
  async search(term: string): Promise<Conversation[]> {
    const like = `%${term}%`;
    return query(
      `SELECT * FROM conversations
       WHERE title LIKE ? AND archived = 0
       ORDER BY last_message_at DESC`,
      [like]
    ) as Promise<Conversation[]>;
  },
};
