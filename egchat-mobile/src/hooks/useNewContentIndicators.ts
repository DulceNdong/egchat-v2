// ══════════════════════════════════════════════════════════════════
// useNewContentIndicators
// Devuelve qué userId tiene contenido nuevo no visto:
//   'story'  → estado nuevo
//   'moment' → moment nuevo
//   'live'   → transmisión en vivo activa
// Se actualiza cada 30s y via Supabase Realtime
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';
import { supabase } from '../supabase';

export type ContentType = 'story' | 'moment' | 'live';

export interface NewContentMap {
  [userId: string]: ContentType[];  // e.g. { 'abc': ['story', 'moment'] }
}

const SEEN_STORIES_KEY  = 'egchat_seen_stories_v1';
const SEEN_MOMENTS_KEY  = 'egchat_seen_moments_v1';
const POLL_INTERVAL_MS  = 30_000;

// Lee los IDs ya vistos de AsyncStorage
async function readSeen(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

// Guarda los IDs vistos
async function writeSeen(key: string, ids: Set<string>) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify([...ids].slice(-500)));
  } catch {}
}

export function useNewContentIndicators(currentUserId: string) {
  const [indicators, setIndicators] = useState<NewContentMap>({});
  const channelRef  = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchIndicators = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const BASE  = getApiBase();
      const token = await getToken();

      // Traer stories recientes de contactos (últimas 24h)
      const [storiesRes, momentsRes, livesRes] = await Promise.allSettled([
        fetch(`${BASE}/api/stories/contacts-new`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/moments/contacts-new`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/live/active`,           { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const seenStories = await readSeen(SEEN_STORIES_KEY);
      const seenMoments = await readSeen(SEEN_MOMENTS_KEY);

      const map: NewContentMap = {};

      const addIndicator = (userId: string, type: ContentType) => {
        if (!map[userId]) map[userId] = [];
        if (!map[userId].includes(type)) map[userId].push(type);
      };

      // Stories nuevas
      if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) {
        const stories: Array<{ user_id: string; id: string }> = await storiesRes.value.json();
        for (const s of stories) {
          if (s.user_id !== currentUserId && !seenStories.has(s.id)) {
            addIndicator(s.user_id, 'story');
          }
        }
      }

      // Moments nuevos (últimas 24h)
      if (momentsRes.status === 'fulfilled' && momentsRes.value.ok) {
        const moments: Array<{ user_id: string; id: string }> = await momentsRes.value.json();
        for (const m of moments) {
          if (m.user_id !== currentUserId && !seenMoments.has(m.id)) {
            addIndicator(m.user_id, 'moment');
          }
        }
      }

      // Lives activos
      if (livesRes.status === 'fulfilled' && livesRes.value.ok) {
        const lives: Array<{ host_id: string; live_id: string }> = await livesRes.value.json();
        for (const l of lives) {
          if (l.host_id !== currentUserId) {
            addIndicator(l.host_id, 'live');
          }
        }
      }

      setIndicators(map);
    } catch {
      // Silencioso — si falla no rompe la UI
    }
  }, [currentUserId]);

  // Marcar como visto (llamar cuando el usuario abre stories/moments de ese contacto)
  const markSeen = useCallback(async (userId: string, type: ContentType, ids: string[]) => {
    const key = type === 'story' ? SEEN_STORIES_KEY : SEEN_MOMENTS_KEY;
    const seen = await readSeen(key);
    for (const id of ids) seen.add(id);
    await writeSeen(key, seen);
    setIndicators(prev => {
      const next = { ...prev };
      if (next[userId]) {
        next[userId] = next[userId].filter(t => t !== type);
        if (next[userId].length === 0) delete next[userId];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Fetch inicial
    fetchIndicators();

    // Polling cada 30s
    intervalRef.current = setInterval(fetchIndicators, POLL_INTERVAL_MS);

    // Supabase Realtime — escuchar nuevas stories/moments/lives en tiempo real
    // Timestamp en el nombre del canal para evitar reusar uno ya suscrito si el
    // componente se monta dos veces (StrictMode / remount)
    const channel = supabase
      .channel(`new-content-${currentUserId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
        fetchIndicators();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, () => {
        fetchIndicators();
      })
      .on('broadcast', { event: 'live_started' }, () => {
        fetchIndicators();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current).catch(() => {});
    };
  }, [currentUserId, fetchIndicators]);

  return { indicators, markSeen, refresh: fetchIndicators };
}
