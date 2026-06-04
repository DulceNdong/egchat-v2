/**
 * OTAUpdater.ts  —  FASE 10: Actualizaciones OTA con Capgo
 *
 * La app:
 *  1. Arranca desde archivos locales (sin red)
 *  2. Busca actualizaciones en background
 *  3. Descarga si hay algo nuevo
 *  4. Aplica en el próximo arranque (no interrumpe la sesión actual)
 *
 * Prerrequisito de producción:
 *   npm install @capgo/capacitor-updater
 *   npx @capgo/cli init
 *
 * Por ahora el módulo hace early-return si Capgo no está instalado,
 * para no romper la app durante el desarrollo.
 */

import { Capacitor } from '@capacitor/core';

let CapacitorUpdater: any = null;

// Importación dinámica — no falla si el plugin no está instalado
async function getUpdater(): Promise<any> {
  if (CapacitorUpdater) return CapacitorUpdater;
  try {
    // Usamos Function constructor para evitar que Rollup analice el import estáticamente
    const mod = await (new Function('s', 'return import(s)'))('@capgo/capacitor-updater');
    CapacitorUpdater = mod.CapacitorUpdater ?? mod.default?.CapacitorUpdater;
    return CapacitorUpdater;
  } catch {
    return null;
  }
}

// ── API Pública ───────────────────────────────────────────────────

export const OTAUpdater = {

  /**
   * Inicializar el sistema OTA.
   * Notifica a Capgo que la app arrancó correctamente
   * (evita rollback automático si el bundle anterior falló).
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const updater = await getUpdater();
    if (!updater) return;

    try {
      await updater.notifyAppReady();
      console.log('[OTA] App marcada como lista');
    } catch (err) {
      console.warn('[OTA] Error en notifyAppReady:', err);
    }
  },

  /**
   * Buscar y descargar actualizaciones en background.
   * No interrumpe la sesión del usuario — se aplica al reiniciar.
   */
  async checkAndDownload(): Promise<{ hasUpdate: boolean; version?: string }> {
    if (!Capacitor.isNativePlatform()) return { hasUpdate: false };
    const updater = await getUpdater();
    if (!updater) return { hasUpdate: false };

    try {
      const latest = await updater.getLatest();
      if (!latest?.url) return { hasUpdate: false };

      console.log('[OTA] Actualización disponible:', latest.version);

      // Descargar en background
      const bundle = await updater.download({
        url:     latest.url,
        version: latest.version,
      });

      // Programar para aplicar en el próximo arranque
      await updater.next(bundle);

      console.log('[OTA] Bundle descargado y programado:', latest.version);
      return { hasUpdate: true, version: latest.version };
    } catch (err: any) {
      // No lanzar error — las OTA no deben bloquear la app
      if (!err.message?.includes('no update')) {
        console.warn('[OTA] Error buscando actualización:', err.message);
      }
      return { hasUpdate: false };
    }
  },

  /**
   * Aplicar actualización inmediatamente (para actualizaciones críticas).
   * Reinicia la app.
   */
  async applyNow(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const updater = await getUpdater();
    if (!updater) return;
    try {
      await updater.reload();
    } catch (err) {
      console.warn('[OTA] Error aplicando actualización:', err);
    }
  },
};
