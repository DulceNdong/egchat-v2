// ══════════════════════════════════════════════════════════════════
// Pantalla de llamada — diseño moderno estilo asiático / glassmorphism
// Audio + Video | Mini ventana PiP | Navegar chats en llamada | Fondo personalizable
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform,
  Image, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Line, Rect, Polygon, Circle } from 'react-native-svg';
import { EGAvatar } from '../../src/components/ui';
import { useWebRTC, RTCView } from '../../src/hooks/useWebRTC';
import { LiveActivity } from '../../src/native/LiveActivity';
import { NativeCallKit } from '../../src/native/CallKit';
import { Audio } from 'expo-av';
import { FaceFilterOverlay } from '../../src/components/FaceFilterOverlay';
import { FaceFilter, FILTERS, type FilterId, type FaceData } from '../../src/native/FaceFilter';

// Guard: si el módulo nativo no está disponible, no crashear
const FACE_FILTER_AVAILABLE = (() => {
  try { return !!FaceFilter?.isAvailable; } catch { return false; }
})();
import { startRingtone, stopRingtone, startDialingTone, stopDialingTone } from '../../src/hooks/useSounds';
import { callAPI } from '../../src/api';
import {
  CallBackgroundPicker,
  loadCallBackground,
  type CallBackground,
  PRESET_BACKGROUNDS,
} from '../../src/components/call/CallBackgroundPicker';
import { useActiveCall } from '../../src/context/ActiveCallContext';

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT    = '#00c8a0';
const GLASS_BG  = 'rgba(30,30,60,0.75)';
const GLASS_BORDER = 'rgba(255,255,255,0.18)';

// ── Botón glassmorphism ───────────────────────────────────────────
function GlassBtn({
  onPress, icon, label, active, danger, size = 58,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  danger?: boolean;
  size?: number;
}) {
  return (
    <TouchableOpacity style={gb.wrap} onPress={onPress} activeOpacity={0.75}>
      <View style={[
        gb.btn,
        { width: size, height: size, borderRadius: size / 2 },
        active  && gb.btnActive,
        danger  && gb.btnDanger,
      ]}>
        {icon}
      </View>
      {!!label && <Text style={gb.label}>{label}</Text>}
    </TouchableOpacity>
  );
}
const gb = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 5, minWidth: 64 },
  btn: {
    backgroundColor: GLASS_BG,
    borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  btnActive: { backgroundColor: 'rgba(0,200,160,0.35)', borderColor: ACCENT },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.35)', borderColor: '#ef4444' },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', textAlign: 'center' },
});

// ── Iconos ────────────────────────────────────────────────────────
const IC = {
  mic: (off?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      {off && <Line x1="1" y1="1" x2="23" y2="23"/>}
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <Line x1="12" y1="19" x2="12" y2="23"/>
      <Line x1="8" y1="23" x2="16" y2="23"/>
    </Svg>
  ),
  speaker: (on?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      {on ? (
        <><Path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><Path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
      ) : (
        <Line x1="23" y1="9" x2="17" y2="15"/>
      )}
    </Svg>
  ),
  video: (off?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      {off ? (
        <><Line x1="1" y1="1" x2="23" y2="23"/>
          <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
        </>
      ) : (
        <><Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/></>
      )}
    </Svg>
  ),
  addUser: () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <Circle cx="8.5" cy="7" r="4"/>
      <Line x1="20" y1="8" x2="20" y2="14"/><Line x1="23" y1="11" x2="17" y2="11"/>
    </Svg>
  ),
  chat: () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </Svg>
  ),
  more: () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="5" r="1" fill="#fff"/>
      <Circle cx="12" cy="12" r="1" fill="#fff"/>
      <Circle cx="12" cy="19" r="1" fill="#fff"/>
    </Svg>
  ),
  hangup: (small?: boolean) => {
    const sz = small ? 20 : 28;
    return (
      <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="#fff">
        <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
      </Svg>
    );
  },
  phone: () => (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </Svg>
  ),
  reject: () => (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8"/>
      <Line x1="23" y1="1" x2="1" y2="23"/>
    </Svg>
  ),
  expand: () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </Svg>
  ),
  bg: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Rect x="3" y="3" width="18" height="18" rx="2"/>
      <Circle cx="8.5" cy="8.5" r="1.5"/>
      <Path d="M21 15l-5-5L5 21"/>
    </Svg>
  ),
};

