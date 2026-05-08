/**
 * badge-manager.ts
 * Gestión del badge (contador) en el icono de la app EGCHAT.
 * Usa @capawesome/capacitor-badge — funciona en Android e iOS.
 *
 * Android: requiere que el launcher soporte badges (Samsung, Xiaomi, etc.)
 *          y que las notificaciones estén habilitadas.
 * iOS:     requiere permiso de notificaciones (ya solicitado por push-notifications).
 *
 * Uso:
 *   import { setBadge, increaseBadge, clearBadge } from './badge-manager';
 *   increaseBadge();   // nuevo mensaje
 *   clearBadge();      // leer todos
 */

import { Badge } from '@capawesome/capacitor-badge';
import { Capacitor } from '@capacitor/core';

// ── Clave de estado local ─────────────────────────────────────────────────────
const BADGE_KEY = 'egchat_badge_count';

// ── Guard ─────────────────────────────────────────────────────────────────────

function canUseBadge(): boolean {
  return Capacitor.isNativePlatform();
}

// ── Funciones principales ─────────────────────────────────────────────────────

/**
 * setBadge(count)
 * Establece el número exacto en el icono.
 * count = 0 elimina el badge.
 */
export async function setBadge(count: number): Promise<void> {
  const n = Math.max(0, Math.round(count));
  // Guardar en localStorage para sincronización
  try { localStorage.setItem(BADGE_KEY, String(n)); } catch {}

  if (!canUseBadge()) return;
  try {
    if (n === 0) {
      await Badge.clear();
    } else {
      await Badge.set({ count: n });
    }
  } catch (e) {
    console.warn('[Badge] Error al establecer badge:', e);
  }
}

/**
 * getBadge()
 * Obtiene el número actual del badge.
 * Usa localStorage como fuente de verdad (más rápido que llamar al plugin).
 */
export async function getBadge(): Promise<number> {
  // Intentar leer del plugin primero
  if (canUseBadge()) {
    try {
      const result = await Badge.get();
      const count = result?.count ?? 0;
      try { localStorage.setItem(BADGE_KEY, String(count)); } catch {}
      return count;
    } catch {}
  }
  // Fallback: localStorage
  try {
    return parseInt(localStorage.getItem(BADGE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * increaseBadge()
 * Incrementa el badge en 1 — llamar al recibir un mensaje nuevo.
 */
export async function increaseBadge(): Promise<void> {
  const current = await getBadge();
  await setBadge(current + 1);
}

/**
 * decreaseBadge()
 * Decrementa el badge en 1 — llamar al leer un mensaje.
 * Nunca baja de 0.
 */
export async function decreaseBadge(): Promise<void> {
  const current = await getBadge();
  await setBadge(Math.max(0, current - 1));
}

/**
 * clearBadge()
 * Elimina el badge completamente — llamar al marcar todo como leído.
 */
export async function clearBadge(): Promise<void> {
  await setBadge(0);
}

/**
 * syncBadgeWithUnread(unreadCount)
 * Sincroniza el badge con el número real de mensajes no leídos.
 * Llamar cuando se cargan los chats desde el servidor.
 */
export async function syncBadgeWithUnread(unreadCount: number): Promise<void> {
  await setBadge(unreadCount);
}

/**
 * isSupported()
 * Verifica si el dispositivo soporta badges.
 */
export async function isBadgeSupported(): Promise<boolean> {
  if (!canUseBadge()) return false;
  try {
    const result = await Badge.isSupported();
    return result?.isSupported ?? false;
  } catch {
    return false;
  }
}

/**
 * requestBadgePermission()
 * Solicita permiso para mostrar badges (necesario en iOS).
 * En Android no es necesario.
 */
export async function requestBadgePermission(): Promise<boolean> {
  if (!canUseBadge()) return false;
  try {
    const result = await Badge.requestPermissions();
    return result?.display === 'granted';
  } catch {
    return false;
  }
}
