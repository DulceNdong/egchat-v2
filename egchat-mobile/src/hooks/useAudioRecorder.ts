// useAudioRecorder — grabación de audio para mensajes de voz
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface AudioRecording {
  uri: string;
  duration: number; // segundos
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') return false;

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      return true;
    } catch {
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    if (!recordingRef.current) return null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const dur = duration;

      recordingRef.current = null;
      setIsRecording(false);
      setDuration(0);

      if (!uri) return null;
      return { uri, duration: dur };
    } catch {
      setIsRecording(false);
      setDuration(0);
      return null;
    }
  }, [duration]);

  const cancelRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return {
    isRecording,
    duration,
    durationFormatted: formatDuration(duration),
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
