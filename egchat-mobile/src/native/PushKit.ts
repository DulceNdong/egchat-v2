/**
 * EGChat — PushKit VoIP para iOS
 * Permite recibir llamadas entrantes incluso con la app cerrada.
 * El sistema iOS despierta la app, muestra la UI de CallKit y conecta la llamada.
 *
 * Uso en el _layout.tsx raíz:
 *   useEffect(() => {
 *     PushKit.register();
 *     const unsub = PushKit.onIncomingCall((data) => {
 *       router.push(`/call/${data.callId}?...`);
 *     });
 *     return unsub;
 *   }, []);
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { EGChatPushKitModule } = NativeModules;
const isAvailable = !!EGChatPushKitModule && Platform.OS === 'ios';
let emitter: NativeEventEmitter | null = null;
if (isAvailable) emitter = new NativeEventEmitter(EGChatPushKitModule);

export interface VoIPCallData {
  callId: string;
  callerName: string;
  callType: 'audio' | 'video';
  offer?: object;
  targetUserId?: string;
}

export const PushKit = {
  /** Registra el dispositivo para recibir VoIP push */
  register() {
    if (!isAvailable) return;
    EGChatPushKitModule.registerVoIP();
  },

  /** Escucha el token VoIP para subirlo al servidor */
  onTokenUpdated(callback: (token: string) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('voipTokenUpdated', ({ token }) => callback(token));
    return () => sub.remove();
  },

  /** Escucha llamadas entrantes recibidas via PushKit (app en background/cerrada) */
  onIncomingCall(callback: (data: VoIPCallData) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('voipPushReceived', callback);
    return () => sub.remove();
  },
};
