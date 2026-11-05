// ══════════════════════════════════════════════════════════════════
// messageReactions — reacciones guardadas en BD, no como mensajes
// Endpoint: POST /api/messages/:id/reactions
//           DELETE /api/messages/:id/reactions/:emoji
//           GET    /api/messages/:id/reactions
// ══════════════════════════════════════════════════════════════════
import { getToken, getApiBase } from '../api';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];      // user_ids que reaccionaron
  reactedByMe: boolean;
}

export type ReactionsMap = Record<string, Reaction>; // emoji → Reaction

/** Añade o quita una reacción (toggle) */
export async function toggleReaction(
  messageId: string,
  emoji: string,
  currentUserId: string,
): Promise<boolean> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.added ?? true;
    }
    return true; // fallback optimista
  } catch {
    return true;
  }
}

/** Obtiene todas las reacciones de un mensaje */
export async function getMessageReactions(messageId: string, currentUserId: string): Promise<ReactionsMap> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/messages/${messageId}/reactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: Array<{ emoji: string; user_id: string }> = await res.json();
      const map: ReactionsMap = {};
      data.forEach(r => {
        if (!map[r.emoji]) {
          map[r.emoji] = { emoji: r.emoji, count: 0, users: [], reactedByMe: false };
        }
        map[r.emoji].count++;
        map[r.emoji].users.push(r.user_id);
        if (r.user_id === currentUserId) map[r.emoji].reactedByMe = true;
      });
      return map;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Aplica una reacción optimísticamente en el mapa local.
 * Si ya existe, la quita; si no, la añade.
 */
export function applyReactionOptimistic(
  map: ReactionsMap,
  emoji: string,
  currentUserId: string,
): ReactionsMap {
  const existing = map[emoji];
  if (existing?.reactedByMe) {
    // Quitar
    const updated = { ...existing, count: existing.count - 1, reactedByMe: false, users: existing.users.filter(u => u !== currentUserId) };
    if (updated.count <= 0) {
      const { [emoji]: _, ...rest } = map;
      return rest;
    }
    return { ...map, [emoji]: updated };
  }
  // Añadir
  return {
    ...map,
    [emoji]: {
      emoji,
      count: (existing?.count ?? 0) + 1,
      users: [...(existing?.users ?? []), currentUserId],
      reactedByMe: true,
    },
  };
}
