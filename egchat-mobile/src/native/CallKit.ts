/**
 * EGChat — Puente nativo para llamadas
 * iOS: CallKit  |  Android: ConnectionService + Notificación full-screen
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { EGChatCallModule } = NativeModules;

const isAvailable = !!EGChatCallModule && Platform.OS !== 'web';

let emitter: NativeEventEmitter | null = null;
if (isAvailable) {
  emitter = new NativeEventEmitter(EGChatCallModule);
}

export const NativeCallKit = {
  /** Muestra la pantalla/notificación de llamada entrante (app abierta) */
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

  /** [Android] Lee y borra la llamada pendiente de SharedPreferences.
   *  Equivalente a consumePendingCall() para el payload nativo (no AsyncStorage).
   *  Devuelve null si no hay llamada pendiente o si caducó. */
  getAndClearPendingCall(): Promise<string | null> {
    if (!isAvailable || Platform.OS !== 'android') return Promise.resolve(null);
    return EGChatCallModule.getAndClearPendingCall();
  },

  /** [Android] Inicia el ForegroundService para mantener la llamada activa en background */
  startCallForegroundService(callId: string, callerName: string, isVideo: boolean) {
    if (!isAvailable || Platform.OS !== 'android') return;
    EGChatCallModule.startCallForegroundService(callId, callerName, isVideo);
  },

  /** [Android] Para el ForegroundService al finalizar la llamada */
  stopCallForegroundService() {
    if (!isAvailable || Platform.OS !== 'android') return;
    EGChatCallModule.stopCallForegroundService();
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
