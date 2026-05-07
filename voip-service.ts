/**
 * voip-service.ts
 * Wrapper TypeScript para VoipServicePlugin de Capacitor.
 * Controla el Foreground Service que mantiene la app viva en segundo plano.
 *
 * Uso:
 *   import { startVoipService, stopVoipService } from './voip-service';
 *
 *   // Al iniciar/recibir una llamada:
 *   await startVoipService('En llamada con Juan García');
 *
 *   // Al colgar:
 *   await stopVoipService();
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

// ── Interfaz del plugin nativo ────────────────────────────────────────────────

interface VoipServicePluginInterface {
  startForegroundService(options: { title?: string; text?: string }): Promise<{ started: boolean }>;
  stopForegroundService(): Promise<{ stopped: boolean }>;
  isRunning(): Promise<{ running: boolean }>;
}

const NativeVoipService = registerPlugin<VoipServicePluginInterface>('VoipServicePlugin');

// ── Funciones exportadas ──────────────────────────────────────────────────────

/**
 * startVoipService()
 * Inicia el Foreground Service con notificación persistente.
 * Android no puede matar la app mientras esté activo.
 *
 * @param statusText - Texto de la notificación (ej: "En llamada con Juan")
 * @param title      - Título de la notificación (por defecto "EGCHAT")
 */
export async function startVoipService(
  statusText = 'App activa para llamadas',
  title = 'EGCHAT'
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeVoipService.startForegroundService({ title, text: statusText });
    console.log('[VoipService] Foreground service iniciado.');
  } catch (e) {
    console.warn('[VoipService] Error al iniciar:', e);
  }
}

/**
 * stopVoipService()
 * Detiene el Foreground Service y elimina la notificación persistente.
 * Llamar al colgar la llamada o al hacer logout.
 */
export async function stopVoipService(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeVoipService.stopForegroundService();
    console.log('[VoipService] Foreground service detenido.');
  } catch (e) {
    console.warn('[VoipService] Error al detener:', e);
  }
}

/**
 * isVoipServiceRunning()
 * Comprueba si el servicio está activo.
 */
export async function isVoipServiceRunning(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { running } = await NativeVoipService.isRunning();
    return running;
  } catch {
    return false;
  }
}
