/**
 * ContactRepository.ts
 * CRUD para contactos con soporte de búsqueda local instantánea.
 */

import { query, run, executeBatch } from '../database';

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  nickname?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  blocked: number;
  favorite: number;
  created_at: number;
  updated_at: number;
  synced: number;
}

export const ContactRepository = {

  async getAll(userId: string): Promise<Contact[]> {
    return query(
      `SELECT c.*, u.full_name, u.phone, u.avatar_url
       FROM contacts c
       LEFT JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = ? AND c.blocked = 0
       ORDER BY COALESCE(c.nickname, u.full_name) ASC`,
      [userId]
    ) as Promise<Contact[]>;
  },

  async getFavorites(userId: string): Promise<Contact[]> {
    return query(
      `SELECT c.*, u.full_name, u.phone, u.avatar_url
       FROM contacts c
       LEFT JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = ? AND c.favorite = 1 AND c.blocked = 0
       ORDER BY COALESCE(c.nickname, u.full_name) ASC`,
      [userId]
    ) as Promise<Contact[]>;
  },

  async search(userId: string, term: string): Promise<Contact[]> {
    const like = `%${term}%`;
    return query(
      `SELECT c.*, u.full_name, u.phone, u.avatar_url
       FROM contacts c
       LEFT JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND (
           u.full_name LIKE ? OR
           c.nickname  LIKE ? OR
           u.phone     LIKE ?
         )
       ORDER BY COALESCE(c.nickname, u.full_name) ASC
       LIMIT 50`,
      [userId, like, like, like]
    ) as Promise<Contact[]>;
  },

  async upsert(contact: Partial<Contact> & { id: string; user_id: string; contact_user_id: string }): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO contacts
         (id, user_id, contact_user_id, nickname, blocked, favorite, created_at, updated_at, synced)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         nickname   = excluded.nickname,
         blocked    = excluded.blocked,
         favorite   = excluded.favorite,
         updated_at = excluded.updated_at,
         synced     = excluded.synced`,
      [
        contact.id,
        contact.user_id,
        contact.contact_user_id,
        contact.nickname   ?? null,
        contact.blocked    ?? 0,
        contact.favorite   ?? 0,
        contact.created_at ?? now,
        now,
        contact.synced     ?? 1,
      ]
    );
  },

  async upsertBatch(contacts: Contact[]): Promise<void> {
    if (!contacts.length) return;
    const now = Date.now();
    await executeBatch(contacts.map(c => ({
      sql: `INSERT INTO contacts
              (id, user_id, contact_user_id, nickname, blocked, favorite, created_at, updated_at, synced)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              nickname = excluded.nickname,
              blocked  = excluded.blocked,
              favorite = excluded.favorite,
              updated_at = excluded.updated_at,
              synced = 1`,
      params: [
        c.id, c.user_id, c.contact_user_id,
        c.nickname ?? null, c.blocked ?? 0, c.favorite ?? 0,
        c.created_at ?? now, now, c.synced ?? 1,
      ],
    })));
  },

  async setFavorite(id: string, favorite: boolean): Promise<void> {
    await run(
      `UPDATE contacts SET favorite = ?, updated_at = ? WHERE id = ?`,
      [favorite ? 1 : 0, Date.now(), id]
    );
  },

  async setBlocked(id: string, blocked: boolean): Promise<void> {
    await run(
      `UPDATE contacts SET blocked = ?, updated_at = ? WHERE id = ?`,
      [blocked ? 1 : 0, Date.now(), id]
    );
  },

  async delete(id: string): Promise<void> {
    await run(`DELETE FROM contacts WHERE id = ?`, [id]);
  },
};
