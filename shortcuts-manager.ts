/**
 * shortcuts-manager.ts
 * App Shortcuts para EGCHAT — accesos directos al mantener pulsado el icono.
 */

import { Capacitor } from '@capacitor/core';

// Import dinámico para evitar error si el paquete no está instalado
let AppShortcuts: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppShortcuts = require('@capawesome/capacitor-app-shortcuts').AppShortcuts;
} catch {
  // Paquete no disponible
}

const SHORTCUTS = [
  { id: 'nuevo-chat', title: 'Nuevo chat', description: 'Iniciar una nueva conversación' },
  { id: 'contactos',  title: 'Mis contactos', description: 'Ver lista de contactos' },
  { id: 'llamada',    title: 'Llamada rápida', description: 'Iniciar una llamada' },
];

// ── Eventos personalizados que App.tsx puede escuchar ─────────────────────────

export const SHORTCUT_EVENTS = {
  'nuevo-chat': 'egchat-shortcut-nuevo-chat',
  'contactos':  'egchat-shortcut-contactos',
  'llamada':    'egchat-shortcut-llamada',
} as const;

// ── Crear shortcuts dinámicos ─────────────────────────────────────────────────

export async function setDynamicShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AppShortcuts) return;
  try {
    await AppShortcuts.setDynamicShortcuts({ shortcuts: SHORTCUTS.map(s => ({ id: s.id, title: s.title, description: s.description })) });
  } catch (error) {
    console.warn('[Shortcuts] Error al registrar shortcuts:', error);
  }
}

export async function clearDynamicShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AppShortcuts) return;
  try { await AppShortcuts.setDynamicShortcuts({ shortcuts: [] }); } catch {}
}

export async function initShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AppShortcuts) return;
  await setDynamicShortcuts();
  try {
    await AppShortcuts.addListener('shortcutUsed', (event: any) => {
      const eventName = SHORTCUT_EVENTS[event.id as keyof typeof SHORTCUT_EVENTS];
      if (eventName) window.dispatchEvent(new CustomEvent(eventName, { detail: { shortcutId: event.id } }));
    });
    const result = await AppShortcuts.getLaunchShortcut();
    if (result?.id) {
      setTimeout(() => {
        const eventName = SHORTCUT_EVENTS[result.id as keyof typeof SHORTCUT_EVENTS];
        if (eventName) window.dispatchEvent(new CustomEvent(eventName, { detail: { shortcutId: result.id } }));
      }, 1000);
    }
  } catch {}
}

export async function removeShortcutListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AppShortcuts) return;
  try { await AppShortcuts.removeAllListeners(); await clearDynamicShortcuts(); } catch {}
}
