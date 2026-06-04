/**
 * useWalletOffline.ts  —  FASE 6: Wallet Profesional Offline-First
 *
 * Reglas de negocio:
 *  ✅ Mostrar offline: último saldo, últimas transacciones
 *  ❌ Bloquear offline: pagos, transferencias, operaciones financieras
 *
 * El hook expone `canTransact` para que la UI decida si habilitar
 * los botones de pago sin necesidad de lógica extra en cada pantalla.
 */

import { useState, useEffect, useCallback } from 'react';
import { WalletRepository, type WalletBalance, type WalletTransaction } from '../db/index';
import { getSyncState, onSyncStateChange } from '../sync/SyncManager';
import { walletAPI } from '../api';

export interface UseWalletOfflineReturn {
  balance:        number | null;
  currency:       string;
  transactions:   WalletTransaction[];
  isLoading:      boolean;
  canTransact:    boolean;       // false cuando offline
  isStale:        boolean;       // true si los datos son >5 min
  lastUpdated:    number | null;
  refresh:        () => Promise<void>;
  loadMore:       () => Promise<void>;
  hasMore:        boolean;
}

const PAGE_SIZE   = 20;
const STALE_MS    = 5 * 60 * 1000; // 5 minutos

export function useWalletOffline(userId: string): UseWalletOfflineReturn {
  const [balance, setBalance]             = useState<number | null>(null);
  const [currency, setCurrency]           = useState('XAF');
  const [transactions, setTransactions]   = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [lastUpdated, setLastUpdated]     = useState<number | null>(null);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(true);
  const [isOnline, setIsOnline]           = useState(getSyncState().isOnline);

  // Seguir estado de conexión
  useEffect(() => {
    return onSyncStateChange(s => setIsOnline(s.isOnline));
  }, []);

  const canTransact = isOnline;
  const isStale = lastUpdated
    ? Date.now() - lastUpdated > STALE_MS
    : true;

  // ── Cargar caché local ────────────────────────────────────────

  const loadLocal = useCallback(async (p = 1) => {
    if (!userId) return;
    try {
      const [bal, txs] = await Promise.all([
        WalletRepository.getBalance(userId),
        WalletRepository.getTransactions(userId, p, PAGE_SIZE),
      ]);
      if (bal) {
        setBalance(bal.balance);
        setCurrency(bal.currency ?? 'XAF');
        setLastUpdated(bal.last_updated);
      }
      if (p === 1) {
        setTransactions(txs);
      } else {
        setTransactions(prev => {
          const existing = new Set(prev.map(t => t.id));
          return [...prev, ...txs.filter(t => !existing.has(t.id))];
        });
      }
      setHasMore(txs.length === PAGE_SIZE);
    } catch (err) {
      console.warn('[useWalletOffline] Error cargando local:', err);
    }
  }, [userId]);

  // ── Sincronizar con servidor ──────────────────────────────────

  const refresh = useCallback(async () => {
    if (!userId || !isOnline) return;
    setIsLoading(true);
    try {
      // Saldo
      const balRes = await walletAPI.getBalance();
      if (typeof balRes.balance === 'number') {
        await WalletRepository.saveBalance(userId, balRes.balance);
        setBalance(balRes.balance);
        setLastUpdated(Date.now());
      }
      // Transacciones
      const txRes = await walletAPI.getTransactions(1, PAGE_SIZE);
      if (Array.isArray(txRes.transactions)) {
        await WalletRepository.upsertBatch(
          txRes.transactions.map((t: any) => ({
            id:           t.id?.toString(),
            server_id:    t.id?.toString(),
            user_id:      userId,
            type:         t.type   ?? 'payment',
            amount:       t.amount ?? 0,
            balance_after: t.balance_after ?? null,
            description:  t.description ?? null,
            reference:    t.reference   ?? null,
            status:       t.status      ?? 'completed',
            method:       t.method      ?? null,
            destination:  t.destination ?? null,
            created_at:   new Date(t.created_at || t.date).getTime(),
            synced:       1,
          }))
        );
        setPage(1);
        await loadLocal(1);
      }
    } catch (err) {
      console.warn('[useWalletOffline] Error sync:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOnline, loadLocal]);

  // ── Paginación ────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const next = page + 1;
    setPage(next);
    await loadLocal(next);
  }, [hasMore, isLoading, page, loadLocal]);

  // ── Inicialización ────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    // Mostrar datos locales inmediatamente
    loadLocal(1);
    // Sincronizar si hay conexión
    if (isOnline) refresh();
    // Actualizar cuando llegan cambios del SyncManager
    const handler = () => loadLocal(1);
    window.addEventListener('egchat:wallet-updated', handler);
    return () => window.removeEventListener('egchat:wallet-updated', handler);
  }, [userId]);

  return {
    balance,
    currency,
    transactions,
    isLoading,
    canTransact,
    isStale,
    lastUpdated,
    refresh,
    loadMore,
    hasMore,
  };
}
