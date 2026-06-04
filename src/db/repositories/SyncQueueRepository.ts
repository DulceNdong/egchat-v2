/**
 * SyncQueueRepository.ts
 * Cola persistente de operaciones pendientes de sincronizar.
 * Sobrevive reinicios de app — garantiza que nada se pierde offline.
 */

import { query, run } from '../database';

export type SyncAction = 'create' | 'update' | 'delete';
export type EntityType =
  | 'message'
  | 'wallet_transaction'
  | 'contact'
  | 'conversation'
  | 'story'
  | 'profile';

export interface SyncQueueItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action: SyncAction;
  payload: string;        // JSON serializado
  priority: number;       // mayor = más urgente
  retries: number;
  created_at: number;
  last_attempt: number | null;
}

export const SyncQueueRepository = {

  /** Añadir una operación a la cola */
  async enqueue(
    entityType: EntityType,
    entityId: string,
    action: SyncAction,
    payload: object,
    priority = 0
  ): Promise<string> {
    const id  = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    await run(
      `INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, priority, retries, created_at, last_attempt)
       VALUES (?,?,?,?,?,?,0,?,NULL)`,
      [id, entityType, entityId, action, JSON.stringify(payload), priority, now]
    );
    return id;
  },

  /** Obtener los próximos N items para procesar (orden prioridad + antigüedad) */
  async dequeue(limit = 20): Promise<SyncQueueItem[]> {
    return query(
      `SELECT * FROM sync_queue
       ORDER BY priority DESC, created_at ASC
       LIMIT ?`,
      [limit]
    ) as Promise<SyncQueueItem[]>;
  },

  /** Marcar como completado y eliminar */
  async complete(id: string): Promise<void> {
    await run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  },

  /** Registrar intento fallido con incremento de reintentos */
  async fail(id: string): Promise<void> {
    await run(
      `UPDATE sync_queue SET retries = retries + 1, last_attempt = ? WHERE id = ?`,
      [Date.now(), id]
    );
  },

  /** Eliminar items que excedieron el máximo de reintentos */
  async pruneExhausted(maxRetries = 5): Promise<number> {
    const result = await run(
      `DELETE FROM sync_queue WHERE retries >= ?`,
      [maxRetries]
    );
    return result.changes;
  },

  /** Contar items pendientes */
  async count(): Promise<number> {
    const rows = await query(`SELECT COUNT(*) as cnt FROM sync_queue`);
    return (rows[0] as any)?.cnt ?? 0;
  },

  /** Limpiar toda la cola (solo en logout) */
  async clear(): Promise<void> {
    await run(`DELETE FROM sync_queue`);
  },
};
