// ══════════════════════════════════════════════════════════════════
// Pantalla de llamada — consume el CallManager global
// Audio + Video | PiP | Fondo personalizable | FaceFilter
//
// CAMBIOS vs versión anterior:
//  • useWebRTC() → fachada del CallManager (misma API)
//  • router.navigate → router.push al minimizar (la pantalla queda en stack)
//  • activeCall/isPip/registerCallControls → useActiveCall() del nuevo contexto
//  • Un solo efecto para iniciar la llamada (caller)
//  • Un solo efecto para aceptar desde CallKit (callee)
//  • endCall / logCallToChat con guard doble conservado
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform,
  Image, ScrollView, Dimensions, StatusBar, ActivityIndicator,
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
import { startRingtone, stopRingtone, startDialingTone, stopDialingTone } from '../../src/hooks/useSounds';
import { callAPI } from '../../src/api';
import { chatAPI } from '../../src/api';
import {
  CallBackgroundPicker,
  loadCallBackground,
  type CallBackground,
  PRESET_BACKGROUNDS,
} from '../../src/components/call/CallBackgroundPicker';
import { useActiveCall } from '../../src/context/ActiveCallContext';
import { callManager } from '../../src/call/CallManager';

// Guard: si el módulo nativo no está disponible, no crashear
const FACE_FILTER_AVAILABLE = (() => {
  try { return !!FaceFilter?.isAvailable; } catch { return false; }
})();

