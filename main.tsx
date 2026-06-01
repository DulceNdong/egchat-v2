import ReactDOM from 'react-dom/client';
import React, { Suspense } from 'react';
import App from './App';

// ErrorBoundary para lazy imports — evita que un chunk fallido cuelgue la app
class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      // Recargar la página limpiando caches — soluciona chunks obsoletos
      if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      setTimeout(() => window.location.reload(), 500);
      return <div style={{ position: 'fixed', inset: 0, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Actualizando...</div>
      </div>;
    }
    return this.props.children;
  }
}
import './index.css';
import initSelectionErrorHandler from './selectionErrorHandler';
import { WalletProvider } from './WalletSystem';
import { initOfflineDB } from './src/offline-db';
import { initSyncManager } from './src/sync-manager';
import { initOfflineUI } from './src/offline-ui';
import { setupSplashSafetyTimeout, hideSplashWhenReady } from './splash-screen';
import { initDeepLinks } from './deep-links';
import { initHaptics } from './haptics-manager';
import { isIOS, isIOSPWA } from './platform';
import { Capacitor } from '@capacitor/core';

initSelectionErrorHandler();

// ── Splash Screen — timeout de seguridad (evita que quede bloqueada) ─────────
setupSplashSafetyTimeout();

// ── Forzar limpieza de SW y caches viejos ────────────────────────────────
// Versión de la app — cambiar esto fuerza que todos los usuarios recarguen
const APP_VERSION = 'v20260601-perf-fixes';
const isNativeApp = Capacitor.isNativePlatform();
const storedVersion = localStorage.getItem('egchat_app_version');
if (storedVersion !== APP_VERSION) {
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
  localStorage.setItem('egchat_app_version', APP_VERSION);
  // iOS (PWA o Safari) y app nativa: NUNCA recargar — causa bucle infinito
  // Solo recargar en web desktop/Android browser cuando hay versión previa
  const iosDevice = isIOS();
  if (storedVersion && !iosDevice && !isNativeApp) {
    window.location.reload();
  }
}

// App nativa (Capacitor): desactivar Service Worker para evitar bundles viejos y bucles de login.
if (isNativeApp && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

// iOS standalone: eliminar SW heredados antes de cargar React (evita pantalla blanca)
if (isIOSPWA() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

// Registrar tiempo de carga para evitar reload del SW en páginas ya abiertas
(window as any).__pageLoadTime = Date.now();

// ── Offline system ────────────────────────────────────────────────
// Inicializar base de datos local, sync manager y UI offline
// Se hace antes del render para que los datos locales estén disponibles
(async () => {
  try {
    await initOfflineDB();
    initOfflineUI();
    initSyncManager();
    await initDeepLinks();
    await initHaptics();
    console.log('[EGCHAT] Sistema offline + deep links + hápticos inicializado');
  } catch (err) {
    console.warn('[EGCHAT] Error inicializando sistema offline:', err);
    // No bloquear el arranque de la app si falla
  }
})();

// ── Fix viewport height para Android WebView / Capacitor ─────────────────
// Con adjustNothing el teclado aparece ENCIMA del contenido sin mover nada.
// Usamos visualViewport para exponer la altura real como variable CSS.
function fixAndroidViewportHeight() {
  const setVh = () => {
    const h = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--real-vh', `${h}px`);
  };
  setVh();
  window.addEventListener('resize', setVh);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVh);
  }
}
fixAndroidViewportHeight();

// ── Fix status bar Android edge-to-edge ──────────────────────────────────
// En Android con Capacitor, env(safe-area-inset-top) puede ser 0 aunque
// haya barra de estado. Detectamos la altura real y la exponemos como
// variable CSS --status-bar-height para que el header la use.
function fixAndroidStatusBar() {
  const isAndroid = /android/i.test(navigator.userAgent);
  if (!isAndroid) return;
  // Intentar leer el safe area real; si es 0, usar 24px (altura estándar Android)
  const testEl = document.createElement('div');
  testEl.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);left:0;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(testEl);
  const safeTop = testEl.getBoundingClientRect().top;
  document.body.removeChild(testEl);
  const statusBarHeight = safeTop > 0 ? safeTop : 24;
  document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);
}
fixAndroidStatusBar();

