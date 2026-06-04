/**
 * WalletRepository.ts
 * Persistencia local del monedero.
 * - Muestra último saldo sincronizado mientras offline.
 * - Bloquea operaciones de pago/transferencia sin conexión.
 * - Historial de transacciones siempre disponible.
 */

import { query, run, executeBatch } from '../database';

export interface WalletBalance {
  user_id: string;
  balance: number;
  currency: string;
  last_updated: number;
  synced: number;
}

export interface WalletTransaction {
  id: string;
  server_id?: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'payment' | 'recharge';
  amount: number;
  balance_after?: number;
  description?: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  method?: string;
  destination?: string;
  created_at: number;
  synced: number;
}

export const WalletRepository = {

  // ── Saldo ────────────────────────────────────────────────────────

  /** Guardar balance del usuario */
  async saveBalance(userId: string, balance: number, currency = 'XAF'): Promise<void> {
    await run(
      `INSERT INTO wallet_balance (user_id, balance, currency, last_updated, synced)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         currency = excluded.currency,
         last_updated = excluded.last_updated,
         synced = 1`,
      [userId, balance, currency, Date.now()]
    );
  },

  /** Obtener balance cacheado del usuario */
  async getBalance(userId: string): Promise<WalletBalance | null> {
    const rows = await query(
      `SELECT * FROM wallet_balance WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return (rows[0] as WalletBalance) ?? null;
  },

  // ── Transacciones ─────────────────────────────────────────────────

  /** Obtener historial de transacciones (paginado) */
  async getTransactions(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<WalletTransaction[]> {
    const offset = (page - 1) * pageSize;
    return query(
      `SELECT * FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    ) as Promise<WalletTransaction[]>;
  },

  /** Guardar o actualizar una transacción */
  async upsertTransaction(tx: Partial<WalletTransaction> & { id: string; user_id: string }): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO wallet_transactions
        (id, server_id, user_id, type, amount, balance_after,
         description, reference, status, method, destination, created_at, synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         status        = excluded.status,
         balance_after = excluded.balance_after,
         synced        = excluded.synced,
         server_id     = COALESCE(excluded.server_id, wallet_transactions.server_id)`,
      [
        tx.id,
        tx.server_id   ?? null,
        tx.user_id,
        tx.type        ?? 'payment',
        tx.amount      ?? 0,
        tx.balance_after ?? null,
        tx.description ?? null,
        tx.reference   ?? null,
        tx.status      ?? 'pending',
        tx.method      ?? null,
        tx.destination ?? null,
        tx.created_at  ?? now,
        tx.synced      ?? 0,
      ]
    );
  },

  /** Batch upsert de transacciones (para sync inicial) */
  async upsertBatch(transactions: WalletTransaction[]): Promise<void> {
    if (transactions.length === 0) return;
    const statements = transactions.map(tx => ({
      sql: `INSERT INTO wallet_transactions
              (id, server_id, user_id, type, amount, balance_after,
               description, reference, status, method, destination, created_at, synced)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              balance_after = excluded.balance_after,
              synced = 1`,
      params: [
        tx.id, tx.server_id ?? null, tx.user_id,
        tx.type ?? 'payment', tx.amount ?? 0,
        tx.balance_after ?? null, tx.description ?? null,
        tx.reference ?? null, tx.status ?? 'completed',
        tx.method ?? null, tx.destination ?? null,
        tx.created_at, tx.synced ?? 1,
      ],
    }));
    await executeBatch(statements);
  },

  /** Transacciones pendientes de sincronizar */
  async getPending(userId: string): Promise<WalletTransaction[]> {
    return query(
      `SELECT * FROM wallet_transactions
       WHERE user_id = ? AND synced = 0
       ORDER BY created_at ASC`,
      [userId]
    ) as Promise<WalletTransaction[]>;
  },

  /** Obtener total de transacciones */
  async getCount(userId: string): Promise<number> {
    const rows = await query(
      `SELECT COUNT(*) as cnt FROM wallet_transactions WHERE user_id = ?`,
      [userId]
    );
    return (rows[0] as any)?.cnt ?? 0;
  },
};
