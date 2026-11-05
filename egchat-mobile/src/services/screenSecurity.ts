// ══════════════════════════════════════════════════════════════════
// screenSecurity.ts — Prevención de capturas de pantalla
//
// En Android: usa FLAG_SECURE via expo-screen-capture
// En iOS: overlay blur cuando la app pasa a background/screenshot
//         (misma técnica que WhatsApp y Telegram)
// ══════════════════════════════════════════════════════════════════
import { Platform, AppState, type AppStateStatus } from 'react-native';

// expo-screen-capture es opcional — degradamos silenciosamente si no está
let ScreenCapture: {
  preventScreenCaptureAsync: (key?: string) => Promise<void>;
  allowScreenCaptureAsync: (key?: string) => Promise<void>;
} | null = null;

try {
  ScreenCapture = require('expo-screen-capture');
} catch {
  // No instalado — modo degradado
}

const SECURE_CONTEXTS = new Set<string>();

export async function enableScreenSecurity(contextKey: string): Promise<void> {
  SECURE_CONTEXTS.add(contextKey);
  if (ScreenCapture) {
    try { await ScreenCapture.preventScreenCaptureAsync(contextKey); } catch {}
  }
}

export async function disableScreenSecurity(contextKey: string): Promise<void> {
  SECURE_CONTEXTS.delete(contextKey);
  if (ScreenCapture) {
    try { await ScreenCapture.allowScreenCaptureAsync(contextKey); } catch {}
  }
}

export function isScreenSecure(): boolean {
  return SECURE_CONTEXTS.size > 0;
}

import { useEffect, useState, useCallback } from 'react';

export function useScreenSecurity(contextKey: string, active: boolean): void {
  useEffect(() => {
    if (!active) {
      disableScreenSecurity(contextKey);
      return;
    }
    enableScreenSecurity(contextKey);
    return () => { disableScreenSecurity(contextKey); };
  }, [contextKey, active]);
}

// ── iOS Privacy Blur ──────────────────────────────────────────────
// En iOS no existe FLAG_SECURE. La solución estándar (usada por
// Signal, Telegram) es mostrar un overlay opaco/blur cuando la app
// pasa a 'inactive' (background, app switcher o screenshot).
// El overlay desaparece al volver a 'active'.

/**
 * Hook que devuelve `showBlur: true` cuando iOS detecta que la app
 * está en background/switcher y la pantalla es un contexto seguro.
 *
 * Uso en chat/[id].tsx:
 *   const { showBlur } = useIOSPrivacyBlur(isIncognito);
 *   // Renderizar <PrivacyBlurOverlay visible={showBlur} /> sobre el contenido
 */
export function useIOSPrivacyBlur(active: boolean): { showBlur: boolean } {
  const [showBlur, setShowBlur] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !active) {
      setShowBlur(false);
      return;
    }

    const handleChange = (nextState: AppStateStatus) => {
      if (!active) return;
      // 'inactive' = app switcher, incoming call, screenshot
      // 'background' = app minimizada
      if (nextState === 'inactive' || nextState === 'background') {
        setShowBlur(true);
      } else if (nextState === 'active') {
        setShowBlur(false);
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => {
      sub.remove();
      setShowBlur(false);
    };
  }, [active]);

  return { showBlur };
}

// ── Screenshot attempt callback ───────────────────────────────────
let screenshotCallback: (() => void) | null = null;

if (Platform.OS === 'ios') {
  let prevState: AppStateStatus = AppState.currentState;
  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (prevState === 'active' && nextState === 'inactive' && isScreenSecure()) {
      screenshotCallback?.();
    }
    prevState = nextState;
  });
}

export function onScreenshotAttempt(cb: () => void): () => void {
  screenshotCallback = cb;
  return () => { screenshotCallback = null; };
}
