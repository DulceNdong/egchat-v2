/**
 * EGChat — Puente nativo para llamadas
 * iOS: CallKit  |  Android: ConnectionService + Notificación full-screen
 *
 * Uso:
 *   import { NativeCallKit } from '../native/CallKit';
 *   NativeCallKit.showIncomingCall('Reddington', '', 'call_123', false);
 *   NativeCallKit.onAnswer(callId => router.push(`/call/${callId}`));
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { EGChatCallModule } = NativeModules;

// En web o si el módulo no está disponible, usamos stubs vacíos
const isAvailable = !!EGChatCallModule && Platform.OS !== 'web';

let emitter: NativeEventEmitter | null = null;
if (isAvailable) {
  emitter = new NativeEventEmitter(EGChatCallModule);
}

export const NativeCallKit = {
  /** Muestra la pantalla/notificación de llamada entrante */
  showIncomingCall(
    callerName: string,
    callerAvatar: string,
    callId: string,
    isVideo: boolean,
  ) {
    if (!isAvailable) return;
    EGChatCallModule.showIncomingCall(callerName, callerAvatar, callId, isVideo);
  },

  /** Cierra la pantalla/notificación de llamada */
  dismissIncomingCall() {
    if (!isAvailable) return;
    EGChatCallModule.dismissIncomingCall();
  },

  /** El usuario contestó desde la app */
  answerCall(callId: string) {
    if (!isAvailable) return;
    EGChatCallModule.answerCall(callId);
  },

  /** El usuario rechazó la llamada */
  rejectCall(callId: string) {
    if (!isAvailable) return;
    EGChatCallModule.rejectCall(callId);
  },

  /** La llamada terminó */
  endCall(callId: string) {
    if (!isAvailable) return;
    EGChatCallModule.endCall(callId);
  },

  /** Escuchar evento: usuario contestó desde la notificación */
  onAnswer(callback: (callId: string) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('callAnswered', callback);
    return () => sub.remove();
  },

  /** Escuchar evento: usuario rechazó desde la notificación */
  onReject(callback: (callId: string) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('callRejected', callback);
    return () => sub.remove();
  },

  /** Escuchar evento: llamada terminada */
  onEnd(callback: (callId: string) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('callEnded', callback);
    return () => sub.remove();
  },
};
