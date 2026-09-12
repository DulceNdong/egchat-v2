// ══════════════════════════════════════════════════════════════════
// Pantalla de llamada — diseño moderno estilo asiático / glassmorphism
// Audio + Video | Chat en llamada | Ventana flotante PiP | Fondo personalizable
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform,
  Image, KeyboardAvoidingView, TextInput, FlatList, ScrollView,
  Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Line, Rect, Polygon, Circle, G } from 'react-native-svg';
import { EGAvatar } from '../../src/components/ui';
import { useWebRTC, RTCView } from '../../src/hooks/useWebRTC';
import { LiveActivity } from '../../src/native/LiveActivity';
import { NativeCallKit } from '../../src/native/CallKit';
import { Audio } from 'expo-av';
import { FaceFilterOverlay } from '../../src/components/FaceFilterOverlay';
import { FaceFilter, FILTERS, type FilterId, type FaceData } from '../../src/native/FaceFilter';
import { startRingtone, stopRingtone } from '../../src/hooks/useSounds';
import { callAPI } from '../../src/api';
import {
  CallBackgroundPicker,
  loadCallBackground,
  type CallBackground,
  PRESET_BACKGROUNDS,
} from '../../src/components/call/CallBackgroundPicker';

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = '#00c8a0';
const GLASS_BG = 'rgba(255,255,255,0.12)';
const GLASS_BORDER = 'rgba(255,255,255,0.22)';

// ── Botón glassmorphism ───────────────────────────────────────────
function GlassBtn({
  onPress, icon, label, active, danger, size = 56,
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
        danger && gb.btnDanger,
      ]}>
        {icon}
      </View>
      {label ? <Text style={gb.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const gb = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, minWidth: 64 },
  btn: {
    backgroundColor: GLASS_BG,
    borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  btnActive: { backgroundColor: 'rgba(0,200,160,0.3)', borderColor: ACCENT },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.6)' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', textAlign: 'center' },
});

