/**
 * splash-screen.ts
 * Control manual de la Splash Screen nativa de EGCHAT.
 * Usa @capacitor/splash-screen con launchAutoHide: false para
 * ocultar la splash SOLO cuando la web esté completamente cargada.
 *
 * Uso:
 *   import { hideSplashWhenReady, showSplashForLoading } from './splash-screen';
 *
 *   // En main.tsx — ocultar cuando React esté montado y la app lista
 *   hideSplashWhenReady();
 *
 *   // Durante carga de recursos pesados (opcional)
 *   await showSplashForLoading('Cargando datos...');
 */

import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

// ── Constantes ────────────────────────────────────────────────────────────────

// Tiempo máximo de espera antes de ocultar la splash por seguridad
const MAX_WAIT_MS = 8_000;

// Tiempo mínimo que se muestra la splash (evita parpadeo en carga rápida)
const MIN_SHOW_MS = 1_200;

// ── Estado ────────────────────────────────────────────────────────────────────

let splashHidden  = false;
let showTimestamp = Date.now();

// ── Funciones principales ─────────────────────────────────────────────────────

/**
 * hideSplashWhenReady()
 * Oculta la splash screen cuando la app web está completamente cargada.
 * Respeta el tiempo mínimo de visualización para evitar parpadeo.
 *
 * Llamar desde main.tsx DESPUÉS de que ReactDOM.createRoot().render() haya
 * completado y la app esté lista para el usuario.
 */
export async function hideSplashWhenReady(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // no aplica en web
  if (splashHidden) return;

  const elapsed = Date.now() - showTimestamp;
  const remaining = Math.max(0, MIN_SHOW_MS - elapsed);

  // Esperar el tiempo mínimo si la carga fue muy rápida
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 400 });
    splashHidden = true;
    console.log('[SplashScreen] Ocultada correctamente.');
  } catch (error) {
    console.warn('[SplashScreen] Error al ocultar:', error);
    // Intentar de nuevo una vez
    try {
      await SplashScreen.hide();
      splashHidden = true;
    } catch (e2) {
      console.error('[SplashScreen] No se pudo ocultar:', e2);
    }
  }
}

/**
 * showSplashForLoading()
 * Muestra la splash durante la carga de recursos pesados.
 * Útil para: carga inicial de datos, actualizaciones OTA, etc.
 *
 * @param autoHideAfterMs — ocultar automáticamente después de X ms (0 = manual)
 */
export async function showSplashForLoading(autoHideAfterMs = 0): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    splashHidden  = false;
    showTimestamp = Date.now();

    await SplashScreen.show({
      showDuration:    autoHideAfterMs || 0,
      autoHide:        autoHideAfterMs > 0,
      fadeInDuration:  200,
      fadeOutDuration: 400,
    });

    console.log('[SplashScreen] Mostrada para carga de recursos.');
  } catch (error) {
    console.warn('[SplashScreen] Error al mostrar:', error);
  }
}

/**
 * hideSplash()
 * Oculta la splash inmediatamente (sin tiempo mínimo).
 * Usar cuando se necesita control total.
 */
export async function hideSplash(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (splashHidden) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
    splashHidden = true;
  } catch (error) {
    console.warn('[SplashScreen] Error al ocultar:', error);
  }
}

/**
 * setupSplashSafetyTimeout()
 * Configura un timeout de seguridad para ocultar la splash
 * si algo falla durante la carga (evita que la app quede bloqueada).
 * Llamar al inicio de main.tsx.
 */
export function setupSplashSafetyTimeout(): void {
  if (!Capacitor.isNativePlatform()) return;

  showTimestamp = Date.now();

  setTimeout(async () => {
    if (!splashHidden) {
      console.warn('[SplashScreen] Timeout de seguridad — ocultando splash.');
      await hideSplash();
    }
  }, MAX_WAIT_MS);
}
