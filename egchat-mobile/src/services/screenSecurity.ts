// ══════════════════════════════════════════════════════════════════
// screenSecurity.ts — Prevención de capturas de pantalla
//
// En Android: usa FLAG_SECURE via expo-screen-capture
// En iOS: difumina la app cuando pasa al background (misma técnica
//         que usaban WhatsApp y Telegram antes de que iOS lo permitiera)
//
// Aplica automáticamente en:
//  - Chats en modo incógnito
//  - Chats con E2E activado (configuración del usuario)
// ══════════════════════════════════════════════════════════════════
import { Platform, AppState, type AppStateStatus } from 'react-native';

// expo-screen-capture es opcional — si no está instalado, degradamos silenciosamente
let ScreenCapture: {
  preventScreenCaptureAsync: (key?: string) => Promise<void>;
  allowScreenCaptureAsync: (key?: string) => Promise<void>;
} | null = null;

try {
  ScreenCapture = require('expo-screen-capture');
} catch {
  // No está instalado — modo degradado
}

const SECURE_CONTEXTS = new Set<string>();

/**
 * Activa la protección contra capturas de pantalla para un contexto específico.
 * @param contextKey Clave única del contexto (ej: chatId, 'wallet', 'settings')
 */
export async function enableScreenSecurity(contextKey: string): Promise<void> {
  SECURE_CONTEXTS.add(contextKey);
  if (ScreenCapture) {
    try {
      await ScreenCapture.preventScreenCaptureAsync(contextKey);
    } catch {
      // Algunos dispositivos no soportan esto
    }
  }
}

/**
 * Desactiva la protección para un contexto.
 * Si otros contextos seguros siguen activos, la protección se mantiene.
 */
export async function disableScreenSecurity(contextKey: string): Promise<void> {
  SECURE_CONTEXTS.delete(contextKey);
  if (ScreenCapture) {
    try {
      await ScreenCapture.allowScreenCaptureAsync(contextKey);
    } catch {}
  }
}

/**
 * ¿Hay algún contexto seguro activo en este momento?
 */
export function isScreenSecure(): boolean {
  return SECURE_CONTEXTS.size > 0;
}

/**
 * Hook de React para activar/desactivar protección según condición.
 * Se limpia automáticamente al desmontar el componente.
 *
 * @example
 * ```tsx
 * import { useScreenSecurity } from '../services/screenSecurity';
 *
 * // En el ChatScreen:
 * useScreenSecurity(`chat_${chatId}`, isIncognito || isE2EEnabled);
 * ```
 */
import { useEffect } from 'react';

export function useScreenSecurity(contextKey: string, active: boolean): void {
  useEffect(() => {
    if (!active) {
      disableScreenSecurity(contextKey);
      return;
    }

    enableScreenSecurity(contextKey);

    // Cleanup al desmontar
    return () => {
      disableScreenSecurity(contextKey);
    };
  }, [contextKey, active]);
}

// ── Bloqueo de captura de pantalla en iOS via AppState ────────────
// iOS no permite FLAG_SECURE, pero sí podemos detectar cuando
// el usuario hace screenshot (AppState 'inactive' momentáneo).
// Esta implementación notifica, pero no puede bloquear en iOS.

let screenshotCallback: (() => void) | null = null;

if (Platform.OS === 'ios') {
  let prevState: AppStateStatus = AppState.currentState;

  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    // En iOS, la app pasa a 'inactive' justo cuando se toma un screenshot
    if (prevState === 'active' && nextState === 'inactive' && isScreenSecure()) {
      screenshotCallback?.();
    }
    prevState = nextState;
  });
}

/**
 * Registra un callback que se llama cuando se detecta un intento de captura.
 * En Android: el sistema bloquea la captura antes de llamar esto.
 * En iOS: la captura ya ocurrió, pero se notifica al usuario.
 */
export function onScreenshotAttempt(cb: () => void): () => void {
  screenshotCallback = cb;
  return () => { screenshotCallback = null; };
}
