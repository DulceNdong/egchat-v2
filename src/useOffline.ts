/**
 * useOffline.ts
 * Hook React que expone el estado del sistema offline.
 *
 * Uso:
 *   const { isOnline, pendingCount, isSyncing, retrySync } = useOffline();
 */

import { useState, useEffect, useCallback } from 'react';
import { onSyncStateChange, getSyncState, retrySync as retrySyncFn, type SyncState } from './sync-manager';

export interface UseOfflineReturn {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  lastSyncAt:   number | null;
  error:        string | null;
  retrySync:    () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    // Suscribirse a cambios del sync manager
    const unsubscribe = onSyncStateChange(setSyncState);
    // Sincronizar estado inicial
    setSyncState(getSyncState());
    return unsubscribe;
  }, []);

  const retrySync = useCallback(async () => {
    await retrySyncFn();
  }, []);

  return {
    isOnline:     syncState.isOnline,
    isSyncing:    syncState.isSyncing,
    pendingCount: syncState.pendingCount,
    lastSyncAt:   syncState.lastSyncAt,
    error:        syncState.error,
    retrySync,
  };
}
