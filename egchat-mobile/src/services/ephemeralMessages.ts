// ══════════════════════════════════════════════════════════════════
// Ephemeral Messages — autodestrucción y "ver una vez" (View Once)
// Almacena tiempos de expiración localmente y los aplica en el chat
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';

const KEY = 'egchat_ephemeral_settings';
const ONCE_KEY = 'egchat_view_once_ids';

// Duraciones disponibles (en segundos, 0 = desactivado)
export const EPHEMERAL_DURATIONS = [
  { label: 'Desactivado', value: 0 },
  { label: '30 segundos', value: 30 },
  { label: '1 minuto', value: 60 },
  { label: '5 minutos', value: 300 },
  { label: '1 hora', value: 3600 },
  { label: '24 horas', value: 86400 },
  { label: '7 días', value: 604800 },
  { label: '90 días', value: 7776000 },
] as const;

export type EphemeralDuration = typeof EPHEMERAL_DURATIONS[number]['value'];

interface EphemeralSettings {
  [chatId: string]: EphemeralDuration;
}

/** Obtiene la duración efímera configurada para un chat */
export async function getEphemeralDuration(chatId: string): Promise<EphemeralDuration> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 0;
    const settings: EphemeralSettings = JSON.parse(raw);
    return settings[chatId] ?? 0;
  } catch {
    return 0;
  }
}

/** Guarda la duración efímera para un chat */
export async function setEphemeralDuration(chatId: string, duration: EphemeralDuration): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const settings: EphemeralSettings = raw ? JSON.parse(raw) : {};
    settings[chatId] = duration;
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
    // Sincronizar con backend si hay API disponible
    try {
      const BASE = getApiBase();
      const token = await getToken();
      await fetch(`${BASE}/api/chats/${chatId}/ephemeral`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_seconds: duration }),
      });
    } catch { /* silencioso — el ajuste local es suficiente */ }
  } catch {}
}

// ── View Once ──────────────────────────────────────────────────────

/** Marca un mensaje como "ver una vez" — devuelve true si ya fue visto (bloqueado) */
export async function checkAndMarkViewOnce(messageId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONCE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (ids.includes(messageId)) return true; // ya visto
    await AsyncStorage.setItem(ONCE_KEY, JSON.stringify([...ids, messageId]));
    return false; // primera y única vez
  } catch {
    return false;
  }
}

/** Verifica si un mensaje ya fue visto (sin marcarlo) */
export async function isViewOnceViewed(messageId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONCE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(messageId);
  } catch {
    return false;
  }
}

// ── Expiración de mensajes ─────────────────────────────────────────

/** Dado un array de mensajes y la duración del chat, filtra los expirados */
export function filterExpiredMessages<T extends { id: string; created_at: string; type?: string }>(
  messages: T[],
  durationSeconds: EphemeralDuration
): T[] {
  if (!durationSeconds) return messages;
  const now = Date.now();
  return messages.filter(m => {
    const created = new Date(m.created_at).getTime();
    return now - created < durationSeconds * 1000;
  });
}

/** Calcula cuántos ms faltan para que expire un mensaje */
export function msUntilExpiry(createdAt: string, durationSeconds: EphemeralDuration): number {
  if (!durationSeconds) return Infinity;
  const created = new Date(createdAt).getTime();
  const expiry = created + durationSeconds * 1000;
  return Math.max(0, expiry - Date.now());
}

/** Formatea el tiempo restante en un string legible */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expirado';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