// FIX 7 — valor inicial; se actualiza dinámicamente con el listener
const { width: SW0, height: SH0 } = Dimensions.get('window');
const ACCENT       = '#00c8a0';
const GLASS_BG     = 'rgba(30,30,60,0.75)';
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
        active && gb.btnActive,
        danger  && gb.btnDanger,
      ]}>
        {icon}
      </View>
      {!!label && <Text style={gb.label}>{label}</Text>}
    </TouchableOpacity>
  );
}
const gb = StyleSheet.create({
  wrap:     { alignItems: 'center', gap: 5, minWidth: 64 },
  btn: {
    backgroundColor: GLASS_BG,
    borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  btnActive: { backgroundColor: 'rgba(0,200,160,0.35)', borderColor: ACCENT },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.35)', borderColor: '#ef4444' },
  label:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', textAlign: 'center' },
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
      {on
        ? <><Path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><Path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
        : <Line x1="23" y1="9" x2="17" y2="15"/>}
    </Svg>
  ),
  video: (off?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      {off
        ? <><Line x1="1" y1="1" x2="23" y2="23"/>
            <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
          </>
        : <><Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/></>}
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
  flip: () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Path d="M20 7h-9"/>
      <Path d="M14 17H5"/>
      <Circle cx="17" cy="17" r="3"/>
      <Circle cx="7" cy="7" r="3"/>
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
  type CallParams = {
    callId: string; targetName: string; targetAvatar: string;
    callType: 'audio' | 'video'; role: 'caller' | 'callee';
    targetUserId?: string; offer?: string; chatId?: string;
  };
  const {
    callId, targetName, targetAvatar, callType, role,
    targetUserId, offer: offerParam, chatId,
  } = useLocalSearchParams() as CallParams;

  // ── CallManager via hook fachada ──────────────────────────────
  const {
    callState, isMuted, isCamOff, isSignalingOnly,
    isSpeakerOn,
    localStream, remoteStream,
    duration,
    startCall, answerCall, endCall, toggleMute, toggleCamera,
    toggleSpeaker: hookToggleSpeaker,
    switchCamera,
  } = useWebRTC();

  // ── Contexto UI ───────────────────────────────────────────────
  const { setPip, minimizeCall } = useActiveCall();

  const insets = useSafeAreaInsets();

  // FIX 7 — Dimensiones dinámicas: se actualizan al rotar la pantalla
  const [screenSize, setScreenSize] = useState({ width: SW0, height: SH0 });
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize({ width: window.width, height: window.height });
    });
    return () => sub?.remove();
  }, []);
  const SW = screenSize.width;
  const SH = screenSize.height;

  // ── Estado local UI ───────────────────────────────────────────
  const [activeFilter,   setActiveFilter]   = useState<FilterId>('none');
  const [showFilters,    setShowFilters]    = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [bg,             setBg]             = useState<CallBackground>({
    type: 'preset', id: 'night', gradient: PRESET_BACKGROUNDS[1].gradient,
  });
  const [showBgPicker,   setShowBgPicker]   = useState(false);
  const [isAccepting,    setIsAccepting]    = useState(false);
  const [isRejecting,    setIsRejecting]    = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const initiated      = useRef(false);
  const wasConnected   = useRef(false);
  const loggedRef      = useRef(false);
  const ringStopped    = useRef(false);
  // durationRef sincronizado con duration del CallManager (M5 fix)
  const durationRef    = useRef(0);
  const screenStreamRef = useRef<any>(null);
  const faceDetectorRef = useRef(false);
  const faceFrameRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const [faces,         setFaces]           = useState<FaceData[]>([]);

  // ── Animaciones ───────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims  = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;

  const isVideo   = callType === 'video';
  const name      = targetName || 'Usuario';
  const remoteUrl = remoteStream ? (remoteStream as any).toURL?.() || '' : '';
  const localUrl  = localStream  ? (localStream  as any).toURL?.() || '' : '';

  // ── Cargar fondo ───────────────────────────────────────────────
  useEffect(() => { loadCallBackground().then(setBg); }, []);

  // ── FaceFilter init ────────────────────────────────────────────
  useEffect(() => {
    if (!FACE_FILTER_AVAILABLE || !isVideo) return;
    try {
      FaceFilter.initialize().then((ok: boolean) => { faceDetectorRef.current = ok; });
    } catch {}
    return () => {
      try { FaceFilter.release(); } catch {}
      faceDetectorRef.current = false;
    };
  }, [isVideo]);

  // ── Loop detección faces ───────────────────────────────────────
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
    return () => {
      if (faceFrameRef.current) { clearInterval(faceFrameRef.current); faceFrameRef.current = null; }
    };
  }, [activeFilter, localStream]);

  // ── Iniciar como CALLER — solo una vez ────────────────────────
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    // Si el manager ya tiene una llamada activa para este callId, no reiniciar
    const existing = callManager.session;
    if (existing?.callId === callId && callManager.isActive) return;
    if (role === 'caller' && targetUserId) {
      startCall(callType as 'audio' | 'video', targetUserId, callId, name, targetAvatar, chatId)
        .catch(err => {
          Alert.alert('Error', err.message || 'No se pudo iniciar la llamada');
          router.back();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animaciones según estado ───────────────────────────────────
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

  // ── Sincronizar durationRef con duration del CallManager ─────
  // durationRef se usa en logCallToChat al colgar, donde duration puede
  // estar desactualizado si el componente no re-renderizó justo antes.
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => {
    if (callState === 'connected') {
      wasConnected.current = true;
      // El CallManager ya gestiona _durationTimer internamente.
      // `duration` llega directo del hook useWebRTC() — sin timer local.
    }
  }, [callState]);

  // ── Finalizado ────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'ended' || callState === 'failed' || callState === 'missed') {
      logCallToChat(wasConnected.current, durationRef.current);
      setPip(false);
      setTimeout(() => router.back(), 500);
    }
    if (callState === 'rejected') {
      setPip(false);
      setTimeout(() => router.back(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  // ── CallKit handlers (callee) ─────────────────────────────────
  useEffect(() => {
    // El CallManager ya llamó showIncomingCall si llegó vía registerIncoming.
    // Aquí solo escuchamos los eventos de respuesta nativa (botones CallKit).
    const unsubAnswer = NativeCallKit.onAnswer((_cid) => acceptFromCallKit());
    const unsubReject = NativeCallKit.onReject((_cid) => rejectFromCallKit());
    return () => { unsubAnswer(); unsubReject(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Altavoz ────────────────────────────────────────────────────
  // isSpeakerOn viene del hook (derivado del CallManager) — fuente de verdad.
  // Al togglear, se llama al manager a través del hook; el observer actualiza
  // isSpeakerOn automáticamente, sin estado local independiente.
  const toggleSpeaker = useCallback(() => {
    hookToggleSpeaker();
  }, [hookToggleSpeaker]);

  // ── Parar ringtone una sola vez ───────────────────────────────
  const stopRingOnce = useCallback(async () => {
    if (ringStopped.current) return;
    ringStopped.current = true;
    try { await stopRingtone(); } catch {}
    await new Promise(r => setTimeout(r, 80));
  }, []);

  // ── Colgar ─────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    if (role === 'callee' && !wasConnected.current) setIsRejecting(true);
    stopDialingTone();
    await stopRingOnce();
    const secs      = durationRef.current;
    const connected = wasConnected.current;
    await endCall();
    logCallToChat(connected, secs);
    router.back();
  }, [endCall, stopRingOnce, role]);

  // ── Aceptar (UI botón en pantalla) ────────────────────────────
  const accept = useCallback(async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      // Si el manager no tiene sesión registrada para este callId, registrarla
      const existing = callManager.session;
      if (!existing || existing.callId !== callId) {
        let parsedOffer: any = offerParam;
        if (typeof parsedOffer === 'string') { try { parsedOffer = JSON.parse(parsedOffer); } catch {} }
        callManager.registerIncoming({
          callId,
          callType: callType as 'audio' | 'video',
          callerName: name,
          callerAvatar: targetAvatar,
          offer: parsedOffer,
          chatId,
        });
      }
      await callManager.acceptCall();
    } catch (err: any) {
      setIsAccepting(false);
      Alert.alert('No se pudo recibir la llamada', err?.message || 'Verifica tu conexión.');
    }
  }, [callId, offerParam, callType, name, targetAvatar, chatId, isAccepting]);

  // ── Aceptar desde botón nativo CallKit ────────────────────────
  const acceptFromCallKit = useCallback(() => {
    accept().catch(() => {});
  }, [accept]);

  // ── Rechazar desde botón nativo CallKit ──────────────────────
  const rejectFromCallKit = useCallback(() => {
    callManager.rejectCall().then(() => router.back()).catch(() => router.back());
  }, []);

  // ── Minimizar — usar push para mantener pantalla en stack ──────
  // ⚠️ CRÍTICO: NO usar router.navigate() — desmontaría la pantalla
  // ⚠️ fullScreenModal: cuando la pantalla de llamada es un modal,
  //    router.push() desde dentro del modal apila sobre el modal.
  //    Usamos minimizeCall() + router.dismiss() para cerrar el modal
  //    y volver al stack de tabs, manteniendo el WebRTC vivo en el manager.
  const openMessageMode = useCallback(() => {
    minimizeCall();
    // dismiss() cierra el modal fullScreenModal y vuelve a la pantalla anterior
    // sin desmontar la lógica de CallManager (que vive fuera del árbol React)
    try {
      router.dismiss();
    } catch {
      // Fallback si dismiss no está disponible (Expo Router < 3.4)
      router.push('/(tabs)/mensajeria' as any);
    }
  }, [minimizeCall]);

  // ── Historial de llamada ───────────────────────────────────────
  const logCallToChat = useCallback(async (connected: boolean, secs: number) => {
    if (!chatId) return;
    if (loggedRef.current) return;
    loggedRef.current = true;
    try {
      const isVid = callType === 'video';
      const emoji = isVid ? '📹' : '📞';
      let text: string;
      if (connected && secs > 0) {
        const mm = Math.floor(secs / 60).toString().padStart(2, '0');
        const ss = (secs % 60).toString().padStart(2, '0');
        text = `${emoji} ${isVid ? 'Videollamada' : 'Llamada'} (${mm}:${ss})`;
      } else {
        text = `${emoji} ${isVid ? 'Videollamada' : 'Llamada'} perdida`;
      }
      await chatAPI.sendMessage(chatId, { text, type: 'call' });
    } catch { /* silencioso */ }
  }, [chatId, callType, role]);

  // ── Screen share ───────────────────────────────────────────────
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

  // ── Estado UI derivado ────────────────────────────────────────
  const uiState     = role === 'callee' && (callState === 'ringing' || isRejecting) ? 'ringing' : callState;
  const isIncoming  = uiState === 'ringing' && role === 'callee';
  const isCalling   = uiState === 'calling' || (uiState === 'ringing' && role === 'caller');
  const isConnected = uiState === 'connected';

  const statusLabel = () => {
    if (isCalling)                     return 'Llamando...';
    if (uiState === 'connecting' ||
        uiState === 'accepted')        return 'Conectando...';
    if (uiState === 'reconnecting')    return 'Reconectando...';
    if (isConnected)                   return formatDur(duration);
    if (uiState === 'ended' ||
        uiState === 'failed')          return 'Llamada finalizada';
    return 'Conectando...';
  };

  const formatDur = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Fondo ──────────────────────────────────────────────────────
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
          <Image source={{ uri: targetAvatar }} style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} resizeMode="cover" blurRadius={22}/>
        ) : null}
        <LinearGradient colors={grad} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill}/>
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER — LLAMADA ENTRANTE
  // ══════════════════════════════════════════════════════════════
  if (isIncoming) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
        {renderBg()}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.incomingWrap, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 50 }]}>
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
              <TouchableOpacity
                style={[s.acceptBtn, isAccepting && { opacity: 0.7 }]}
                onPress={accept}
                disabled={isAccepting}
                activeOpacity={0.85}
              >
                {isAccepting
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : IC.phone()}
              </TouchableOpacity>
              <Text style={s.actionLabel}>{isAccepting ? 'Conectando...' : 'Aceptar'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER — LLAMADA ACTIVA
  // ══════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      {renderBg()}

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={s.glassChip}
          onPress={openMessageMode}
          activeOpacity={0.8}
        >
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
        {uiState === 'reconnecting' && (
          <View style={[s.timerChip, { borderColor: '#f59e0b' }]}>
            <ActivityIndicator size="small" color="#f59e0b"/>
            <Text style={[s.timerText, { color: '#f59e0b', marginLeft: 4 }]}>Reconectando</Text>
          </View>
        )}

        <TouchableOpacity style={s.glassIconBtn} onPress={() => setShowBgPicker(true)} activeOpacity={0.8}>
          {IC.bg()}
        </TouchableOpacity>
      </View>

      {/* PiP video local */}
      {isVideo && localStream && !isCamOff && (
        <View style={[s.localPip, { top: insets.top + 62 }]}>
          <RTCView streamURL={localUrl} style={StyleSheet.absoluteFill} objectFit="cover" mirror/>
        </View>
      )}

      {/* Centro: avatar + nombre + estado */}
      {(!isVideo || !remoteUrl) && (
        <View style={s.centerBlock}>
          {isConnected && (
            <View style={s.waveRow}>
              {[3,6,10,7,14,9,5,12,8,5,11,7,4].map((h, i) => (
                <View key={i} style={[s.waveBar, { height: h * 2.2 }]}/>
              ))}
            </View>
          )}
          <View style={s.bigAvatarWrap}>
            <Animated.View style={[s.bigPulse, { transform: [{ scale: pulseAnim }] }]}/>
            <View style={s.bigRing}>
              <EGAvatar src={targetAvatar} name={name} size={110}/>
            </View>
          </View>
          <Text style={s.bigName}>{name}</Text>
          <View style={s.statusRow}>
            {isConnected && <View style={[s.dot2, { backgroundColor: '#4ade80' }]}/>}
            {isCalling    && <Animated.View style={[s.dot2, { transform: [{ scale: pulseAnim }] }]}/>}
            <Text style={s.statusText}>{statusLabel()}</Text>
          </View>
          <Text style={s.callTypeLabel}>{isVideo ? 'Llamada de video' : 'Llamada de audio'}</Text>
        </View>
      )}

      {/* Controles */}
      <View style={[s.ctrlArea, { paddingBottom: insets.bottom + 24 }]}>
        <View style={s.ctrlPanel}>
          {/* Fila 1 */}
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
              icon={IC.speaker(isSpeakerOn)}
              label={isSpeakerOn ? 'Altavoz' : 'Auricular'}
              active={isSpeakerOn}
            />
            {/* FIX 8 — Botón flip-cámara: solo visible en videollamada activa */}
            {isVideo ? (
              <GlassBtn
                onPress={() => switchCamera()}
                icon={IC.flip()}
                label="Voltear"
                active={false}
              />
            ) : (
              <GlassBtn
                onPress={() => Alert.alert('Añadir participante', 'Próximamente podrás añadir más personas.')}
                icon={IC.addUser()}
                label="Añadir"
              />
            )}
          </View>

          {/* Fila 2 */}
          <View style={s.ctrlRowCenter}>
            <GlassBtn
              onPress={openMessageMode}
              icon={IC.chat()}
              label="Mensaje"
            />
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
                  {
                    text: isVideo ? 'Filtros AR' : 'Compartir pantalla',
                    onPress: isVideo ? () => setShowFilters(v => !v) : toggleScreenShare,
                  },
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
  chipText:  { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12,
  },
  timerDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  timerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  glassIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  localPip: {
    position: 'absolute', right: 16, width: 96, height: 130,
    borderRadius: 16, overflow: 'hidden', zIndex: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
  },
  centerBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    zIndex: 5, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24,
  },
  waveRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12, opacity: 0.7 },
  waveBar:    { width: 3, borderRadius: 2, backgroundColor: ACCENT },
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
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot2:          { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00e5ff' },
  statusText:    { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  callTypeLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 },
  ctrlArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
    paddingHorizontal: 12,
  },
  ctrlPanel: {
    backgroundColor: 'rgba(20,20,45,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 28,
    paddingTop: 20, paddingBottom: 12, paddingHorizontal: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.28, shadowRadius: 18, elevation: 16,
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
  filtersRow:      { gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: GLASS_BG,
    borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: 'rgba(0,200,160,0.35)', borderColor: ACCENT },
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
  incomingName:    { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  incomingTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomingType:    { color: 'rgba(255,255,255,0.65)', fontSize: 15 },
  dotsRow:         { flexDirection: 'row', gap: 6 },
  dot:             { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  incomingActions: { flexDirection: 'row', gap: 52 },
  actionCol:       { alignItems: 'center', gap: 10 },
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
});
