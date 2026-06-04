/**
 * SettingsRepository.ts
 * Almacén key-value para configuración del usuario.
 * Reemplaza localStorage para datos persistentes críticos.
 */

import { query, run } from '../database';

export const SettingsRepository = {

  async get(key: string): Promise<string | null> {
    const rows = await query(
      `SELECT value FROM settings WHERE key = ? LIMIT 1`, [key]
    );
    return (rows[0] as any)?.value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    await run(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, Date.now()]
    );
  },

  async delete(key: string): Promise<void> {
    await run(`DELETE FROM settings WHERE key = ?`, [key]);
  },

  async getAll(): Promise<Record<string, string>> {
    const rows = await query(`SELECT key, value FROM settings`);
    const result: Record<string, string> = {};
    for (const row of rows as any[]) result[row.key] = row.value;
    return result;
  },

  /** Helpers tipados para valores comunes */
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },
};
