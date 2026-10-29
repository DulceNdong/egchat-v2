// ══════════════════════════════════════════════════════════════════
// Pantalla de llamada — WebRTC real con react-native-webrtc
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { EGAvatar } from '../../src/components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { useWebRTC, RTCView } from '../../src/hooks/useWebRTC';
import { getToken } from '../../src/api';
import { startRingtone, stopRingtone } from '../../src/hooks/useSounds';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com').replace(/\/+$/, '').replace(/\/api$/, '');
async function sigFetch(path: string) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export default function CallScreen() {
  const {
    callId, targetName, targetAvatar, callType, role,
    targetUserId, offer: offerParam,
  } = useLocalSearchParams<{
    callId: string;
    targetName: string;
    targetAvatar: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    targetUserId?: string;
    offer?: string;           // JSON string del offer (solo callee)
  }>();

  const {
    callState, isMuted, isCamOff,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera,
  } = useWebRTC();

  const [duration, setDuration] = useState(0);
  const [incomingPending, setIncomingPending] = useState(role === 'callee');
  const [accepting, setAccepting] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated = useRef(false);
  const acceptingRef = useRef(false);

  // Iniciar o responder llamada al montar
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    if (role === 'caller' && targetUserId) {
      startCall(callType as 'audio' | 'video', targetUserId).catch(err => {
        Alert.alert('Error', err.message || 'No se pudo iniciar la llamada');
        router.back();
      });
    } else if (role === 'callee') {
      startRingtone().catch(() => {});
    }
  }, []);

  useEffect(() => () => { stopRingtone().catch(() => {}); }, []);

  // Si otro dispositivo contesta, cerrar esta pantalla y parar el timbre.
  useEffect(() => {
    if (role !== 'callee' || !incomingPending || !callId) return;
    let stopped = false;
    let checking = false;
    const checkStatus = async () => {
      if (checking || stopped) return;
      checking = true;
      try {
        const session = await sigFetch(`/call/${callId}`);
        if ((session?.status && session.status !== 'ringing') || session?.answer) {
          if ((session.status === 'accepted' || session.answer) && acceptingRef.current) return;
          stopped = true;
          await stopRingtone().catch(() => {});
          setIncomingPending(false);
          router.back();
        }
      } catch {}
      finally { checking = false; }
    };
    checkStatus();
    const id = setInterval(checkStatus, 1800);
    return () => { stopped = true; clearInterval(id); };
  }, [callId, incomingPending, role]);

  // Pulso animado mientras suena
  useEffect(() => {
    if (incomingPending || callState === 'calling' || callState === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState, incomingPending]);

  // Contador de duración
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Cuando termina la llamada, volver atrás
  useEffect(() => {
    if (callState === 'ended') {
      setTimeout(() => router.back(), 800);
    }
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const hangUp = useCallback(async () => {
    if (role === 'callee' && incomingPending) {
      const token = await getToken();
      try {
        await fetch(`${API_BASE}/api/call/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ callId }),
        });
      } catch {}
      await stopRingtone().catch(() => {});
      router.back();
      return;
    }
    await endCall();
    router.back();
  }, [callId, endCall, incomingPending, role]);

  const accept = useCallback(async () => {
    if (accepting) return;
    setAccepting(true);
    acceptingRef.current = true;
    await stopRingtone().catch(() => {});
    try {
      let offer: any = null;
      if (offerParam) { try { offer = JSON.parse(offerParam); } catch {} }
      if (!offer) offer = (await sigFetch(`/call/${callId}`))?.offer;
      await answerCall(callId, offer, callType as 'audio' | 'video');
      setIncomingPending(false);
    } catch (error: any) {
      setAccepting(false);
      acceptingRef.current = false;
      await startRingtone().catch(() => {});
      if (String(error?.message || '').includes('(409)')) {
        await stopRingtone().catch(() => {});
        router.back();
        return;
      }
      Alert.alert('No se pudo aceptar', error?.message || 'Comprueba tu conexión y vuelve a intentarlo.');
    }
  }, [accepting, answerCall, callId, callType, offerParam]);

  const statusLabel = () => {
    if (incomingPending) return `Llamada entrante (${callType === 'video' ? '📹 Video' : '📞 Audio'})`;
    if (callState === 'calling') return role === 'callee' ? 'Conectando...' : 'Llamando...';
    if (callState === 'ringing') return 'Conectando...';
    if (callState === 'connected') return formatDuration(duration);
    if (callState === 'ended') return 'Llamada finalizada';
    return '...';
  };

  const isRinging = incomingPending || callState === 'calling' || callState === 'ringing';
  const isConnected = callState === 'connected';

  return (
    <SafeAreaView style={styles.container}>
      {/* Video remoto (fondo completo) */}
      {callType === 'video' && remoteStream && (
        <RTCView
          streamURL={(remoteStream as any).toURL?.() || ''}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={false}
        />
      )}

      {/* Video local (esquina) */}
      {callType === 'video' && localStream && isConnected && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={(localStream as any).toURL?.() || ''}
            style={styles.localVideo}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      {/* Overlay oscuro para llamadas de audio o cuando no hay video remoto */}
      {(callType === 'audio' || !remoteStream) && (
        <View style={styles.audioOverlay} />
      )}

      {/* Avatar y nombre */}
      <View style={styles.top}>
        <Animated.View style={{ transform: [{ scale: isRinging ? pulseAnim : 1 }] }}>
          <EGAvatar src={targetAvatar} name={targetName || 'Usuario'} size={100} />
        </Animated.View>
        <Text style={styles.name}>{targetName || 'Usuario'}</Text>
        <Text style={styles.status}>{statusLabel()}</Text>

        {callType === 'video' && !remoteStream && isConnected && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>📹 Esperando video...</Text>
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {isConnected && (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={toggleMute}
            >
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>{isMuted ? 'Activar' : 'Silenciar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isCamOff && styles.controlBtnActive]}
              onPress={callType === 'video' ? toggleCamera : undefined}
              disabled={callType === 'audio'}
            >
              <Text style={styles.controlIcon}>{callType === 'video' ? (isCamOff ? '📷' : '📹') : '🔊'}</Text>
              <Text style={styles.controlLabel}>{callType === 'video' ? (isCamOff ? 'Cámara' : 'Apagar') : 'Altavoz'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Callee: aceptar / rechazar */}
        {incomingPending && role === 'callee' && (
          <View style={styles.incomingRow}>
            <View style={styles.incomingBtnWrap}>
              <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={accept}>
                <Text style={styles.callBtnIcon}>📞</Text>
              </TouchableOpacity>
              <Text style={styles.incomingLabel}>Aceptar</Text>
            </View>
            <View style={styles.incomingBtnWrap}>
              <TouchableOpacity style={[styles.callBtn, styles.hangBtn]} onPress={hangUp}>
                <Text style={styles.callBtnIcon}>📵</Text>
              </TouchableOpacity>
              <Text style={styles.incomingLabel}>Rechazar</Text>
            </View>
          </View>
        )}

        {/* Colgar */}
        {(isConnected || (isRinging && role === 'caller')) && (
          <TouchableOpacity
            style={[styles.callBtn, styles.hangBtn, { alignSelf: 'center' }]}
            onPress={hangUp}
          >
            <Text style={styles.callBtnIcon}>📵</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1923',
    justifyContent: 'space-between',
    paddingVertical: Spacing['3xl'],
  },
  audioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f1923',
  },
  top: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing['3xl'],
    zIndex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  status: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
  },
  videoPlaceholder: {
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  videoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: { flex: 1 },
  controls: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    zIndex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  controlBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    width: 72,
    height: 72,
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: Colors.accent },
  controlIcon: { fontSize: 26 },
  controlLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  incomingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  incomingBtnWrap: { alignItems: 'center', gap: Spacing.xs },
  incomingLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },
  callBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  hangBtn: { backgroundColor: '#ef4444' },
  callBtnIcon: { fontSize: 28 },
});