// ── Service Worker + Web Push ─────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'https://egchat-api.onrender.com';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

async function registerPush(registration: ServiceWorkerRegistration) {
  try {
    if (!('PushManager' in window)) return; // navegador no soporta push

    // Si el permiso no está concedido, pedirlo
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    // Suscribirse al push — siempre forzar nueva suscripción si la actual puede estar expirada
    let subscription = await registration.pushManager.getSubscription();

    // Verificar si la suscripción sigue siendo válida enviándola al backend
    // Si el backend devuelve 410/404 significa que expiró — crear una nueva
    if (subscription) {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || localStorage.getItem('egchat_token_backup') || '';
      if (token) {
        try {
          const check = await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          });
          if (!check.ok) {
            // Suscripción inválida — crear nueva
            await subscription.unsubscribe();
            subscription = null;
          }
        } catch {}
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Enviar suscripción al backend
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || localStorage.getItem('egchat_token_backup') || '';
    if (!token) { console.warn('Push: no token found'); return; }

    const resp = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    if (resp.ok) {
      console.log('Push subscription registered successfully');
      // Guardar timestamp para saber cuándo fue la última renovación
      localStorage.setItem('egchat_push_registered_at', Date.now().toString());
    } else {
      console.warn('Push subscription failed:', await resp.text());
    }
  } catch (e) {
    console.warn('Push subscription failed:', e);
  }
}

async function registerServiceWorkerForPush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((k) => caches.delete(k)));
    }

    const registration = await navigator.serviceWorker.register(`/sw.js?v=${APP_VERSION}`, { scope: '/' });

      // NO recargar automáticamente cuando el SW toma control
      // Esto evita el parpadeo en iOS Safari al abrir la app
      // Las actualizaciones se aplican en la siguiente apertura natural

      // Escuchar mensajes del SW (click en notificación)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          window.dispatchEvent(new CustomEvent('sw-notification-click', { detail: event.data }));
        }
        // Bufferizar mensajes de llamada para cuando App.tsx aún no esté listo
        if (event.data?.type === 'INCOMING_CALL' || event.data?.type === 'CALL_REJECTED') {
          (window as any).__pendingSWMessage = event.data;
          window.dispatchEvent(new CustomEvent('sw-call-message', { detail: event.data }));
          if (typeof (window as any).__egchat_processCallMessage === 'function') {
            (window as any).__egchat_processCallMessage(event.data);
          }
        }
        // El SW pide el token para renovar la suscripción push (pushsubscriptionchange)
        if (event.data?.type === 'GET_TOKEN' && event.ports?.[0]) {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || '';
          event.ports[0].postMessage({ token });
        }
      });

      // Suscribirse al push cuando el usuario ya esté autenticado
      // Intentar inmediatamente y también cuando el token aparezca
      const trySubscribe = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || '';
        if (token) registerPush(registration);
      };

      trySubscribe();

      // Reintentar cada 5s hasta que haya token (máx 60s)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        trySubscribe();
        if (attempts >= 12) clearInterval(interval);
      }, 5000);

      // Renovar suscripción push cuando la app vuelve al primer plano
      // Esto cubre el caso de teléfono hibernado que invalida la suscripción
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || '';
          if (!token) return;
          // Renovar si han pasado más de 6 horas desde la última renovación
          const lastReg = parseInt(localStorage.getItem('egchat_push_registered_at') || '0');
          const sixHours = 6 * 60 * 60 * 1000;
          if (Date.now() - lastReg > sixHours) {
            registerPush(registration);
          }
        }
      });

  } catch (e) {
    console.warn('SW registration failed:', e);
  }
}

// Exportar función para que App.tsx pueda re-suscribir tras login
(window as any).__egchat_registerPush = async () => {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  await registerPush(reg);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#f0f2f5' }} />}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </Suspense>
  </AppErrorBoundary>
);

// ── Ocultar splash cuando React esté montado y la web lista ──────────────────
hideSplashWhenReady();

// iPhone: sin Service Worker en arranque (iOS PWA + SW = pantalla blanca frecuente)
// Android/desktop: SW solo para push, tras montar React
if (!isIOS() && !isNativeApp) {
  setTimeout(() => {
    registerServiceWorkerForPush();
  }, 2500);
}
