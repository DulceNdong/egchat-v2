/**
 * EGChat — Llamada grupal con grid dinámico
 *
 * Layout adaptativo estilo WhatsApp/FaceTime:
 *  1 persona  → pantalla completa
 *  2 personas → split vertical 50/50
 *  3 personas → 1 arriba (60%) + 2 abajo (40%)
 *  4 personas → grid 2×2
 *  5-6        → 2 columnas variables
 *  7-9        → 3 columnas
 *
 * Speaker activo: borde animado verde para quien habla.
 * PiP local: miniatura arrastrable en esquina.
 * Controles flotantes sobre el grid.
 */
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Dimensions, Animated, PanResponder, Alert, SafeAreaView,
  FlatList, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Polygon, Rect, Line } from 'react-native-svg';
import { useSFUGroupCall, type SFUParticipant } from '../src/hooks/useSFUGroupCall';
import { authAPI, getToken, getApiBase } from '../src/api';

const ACCENT = '#00c8a0';
const { width: SW, height: SH } = Dimensions.get('window');

// RTCView lazy-loaded
let RTCView: any = View;
try {
  if (Platform.OS !== 'web') RTCView = require('react-native-webrtc').RTCView;
} catch {}

// ── Helpers de layout ─────────────────────────────────────────────

/** Devuelve dimensiones de celda según número total de participantes */
function getCellLayout(total: number, index: number): {
  width: number; height: number; flex?: number;
} {
  const w = SW;
  if (total === 1) return { width: w, height: SH * 0.75 };
  if (total === 2) return { width: w, height: SH * 0.38 };
  if (total === 3) {
    if (index === 0) return { width: w, height: SH * 0.52 };
    return { width: w / 2 - 3, height: SH * 0.28 };
  }
  if (total === 4) return { width: w / 2 - 3, height: SH * 0.36 };
  if (total <= 6)  return { width: w / 2 - 3, height: SH * 0.28 };
  return { width: w / 3 - 3, height: SH * 0.28 };
}

// ── Celda de participante ─────────────────────────────────────────

const GRAD_PALETTES: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#ffecd2', '#fcb69f'],
  ['#fd7043', '#ff8a65'],
];

