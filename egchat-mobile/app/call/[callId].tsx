// Pantalla de llamada — paridad App.tsx renderActiveCall + incoming call modal
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Line, Rect, Polygon, Polyline } from 'react-native-svg';
import { EGAvatar } from '../../src/components/ui';
import { useWebRTC, RTCView } from '../../src/hooks/useWebRTC';
import { LiveActivity } from '../../src/native/LiveActivity';
import { NativeCallKit } from '../../src/native/CallKit';
import { Audio } from 'expo-av';
import { FaceFilterOverlay } from '../../src/components/FaceFilterOverlay';
import { FaceFilter, FILTERS, type FilterId, type FaceData } from '../../src/native/FaceFilter';
import { startRingtone, stopRingtone } from '../../src/hooks/useSounds';

const ACCENT = '#00c8a0';

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
    offer?: string;
  }>();

  const {
    callState, isMuted, isCamOff, isSignalingOnly,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera,
  } = useWebRTC();

  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 300, height: 400 });

  // ── FASE 3: FaceFilter AR ─────────────────────────────────────────
  const [faces, setFaces] = useState<FaceData[]>([]);
  const faceDetectorRef = useRef(false);   // true cuando FaceFilter ya está inicializado
  const faceFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicializar detector cuando hay videollamada
  useEffect(() => {
    if (!FaceFilter.isAvailable || !isVideo) return;

    FaceFilter.initialize().then(ok => {
      faceDetectorRef.current = ok;
    });

    return () => {
      FaceFilter.release();
      faceDetectorRef.current = false;
    };
  // isVideo proviene de callType, estable durante la llamada
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Iniciar/detener el loop de detección según filtro activo
  useEffect(() => {
    if (faceFrameRef.current) {
      clearInterval(faceFrameRef.current);
      faceFrameRef.current = null;
    }

    if (
      activeFilter === 'none' ||
      !FaceFilter.isAvailable ||
      !faceDetectorRef.current ||
      !localStream
    ) {
      setFaces([]);
      return;
    }

    // Capturar frame del stream local cada 200ms (≈5fps — suficiente para filtros)
    faceFrameRef.current = setInterval(async () => {
      try {
        // Obtener frame como base64 desde el stream nativo si es posible
        const stream = localStream as any;
        if (!stream?.captureFrame) return;
        const base64 = await stream.captureFrame();
        if (!base64) return;
        const detected = await FaceFilter.detectFaces(base64);
        setFaces(detected);
      } catch {
        // Frame no disponible — no crashear
      }
    }, 200);

    return () => {
      if (faceFrameRef.current) {
        clearInterval(faceFrameRef.current);
        faceFrameRef.current = null;
      }
    };
  }, [activeFilter, localStream]);
  // ── Fin FASE 3 ────────────────────────────────────────────────────

  // Routing de audio real al altavoz
  const toggleSpeaker = useCallback(async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: !next, // false=altavoz, true=auricular
        });
      } catch {}
    }
  }, [speakerOn]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated = useRef(false);
  const topOffset = insets.top + 14;
  const contentOffset = insets.top + 56;

  const isVideo = callType === 'video';
  const name = targetName || 'Usuario';
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EG';

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    if (role === 'caller' && targetUserId) {
      startCall(callType as 'audio' | 'video', targetUserId, callId).catch(err => {
        Alert.alert('Error', err.message || 'No se pudo iniciar la llamada');
        router.back();
      });
    }
  }, []);

  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
      dotAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 150),
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
          ]),
        ).start();
      });
    } else {
      pulseAnim.setValue(1);
      dotAnims.forEach(a => a.setValue(0.4));
    }
  }, [callState]);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      // Iniciar Live Activity en iOS cuando la llamada se conecta
      LiveActivity.startCall(callId, name, isVideo);
      // Cerrar notificación nativa de llamada entrante (si estaba visible)
      NativeCallKit.dismissIncomingCall();
      stopRingtone().catch(() => {});
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    if (callState === 'ended') {
      // Terminar Live Activity al colgar
      LiveActivity.endCall();
      NativeCallKit.endCall(callId);
      stopRingtone().catch(() => {});
      setTimeout(() => router.back(), 800);
    }
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const hangUp = useCallback(async () => {
    await stopRingtone().catch(() => {});
    await endCall();
    router.back();
  }, [endCall]);

  const accept = useCallback(async () => {
    if (!callId) return;
    try {
      let offer: any = offerParam;
      if (typeof offerParam === 'string') {
        try { offer = JSON.parse(offerParam); } catch { /* ignore */ }
      }
      await answerCall(callId, offer, callType as 'audio' | 'video');
    } catch {
      Alert.alert('Error', 'No se pudo aceptar la llamada');
    }
  }, [callId, offerParam, callType, answerCall]);

  // ── FASE 4: CallKit nativo — mostrar UI de llamada entrante ──────
  // Cuando la pantalla carga en modo callee+idle (llamada entrante),
  // mostramos la UI nativa de CallKit (iOS) / notificación full-screen (Android).
  // Así el usuario ve la interfaz nativa del SO aunque la app esté en foreground.
  useEffect(() => {
    if (role === 'callee' && callState === 'idle') {
      NativeCallKit.showIncomingCall(name, targetAvatar || '', callId, isVideo);
    }
    // Escuchar si el usuario acepta/rechaza desde la UI nativa
    const unsubAnswer = NativeCallKit.onAnswer((_cid) => {
      accept();
    });
    const unsubReject = NativeCallKit.onReject((_cid) => {
      hangUp();
    });
    return () => {
      unsubAnswer();
      unsubReject();
    };
  // Solo al montar — callId/role/name son estables
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Fin FASE 4 ────────────────────────────────────────────────────

  const uiState = role === 'callee' && callState === 'idle' ? 'ringing' : callState;
  const isIncoming = uiState === 'ringing' && role === 'callee';
  const isCalling = uiState === 'calling' || (uiState === 'ringing' && role === 'caller');
  const isConnected = uiState === 'connected';

  useEffect(() => {
    if (isIncoming) {
      startRingtone().catch(() => {});
    } else {
      stopRingtone().catch(() => {});
    }
    return () => { stopRingtone().catch(() => {}); };
  }, [isIncoming]);

  const statusLabel = () => {
    if (isCalling) return 'Llamando...';
    if (isConnected) return formatDuration(duration);
    if (uiState === 'ended') return 'Llamada finalizada';
    return 'Conectando...';
  };

  const remoteUrl = remoteStream ? (remoteStream as any).toURL?.() || '' : '';
  const localUrl = localStream ? (localStream as any).toURL?.() || '' : '';

  // ── Modal llamada entrante (paridad web incomingCall card) ───────
  if (isIncoming) {
    return (
      <Modal visible transparent animationType="fade" statusBarTranslucent>
        <View style={s.incomingOverlay}>
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={s.incomingCard}>
            <View style={s.incomingAvatarRing}>
              <EGAvatar src={targetAvatar} name={name} size={84} />
            </View>
            <Text style={s.incomingName}>{name}</Text>
            <View style={s.incomingTypeRow}>
              {isVideo ? (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round">
                    <Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/>
                  </Svg>
                  <Text style={s.incomingType}>Videollamada entrante</Text>
                </>
              ) : (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </Svg>
                  <Text style={s.incomingType}>Llamada de voz entrante</Text>
                </>
              )}
            </View>
            <View style={s.incomingDots}>
              {dotAnims.map((anim, i) => (
                <Animated.View key={i} style={[s.incomingDot, { opacity: anim }]} />
              ))}
            </View>
            <View style={s.incomingActions}>
              <View style={s.incomingActionCol}>
                <TouchableOpacity style={s.rejectBtn} onPress={hangUp} activeOpacity={0.85}>
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8"/>
                    <Line x1="23" y1="1" x2="1" y2="23"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={s.incomingActionLabel}>Rechazar</Text>
              </View>
              <View style={s.incomingActionCol}>
                <TouchableOpacity style={s.acceptBtn} onPress={accept} activeOpacity={0.85}>
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={s.incomingActionLabel}>Aceptar</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  }

  // ── Pantalla activa (paridad renderActiveCall web) ───────────────
  return (
    <View style={s.root}>
      {isVideo ? (
        <View style={s.videoBg}>
          {remoteUrl ? (
            <RTCView streamURL={remoteUrl} style={s.remoteVideo} objectFit="cover" mirror={false} />
          ) : (
            <View style={s.remotePlaceholder}>
              <View style={[s.avatarCircle, { borderColor: `${ACCENT}99` }]}>
                <Text style={s.initials}>{initials}</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {isSignalingOnly && (
        <View style={[s.signalingBanner, { paddingTop: insets.top }]}>
          <Text style={s.signalingText}>
            Expo Go no incluye WebRTC nativo. Usa EAS Dev Client para audio/video reales.
          </Text>
        </View>
      )}

      {/* Minimizar */}
      <TouchableOpacity
        style={[s.minimizeBtn, { top: topOffset }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} strokeLinecap="round">
          <Polyline points="18 15 12 9 6 15"/>
        </Svg>
        <Text style={s.minimizeText}>Minimizar</Text>
      </TouchableOpacity>

      {/* Video local PiP */}
      {isVideo && localStream && !isCamOff && (
        <View style={[s.localPip, { top: topOffset + 62 }]}>
          <RTCView streamURL={localUrl} style={s.localVideo} objectFit="cover" mirror />
        </View>
      )}

      {/* Info contacto */}
      <View style={[s.infoBlock, { marginTop: contentOffset }]}> 
        {(!isVideo || !remoteUrl) && (
          <View style={[s.avatarCircle, { borderColor: `${ACCENT}99`, marginBottom: 14 }]}>
            {targetAvatar ? (
              <EGAvatar src={targetAvatar} name={name} size={74} />
            ) : (
              <Text style={s.initials}>{initials}</Text>
            )}
          </View>
        )}
        <Text style={s.contactName}>{name}</Text>
        <View style={s.statusRow}>
          {isCalling && (
            <Animated.View style={[s.statusDot, { transform: [{ scale: pulseAnim }] }]} />
          )}
          <Text style={s.statusText}>{statusLabel()}</Text>
        </View>
        <Text style={s.callTypeLabel}>{isVideo ? 'Videollamada' : 'Llamada de voz'}</Text>
      </View>

      {/* Controles inferiores */}
      <SafeAreaView edges={['bottom']} style={s.controlsWrap}>
        <View style={s.controlsRow}>
          {/* Silenciar */}
          <TouchableOpacity
            style={[s.ctrlBtn, isMuted && s.ctrlBtnDanger]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isMuted ? (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <Line x1="1" y1="1" x2="23" y2="23"/>
                <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/>
              </Svg>
            ) : (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/>
              </Svg>
            )}
          </TouchableOpacity>

          {/* Colgar — botón central rojo */}
          <TouchableOpacity onPress={hangUp} activeOpacity={0.85}>
            <LinearGradient colors={['#ff3b30', '#c0392b']} style={s.hangupBtn}>
              <Svg width={30} height={30} viewBox="0 0 24 24" fill="#fff">
                <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
              </Svg>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cámara o altavoz + botón filtros */}
          {isVideo ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[s.ctrlBtn, isCamOff && s.ctrlBtnDanger]}
                onPress={toggleCamera}
                activeOpacity={0.8}
              >
                {isCamOff ? (
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                    <Line x1="1" y1="1" x2="23" y2="23"/>
                    <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
                  </Svg>
                ) : (
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                    <Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/>
                  </Svg>
                )}
              </TouchableOpacity>
              {/* Botón filtros AR */}
              <TouchableOpacity
                style={[s.ctrlBtn, showFilters && s.ctrlBtnActive]}
                onPress={() => setShowFilters(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>✨</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.ctrlBtn, speakerOn && s.ctrlBtnActive]}
              onPress={toggleSpeaker}
              activeOpacity={0.8}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <Path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <Path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Selector de filtros AR — solo en videollamada */}
        {isVideo && showFilters && (
          <View style={s.filtersRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[s.filterChip, activeFilter === f.id && s.filterChipActive]}
                onPress={() => { setActiveFilter(f.id); setShowFilters(false); }}
                activeOpacity={0.8}
              >
                <Text style={s.filterEmoji}>{f.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>

      {/* Overlay de face filter sobre el video */}
      {isVideo && activeFilter !== 'none' && (
        <FaceFilterOverlay
          faces={faces}
          filterId={activeFilter}
          width={videoSize.width}
          height={videoSize.height}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Incoming modal
  incomingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  incomingCard: {
    width: 280,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
  },
  incomingAvatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(0,200,160,0.5)',
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  incomingName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  incomingTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  incomingType: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  incomingDots: { flexDirection: 'row', gap: 4, marginBottom: 24, marginTop: 8 },
  incomingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  incomingActions: { flexDirection: 'row', gap: 24 },
  incomingActionCol: { alignItems: 'center', gap: 8 },
  rejectBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  acceptBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  incomingActionLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // Active call
  videoBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
  remoteVideo: { flex: 1 },
  remotePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  signalingBanner: {
    position: 'absolute', left: 0, right: 0, zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 16, paddingBottom: 8,
  },
  signalingText: { color: '#fff', fontSize: 11, textAlign: 'center' },
  minimizeBtn: {
    position: 'absolute', left: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14, paddingVertical: 7, paddingHorizontal: 13,
  },
  minimizeText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  localPip: {
    position: 'absolute', right: 16, width: 90, height: 120,
    borderRadius: 12, overflow: 'hidden', zIndex: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: '#222',
  },
  localVideo: { flex: 1 },
  infoBlock: { alignItems: 'center', zIndex: 5, paddingHorizontal: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, backgroundColor: `${ACCENT}30`,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  initials: { fontSize: 28, fontWeight: '700', color: ACCENT },
  contactName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5ff',
  },
  statusText: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  callTypeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  controlsWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 28, paddingBottom: Platform.OS === 'ios' ? 8 : 24,
    paddingHorizontal: 16,
  },
  ctrlBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  hangupBtn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  // Face filters
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  filterChip: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0,200,160,0.4)',
    borderColor: '#00c8a0',
  },
  filterEmoji: { fontSize: 20 },
});
