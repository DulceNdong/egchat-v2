// useStoryRings.ts
// Carga los estados activos del servidor y devuelve dos Sets:
//   - activeUserIds  → user_ids que tienen al menos 1 estado vigente (no expirado)
//   - seenUserIds    → de esos, los que el usuario actual ya vio
//
// Se puede llamar desde cualquier pantalla que muestre avatares.
// El resultado se refresca cada REFRESH_MS o cuando se llama a refresh() manualmente.

import { useState, useEffect, useCallback, useRef } from 'react';
import { storiesAPI, authAPI } from '../api';
import { parseStoriesResponse } from '../utils/storyParser';

const REFRESH_MS = 60_000; // refresco automático cada 60 s

export interface StoryRingsState {
  /** user_ids que tienen estado activo no visto */
  activeUserIds: Set<string>;
  /** user_ids cuyo estado ya fue visto por el usuario actual */
  seenUserIds: Set<string>;
  /** true mientras se está cargando la primera vez */
  loading: boolean;
  /** fuerza un refresco inmediato */
  refresh: () => void;
}

export function useStoryRings(): StoryRingsState {
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());
  const [seenUserIds, setSeenUserIds]     = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [storiesResult, meResult] = await Promise.allSettled([
        storiesAPI.getAll(),
        authAPI.me(),
      ]);

      const meId =
        meResult.status === 'fulfilled' ? meResult.value?.id || '' : '';

      if (storiesResult.status !== 'fulfilled') return;

      const { groups, myGroup } = parseStoriesResponse(
        storiesResult.value,
        meId,
      );

      // Todos los grupos excepto el propio usuario
      const active = new Set<string>();
      const seen   = new Set<string>();

      groups.forEach(g => {
        if (g.stories.length === 0) return;
        active.add(g.userId);
        if (g.seen) seen.add(g.userId);
      });

      // También incluir el grupo propio si existe (por si se muestra en chats)
      if (myGroup && myGroup.stories.length > 0) {
        active.add(myGroup.userId);
        if (myGroup.seen) seen.add(myGroup.userId);
      }

      setActiveUserIds(active);
      setSeenUserIds(seen);
    } catch {
      // Fallo silencioso — simplemente no se muestran anillos
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + polling cada REFRESH_MS
  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  return { activeUserIds, seenUserIds, loading, refresh: load };
}
