/**
 * deep-links.ts
 * Sistema completo de Deep Links para EGCHAT.
 *
 * Soporta:
 *   egchat://chat/UUID-DEL-CHAT          → abrir conversación
 *   egchat://profile/UUID-USUARIO        → abrir perfil
 *   egchat://pay/UUID-USUARIO            → abrir pago
 *   https://egchat-v2.vercel.app/chat/ID → universal link (App Links Android)
 *
 * Integración con App.tsx via window.__pendingOpenChatId (patrón ya existente).
 */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type DeepLinkRoute =
  | { type: 'chat';    chatId: string }
  | { type: 'profile'; userId: string }
  | { type: 'pay';     userId: string }
  | { type: 'home' }
  | { type: 'unknown'; url: string };

// ── Constantes ────────────────────────────────────────────────────────────────

const SCHEME  = 'egchat';
const DOMAINS = ['egchat-v2.vercel.app', 'egchat.app'];

// Clave para guardar deep link pendiente cuando el usuario no está autenticado
const PENDING_DEEP_LINK_KEY = 'egchat_pending_deep_link';

// ── Parser de URL ─────────────────────────────────────────────────────────────

/**
 * parseDeepLink()
 * Parsea cualquier URL (scheme o https) y devuelve la ruta estructurada.
 *
 * Ejemplos:
 *   egchat://chat/abc-123          → { type: 'chat', chatId: 'abc-123' }
 *   https://egchat-v2.vercel.app/chat/abc-123 → { type: 'chat', chatId: 'abc-123' }
 */
export function parseDeepLink(url: string): DeepLinkRoute {
  if (!url) return { type: 'unknown', url };

  try {
    // Normalizar: convertir scheme custom a https para parsear con URL API
    let normalized = url;
    if (url.startsWith(`${SCHEME}://`)) {
      normalized = url.replace(`${SCHEME}://`, 'https://egchat-internal/');
    }

    const parsed = new URL(normalized);
    const parts  = parsed.pathname.split('/').filter(Boolean);

    // /chat/:id
    if (parts[0] === 'chat' && parts[1]) {
      return { type: 'chat', chatId: decodeURIComponent(parts[1]) };
    }

    // /profile/:id
    if (parts[0] === 'profile' && parts[1]) {
      return { type: 'profile', userId: decodeURIComponent(parts[1]) };
    }

    // /pay/:id
    if (parts[0] === 'pay' && parts[1]) {
      return { type: 'pay', userId: decodeURIComponent(parts[1]) };
    }

    // Raíz
    if (parts.length === 0) {
      return { type: 'home' };
    }

    return { type: 'unknown', url };
  } catch {
    return { type: 'unknown', url };
  }
}

// ── Navegación ────────────────────────────────────────────────────────────────

/**
 * handleDeepLinkRoute()
 * Ejecuta la navegación correspondiente a la ruta parseada.
 * Usa el patrón __pendingOpenChatId ya existente en App.tsx.
 */
export function handleDeepLinkRoute(route: DeepLinkRoute): void {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    // Guardar el deep link para procesarlo tras el login
    localStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(route));
    console.log('[DeepLinks] Usuario no autenticado — deep link guardado para después del login.');
    return;
  }

  switch (route.type) {
    case 'chat':
      console.log(`[DeepLinks] Navegando al chat: ${route.chatId}`);
      // Usar el patrón existente en App.tsx — loadChats() lo procesa automáticamente
      (window as any).__pendingOpenChatId = route.chatId;
      // Disparar evento para que App.tsx recargue los chats y abra el correcto
      window.dispatchEvent(new CustomEvent('egchat-deep-link-chat', {
        detail: { chatId: route.chatId },
      }));
      break;

    case 'profile':
      console.log(`[DeepLinks] Navegando al perfil: ${route.userId}`);
      window.dispatchEvent(new CustomEvent('egchat-deep-link-profile', {
        detail: { userId: route.userId },
      }));
      break;

    case 'pay':
      console.log(`[DeepLinks] Navegando a pago: ${route.userId}`);
      window.dispatchEvent(new CustomEvent('egchat-deep-link-pay', {
        detail: { userId: route.userId },
      }));
      break;

    case 'home':
      window.dispatchEvent(new CustomEvent('egchat-deep-link-home'));
      break;

    case 'unknown':
      console.warn('[DeepLinks] URL no reconocida:', route.url);
      break;
  }
}

