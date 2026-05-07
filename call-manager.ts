/**
 * call-manager.ts
 * Gestión de pantalla de llamada entrante nativa usando el plugin call-screen.
 * Se integra con el sistema WebRTC existente de App.tsx.
 *
 * Funciones exportadas:
 *   showIncomingCall(callId, callerName, roomName) — muestra la UI nativa de llamada
 *   answerCall()   — acepta la llamada activa
 *   rejectCall()   — rechaza la llamada activa
 *   stopCallScreen() — cierra la pantalla de llamada
 *   initCallManager() — inicializa los listeners (llamar una vez al arrancar la app)
 *   cleanupCallManager() — elimina los listeners (llamar al hacer logout)
 */

import { Capacitor } from '@capacitor/core';
import { CallScreen } from 'call-screen';
import type { CallActionEvent } from 'call-screen';

// ── Estado interno ────────────────────────────────────────────────────────────

let _activeCallId: string | null = null;
let _activeCallerName: string | null = null;
let _activeRoomName: string | null = null;
let _listenerHandle: any = null;

// ── Eventos personalizados que App.tsx puede escuchar ─────────────────────────

/**
 * 'call-answered' — el usuario tocó "Aceptar" en la pantalla nativa
 * detail: { callId, callerName, roomName }
 */
export const CALL_ANSWERED_EVENT = 'call-answered';

/**
 * 'call-rejected' — el usuario tocó "Rechazar" en la pantalla nativa
 * detail: { callId, callerName, roomName }
 */
export const CALL_REJECTED_EVENT = 'call-rejected';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function dispatchCallEvent(eventName: string, detail: object): void {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// ── Función principal: mostrar pantalla de llamada entrante ───────────────────

/**
 * showIncomingCall()
 * Muestra la pantalla nativa de llamada entrante con botones Aceptar/Rechazar.
 * En web muestra una notificación del navegador como fallback.
 *
 * @param callId      - ID único de la llamada (del servidor WebRTC)
 * @param callerName  - Nombre del llamante a mostrar en pantalla
 * @param roomName    - Nombre de la sala WebRTC para unirse al aceptar
 */
export async function showIncomingCall(
  callId: string,
  callerName: string,
  roomName: string = ''
): Promise<void> {
  // Guardar estado para answerCall() y rejectCall()
  _activeCallId    = callId;
  _activeCallerName = callerName;
  _activeRoomName  = roomName;

  if (isNativeAndroid()) {
    // ── Android nativo: pantalla completa sobre la pantalla de bloqueo ──
    try {
      await CallScreen.showCallScreen({
        username: callerName,
        callId,
        roomName,
      });
      console.log(`[CallManager] Pantalla de llamada mostrada — caller: ${callerName}, room: ${roomName}`);
    } catch (error) {
      console.error('[CallManager] Error al mostrar pantalla de llamada:', error);
      // Fallback: notificación del navegador
      _showBrowserFallback(callerName, callId);
    }
  } else {
    // ── Web / PWA: notificación del navegador como fallback ──────────────
    _showBrowserFallback(callerName, callId);
  }
}

/**
 * Fallback para web/PWA: notificación del navegador con acciones.
 */
function _showBrowserFallback(callerName: string, callId: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notif = new Notification(`📞 Llamada entrante`, {
      body: `${callerName} te está llamando`,
      icon: '/logo-transparent.png',
      tag: `call-${callId}`,
      requireInteraction: true, // no desaparece sola
    });

    notif.onclick = () => {
      notif.close();
      dispatchCallEvent(CALL_ANSWERED_EVENT, {
        callId: _activeCallId,
        callerName: _activeCallerName,
        roomName: _activeRoomName,
      });
    };
  }
}

// ── Aceptar llamada ───────────────────────────────────────────────────────────

/**
 * answerCall()
 * Acepta la llamada activa programáticamente (desde la UI web).
 * Emite el evento 'call-answered' para que App.tsx conecte el WebRTC.
 */
