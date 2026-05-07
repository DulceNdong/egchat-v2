/**
 * useOffline.ts
 * ─────────────────────────────────────────────────────────────────
 * Hook React que expone el estado de conectividad y los métodos
 * del sistema offline a cualquier componente.
 *
 * Uso:
 *   const { isOnline, pendingCount, retrySync } = useOffline();
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { getPendingMessages } from './offline-db';
import { syncPendingMessages, onSyncEvent } from './sync-manager';

export interface UseOfflineReturn {
  /** true si hay conexión a internet */
  isOnline: boolean;
  /** número de mensajes pendientes de sincronizar */
  pendingCount: number;
  /** true mientras se está sincronizando */
  isSyncing: boolean;
  /** fuerza una sincronización manual */
  retrySync: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Actualizar contador de pendientes
  const refreshPendingCount = useCallback(async () => {
    const pending = await getPendingMessages();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    // Listeners de conectividad
    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listeners de sync-manager
    const unsubStart = onSyncEvent('sync-start', () => setIsSyncing(true));
    const unsubEnd = onSyncEvent('sync-end', () => {
      setIsSyncing(false);
      refreshPendingCount();
    });
    const unsubSynced = onSyncEvent('message-synced', refreshPendingCount);

    // Carga inicial
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubStart();
      unsubEnd();
      unsubSynced();
    };
  }, [refreshPendingCount]);

  const retrySync = useCallback(async () => {
    if (!isOnline) return;
    await syncPendingMessages();
    await refreshPendingCount();
  }, [isOnline, refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, retrySync };
}