// ════════════════════════════════════════════════════════════════════
export default function CallScreen() {
  const {
    callId, targetName, targetAvatar, callType, role,
    targetUserId, offer: offerParam,
  } = useLocalSearchParams<{
    callId: string; targetName: string; targetAvatar: string;
    callType: 'audio' | 'video'; role: 'caller' | 'callee';
    targetUserId?: string; offer?: string;
  }>();

  const {
    callState, isMuted, isCamOff, isSignalingOnly,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera,
  } = useWebRTC();

  const insets = useSafeAreaInsets();
  const { setActiveCall, setIsPip: setGlobalPip } = useActiveCall();

  // Estado principal

  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims  = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated = useRef(false);
  const screenStreamRef = useRef<any>(null);

  // FaceFilter
  const [faces, setFaces] = useState<FaceData[]>([]);
  const faceDetectorRef = useRef(false);
  const faceFrameRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const isVideo   = callType === 'video';
  const name      = targetName || 'Usuario';
  const remoteUrl = remoteStream ? (remoteStream as any).toURL?.() || '' : '';
  const localUrl  = localStream  ? (localStream  as any).toURL?.() || '' : '';

  // Cargar fondo guardado al montar
  useEffect(() => { loadCallBackground().then(setBg); }, []);

  // FaceFilter init — solo si el módulo nativo está disponible
  useEffect(() => {
    if (!FACE_FILTER_AVAILABLE || !isVideo) return;
    try {
      FaceFilter.initialize().then((ok: boolean) => { faceDetectorRef.current = ok; });
    } catch {}
    return () => {
      try { FaceFilter.release(); } catch {}
      faceDetectorRef.current = false;
    };
  }, []);

  // Loop detección faces
  useEffect(() => {
    if (faceFrameRef.current) { clearInterval(faceFrameRef.current); faceFrameRef.current = null; }
    if (!FACE_FILTER_AVAILABLE || activeFilter === 'none' || !faceDetectorRef.current || !localStream) {
      setFaces([]); return;
    }
    faceFrameRef.current = setInterval(async () => {
      try {
        const s = localStream as any;
        if (!s?.captureFrame) return;
        const b64 = await s.captureFrame();
        if (!b64) return;
        setFaces(await FaceFilter.detectFaces(b64));
      } catch {}
    }, 200);
    return () => { if (faceFrameRef.current) { clearInterval(faceFrameRef.current); faceFrameRef.current = null; } };
  }, [activeFilter, localStream]);

  // Screen share
  const toggleScreenShare = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      if (isSharingScreen) {
        screenStreamRef.current?.getTracks?.().forEach((t: any) => t.stop());
        screenStreamRef.current = null;
        setIsSharingScreen(false);
        return;
      }
      const { mediaDevices } = require('react-native-webrtc');
      if (!mediaDevices?.getDisplayMedia) {
        Alert.alert('No disponible', 'Requiere Android 10+ y build nativo.');
        return;
      }
      screenStreamRef.current = await mediaDevices.getDisplayMedia({ video: true });
      setIsSharingScreen(true);
    } catch (e: any) {
      if (e?.message?.includes('cancel') || e?.message?.includes('denied')) return;
      Alert.alert('Error', 'No se pudo compartir la pantalla.');
    }
  }, [isSharingScreen]);

  // Altavoz
  const toggleSpeaker = useCallback(async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: !next,
        });
      } catch {}
    }
  }, [speakerOn]);

  // Iniciar llamada (caller)
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    if (role === 'caller' && targetUserId) {
      // Ringtone de marcado para el caller
      startDialingTone().catch(() => {});
      startCall(callType as 'audio' | 'video', targetUserId, callId).catch(err => {
        stopDialingTone();
        Alert.alert('Error', err.message || 'No se pudo iniciar la llamada');
        router.back();
      });
    }
  }, []);

  // Animaciones
  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])).start();
      dotAnims.forEach((a, i) => {
        Animated.loop(Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(a, { toValue: 1,   duration: 500, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])).start();
      });
    } else {
      pulseAnim.setValue(1);
      dotAnims.forEach(a => a.setValue(0.4));
    }
  }, [callState]);

  // Timer + conectado
  useEffect(() => {
    if (callState === 'connected') {
      stopDialingTone();
      stopRingtone().catch(() => {});
      // Registrar llamada activa en contexto global
      setActiveCall({
        callId, targetName: name, targetAvatar,
        callType: callType as 'audio' | 'video', duration: 0,
      });
      timerRef.current = setInterval(() => {
        setDuration(d => {
          const next = d + 1;
          // Actualizar duración en contexto global
          setActiveCall(prev => prev ? { ...prev, duration: next } : null);
          return next;
        });
      }, 1000);
      LiveActivity.startCall(callId, name, isVideo);
      NativeCallKit.dismissIncomingCall();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Fin de llamada
  useEffect(() => {
    if (callState === 'ended') {
      stopDialingTone();
      LiveActivity.endCall();
      NativeCallKit.endCall(callId);
      stopRingtone().catch(() => {});
      setActiveCall(null);
      setGlobalPip(false);
      setTimeout(() => router.back(), 800);
    }
  }, [callState]);

  // CallKit handlers
  useEffect(() => {
    if (role === 'callee' && callState === 'idle') {
      NativeCallKit.showIncomingCall(name, targetAvatar || '', callId, isVideo);
    }
    const unsubAnswer = NativeCallKit.onAnswer(() => accept());
    const unsubReject = NativeCallKit.onReject(() => hangUp());
    return () => { unsubAnswer(); unsubReject(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estados UI
  const uiState    = role === 'callee' && callState === 'idle' ? 'ringing' : callState;
  const isIncoming  = uiState === 'ringing' && role === 'callee';
  const isCalling   = uiState === 'calling' || (uiState === 'ringing' && role === 'caller');
  const isConnected = uiState === 'connected';

  // Ringtone para el callee
  useEffect(() => {
    if (isIncoming) startRingtone().catch(() => {});
    else stopRingtone().catch(() => {});
    return () => { stopRingtone().catch(() => {}); };
  }, [isIncoming]);

  // Ringtone de llamada saliente (caller escucha un tono de espera)
  useEffect(() => {
    if (isCalling && role === 'caller') {
      startRingtone().catch(() => {});
    } else {
      stopRingtone().catch(() => {});
    }
  }, [isCalling]);

  const formatDur = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  const statusLabel = () => {
    if (isCalling)   return 'Llamando...';
    if (isConnected) return formatDur(duration);
    if (uiState === 'ended') return 'Llamada finalizada';
    return 'Conectando...';
  };

  const hangUp = useCallback(async () => {
    stopDialingTone();
    await stopRingtone().catch(() => {});
    await endCall();
    router.back();
  }, [endCall]);

  const accept = useCallback(async () => {
    if (!callId) return;
    try {
      let offer: any = offerParam;
      if (typeof offer === 'string') { try { offer = JSON.parse(offer); } catch {} }
      if (typeof offer === 'string') { try { offer = JSON.parse(offer); } catch {} }
      if (!offer || typeof offer !== 'object' || !offer.type || !offer.sdp) {
        const session = await callAPI.get(callId);
        if (session?.offer) offer = session.offer;
        else throw new Error('No se encontró el offer de la llamada');
      }
      await answerCall(callId, offer, callType as 'audio' | 'video');
    } catch (err: any) {
      Alert.alert('No se pudo recibir la llamada', err?.message || 'Verifica tu conexión e inténtalo de nuevo.');
    }
  }, [callId, offerParam, callType, answerCall]);

  // ── Botón Mensaje: activa PiP global y navega a lista de chats ──
  const openMessageMode = useCallback(() => {
    setGlobalPip(true);
    router.push('/(tabs)/mensajeria' as any);
  }, [setGlobalPip]);

  // Restaurar pantalla completa desde PiP
  const expandFromPip = useCallback(() => {
    setGlobalPip(false);
    router.push(`/call/${callId}` as any);
  }, [callId, setGlobalPip]);

  // ── Fondo ─────────────────────────────────────────────────────────
  const renderBg = () => {
    if (isVideo && remoteUrl) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <RTCView streamURL={remoteUrl} style={StyleSheet.absoluteFill} objectFit="cover" mirror={false}/>
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.25, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }
    if (bg.type === 'custom' && bg.uri) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: bg.uri }} style={StyleSheet.absoluteFill} resizeMode="cover"/>
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill}/>
        </View>
      );
    }
    const grad = bg.gradient || PRESET_BACKGROUNDS[1].gradient;
    return (
      <View style={StyleSheet.absoluteFill}>
        {targetAvatar ? (
          <Image
            source={{ uri: targetAvatar }}
            style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
            resizeMode="cover"
            blurRadius={22}
          />
        ) : null}
        <LinearGradient colors={grad} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill}/>
      </View>
    );
  };

  // ── PANTALLA LLAMADA ENTRANTE ────────────────────────────────────
  if (isIncoming) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
        {renderBg()}
        {/* Overlay oscuro */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.incomingWrap, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 50 }]}>
          {/* Avatar grande con glow */}
          <View style={s.incomingAvatarWrap}>
            <Animated.View style={[s.incomingPulse, { transform: [{ scale: pulseAnim }] }]}/>
            <View style={s.incomingRing}>
              <EGAvatar src={targetAvatar} name={name} size={114}/>
            </View>
          </View>

          <Text style={s.incomingName}>{name}</Text>
          <View style={s.incomingTypeRow}>
            {isVideo ? IC.video() : IC.phone()}
            <Text style={s.incomingType}>{isVideo ? 'Videollamada entrante' : 'Llamada de voz entrante'}</Text>
          </View>

          <View style={s.dotsRow}>
            {dotAnims.map((a, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: a }]}/>
            ))}
          </View>

          <View style={s.incomingActions}>
            <View style={s.actionCol}>
              <TouchableOpacity style={s.rejectBtn} onPress={hangUp} activeOpacity={0.85}>
                {IC.reject()}
              </TouchableOpacity>
              <Text style={s.actionLabel}>Rechazar</Text>
            </View>
            <View style={s.actionCol}>
              <TouchableOpacity style={s.acceptBtn} onPress={accept} activeOpacity={0.85}>
                {IC.phone()}
              </TouchableOpacity>
              <Text style={s.actionLabel}>Aceptar</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── PANTALLA LLAMADA ACTIVA ──────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      {renderBg()}

      {/* ── Top bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.glassChip} onPress={() => router.back()} activeOpacity={0.8}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} strokeLinecap="round">
            <Path d="M18 15 12 9 6 15"/>
          </Svg>
          <Text style={s.chipText}>Minimizar</Text>
        </TouchableOpacity>

        {isConnected && (
          <View style={s.timerChip}>
            <View style={s.timerDot}/>
            <Text style={s.timerText}>{formatDur(duration)}</Text>
          </View>
        )}

        <TouchableOpacity style={s.glassIconBtn} onPress={() => setShowBgPicker(true)} activeOpacity={0.8}>
          {IC.bg()}
        </TouchableOpacity>
      </View>

      {/* ── PiP video local ── */}
      {isVideo && localStream && !isCamOff && (
        <View style={[s.localPip, { top: insets.top + 62 }]}>
          <RTCView streamURL={localUrl} style={StyleSheet.absoluteFill} objectFit="cover" mirror/>
        </View>
      )}

      {/* ── Centro: avatar + nombre + estado ── */}
      {(!isVideo || !remoteUrl) && (
        <View style={s.centerBlock}>
          {/* Waveform decorativo */}
          {isConnected && (
            <View style={s.waveRow}>
              {[3,6,10,7,14,9,5,12,8,5,11,7,4].map((h, i) => (
                <View key={i} style={[s.waveBar, { height: h * 2.2 }]}/>
              ))}
            </View>
          )}

          {/* Avatar */}
          <View style={s.bigAvatarWrap}>
            <Animated.View style={[s.bigPulse, { transform: [{ scale: pulseAnim }] }]}/>
            <View style={s.bigRing}>
              <EGAvatar src={targetAvatar} name={name} size={110}/>
            </View>
          </View>

          <Text style={s.bigName}>{name}</Text>
          <View style={s.statusRow}>
            {isConnected && <View style={[s.dot2, { backgroundColor: '#4ade80' }]}/>}
            {isCalling && <Animated.View style={[s.dot2, { transform: [{ scale: pulseAnim }] }]}/>}
            <Text style={s.statusText}>{statusLabel()}</Text>
          </View>
          <Text style={s.callTypeLabel}>{isVideo ? 'Llamada de video' : 'Llamada de audio'}</Text>
        </View>
      )}

      {/* ── Controles — dos filas ── */}
      <View style={[s.ctrlArea, { paddingBottom: insets.bottom + 24 }]}>

        {/* Fila 1: Video · Silenciar · Altavoz · Añadir */}
        <View style={s.ctrlRow}>
          <GlassBtn
            onPress={isVideo ? toggleCamera : () => Alert.alert('Video', 'Activa el video durante la llamada.')}
            icon={IC.video(isCamOff)}
            label={isCamOff ? 'Video off' : 'Video'}
            active={isVideo && !isCamOff}
          />
          <GlassBtn
            onPress={toggleMute}
            icon={IC.mic(isMuted)}
            label={isMuted ? 'Activar mic' : 'Silenciar'}
            danger={isMuted}
          />
          <GlassBtn
            onPress={toggleSpeaker}
            icon={IC.speaker(speakerOn)}
            label={speakerOn ? 'Altavoz' : 'Auricular'}
            active={speakerOn}
          />
          <GlassBtn
            onPress={() => Alert.alert('Añadir participante', 'Próximamente podrás añadir más personas a esta llamada.')}
            icon={IC.addUser()}
            label="Añadir"
          />
        </View>

        {/* Fila 2: Mensaje · Colgar · Más */}
        <View style={s.ctrlRowCenter}>
          <GlassBtn
            onPress={openMessageMode}
            icon={IC.chat()}
            label="Mensaje"
          />

          {/* Colgar — botón central prominente */}
          <View style={s.hangupWrap}>
            <TouchableOpacity style={s.hangupBtn} onPress={hangUp} activeOpacity={0.85}>
              {IC.hangup()}
            </TouchableOpacity>
            <Text style={gb.label}>Colgar</Text>
          </View>

          <GlassBtn
            onPress={() => {
              Alert.alert('Más opciones', '', [
                { text: 'Cambiar fondo', onPress: () => setShowBgPicker(true) },
                { text: isVideo ? 'Filtros AR' : 'Compartir pantalla', onPress: isVideo ? () => setShowFilters(v => !v) : toggleScreenShare },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }}
            icon={IC.more()}
            label="Más"
          />
        </View>

        {/* Filtros AR */}
        {isVideo && showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[s.filterChip, activeFilter === f.id && s.filterChipActive]}
                onPress={() => { setActiveFilter(f.id); setShowFilters(false); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Overlay FaceFilter */}
      {isVideo && FACE_FILTER_AVAILABLE && activeFilter !== 'none' && (
        <FaceFilterOverlay faces={faces} filterId={activeFilter} width={SW} height={SH}/>
      )}

      {/* Picker de fondo */}
      <CallBackgroundPicker
        visible={showBgPicker}
        current={bg}
        onSelect={setBg}
        onClose={() => setShowBgPicker(false)}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080820' },

  // ── Top ──────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute', left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  glassChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
  },
  chipText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12,
  },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  timerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  glassIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── PiP local ────────────────────────────────────────────────────
  localPip: {
    position: 'absolute', right: 16, width: 96, height: 130,
    borderRadius: 16, overflow: 'hidden', zIndex: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
  },

  // ── Centro ───────────────────────────────────────────────────────
  centerBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    zIndex: 5, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24,
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12, opacity: 0.7 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: ACCENT },
  bigAvatarWrap: { alignItems: 'center', marginBottom: 22 },
  bigPulse: {
    position: 'absolute', width: 148, height: 148, borderRadius: 74,
    borderWidth: 2, borderColor: 'rgba(0,200,160,0.3)',
  },
  bigRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: 'rgba(0,200,160,0.65)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 28, elevation: 14,
  },
  bigName: {
    fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot2: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00e5ff' },
  statusText: { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  callTypeLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 },

  // ── Controles ────────────────────────────────────────────────────
  ctrlArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
    paddingHorizontal: 8,
  },
  ctrlRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 8, marginBottom: 14,
  },
  ctrlRowCenter: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', paddingHorizontal: 8, marginBottom: 6,
  },
  hangupWrap: { alignItems: 'center', gap: 5 },
  hangupBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65, shadowRadius: 18, elevation: 18,
  },
  filtersRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: GLASS_BG,
    borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: 'rgba(0,200,160,0.35)', borderColor: ACCENT },

  // ── Incoming ─────────────────────────────────────────────────────
  incomingWrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
  incomingAvatarWrap: { alignItems: 'center', justifyContent: 'center' },
  incomingPulse: {
    position: 'absolute', width: 162, height: 162, borderRadius: 81,
    borderWidth: 2, borderColor: 'rgba(0,200,160,0.3)',
  },
  incomingRing: {
    width: 122, height: 122, borderRadius: 61,
    borderWidth: 3, borderColor: 'rgba(0,200,160,0.65)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 28, elevation: 14,
  },
  incomingName: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  incomingTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomingType: { color: 'rgba(255,255,255,0.65)', fontSize: 15 },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  incomingActions: { flexDirection: 'row', gap: 52 },
  actionCol: { alignItems: 'center', gap: 10 },
  rejectBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 14,
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 14,
  },
  actionLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

  // ── Mini barra PiP ────────────────────────────────────────────────
  pipBar: {
    position: 'absolute', left: 12, right: 12, zIndex: 9999,
    height: 60, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, gap: 8,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 20,
  },
  pipAvatar: { flexShrink: 0 },
  pipInfo: { flex: 1, justifyContent: 'center' },
  pipName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pipStatus: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  pipBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  pipHangup: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  pipExpand: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
});
