/**
 * useSync.ts
 * Hook React para consumir el estado del SyncManager.
 * Drop-in replacement del anterior useOffline.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onSyncStateChange,
  getSyncState,
  forceSync,
  type SyncState,
} from './SyncManager';

export interface UseSyncReturn {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  lastSyncAt:   number | null;
  error:        string | null;
  forceSync:    () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>(getSyncState);

  useEffect(() => {
    return onSyncStateChange(setSyncState);
  }, []);

  const handleForceSync = useCallback(() => forceSync(), []);

  return {
    isOnline:     syncState.isOnline,
    isSyncing:    syncState.isSyncing,
    pendingCount: syncState.pendingCount,
    lastSyncAt:   syncState.lastSyncAt,
    error:        syncState.error,
    forceSync:    handleForceSync,
  };
}

// Alias para compatibilidad con imports existentes
export { useSync as useOffline };
