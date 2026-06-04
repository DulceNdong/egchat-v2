/**
 * UserRepository.ts
 * Persistencia local de perfiles de usuario.
 */

import { query, run, executeBatch } from '../database';

export interface User {
  id: string;
  phone: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
  region?: string;
  created_at: number;
  updated_at: number;
  synced: number;
}

export const UserRepository = {

  async getById(id: string): Promise<User | null> {
    const rows = await query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
    return (rows[0] as User) ?? null;
  },

  async getByPhone(phone: string): Promise<User | null> {
    const rows = await query(`SELECT * FROM users WHERE phone = ? LIMIT 1`, [phone]);
    return (rows[0] as User) ?? null;
  },

  async upsert(user: Partial<User> & { id: string; phone: string }): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO users (id, phone, full_name, avatar_url, email, bio, region, created_at, updated_at, synced)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         phone      = excluded.phone,
         full_name  = excluded.full_name,
         avatar_url = excluded.avatar_url,
         email      = excluded.email,
         bio        = excluded.bio,
         region     = excluded.region,
         updated_at = excluded.updated_at,
         synced     = excluded.synced`,
      [
        user.id, user.phone,
        user.full_name  ?? null, user.avatar_url ?? null,
        user.email      ?? null, user.bio        ?? null,
        user.region     ?? null,
        user.created_at ?? now, now,
        user.synced     ?? 1,
      ]
    );
  },

  async upsertBatch(users: User[]): Promise<void> {
    if (!users.length) return;
    const now = Date.now();
    await executeBatch(users.map(u => ({
      sql: `INSERT INTO users (id, phone, full_name, avatar_url, email, bio, region, created_at, updated_at, synced)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              full_name = excluded.full_name,
              avatar_url = excluded.avatar_url,
              updated_at = excluded.updated_at,
              synced = 1`,
      params: [
        u.id, u.phone, u.full_name ?? null, u.avatar_url ?? null,
        u.email ?? null, u.bio ?? null, u.region ?? null,
        u.created_at ?? now, now, u.synced ?? 1,
      ],
    })));
  },

  async delete(id: string): Promise<void> {
    await run(`DELETE FROM users WHERE id = ?`, [id]);
  },
};
