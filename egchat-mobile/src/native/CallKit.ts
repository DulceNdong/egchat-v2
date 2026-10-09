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

  /**
   * [Android] Lee y borra la acción pendiente guardada por CallActionReceiver
   * cuando el usuario pulsó "Aceptar"/"Rechazar" con la app terminada.
   *
   * FIX C1: sin esto, la acción del botón de notificación se perdía silenciosamente
   * porque EGChatCallModule.instance era null cuando CallActionReceiver disparaba.
   *
   * Devuelve JSON string { action: "answer"|"reject"|"end", callId: string }
   * o null si no hay acción pendiente o caducó (>30s).
   */
  getAndClearPendingCallAction(): Promise<string | null> {
    if (!isAvailable || Platform.OS !== 'android') return Promise.resolve(null);
    return EGChatCallModule.getAndClearPendingCallAction();
  },

  /** [Android] Token FCM directo para llamadas de alta prioridad. */
  getFcmToken(): Promise<string | null> {
    if (!isAvailable || Platform.OS !== 'android') return Promise.resolve(null);
    return EGChatCallModule.getFcmToken();
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

  /**
   * [iOS] Escuchar interrupción de AVAudioSession.
   * Llega cuando una llamada telefónica entra o una alarma suena.
   * interrupted=true → pausa, interrupted=false → reanuda.
   */
  onAudioInterrupted(callback: (data: { interrupted: boolean; callId: string }) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('audioInterrupted', callback);
    return () => sub.remove();
  },

  /**
   * [iOS] Escuchar cambio de ruta de audio.
   * Llega cuando se conecta/desconecta Bluetooth, auriculares, etc.
   */
  onAudioRouteChanged(callback: (data: { route: string; callId: string }) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('audioRouteChanged', callback);
    return () => sub.remove();
  },
};
