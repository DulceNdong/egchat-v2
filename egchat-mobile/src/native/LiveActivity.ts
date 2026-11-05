/**
 * EGChat — Live Activity iOS 16.2+
 * Muestra duración de llamada en la Dynamic Island y pantalla bloqueada.
 * Solo disponible en iOS 16.2+. No hace nada en Android o versiones anteriores.
 *
 * Uso en la pantalla de llamada:
 *   useEffect(() => {
 *     LiveActivity.startCall(callId, callerName, isVideo);
 *     return () => LiveActivity.endCall();
 *   }, []);
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatLiveActivityModule } = NativeModules;
const isAvailable = !!EGChatLiveActivityModule && Platform.OS === 'ios';

export const LiveActivity = {
  /** Inicia la barra de llamada activa */
  startCall(callId: string, callerName: string, isVideo: boolean) {
    if (!isAvailable) return;
    EGChatLiveActivityModule.startCallActivity(callId, callerName, isVideo);
  },

  /** Actualiza el contador manualmente (el módulo lo hace auto cada 1s) */
  update(seconds: number) {
    if (!isAvailable) return;
    EGChatLiveActivityModule.updateCallActivity(seconds);
  },

  /** Termina y descarta la barra */
  endCall() {
    if (!isAvailable) return;
    EGChatLiveActivityModule.endCallActivity();
  },
};