// ── Iconos SVG inline ─────────────────────────────────────────────
const IC = {
  mic: (off?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      {off && <Line x1="1" y1="1" x2="23" y2="23"/>}
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/>
    </Svg>
  ),
  speaker: (on?: boolean) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      {on && <><Path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><Path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
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
      <Circle cx="12" cy="5" r="1" fill="#fff"/><Circle cx="12" cy="12" r="1" fill="#fff"/>
      <Circle cx="12" cy="19" r="1" fill="#fff"/>
    </Svg>
  ),
  hangup: () => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="#fff">
      <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
    </Svg>
  ),
  minimize: () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M18 15 12 9 6 15"/>
    </Svg>
  ),
  bg: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Rect x="3" y="3" width="18" height="18" rx="2"/>
      <Circle cx="8.5" cy="8.5" r="1.5"/>
      <Path d="M21 15l-5-5L5 21"/>
    </Svg>
  ),
  send: () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Line x1="22" y1="2" x2="11" y2="13"/>
      <Path d="M22 2 15 22 11 13 2 9 22 2" fill="#fff" stroke="#fff"/>
    </Svg>
  ),
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
  const [duration, setDuration]     = useState(0);
  const [speakerOn, setSpeakerOn]   = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>('none');
  const [showFilters, setShowFilters]   = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  // Fondo personalizable
  const [bg, setBg] = useState<CallBackground>({ type: 'preset', id: 'night', gradient: PRESET_BACKGROUNDS[1].gradient });
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Chat en llamada
  const [chatMode, setChatMode] = useState<'hidden' | 'panel' | 'pip'>('hidden');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; mine: boolean; time: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatListRef = useRef<FlatList>(null);

  // Animaciones
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const dotAnims   = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;
  const pipAnim    = useRef(new Animated.Value(0)).current; // 0=hidden, 1=visible
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated  = useRef(false);
  const endedRef   = useRef(false);

  // FaceFilter
  const [faces, setFaces] = useState<FaceData[]>([]);
  const faceDetectorRef = useRef(false);
  const faceFrameRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const isVideo   = callType === 'video';
  const name      = targetName || 'Usuario';
  const remoteUrl = remoteStream ? (remoteStream as any).toURL?.() || '' : '';
  const localUrl  = localStream  ? (localStream  as any).toURL?.() || '' : '';

  // Cargar fondo guardado
  useEffect(() => {
    loadCallBackground().then(setBg);
  }, []);

  // Inicializar FaceFilter
  useEffect(() => {
    if (!FaceFilter.isAvailable || !isVideo) return;
    FaceFilter.initialize().then(ok => { faceDetectorRef.current = ok; });
    return () => { FaceFilter.release(); faceDetectorRef.current = false; };
  }, []);

  // Loop detección faces
  useEffect(() => {
    if (faceFrameRef.current) { clearInterval(faceFrameRef.current); faceFrameRef.current = null; }
    if (activeFilter === 'none' || !FaceFilter.isAvailable || !faceDetectorRef.current || !localStream) {
      setFaces([]); return;
    }
    faceFrameRef.current = setInterval(async () => {
      try {
        const stream = localStream as any;
        if (!stream?.captureFrame) return;
        const base64 = await stream.captureFrame();
        if (!base64) return;
        const detected = await FaceFilter.detectFaces(base64);
        setFaces(detected);
      } catch {}
    }, 200);
    return () => { if (faceFrameRef.current) { clearInterval(faceFrameRef.current); faceFrameRef.current = null; } };
  }, [activeFilter, localStream]);

  // Screen share
  const screenStreamRef = useRef<any>(null);
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
      const screenStream = await mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      setIsSharingScreen(true);
    } catch (e: any) {
      if (e?.message?.includes('cancel') || e?.message?.includes('denied')) return;
      Alert.alert('Error', 'No se pudo iniciar la compartición de pantalla.');
    }
  }, [isSharingScreen]);

  // Altavoz
  const toggleSpeaker = useCallback(async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, playsInSilentModeIOS: true,
          shouldDuckAndroid: false, playThroughEarpieceAndroid: !next,
        });
      } catch {}
    }
  }, [speakerOn]);

  // Iniciar llamada (caller)
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

  // Animaciones pulsante
  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])).start();
      dotAnims.forEach((anim, i) => {
        Animated.loop(Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])).start();
      });
    } else {
      pulseAnim.setValue(1);
      dotAnims.forEach(a => a.setValue(0.4));
    }
  }, [callState]);

  // Timer + LiveActivity al conectar
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      LiveActivity.startCall(callId, name, isVideo);
      NativeCallKit.dismissIncomingCall();
      stopRingtone().catch(() => {});
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Fin de llamada
  useEffect(() => {
    if (callState === 'ended') {
      LiveActivity.endCall();
      NativeCallKit.endCall(callId);
      stopRingtone().catch(() => {});
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
  }, []);

  // Ringtone
  const uiState   = role === 'callee' && callState === 'idle' ? 'ringing' : callState;
  const isIncoming = uiState === 'ringing' && role === 'callee';
  const isCalling  = uiState === 'calling' || (uiState === 'ringing' && role === 'caller');
  const isConnected = uiState === 'connected';

  useEffect(() => {
    if (isIncoming) startRingtone().catch(() => {});
    else stopRingtone().catch(() => {});
    return () => { stopRingtone().catch(() => {}); };
  }, [isIncoming]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const statusLabel = () => {
    if (isCalling)   return 'Llamando...';
    if (isConnected) return formatDuration(duration);
    if (uiState === 'ended') return 'Llamada finalizada';
    return 'Conectando...';
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

  // Chat helpers
  const sendChatMsg = useCallback(() => {
    if (!chatInput.trim()) return;
    const now  = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), text: chatInput.trim(), mine: true, time }]);
    setChatInput('');
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatInput]);

  const openChat = useCallback(() => {
    setChatMode('panel');
    Animated.timing(pipAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [pipAnim]);

  const closeChat = useCallback(() => {
    setChatMode('hidden');
    Animated.timing(pipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [pipAnim]);

  // ── Fondo de llamada ─────────────────────────────────────────────
  const renderBackground = () => {
    if (isVideo && remoteUrl) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <RTCView streamURL={remoteUrl} style={StyleSheet.absoluteFill} objectFit="cover" mirror={false}/>
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.2, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }
    if (bg.type === 'custom' && bg.uri) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: bg.uri }} style={StyleSheet.absoluteFill} resizeMode="cover"/>
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill}/>
        </View>
      );
    }
    const grad = bg.gradient || PRESET_BACKGROUNDS[1].gradient;
    return (
      <View style={StyleSheet.absoluteFill}>
        {targetAvatar ? (
          <Image source={{ uri: targetAvatar }} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" blurRadius={25}/>
        ) : null}
        <LinearGradient colors={grad} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill}/>
      </View>
    );
  };

  // ── PANTALLA LLAMADA ENTRANTE ────────────────────────────────────
  if (isIncoming) {
    return (
      <View style={s.root}>
        {renderBackground()}
        <View style={[s.incomingWrap, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
          {/* Avatar grande con glow */}
          <View style={s.incomingAvatarWrap}>
            <Animated.View style={[s.incomingPulse, { transform: [{ scale: pulseAnim }] }]}/>
            <View style={s.incomingAvatarRing}>
              <EGAvatar src={targetAvatar} name={name} size={110}/>
            </View>
          </View>

          <Text style={s.incomingName}>{name}</Text>
          <View style={s.incomingTypeRow}>
            {IC[isVideo ? 'video' : 'phone']()}
            <Text style={s.incomingType}>{isVideo ? 'Videollamada entrante' : 'Llamada de voz entrante'}</Text>
          </View>

          {/* Dots animados */}
          <View style={s.dotsRow}>
            {dotAnims.map((anim, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: anim }]}/>
            ))}
          </View>

          {/* Botones aceptar/rechazar */}
          <View style={s.incomingActions}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={s.rejectBtn} onPress={hangUp} activeOpacity={0.85}>
                {IC.reject()}
              </TouchableOpacity>
              <Text style={s.actionLabel}>Rechazar</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
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
      {renderBackground()}

      {/* ── Top bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Minimizar */}
        <TouchableOpacity style={s.glassChip} onPress={() => router.back()} activeOpacity={0.8}>
          {IC.minimize()}
          <Text style={s.chipText}>Minimizar</Text>
        </TouchableOpacity>

        {/* Duración */}
        {isConnected && (
          <View style={s.timerChip}>
            <View style={s.timerDot}/>
            <Text style={s.timerText}>{formatDuration(duration)}</Text>
          </View>
        )}

        {/* Cambiar fondo */}
        <TouchableOpacity style={s.glassIconBtn} onPress={() => setShowBgPicker(true)} activeOpacity={0.8}>
          {IC.bg()}
        </TouchableOpacity>
      </View>

      {/* ── PiP video local ── */}
      {isVideo && localStream && !isCamOff && (
        <View style={[s.localPip, { top: insets.top + 60 }]}>
          <RTCView streamURL={localUrl} style={s.localVideo} objectFit="cover" mirror/>
        </View>
      )}

      {/* ── Bloque central: avatar + nombre + estado ── */}
      {(!isVideo || !remoteUrl) && (
        <View style={s.centerBlock}>
          {/* Waveform decorativo */}
          {isConnected && (
            <View style={s.waveRow}>
              {[3,5,8,5,10,7,4,9,6,4,8,5,3].map((h, i) => (
                <View key={i} style={[s.waveBar, { height: h * 2 }]}/>
              ))}
            </View>
          )}
          {isConnected && <Text style={s.durationBig}>{formatDuration(duration)}</Text>}

          {/* Avatar con anillo de glow */}
          <View style={s.bigAvatarWrap}>
            <Animated.View style={[s.bigPulseRing, { transform: [{ scale: pulseAnim }] }]}/>
            <View style={s.bigAvatarRing}>
              <EGAvatar src={targetAvatar} name={name} size={108}/>
            </View>
          </View>

          <Text style={s.bigName}>{name}</Text>
          <View style={s.statusRow}>
            {isConnected && <View style={[s.statusDot, { backgroundColor: '#4ade80' }]}/>}
            {isCalling && <Animated.View style={[s.statusDot, { transform: [{ scale: pulseAnim }] }]}/>}
            <Text style={s.statusText}>{statusLabel()}</Text>
          </View>
          <Text style={s.callTypeLabel}>{isVideo ? 'Llamada de video' : 'Llamada de audio'}</Text>
        </View>
      )}

      {/* ── Controles: grid 2 filas ── */}
      <View style={[s.controlsArea, { paddingBottom: insets.bottom + 20 }]}>

        {/* Fila 1: Video · Silenciar · Altavoz · Añadir */}
        <View style={s.ctrlRow}>
          {isVideo ? (
            <GlassBtn onPress={toggleCamera} icon={IC.video(isCamOff)} label={isCamOff ? 'Video off' : 'Video'} active={!isCamOff}/>
          ) : (
            <GlassBtn onPress={() => {}} icon={IC.video()} label="Video" active={false}/>
          )}
          <GlassBtn onPress={toggleMute}   icon={IC.mic(isMuted)}    label={isMuted ? 'Activar' : 'Silenciar'} danger={isMuted}/>
          <GlassBtn onPress={toggleSpeaker} icon={IC.speaker(speakerOn)} label={speakerOn ? 'Altavoz' : 'Auricular'} active={speakerOn}/>
          <GlassBtn onPress={() => Alert.alert('Añadir', 'Próximamente podrás añadir participantes.')} icon={IC.addUser()} label="Añadir"/>
        </View>

        {/* Fila 2: Mensaje · Colgar · Más */}
        <View style={s.ctrlRowCenter}>
          <GlassBtn onPress={openChat} icon={IC.chat()} label="Mensaje" active={chatMode !== 'hidden'}/>

          {/* Colgar — botón central grande rojo */}
          <TouchableOpacity onPress={hangUp} activeOpacity={0.85} style={s.hangupWrap}>
            <View style={s.hangupBtn}>
              {IC.hangup()}
            </View>
            <Text style={[gb.label, { marginTop: 6 }]}>Colgar</Text>
          </TouchableOpacity>

          <GlassBtn
            onPress={() => setShowFilters(v => !v)}
            icon={isVideo ? <Text style={{ fontSize: 20 }}>✨</Text> : IC.more()}
            label={isVideo ? 'Filtros' : 'Más'}
            active={showFilters}
          />
        </View>

        {/* Selector filtros AR */}
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

      {/* ── Panel chat (desliza desde abajo) ── */}
      {chatMode === 'panel' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[s.chatPanel, { paddingBottom: insets.bottom }]}
        >
          {/* Header chat */}
          <View style={s.chatHeader}>
            <View style={s.chatHeaderLeft}>
              <EGAvatar src={targetAvatar} name={name} size={32}/>
              <View>
                <Text style={s.chatHeaderName}>{name}</Text>
                <Text style={s.chatHeaderSub}>En llamada · {formatDuration(duration)}</Text>
              </View>
            </View>
            <View style={s.chatHeaderRight}>
              <TouchableOpacity style={s.chatHeaderBtn} onPress={hangUp} activeOpacity={0.8}>
                <View style={s.miniHangup}>{IC.hangup()}</View>
              </TouchableOpacity>
              <TouchableOpacity style={s.chatHeaderBtn} onPress={closeChat} hitSlop={12} activeOpacity={0.8}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M18 15 12 9 6 15"/>
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista mensajes */}
          <FlatList
            ref={chatListRef}
            data={chatMessages}
            keyExtractor={m => m.id}
            style={s.chatList}
            contentContainerStyle={{ padding: 12, gap: 6 }}
            renderItem={({ item }) => (
              <View style={[s.bubble, item.mine ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={[s.bubbleText, !item.mine && { color: '#fff' }]}>{item.text}</Text>
                <Text style={[s.bubbleTime, item.mine && { color: 'rgba(255,255,255,0.6)' }]}>{item.time}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={s.chatEmpty}>Escribe un mensaje mientras hablas 💬</Text>}
          />

          {/* Input */}
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              returnKeyType="send"
              onSubmitEditing={sendChatMsg}
            />
            <TouchableOpacity
              style={[s.chatSendBtn, !chatInput.trim() && { opacity: 0.4 }]}
              disabled={!chatInput.trim()}
              onPress={sendChatMsg}
              activeOpacity={0.8}
            >
              {IC.send()}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Overlay FaceFilter */}
      {isVideo && activeFilter !== 'none' && (
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
  root: { flex: 1, backgroundColor: '#000' },

  // Top bar
  topBar: {
    position: 'absolute', left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  glassChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
  },
  chipText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12,
  },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  timerText: { color: '#fff', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  glassIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },

  // PiP video local
  localPip: {
    position: 'absolute', right: 16, width: 96, height: 130,
    borderRadius: 16, overflow: 'hidden', zIndex: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
  },
  localVideo: { flex: 1 },

  // Centro
  centerBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    zIndex: 5, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 20,
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8, opacity: 0.7 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: ACCENT },
  durationBig: {
    color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600',
    marginBottom: 20, fontVariant: ['tabular-nums'],
  },
  bigAvatarWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  bigPulseRing: {
    position: 'absolute', width: 145, height: 145, borderRadius: 73,
    borderWidth: 2, borderColor: 'rgba(0,200,160,0.3)',
  },
  bigAvatarRing: {
    width: 118, height: 118, borderRadius: 59,
    borderWidth: 3, borderColor: 'rgba(0,200,160,0.6)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  bigName: {
    fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00e5ff' },
  statusText: { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  callTypeLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 },

  // Controls
  controlsArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
    paddingHorizontal: 12,
  },
  ctrlRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 8, marginBottom: 16,
  },
  ctrlRowCenter: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', paddingHorizontal: 8, marginBottom: 8,
  },
  hangupWrap: { alignItems: 'center' },
  hangupBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 16,
  },
  filtersRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: GLASS_BG, borderWidth: 1.5, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: 'rgba(0,200,160,0.35)', borderColor: ACCENT },

  // Incoming
  incomingWrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
  incomingAvatarWrap: { alignItems: 'center', justifyContent: 'center' },
  incomingPulse: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(0,200,160,0.3)',
  },
  incomingAvatarRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: 'rgba(0,200,160,0.6)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  incomingName: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  incomingTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomingType: { color: 'rgba(255,255,255,0.65)', fontSize: 15 },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  incomingActions: { flexDirection: 'row', gap: 48, justifyContent: 'center' },
  rejectBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  actionLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

  // Chat panel
  chatPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
    height: '60%',
    backgroundColor: 'rgba(8,8,20,0.96)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chatHeaderSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 },
  chatHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatHeaderBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  miniHangup: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
    transform: [{ scale: 0.7 }],
  },
  chatList: { flex: 1 },
  chatEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', marginTop: 32 },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 10, paddingHorizontal: 14 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: ACCENT },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)' },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3, alignSelf: 'flex-end' },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chatInput: {
    flex: 1, color: '#fff', fontSize: 14, maxHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  chatSendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
});
