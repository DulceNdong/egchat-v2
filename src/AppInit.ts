/**
 * AppInit.ts
 * Secuencia de inicialización Offline-First.
 *
 * Orden garantizado:
 *  1. Monitor global de errores
 *  2. SQLite (persistencia local)
 *  3. SyncManager (detección de red + cola offline)
 *  4. RealtimeSync si hay token (WebSocket en lugar de polling)
 *  5. FileCache limpieza (background)
 *  6. OTA check (background)
 */

import { initDatabase }    from './db/database';
import { initSyncManager } from './sync/SyncManager';
import { initRealtime }    from './sync/RealtimeSync';
import { AppMonitor }      from './monitor/AppMonitor';
import { OTAUpdater }      from './ota/OTAUpdater';
import { FileCache }       from './cache/FileCache';
import { Keyboard }        from '@capacitor/keyboard';

let initialized = false;

export async function initApp(): Promise<void> {
  if (initialized) return;
  initialized = true;

  AppMonitor.init();

  // Wake-up ping al servidor (Render free tier duerme tras 15min de inactividad)
  // Lanzar en background sin bloquear la inicialización
  const apiUrl = (typeof (window as any).__API_URL__ !== 'undefined' && (window as any).__API_URL__)
    ? (window as any).__API_URL__.replace(/\/$/, '').replace(/\/api$/, '')
    : 'https://egchat-api-xlxj.onrender.com';
  fetch(`${apiUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(90000) })
    .then(() => console.log('[AppInit] ✅ Servidor activo'))
    .catch(() => console.log('[AppInit] ⏳ Servidor despertando...'));

  // Configurar teclado: none = WebView no se mueve, solo el #chat-input-bar via translateY
  try {
    await Keyboard.setResizeMode({ mode: 'none' });
    console.log('[AppInit] ✅ Keyboard resize: none');
  } catch { /* web/no capacitor */ }

  try {
    // 1. SQLite
    await initDatabase();
    console.log('[AppInit] ✅ SQLite lista (cifrada)');

    // 2. SyncManager (polling fallback + cola offline)
    initSyncManager();
    console.log('[AppInit] ✅ SyncManager listo');

    // 3. WebSocket si ya hay token (usuario ya autenticado)
    const token = localStorage.getItem('token')
               || localStorage.getItem('egchat_token_backup')
               || '';
    if (token) {
      initRealtime(token);
      console.log('[AppInit] ✅ WebSocket iniciado');
    }

    // 4. Limpieza de caché (background)
    FileCache.prune().then(n => {
      if (n > 0) console.log(`[AppInit] 🗑 ${n} archivos viejos eliminados`);
    }).catch(() => {});

    // 5. OTA (background)
    OTAUpdater.init()
      .then(() => OTAUpdater.checkAndDownload())
      .then(result => {
        if (result.hasUpdate) {
          console.log('[AppInit] 📦 OTA disponible:', result.version);
          window.dispatchEvent(
            new CustomEvent('egchat:ota-update-ready', { detail: result })
          );
        }
      }).catch(() => {});

  } catch (err: any) {
    AppMonitor.recordError(err?.message ?? 'AppInit failed', 'init');
    console.error('[AppInit] ⚠️ Modo degradado:', err);
  }
}

/**
 * Llamar tras login exitoso para activar WebSocket con el nuevo token.
 */
export function onLoginSuccess(token: string): void {
  initRealtime(token);
  console.log('[AppInit] ✅ WebSocket activado tras login');
}
