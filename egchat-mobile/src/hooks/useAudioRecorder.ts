// useAudioRecorder — grabación de audio para mensajes de voz
// Usa el módulo nativo (AAC 128kbps + AEC/ANS) cuando está disponible,
// con fallback a expo-av para web y Expo Go.
import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { NativeAudioRecorder } from '../native/NativeAudioRecorder';

export interface AudioRecording {
  uri: string;
  duration: number; // segundos
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0); // 0-32768 para forma de onda
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const ampTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup al desmontar
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (ampTimerRef.current) clearInterval(ampTimerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    // Muestrear amplitud cada 100ms para animar la onda
    ampTimerRef.current = setInterval(async () => {
      if (NativeAudioRecorder.isAvailable) {
        const amp = await NativeAudioRecorder.getAmplitude().catch(() => 0);
        setAmplitude(amp);
      }
    }, 100);
  }, []);

  const stopTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);    timerRef.current    = null; }
    if (ampTimerRef.current) { clearInterval(ampTimerRef.current); ampTimerRef.current = null; }
    setAmplitude(0);
  }, []);

  // ── Nativo (Android/iOS) ──────────────────────────────────────
  const startNative = useCallback(async (): Promise<boolean> => {
    try {
      await NativeAudioRecorder.start();
      setIsRecording(true);
      startTimer();
      return true;
    } catch { return false; }
  }, [startTimer]);

  const stopNative = useCallback(async (): Promise<AudioRecording | null> => {
    stopTimers();
    try {
      const result = await NativeAudioRecorder.stop();
      setIsRecording(false);
      setDuration(0);
      return { uri: result.uri, duration: result.duration };
    } catch {
      setIsRecording(false);
      setDuration(0);
      return null;
    }
  }, [stopTimers]);

  // ── Fallback expo-av (web / Expo Go) ─────────────────────────
  const startExpo = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') return false;
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      startTimer();
      return true;
    } catch { return false; }
  }, [startTimer]);

  const stopExpo = useCallback(async (): Promise<AudioRecording | null> => {
    if (!recordingRef.current) return null;
    stopTimers();
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const dur = duration;
      recordingRef.current = null;
      setIsRecording(false);
      setDuration(0);
      return uri ? { uri, duration: dur } : null;
    } catch {
      setIsRecording(false);
      setDuration(0);
      return null;
    }
  }, [duration, stopTimers]);

  // ── API pública ───────────────────────────────────────────────
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (NativeAudioRecorder.isAvailable) return startNative();
    return startExpo();
  }, [startNative, startExpo]);

  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    if (NativeAudioRecorder.isAvailable) return stopNative();
    return stopExpo();
  }, [stopNative, stopExpo]);

  const cancelRecording = useCallback(async () => {
    stopTimers();
    if (NativeAudioRecorder.isAvailable) {
      NativeAudioRecorder.cancel();
    } else if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
  }, [stopTimers]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return {
    isRecording,
    duration,
    amplitude,            // 0-32768 — para animar forma de onda en tiempo real
    durationFormatted: formatDuration(duration),
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