// ── Deep link pendiente tras login ────────────────────────────────────────────

/**
 * processPendingDeepLink()
 * Procesa el deep link guardado cuando el usuario no estaba autenticado.
 * Llamar desde App.tsx justo después de que el usuario inicie sesión.
 */
export function processPendingDeepLink(): void {
  const raw = localStorage.getItem(PENDING_DEEP_LINK_KEY);
  if (!raw) return;

  try {
    const route = JSON.parse(raw) as DeepLinkRoute;
    localStorage.removeItem(PENDING_DEEP_LINK_KEY);
    console.log('[DeepLinks] Procesando deep link pendiente:', route);
    // Pequeño delay para que App.tsx esté completamente montado
    setTimeout(() => handleDeepLinkRoute(route), 800);
  } catch {
    localStorage.removeItem(PENDING_DEEP_LINK_KEY);
  }
}

// ── Inicialización ────────────────────────────────────────────────────────────

/**
 * initDeepLinks()
 * Inicializa los listeners de deep links para Capacitor (Android/iOS).
 * Llamar una vez al arrancar la app en main.tsx.
 *
 * Maneja dos casos:
 * 1. App ya abierta — evento appUrlOpen
 * 2. App abierta desde un link — getInitialUrl (URL de lanzamiento)
 */
export async function initDeepLinks(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // En web: escuchar cambios de URL del navegador
    _initWebDeepLinks();
    return;
  }

  // ── Caso 1: App ya abierta, llega un deep link ────────────────────────────
  await App.addListener('appUrlOpen', (event) => {
    console.log('[DeepLinks] appUrlOpen:', event.url);
    const route = parseDeepLink(event.url);
    handleDeepLinkRoute(route);
  });

  // ── Caso 2: App lanzada desde un deep link ────────────────────────────────
  try {
    const { url } = await App.getLaunchUrl();
    if (url) {
      console.log('[DeepLinks] Launch URL:', url);
      const route = parseDeepLink(url);
      // Delay para que App.tsx esté montado antes de navegar
      setTimeout(() => handleDeepLinkRoute(route), 1_000);
    }
  } catch {
    // getLaunchUrl puede fallar si no hay URL de lanzamiento — es normal
  }

  console.log('[DeepLinks] Inicializado en plataforma nativa.');
}

/**
 * removeDeepLinkListeners()
 * Elimina los listeners. Llamar al hacer logout.
 */
export async function removeDeepLinkListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await App.removeAllListeners();
}

// ── Web fallback ──────────────────────────────────────────────────────────────

function _initWebDeepLinks(): void {
  // En web, los deep links llegan como parámetros de URL o hash
  const url = window.location.href;
  const hash = window.location.hash;

  // Soportar: https://egchat-v2.vercel.app/#/chat/abc-123
  if (hash.startsWith('#/')) {
    const route = parseDeepLink(`egchat:/${hash.slice(1)}`);
    if (route.type !== 'unknown') {
      setTimeout(() => handleDeepLinkRoute(route), 500);
    }
  }

  // Soportar: https://egchat-v2.vercel.app/chat/abc-123
  if (DOMAINS.some(d => url.includes(d))) {
    const route = parseDeepLink(url);
    if (route.type !== 'unknown' && route.type !== 'home') {
      setTimeout(() => handleDeepLinkRoute(route), 500);
    }
  }

  console.log('[DeepLinks] Inicializado en web.');
}

// ── Generador de URLs ─────────────────────────────────────────────────────────

/**
 * buildDeepLink()
 * Genera una URL de deep link para compartir.
 *
 * @param type    — tipo de ruta
 * @param id      — ID del recurso
 * @param useHttps — true para universal link, false para scheme custom
 */
export function buildDeepLink(
  type: 'chat' | 'profile' | 'pay',
  id: string,
  useHttps = true
): string {
  if (useHttps) {
    return `https://egchat-v2.vercel.app/${type}/${id}`;
  }
  return `${SCHEME}://${type}/${id}`;
}
