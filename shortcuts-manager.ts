/**
 * shortcuts-manager.ts
 * App Shortcuts para EGCHAT — accesos directos al mantener pulsado el icono.
 *
 * Android: shortcuts dinámicos (API 25+) — funcionan automáticamente
 * iOS:     shortcuts estáticos via UIApplicationShortcutItems en Info.plist
 *
 * Shortcuts disponibles:
 *   nuevo-chat   → abre nueva conversación
 *   contactos    → abre lista de contactos
 *   llamada      → abre marcador / llamada rápida
 *
 * Uso:
 *   import { initShortcuts, removeShortcutListeners } from './shortcuts-manager';
 *   await initShortcuts(); // llamar tras login
 */

import { AppShortcuts } from '@capawesome/capacitor-app-shortcuts';
import { Capacitor } from '@capacitor/core';

// ── Definición de shortcuts ───────────────────────────────────────────────────

const SHORTCUTS = [
  {
    id:          'nuevo-chat',
    title:       'Nuevo chat',
    description: 'Iniciar una nueva conversación',
    // Android usa iconos del sistema — se puede personalizar con drawable
    icon:        { type: 'system', name: 'ic_menu_add' },
  },
  {
    id:          'contactos',
    title:       'Mis contactos',
    description: 'Ver lista de contactos',
    icon:        { type: 'system', name: 'ic_menu_myplaces' },
  },
  {
    id:          'llamada',
    title:       'Llamada rápida',
    description: 'Iniciar una llamada',
    icon:        { type: 'system', name: 'ic_menu_call' },
  },
];

// ── Eventos personalizados que App.tsx puede escuchar ─────────────────────────

export const SHORTCUT_EVENTS = {
  'nuevo-chat': 'egchat-shortcut-nuevo-chat',
  'contactos':  'egchat-shortcut-contactos',
  'llamada':    'egchat-shortcut-llamada',
} as const;

// ── Crear shortcuts dinámicos ─────────────────────────────────────────────────

/**
 * setDynamicShortcuts()
 * Registra los 3 shortcuts en Android.
 * En iOS los shortcuts estáticos se configuran en Info.plist (ver abajo).
 */
export async function setDynamicShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AppShortcuts.setDynamicShortcuts({
      shortcuts: SHORTCUTS.map(s => ({
        id:          s.id,
        title:       s.title,
        description: s.description,
      })),
    });
    console.log('[Shortcuts] Shortcuts dinámicos registrados:', SHORTCUTS.map(s => s.id));
  } catch (error) {
    console.warn('[Shortcuts] Error al registrar shortcuts:', error);
  }
}

/**
 * clearDynamicShortcuts()
 * Elimina todos los shortcuts dinámicos (al hacer logout).
 */
export async function clearDynamicShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AppShortcuts.setDynamicShortcuts({ shortcuts: [] });
    console.log('[Shortcuts] Shortcuts eliminados.');
  } catch {}
}

// ── Listener de shortcuts ─────────────────────────────────────────────────────

/**
 * initShortcuts()
 * Inicializa los shortcuts y escucha cuando el usuario toca uno.
 * Llamar una vez tras el login del usuario.
 *
 * Flujo:
 *   Usuario mantiene pulsado el icono → toca "Nuevo chat"
 *   → AppShortcuts dispara 'shortcutUsed'
 *   → initShortcuts() captura el evento
 *   → dispara 'egchat-shortcut-nuevo-chat'
 *   → App.tsx navega a la pantalla correcta
 */
export async function initShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // 1. Registrar los shortcuts
  await setDynamicShortcuts();

  // 2. Escuchar cuando el usuario toca un shortcut
  await AppShortcuts.addListener('shortcutUsed', (event) => {
    const shortcutId = event.id;
    console.log('[Shortcuts] Shortcut usado:', shortcutId);

    // Disparar evento personalizado para que App.tsx navegue
    const eventName = SHORTCUT_EVENTS[shortcutId as keyof typeof SHORTCUT_EVENTS];
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { shortcutId } }));
    } else {
      console.warn('[Shortcuts] Shortcut desconocido:', shortcutId);
    }
  });

  // 3. Verificar si la app fue lanzada desde un shortcut
  try {
    const result = await AppShortcuts.getLaunchShortcut();
    if (result?.id) {
      console.log('[Shortcuts] App lanzada desde shortcut:', result.id);
      // Pequeño delay para que App.tsx esté montado
      setTimeout(() => {
        const eventName = SHORTCUT_EVENTS[result.id as keyof typeof SHORTCUT_EVENTS];
        if (eventName) {
          window.dispatchEvent(new CustomEvent(eventName, { detail: { shortcutId: result.id } }));
        }
      }, 1_000);
    }
  } catch {
    // getLaunchShortcut puede no estar disponible en todas las versiones
  }

  console.log('[Shortcuts] Inicializado.');
}

/**
 * removeShortcutListeners()
 * Elimina los listeners y shortcuts. Llamar al hacer logout.
 */
export async function removeShortcutListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AppShortcuts.removeAllListeners();
    await clearDynamicShortcuts();
  } catch {}
}
