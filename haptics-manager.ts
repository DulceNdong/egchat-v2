/**
 * haptics-manager.ts
 * Vibración háptica nativa para EGCHAT.
 * Usa @capacitor/haptics — funciona en Android e iOS.
 * En web es un no-op silencioso.
 *
 * Uso:
 *   import { impactLight, notificationSuccess, hapticsEnabled } from './haptics-manager';
 *   impactLight();           // toque suave
 *   notificationSuccess();   // mensaje enviado
 *
 * El usuario puede desactivar los hápticos desde Ajustes:
 *   import { setHapticsEnabled } from './haptics-manager';
 *   setHapticsEnabled(false);
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// ── Clave de configuración en localStorage ────────────────────────────────────
const HAPTICS_KEY = 'egchat_haptics_enabled';

// ── Estado ────────────────────────────────────────────────────────────────────

/** true si el dispositivo soporta hápticos Y el usuario los tiene activados */
let _enabled: boolean = _loadEnabled();
let _supported: boolean | null = null; // null = no verificado aún

function _loadEnabled(): boolean {
  try {
    const stored = localStorage.getItem(HAPTICS_KEY);
    return stored === null ? true : stored === 'true'; // activado por defecto
  } catch {
    return true;
  }
}

// ── Detección de soporte ──────────────────────────────────────────────────────

/**
 * isHapticsSupported()
 * Detecta si el dispositivo soporta hápticos.
 * Cachea el resultado para no llamar al plugin en cada vibración.
 */
export async function isHapticsSupported(): Promise<boolean> {
  if (_supported !== null) return _supported;
  if (!Capacitor.isNativePlatform()) { _supported = false; return false; }

  try {
    // @capacitor/haptics no tiene método .supported() explícito
    // pero podemos intentar una vibración silenciosa para detectar soporte
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
    _supported = true;
  } catch {
    _supported = false;
  }
  return _supported;
}

// ── Configuración de usuario ──────────────────────────────────────────────────

/** Activa o desactiva los hápticos (persiste en localStorage) */
export function setHapticsEnabled(enabled: boolean): void {
  _enabled = enabled;
  try { localStorage.setItem(HAPTICS_KEY, String(enabled)); } catch {}
  console.log(`[Haptics] ${enabled ? 'Activados' : 'Desactivados'}`);
}

/** Devuelve si los hápticos están activados por el usuario */
export function hapticsEnabled(): boolean {
  return _enabled;
}

/** Alterna el estado de los hápticos */
export function toggleHaptics(): boolean {
  setHapticsEnabled(!_enabled);
  return _enabled;
}

// ── Guard interno ─────────────────────────────────────────────────────────────

function _canVibrate(): boolean {
  return _enabled && Capacitor.isNativePlatform();
}

// ── Funciones de impacto ──────────────────────────────────────────────────────

/**
 * impactLight()
 * Toque suave — para botones pequeños, navegación, selección de elementos.
 */
export async function impactLight(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

/**
 * impactMedium()
 * Toque normal — para enviar mensajes, confirmar acciones.
 */
export async function impactMedium(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
}

/**
 * impactHeavy()
 * Toque fuerte — para llamadas entrantes, acciones importantes.
 */
export async function impactHeavy(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
}

// ── Funciones de notificación ─────────────────────────────────────────────────

/**
 * notificationSuccess()
 * Vibración de éxito — mensaje enviado, acción completada.
 */
export async function notificationSuccess(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
}

/**
 * notificationWarning()
 * Vibración de advertencia — errores leves, límites alcanzados.
 */
export async function notificationWarning(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.notification({ type: NotificationType.Warning }); } catch {}
}

/**
 * notificationError()
 * Vibración de error — acción fallida, sin conexión.
 */
export async function notificationError(): Promise<void> {
  if (!_canVibrate()) return;
  try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
}

// ── Selección ─────────────────────────────────────────────────────────────────

/**
 * selectionChanged()
 * Vibración de selección — deslizar listas, cambiar tabs, scroll snap.
 */
export async function selectionChanged(): Promise<void> {
  if (!_canVibrate()) return;
  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch {}
}

// ── Patrones compuestos para EGCHAT ──────────────────────────────────────────

/**
 * hapticsOnSendMessage()
 * Al pulsar "Enviar" en el chat — vibración suave de confirmación.
 */
export async function hapticsOnSendMessage(): Promise<void> {
  await impactLight();
}

/**
 * hapticsOnLongPress()
 * Al mantener pulsado un mensaje — vibración media (menú contextual).
 */
export async function hapticsOnLongPress(): Promise<void> {
  await impactMedium();
}

/**
 * hapticsOnIncomingCall()
 * Al recibir una llamada entrante — vibración fuerte.
 */
export async function hapticsOnIncomingCall(): Promise<void> {
  await impactHeavy();
}

/**
 * hapticsOnSwipeDelete()
 * Al deslizar para eliminar un mensaje — vibración de selección.
 */
export async function hapticsOnSwipeDelete(): Promise<void> {
  await selectionChanged();
}

/**
 * hapticsOnMessageReceived()
 * Al recibir un mensaje nuevo — vibración de éxito suave.
 */
export async function hapticsOnMessageReceived(): Promise<void> {
  await notificationSuccess();
}

/**
 * hapticsOnError()
 * Al producirse un error (sin conexión, fallo de envío) — vibración de error.
 */
export async function hapticsOnError(): Promise<void> {
  await notificationError();
}

// ── Inicialización ────────────────────────────────────────────────────────────

/**
 * initHaptics()
 * Verifica soporte y carga la configuración del usuario.
 * Llamar una vez al arrancar la app.
 */
export async function initHaptics(): Promise<void> {
  _enabled = _loadEnabled();
  const supported = await isHapticsSupported();
  console.log(`[Haptics] Soporte: ${supported} | Activados: ${_enabled}`);
}
