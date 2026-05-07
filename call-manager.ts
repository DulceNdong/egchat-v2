/**
 * call-manager.ts
 * Gestión de pantalla de llamada entrante para EGCHAT.
 * Usa la UI de llamada nativa de App.tsx (incomingCall state) en lugar
 * del plugin call-screen externo que tenía recursos Android rotos.
 *
 * Funciones exportadas:
 *   showIncomingCall(callId, callerName, roomName) — muestra la UI de llamada
 *   answerCall()         — acepta la llamada activa
 *   rejectCall()         — rechaza la llamada activa
 *   stopCallScreen()     — cierra la pantalla de llamada
 *   initCallManager()    — inicializa los listeners
 *   cleanupCallManager() — elimina los listeners (llamar al hacer logout)
 */

import { Capacitor } from '@capacitor/core';

// ── Estado interno ────────────────────────────────────────────────────────────

let _activeCallId:    string | null = null;
let _activeCallerName: string | null = null;
let _activeRoomName:  string | null = null;

// ── Eventos personalizados que App.tsx puede escuchar ─────────────────────────

/** El usuario tocó "Aceptar" — detail: { callId, callerName, roomName } */
export const CALL_ANSWERED_EVENT = 'call-answered';

/** El usuario tocó "Rechazar" — detail: { callId, callerName, roomName } */
export const CALL_REJECTED_EVENT = 'call-rejected';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dispatchCallEvent(eventName: string, detail: object): void {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// ── Función principal: mostrar pantalla de llamada entrante ───────────────────

/**
 * showIncomingCall()
 * Muestra la pantalla de llamada entrante.
 * En Android nativo: dispara el evento 'egchat-show-incoming-call' que
 * App.tsx recoge para mostrar su UI nativa de llamada (incomingCall state).
 * En web: muestra una notificación del navegador como fallback.
 */
export async function showIncomingCall(
  callId: string,
  callerName: string,
  roomName: string = ''
): Promise<void> {
  _activeCallId     = callId;
  _activeCallerName = callerName;
  _activeRoomName   = roomName;

  console.log(`[CallManager] showIncomingCall → callId:${callId} caller:${callerName}`);

  // Disparar evento para que App.tsx muestre su UI de llamada entrante
  // (el incomingCall state ya gestiona la pantalla nativa en Capacitor)
  window.dispatchEvent(
    new CustomEvent('egchat-show-incoming-call', {
      detail: { callId, callerName, roomName },
    })
  );

  // Fallback web: notificación del navegador
  if (!Capacitor.isNativePlatform()) {
    _showBrowserFallback(callerName, callId);
  }
}

function _showBrowserFallback(callerName: string, callId: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notif = new Notification('📞 Llamada entrante', {
      body: `${callerName} te está llamando`,
      icon: '/logo-transparent.png',
      tag: `call-${callId}`,
      requireInteraction: true,
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

export async function answerCall(): Promise<void> {
  if (!_activeCallId) return;
  dispatchCallEvent(CALL_ANSWERED_EVENT, {
    callId:     _activeCallId,
    callerName: _activeCallerName,
    roomName:   _activeRoomName,
  });
  _clearActiveCall();
}

// ── Rechazar llamada ──────────────────────────────────────────────────────────

export async function rejectCall(): Promise<void> {
  if (!_activeCallId) return;
  dispatchCallEvent(CALL_REJECTED_EVENT, {
    callId:     _activeCallId,
    callerName: _activeCallerName,
    roomName:   _activeRoomName,
  });
  _clearActiveCall();
}

// ── Cerrar pantalla ───────────────────────────────────────────────────────────

export async function stopCallScreen(): Promise<void> {
  _clearActiveCall();
}

// ── Inicializar / limpiar ─────────────────────────────────────────────────────

/**
 * initCallManager()
 * No necesita registrar listeners externos — App.tsx gestiona
 * la UI de llamada directamente via incomingCall state.
 */
export async function initCallManager(): Promise<void> {
  console.log('[CallManager] Inicializado.');
}

export async function cleanupCallManager(): Promise<void> {
  _clearActiveCall();
  console.log('[CallManager] Limpiado.');
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function _clearActiveCall(): void {
  _activeCallId     = null;
  _activeCallerName = null;
  _activeRoomName   = null;
}
