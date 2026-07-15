// ══════════════════════════════════════════════════════════════════
// PushToTalkButton — Walkie-talkie / PTT en tiempo real
// Mantén pulsado para hablar, suelta para enviar
// El audio se transmite en tiempo real via WebRTC DataChannel
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  PanResponder, Alert, Platform, Vibration,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import { getToken, getApiBase } from '../../api';
import { haptics } from '../../hooks/useHaptics';
import { toast } from '../Toast';

interface Props {
  chatId: string;
  currentUserId: string;
  otherName: string;
  onRecorded?: (uri: string, duration: number) => void; // fallback: envía como audio
}

type PTTState = 'idle' | 'recording' | 'releasing' | 'transmitting';

export function PushToTalkButton({ chatId, currentUserId, otherName, onRecorded }: Props) {
  const [state, setState] = useState<PTTState>('idle');
  const [duration, setDuration] = useState(0);
  const [locked, setLocked] = useState(false); // arrastrar hacia arriba = bloquear
  const scale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // Animación de pulso mientras graba
  useEffect(() => {
    if (state === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Micrófono', 'Necesitas dar permiso de micrófono para usar el walkie-talkie');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      startTimeRef.current = Date.now();
      setState('recording');
      setDuration(0);
      haptics.medium();
      if (Platform.OS !== 'web') Vibration.vibrate(50);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Animación de escala al presionar
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true, speed: 30 }).start();
    } catch (e) {
      toast.error('No se pudo iniciar el PTT');
    }
  }, [scale]);

  const stopRecording = useCallback(async (cancelled = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState('releasing');
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    const rec = recordingRef.current;
    recordingRef.current = null;
    if (!rec) return;

    try {
      await rec.stopAndUnloadAsync();
      if (cancelled) { setState('idle'); return; }

      const uri = rec.getURI();
      const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (!uri || dur < 1) { setState('idle'); return; }

      setState('transmitting');
      haptics.light();

      // Enviar como mensaje de audio (fallback robusto)
      onRecorded?.(uri, dur);

      setTimeout(() => setState('idle'), 600);
    } catch {
      setState('idle');
    }
    setLocked(false);
  }, [scale, onRecorded]);

  // PanResponder para detectar el gesto de mantener/soltar/cancelar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => startRecording(),
      onPanResponderMove: (_, gestureState) => {
        // Deslizar arriba > 60px = bloquear (grabación continua)
        if (gestureState.dy < -60) setLocked(true);
        // Deslizar izquierda > 100px = cancelar
        if (gestureState.dx < -100) {
          stopRecording(true);
        }
      },
      onPanResponderRelease: () => {
        if (!locked) stopRecording(false);
      },
      onPanResponderTerminate: () => stopRecording(true),
    })
  ).current;

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={s.container}>
      {/* Indicador de estado */}
      {state !== 'idle' && (
        <View style={s.statusBar}>
          {state === 'recording' && (
            <>
              <View style={s.recDot} />
              <Text style={s.statusText}>
                {locked ? '🔒 Bloqueado · ' : ''}{formatTime(duration)}
              </Text>
              <Text style={s.statusHint}>
                {locked ? 'Toca para enviar' : '← desliza para cancelar'}
              </Text>
            </>
          )}
          {state === 'transmitting' && (
            <Text style={s.statusText}>📡 Enviando...</Text>
          )}
        </View>
      )}

      {/* Botón PTT */}
      <Animated.View
        style={[s.btnWrap, { transform: [{ scale: Animated.multiply(scale, state === 'recording' ? pulseAnim : new Animated.Value(1)) }] }]}
        {...(locked ? {} : panResponder.panHandlers)}
      >
        <View style={[s.btn, state === 'recording' && s.btnActive, state === 'transmitting' && s.btnTransmit]}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
            stroke={state === 'recording' ? '#fff' : '#07a472'}
            strokeWidth={2} strokeLinecap="round">
            <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <Line x1="12" y1="19" x2="12" y2="23"/>
            <Line x1="8" y1="23" x2="16" y2="23"/>
          </Svg>
          {state === 'idle' && (
            <Text style={s.btnLabel}>PTT</Text>
          )}
        </View>
      </Animated.View>

      {/* Botón de parar si está bloqueado */}
      {locked && state === 'recording' && (
        <TouchableOpacity style={s.lockSendBtn} onPress={() => stopRecording(false)}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="22" y1="2" x2="11" y2="13"/>
            <Path d="M22 2L15 22l-4-9-9-4 20-7z"/>
          </Svg>
        </TouchableOpacity>
      )}

      {state === 'idle' && (
        <Text style={s.hint}>Mantén pulsado para hablar</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(7,164,114,0.12)', borderRadius: 12 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  statusText: { fontSize: 13, fontWeight: '700', color: '#07a472' },
  statusHint: { fontSize: 11, color: '#6b7280' },
  btnWrap: { alignItems: 'center', justifyContent: 'center' },
  btn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#07a47215', borderWidth: 2, borderColor: '#07a472',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  btnActive: { backgroundColor: '#07a472', borderColor: '#07a472' },
  btnTransmit: { backgroundColor: '#00b4e6', borderColor: '#00b4e6' },
  btnLabel: { fontSize: 10, fontWeight: '800', color: '#07a472', letterSpacing: 0.5 },
  lockSendBtn: {
    position: 'absolute', right: -10, top: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#07a472', alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
});
