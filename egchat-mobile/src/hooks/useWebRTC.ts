// ══════════════════════════════════════════════════════════════════
// useWebRTC — Fachada React del CallManager singleton
//
// Mantiene la MISMA API externa que antes para que [callId].tsx
// y cualquier otro consumidor no necesite cambios de firma.
//
// La fuente de verdad es CallManager. Este hook solo:
//  1. Se suscribe al manager via observer
//  2. Traduce el snapshot a las mismas variables que exponía antes
//  3. Delega todas las acciones al manager
//
// El RTCView se exporta aquí para que [callId].tsx lo importe igual.
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Platform } from 'react-native';
import { callManager, HAS_NATIVE_MEDIA } from '../call/CallManager';
import type { CallCommState, IncomingCallPayload } from '../call/types';

// ── RTCView — mismo export que antes ─────────────────────────────
let _NativeRTC: any = null;
try {
  if (Platform.OS !== 'web') _NativeRTC = require('react-native-webrtc');
} catch { _NativeRTC = null; }

export const RTCView = (_NativeRTC?.RTCView ?? View) as React.ComponentType<any>;

// ── Tipo público del estado de llamada (alias para compatibilidad) ─
export type CallState = CallCommState;

// ══════════════════════════════════════════════════════════════════
export function useWebRTC() {
  // Estado local sincronizado con el CallManager
  const [snapshot, setSnapshot] = useState(() => callManager.state);

  useEffect(() => {
    const unsub = callManager.subscribe(setSnapshot);
    return unsub;
  }, []);

  // ── Mapeo del snapshot a las variables originales ──────────────
  const callState    = snapshot.commState;
  const callType     = snapshot.session?.callType ?? 'audio';
  const isMuted      = snapshot.isMuted;
  const isCamOff     = snapshot.isCamOff;
  const isSpeakerOn  = snapshot.isSpeakerOn;
  const isSignalingOnly = snapshot.isSignalingOnly;
  const localStream  = snapshot.localStream;
  const remoteStream = snapshot.remoteStream;

  // ── Acciones delegadas al manager ─────────────────────────────
  const startCall = useCallback(async (
    type: 'audio' | 'video',
    targetUserId: string,
    callId?: string,
    targetName?: string,
    targetAvatar?: string,
    chatId?: string,
  ) => {
    await callManager.startCall(
      type,
      targetUserId,
      targetName  ?? 'Usuario',
      targetAvatar ?? '',
      callId ?? `call_${Date.now()}`,
      chatId,
    );
  }, []);

  const answerCall = useCallback(async (
    callId: string,
    offer: object,
    type: 'audio' | 'video',
  ) => {
    // Si el manager no tiene la sesión registrada aún (llamada entrante
    // navegada directamente sin pasar por registerIncoming), registrarla
    if (!callManager.session || callManager.session.callId !== callId) {
      callManager.registerIncoming({
        callId,
        callType: type,
        callerName: 'Usuario',
        offer,
      });
    }
    await callManager.acceptCall();
  }, []);

  const endCall    = useCallback(() => callManager.endCall(),    []);
  const toggleMute = useCallback(() => callManager.toggleMute(), []);
  const toggleCamera = useCallback(() => callManager.toggleCamera(), []);

  // ── pollIncoming — conservado para compatibilidad con código legado ──
  // En la nueva arquitectura se prefiere registerIncoming() + el overlay
  // del _layout.tsx, pero esta función sigue funcionando como antes.
  const pollIncoming = useCallback((
    myUserId: string,
    onIncoming: (call: any) => void,
    onCancelled?: () => void,
  ) => {
    if (!myUserId) return () => {};
    // Importar callAPI dinámicamente para evitar dependencia circular
    const { callAPI } = require('../api');
    let lastCallId: string | null = null;
    const check = async () => {
      try {
        const calls = await callAPI.incoming(myUserId);
        if (Array.isArray(calls) && calls.length > 0) {
          const call = calls[0];
          const cid  = call.callId || call.call_id;
          if (cid !== lastCallId) {
            lastCallId = cid;
            onIncoming({
              callId:      cid,
              offer:       call.offer,
              type:        call.type || 'audio',
              callerId:    call.callerId || call.caller_id,
              callerName:  call.callerName,
              callerAvatar: call.callerAvatar,
            });
          }
        } else if (lastCallId !== null) {
          lastCallId = null;
          onCancelled?.();
        }
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  return {
    callState, callType, isMuted, isCamOff, isSignalingOnly,
    isSpeakerOn,
    hasNativeMedia: HAS_NATIVE_MEDIA, localStream, remoteStream,
    duration: snapshot.session?.duration ?? 0,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
    switchCamera:    () => callManager.switchCamera(),
    toggleSpeaker:   () => callManager.toggleSpeaker(),
    toggleBluetooth: () => callManager.toggleBluetooth(),
  };
}