export async function answerCall(): Promise<void> {
  if (!_activeCallId) {
    console.warn('[CallManager] answerCall() llamado sin llamada activa.');
    return;
  }

  dispatchCallEvent(CALL_ANSWERED_EVENT, {
    callId:     _activeCallId,
    callerName: _activeCallerName,
    roomName:   _activeRoomName,
  });

  // Cerrar la pantalla nativa si está activa
  if (isNativeAndroid()) {
    try { await CallScreen.stopCall(); } catch {}
  }

  _clearActiveCall();
}

// ── Rechazar llamada ──────────────────────────────────────────────────────────

/**
 * rejectCall()
 * Rechaza la llamada activa programáticamente (desde la UI web).
 * Emite el evento 'call-rejected' para que App.tsx notifique al servidor.
 */
export async function rejectCall(): Promise<void> {
  if (!_activeCallId) {
    console.warn('[CallManager] rejectCall() llamado sin llamada activa.');
    return;
  }

  dispatchCallEvent(CALL_REJECTED_EVENT, {
    callId:     _activeCallId,
    callerName: _activeCallerName,
    roomName:   _activeRoomName,
  });

  // Cerrar la pantalla nativa
  if (isNativeAndroid()) {
    try { await CallScreen.stopCall(); } catch {}
  }

  _clearActiveCall();
}

// ── Cerrar pantalla de llamada ────────────────────────────────────────────────

/**
 * stopCallScreen()
 * Cierra la pantalla de llamada nativa sin emitir eventos.
 * Usar cuando la llamada termina desde el otro lado.
 */
export async function stopCallScreen(): Promise<void> {
  if (isNativeAndroid()) {
    try { await CallScreen.stopCall(); } catch {}
  }
  _clearActiveCall();
}

// ── Inicializar listeners ─────────────────────────────────────────────────────

/**
 * initCallManager()
 * Registra el listener del plugin call-screen para recibir eventos
 * de aceptar/rechazar desde los botones nativos de la pantalla de llamada.
 *
 * Llamar UNA VEZ al arrancar la app (en App.tsx, tras login).
 */
export async function initCallManager(): Promise<void> {
  if (!isNativeAndroid()) return;

  // Evitar registrar el listener dos veces
  if (_listenerHandle) {
    await CallScreen.removeAllListeners('callAction');
    _listenerHandle = null;
  }

  try {
    _listenerHandle = await CallScreen.addListener(
      'callAction',
      (event: CallActionEvent) => {
        console.log(`[CallManager] Acción nativa: ${event.action} — caller: ${event.username}`);

        if (event.action === 'accepted') {
          // El usuario tocó "Aceptar" en la pantalla nativa
          dispatchCallEvent(CALL_ANSWERED_EVENT, {
            callId:     event.callId,
            callerName: event.username,
            roomName:   event.roomName || _activeRoomName || '',
          });
        } else {
          // El usuario tocó "Rechazar" en la pantalla nativa
          dispatchCallEvent(CALL_REJECTED_EVENT, {
            callId:     event.callId,
            callerName: event.username,
            roomName:   event.roomName || _activeRoomName || '',
          });
        }

        _clearActiveCall();
      }
    );

    console.log('[CallManager] Listener de callAction registrado.');
  } catch (error) {
    console.error('[CallManager] Error al registrar listener:', error);
  }
}

// ── Limpiar listeners ─────────────────────────────────────────────────────────

/**
 * cleanupCallManager()
 * Elimina todos los listeners del plugin.
 * Llamar al hacer logout para evitar memory leaks.
 */
export async function cleanupCallManager(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    await CallScreen.removeAllListeners('callAction');
    _listenerHandle = null;
    console.log('[CallManager] Listeners eliminados.');
  } catch {}
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function _clearActiveCall(): void {
  _activeCallId    = null;
  _activeCallerName = null;
  _activeRoomName  = null;
}
