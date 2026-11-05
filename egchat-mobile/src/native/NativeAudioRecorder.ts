/**
 * EGChat — Grabación de audio nativa de alta calidad
 * Android: MediaRecorder AAC 128kbps + VOICE_COMMUNICATION (AEC+ANS)
 * iOS:     AVAudioRecorder AAC 128kbps + AVAudioSession.Mode.voiceChat
 *
 * Fallback a expo-av si el módulo nativo no está disponible (web/Expo Go)
 *
 * Uso:
 *   const rec = useNativeAudioRecorder();
 *   await rec.start();
 *   const { uri, duration } = await rec.stop();
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatAudioRecorder } = NativeModules;
const isNativeAvailable = !!EGChatAudioRecorder && Platform.OS !== 'web';

export interface RecordingResult {
  uri: string;
  duration: number;   // segundos
  mimeType: string;
}

export const NativeAudioRecorder = {
  isAvailable: isNativeAvailable,

  async start(): Promise<{ path: string; recording: boolean }> {
    if (!isNativeAvailable) throw new Error('Módulo nativo no disponible');
    return EGChatAudioRecorder.startRecording();
  },

  async stop(): Promise<RecordingResult> {
    if (!isNativeAvailable) throw new Error('Módulo nativo no disponible');
    return EGChatAudioRecorder.stopRecording();
  },

  cancel(): void {
    if (!isNativeAvailable) return;
    EGChatAudioRecorder.cancelRecording();
  },

  /** Amplitud actual 0-32768 para animar forma de onda */
  async getAmplitude(): Promise<number> {
    if (!isNativeAvailable) return 0;
    return EGChatAudioRecorder.getAmplitude();
  },
};