const ParticipantCell = React.memo(({
  participant, isVideo, size, isSpeaking,
}: {
  participant: SFUParticipant;
  isVideo: boolean;
  size: { width: number; height: number };
  isSpeaking: boolean;
}) => {
  const speakerAnim = useRef(new Animated.Value(0)).current;
  const gradColors = GRAD_PALETTES[
    participant.userId.charCodeAt(0) % GRAD_PALETTES.length
  ];
  const initials = (participant.name || participant.userId).slice(0, 2).toUpperCase();
  const remoteUrl = participant.stream?.toURL?.() || '';

  useEffect(() => {
    Animated.timing(speakerAnim, {
      toValue: isSpeaking ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSpeaking]);

  const borderColor = speakerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', ACCENT],
  });

  return (
    <Animated.View style={[
      cs.cell,
      { width: size.width, height: size.height, borderColor, borderWidth: 2 },
    ]}>
      {isVideo && remoteUrl ? (
        <RTCView
          streamURL={remoteUrl}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : (
        <LinearGradient
          colors={participant.isConnected ? gradColors : ['#374151', '#1f2937']}
          style={[StyleSheet.absoluteFill, cs.cellCenter]}
        >
          <Text style={cs.initials}>{initials}</Text>
          {!participant.isConnected && (
            <Text style={cs.connecting}>Conectando…</Text>
          )}
        </LinearGradient>
      )}

      {/* Nombre */}
      <View style={cs.nameTag}>
        <Text style={cs.nameText} numberOfLines={1}>
          {participant.name || participant.userId}
        </Text>
      </View>

      {/* Indicadores */}
      <View style={cs.indicators}>
        {participant.isMuted && (
          <View style={cs.badge}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="1" y1="1" x2="23" y2="23" />
              <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            </Svg>
          </View>
        )}
        {participant.isCamOff && isVideo && (
          <View style={cs.badge}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="1" y1="1" x2="23" y2="23" />
              <Path d="M21 21H3a2 2 0 0 1-2-2V8" />
            </Svg>
          </View>
        )}
      </View>

      {/* Indicador de voz activa */}
      {isSpeaking && (
        <View style={cs.speakerDot} />
      )}
    </Animated.View>
  );
});

// ── PiP local (miniatura arrastrable) ────────────────────────────

const LocalPiP = ({
  stream, isMuted, isCamOff, isVideo, name,
}: {
  stream: any; isMuted: boolean; isCamOff: boolean; isVideo: boolean; name: string;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: SW - 110, y: 80 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.extractOffset(),
    }),
  ).current;

  const localUrl = stream?.toURL?.() || '';

  return (
    <Animated.View
      style={[pip.container, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {isVideo && localUrl && !isCamOff ? (
        <RTCView streamURL={localUrl} style={pip.video} objectFit="cover" mirror />
      ) : (
        <LinearGradient colors={['#00c8a0', '#00b4e6']} style={[pip.video, pip.center]}>
          <Text style={pip.initials}>
            {(name || 'Yo').slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
      <View style={pip.nameTag}>
        <Text style={pip.nameText}>Tú</Text>
      </View>
      {isMuted && (
        <View style={pip.mutedBadge}>
          <Text style={{ fontSize: 9 }}>🔇</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ── Pantalla principal ────────────────────────────────────────────

export default function GroupCallScreen() {
  const { groupId, callType: rawType, participantNames: rawNames } = useLocalSearchParams<{
    groupId: string;
    callType: 'audio' | 'video';
    participantNames?: string;
  }>();

  const callType = (rawType as 'audio' | 'video') || 'audio';
  const isVideo = callType === 'video';
  const participantNames: Record<string, string> = rawNames ? JSON.parse(rawNames) : {};

  const {
    participants, localStream, isActive,
    isMuted, isCamOff, participantCount,
    startSFUCall, leaveSFUCall,
    toggleSFUMute, toggleSFUCamera,
    hasWebRTC, handlePeerJoined,
  } = useSFUGroupCall();

  const [duration, setDuration] = useState(0);
  const [myUser, setMyUser] = useState<any>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; name: string; text: string; ts: number }[]>([]);
  const [chatText, setChatText] = useState('');
  const [joinToasts, setJoinToasts] = useState<string[]>([]);
  const sseRef = useRef<XMLHttpRequest | null>(null);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const init = async () => {
      try {
        const me = await authAPI.me();
        setMyUser(me);

        if (!hasWebRTC) {
          Alert.alert(
            'Requiere EAS Dev Client',
            'Las llamadas grupales con audio/video real necesitan un APK/IPA.\nCon Expo Go solo se completa la señalización.',
            [{ text: 'Entendido', onPress: () => router.back() }],
          );
          return;
        }

        const ok = await startSFUCall(groupId, me.id, me.full_name || me.id, callType, me.avatar_url);
        if (!ok) {
          Alert.alert('Error', 'No se pudo iniciar la llamada grupal', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }

        timer = setInterval(() => setDuration(d => d + 1), 1000);
        subscribeSSE(me.id);
      } catch {
        router.back();
      }
    };
    init();
    return () => {
      clearInterval(timer);
      sseRef.current?.abort();
    };
  }, []);

  const subscribeSSE = useCallback(async (myUserId: string) => {
    const token = await getToken();
    const BASE  = getApiBase();
    const xhr   = new XMLHttpRequest();
    let lastIdx = 0;
    let buf = '';
    xhr.open('GET', `${BASE}/api/chat/stream?_t=${encodeURIComponent(token || '')}`, true);
    xhr.onprogress = () => {
      buf += xhr.responseText.slice(lastIdx);
      lastIdx = xhr.responseText.length;
      const parts = buf.split('\n\n');
      buf = parts.pop() || '';
      for (const part of parts) {
        if (!part.startsWith('data:')) continue;
        try {
          const msg = JSON.parse(part.replace(/^data:\s*/, ''));
          if (msg.type === 'group_call_participant_joined' && msg.roomId === groupId) {
            handlePeerJoined(msg.userId, msg.name, msg.avatar);
            // Toast de quien se unió
            const name = msg.name || participantNames[msg.userId] || 'Alguien';
            setJoinToasts(prev => [...prev, `${name} se unió`]);
            setTimeout(() => setJoinToasts(prev => prev.slice(1)), 3000);
          }
        } catch {}
      }
    };
    xhr.send();
    sseRef.current = xhr;
  }, [groupId, handlePeerJoined]);

  const hangUp = useCallback(async () => {
    sseRef.current?.abort();
    await leaveSFUCall();
    router.back();
  }, [leaveSFUCall]);

  // Grid layout
  const total       = participants.length; // sin contar al usuario local (PiP)
  const displayList = participants;

  const renderGrid = () => {
    if (total === 0) {
      // Solo yo — esperando participantes
      return (
        <View style={g.waiting}>
          <LinearGradient colors={['#00c8a0', '#00b4e6']} style={g.waitingAvatar}>
            <Text style={g.waitingInitials}>
              {(myUser?.full_name || 'Yo').slice(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={g.waitingText}>Esperando participantes…</Text>
          <Text style={g.waitingTimer}>{fmt(duration)}</Text>
        </View>
      );
    }

    // Caso especial 3 participantes: 1 grande arriba + 2 abajo
    if (total === 3) {
      const [first, ...rest] = displayList;
      return (
        <View style={g.col}>
          <ParticipantCell
            key={first.userId}
            participant={first}
            isVideo={isVideo}
            size={getCellLayout(3, 0)}
            isSpeaking={activeSpeaker === first.userId}
          />
          <View style={g.row}>
            {rest.map((p, i) => (
              <ParticipantCell
                key={p.userId}
                participant={p}
                isVideo={isVideo}
                size={getCellLayout(3, i + 1)}
                isSpeaking={activeSpeaker === p.userId}
              />
            ))}
          </View>
        </View>
      );
    }

    // Resto de layouts: flexWrap en rows
    const cols = total <= 4 ? 2 : total <= 6 ? 2 : 3;
    return (
      <View style={[g.grid, { flexDirection: 'row', flexWrap: 'wrap', gap: 3 }]}>
        {displayList.map((p, i) => (
          <ParticipantCell
            key={p.userId}
            participant={p}
            isVideo={isVideo}
            size={getCellLayout(total, i)}
            isSpeaking={activeSpeaker === p.userId}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

      {/* Grid de participantes remotos */}
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header compacto */}
        <View style={s.header}>
          <Text style={s.title}>Llamada grupal</Text>
          <Text style={s.timerTxt}>{fmt(duration)}</Text>
          <Text style={s.countTxt}>
            {total + 1} participante{total !== 0 ? 's' : ''}
          </Text>
        </View>

        {/* Área de video */}
        <View style={{ flex: 1 }}>
          {renderGrid()}
        </View>

        {/* Controles flotantes */}
        <View style={s.controls}>
          {/* Silenciar */}
          <CtrlBtn active={isMuted} danger onPress={toggleSFUMute}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              {isMuted
                ? <><Line x1="1" y1="1" x2="23" y2="23" /><Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2" /><Line x1="12" y1="19" x2="12" y2="23" /><Line x1="8" y1="23" x2="16" y2="23" /></>
                : <><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><Path d="M19 10v2a7 7 0 0 1-14 0v-2" /><Line x1="12" y1="19" x2="12" y2="23" /><Line x1="8" y1="23" x2="16" y2="23" /></>
              }
            </Svg>
          </CtrlBtn>

          {/* Chat lateral */}
          <CtrlBtn active={showChat} onPress={() => setShowChat(v => !v)}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
          </CtrlBtn>

          {/* Colgar */}
          <TouchableOpacity onPress={hangUp} activeOpacity={0.85}>
            <LinearGradient colors={['#ff3b30', '#c0392b']} style={s.hangup}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="#fff">
                <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)" />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cámara (solo video) */}
          {isVideo && (
            <CtrlBtn active={isCamOff} danger onPress={toggleSFUCamera}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                {isCamOff
                  ? <><Line x1="1" y1="1" x2="23" y2="23" /><Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" /></>
                  : <><Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" /></>
                }
              </Svg>
            </CtrlBtn>
          )}
        </View>
      </SafeAreaView>

      {/* PiP local arrastrable — solo en videollamada */}
      {isVideo && (
        <LocalPiP
          stream={localStream}
          isMuted={isMuted}
          isCamOff={isCamOff}
          isVideo={isVideo}
          name={myUser?.full_name || 'Yo'}
        />
      )}

      {/* Toasts de quien se une */}
      <View style={{ position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', gap: 6 }} pointerEvents="none">
        {joinToasts.map((t, i) => (
          <View key={i} style={{ backgroundColor: 'rgba(0,200,160,0.85)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>👋 {t}</Text>
          </View>
        ))}
      </View>

      {/* Panel de chat lateral */}
      {showChat && (
        <View style={s.chatPanel}>
          <View style={s.chatHeader}>
            <Text style={s.chatTitle}>Chat de la llamada</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={chatMessages}
            keyExtractor={m => m.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 10, gap: 8 }}
            ListEmptyComponent={<Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20 }}>Sin mensajes aún</Text>}
            renderItem={({ item }) => (
              <View>
                <Text style={{ color: '#00c8a0', fontSize: 11, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: '#fff', fontSize: 14 }}>{item.text}</Text>
              </View>
            )}
          />
          <View style={s.chatInput}>
            <TextInput
              style={s.chatTextInput}
              value={chatText}
              onChangeText={setChatText}
              placeholder="Mensaje..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              returnKeyType="send"
              onSubmitEditing={() => {
                if (!chatText.trim()) return;
                const msg = { id: String(Date.now()), name: myUser?.full_name || 'Yo', text: chatText.trim(), ts: Date.now() };
                setChatMessages(prev => [...prev, msg]);
                setChatText('');
              }}
            />
            <TouchableOpacity
              onPress={() => {
                if (!chatText.trim()) return;
                const msg = { id: String(Date.now()), name: myUser?.full_name || 'Yo', text: chatText.trim(), ts: Date.now() };
                setChatMessages(prev => [...prev, msg]);
                setChatText('');
              }}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ color: '#00c8a0', fontWeight: '700', fontSize: 15 }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Botón de control reutilizable ─────────────────────────────────
function CtrlBtn({ children, active, danger, onPress }: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.ctrlBtn,
        active && danger && s.ctrlBtnDanger,
        active && !danger && s.ctrlBtnActive,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0f172a' },
  header:  { alignItems: 'center', paddingVertical: 10, gap: 1 },
  title:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  timerTxt:{ fontSize: 13, color: ACCENT, fontWeight: '600' },
  countTxt:{ fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  controls: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 22,
    paddingVertical: 14, paddingHorizontal: 24,
    backgroundColor: 'rgba(15,23,42,0.92)',
  },
  ctrlBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnDanger:  { backgroundColor: 'rgba(239,68,68,0.35)', borderColor: 'rgba(239,68,68,0.5)' },
  ctrlBtnActive:  { backgroundColor: 'rgba(0,200,160,0.25)', borderColor: ACCENT },
  hangup: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 10,
  },
  // Chat lateral
  chatPanel: {
    position: 'absolute', bottom: 90, right: 0, top: 0,
    width: 260, backgroundColor: 'rgba(15,23,42,0.96)',
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatInput: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    padding: 8,
  },
  chatTextInput: {
    flex: 1, color: '#fff', fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 8,
  },
});

const g = StyleSheet.create({
  col:     { flex: 1, flexDirection: 'column', gap: 3 },
  row:     { flexDirection: 'row', gap: 3 },
  grid:    { flex: 1, padding: 3 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  waitingAvatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  waitingInitials: { fontSize: 36, fontWeight: '900', color: '#fff' },
  waitingText:  { fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  waitingTimer: { fontSize: 22, color: ACCENT, fontWeight: '700' },
});

const cs = StyleSheet.create({
  cell: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  cellCenter: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  initials: { fontSize: 30, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
  connecting: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  nameTag: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  nameText: { fontSize: 11, color: '#fff', fontWeight: '600', textAlign: 'center' },
  indicators: {
    position: 'absolute', top: 6, right: 6,
    flexDirection: 'row', gap: 3,
  },
  badge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  speakerDot: {
    position: 'absolute', top: 6, left: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: ACCENT,
  },
});

const pip = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 88, height: 120,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: ACCENT,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
    zIndex: 100,
  },
  video: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 22, fontWeight: '900', color: '#fff' },
  nameTag: {
    position: 'absolute', bottom: 3, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 2,
  },
  nameText: { fontSize: 10, color: '#fff', fontWeight: '600', textAlign: 'center' },
  mutedBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 2,
  },
});
