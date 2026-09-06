// ══════════════════════════════════════════════════════════════════
// EGCHAT — LIA-25 Asistente IA  (diseño mejorado)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polygon, Rect, Circle } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { liaAPI } from '../../src/api';
import { Colors, Spacing, FontSize, FontWeight, Shadow } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

const SW = Dimensions.get('window').width;

// ── Store de sesión ───────────────────────────────────────────────
interface LIAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const WELCOME: LIAMessage = {
  id: '0', role: 'assistant',
  content: '¡Hola! Soy Lia-25, tu asistente inteligente de EGCHAT. Puedo ayudarte con cualquier cosa: responder preguntas, enviar mensajes a contactos, gestionar tu dinero, y mucho más. ¿En qué puedo ayudarte?',
  time: '00:00',
};
let sessionHistory: LIAMessage[] = [WELCOME];

const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// ── Sugerencias ───────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    color: '#00C8A0', bg: '#E6FAF6', text: '¿Cuál es mi saldo?',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="1.8" strokeLinecap="round"><Rect x="2" y="5" width="20" height="14" rx="2"/><Line x1="2" y1="10" x2="22" y2="10"/><Circle cx="12" cy="15" r="2" fill="#00C8A0" stroke="none"/></Svg>,
  },
  {
    color: '#6B5BD6', bg: '#F0EEFF', text: 'Resumen de actividad',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round"><Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/><Line x1="6" y1="20" x2="6" y2="14"/></Svg>,
  },
  {
    color: '#F59E0B', bg: '#FFF8E6', text: 'Noticias de hoy',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"><Rect x="2" y="9" width="4" height="12" rx="1"/><Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><Path d="M10 11h8"/><Path d="M10 15h8"/></Svg>,
  },
  {
    color: '#00B4E6', bg: '#E6F8FF', text: '¿Cómo está el tiempo?',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00B4E6" strokeWidth="1.8" strokeLinecap="round"><Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></Svg>,
  },
  {
    color: '#00C8A0', bg: '#E6FAF6', text: 'Enviar dinero',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="1.8" strokeLinecap="round"><Line x1="22" y1="2" x2="11" y2="13"/><Polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
  },
  {
    color: '#EF4444', bg: '#FEF2F2', text: 'Centros de salud',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><Path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Svg>,
  },
  {
    color: '#F59E0B', bg: '#FFF8E6', text: 'Pedir un taxi',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"><Path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><Circle cx="7" cy="17" r="2"/><Circle cx="17" cy="17" r="2"/></Svg>,
  },
  {
    color: '#6B5BD6', bg: '#F0EEFF', text: 'Supermercados cercanos',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round"><Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><Line x1="3" y1="6" x2="21" y2="6"/><Path d="M16 10a4 4 0 0 1-8 0"/></Svg>,
  },
];

const QUICK_CHIPS = [
  { icon: '💳', text: 'Saldo' },
  { icon: '📰', text: 'Noticias' },
  { icon: '🚕', text: 'Taxi' },
  { icon: '↗️', text: 'Enviar' },
  { icon: '🏥', text: 'Salud' },
  { icon: '🛒', text: 'Compras' },
  { icon: '☀️', text: 'Clima' },
];

// ── Animación onda LIA ────────────────────────────────────────────
const BARS = [3, 5, 8, 12, 16, 20, 16, 12, 8, 5, 3, 5, 8, 12, 16, 20, 16, 12, 8, 5, 3];

const LiaWave = ({ active, color = '#00C8A0' }: { active: boolean; color?: string }) => {
  const anims = useRef(BARS.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (active) {
      const loops = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 40),
            Animated.timing(anim, { toValue: 1, duration: 300 + (i % 4) * 80, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 300 + (i % 4) * 80, useNativeDriver: true }),
          ])
        )
      );
      loops.forEach(l => l.start());
      return () => loops.forEach(l => l.stop());
    } else {
      anims.forEach(a => a.setValue(0.3));
    }
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 28, paddingHorizontal: 4 }}>
      {BARS.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3, borderRadius: 2,
            backgroundColor: color,
            height: h,
            transform: [{ scaleY: anims[i] }],
            opacity: anims[i],
          }}
        />
      ))}
    </View>
  );
};

// ── Avatar LIA ────────────────────────────────────────────────────
const LiaAvatar = ({ size = 36, speaking = false }: { size?: number; speaking?: boolean }) => (
  <LinearGradient
    colors={['#00C8A0', '#00B4E6']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={[{
      width: size, height: size, borderRadius: size / 2,
      alignItems: 'center', justifyContent: 'center',
    }, speaking && {
      shadowColor: '#00C8A0',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 12, elevation: 10,
    }]}
  >
    <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
      <Rect x="3" y="6" width="18" height="13" rx="3"/>
      <Path d="M3 10h18"/>
      <Circle cx="8.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
      <Circle cx="15.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
      <Path d="M9 17c.83.63 1.94 1 3 1s2.17-.37 3-1"/>
    </Svg>
  </LinearGradient>
);

// ── Puntos typing ─────────────────────────────────────────────────
const TypingDots = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start()
    );
  }, []);
  return (
    <View style={s.typingRow}>
      <LiaAvatar size={30} />
      <View style={s.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[s.dot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
// Altura real del tab bar (debe coincidir con _layout.tsx)
const TAB_BAR_H = Platform.OS === 'ios' ? 92 : 72;

export default function LiaScreen() {
  const insets = useSafeAreaInsets();
  // El tab bar es position:absolute con altura 72/92px — necesitamos ese espacio libre
  const tabBarOffset = TAB_BAR_H;
  const [messages, setMessages] = useState<LIAMessage[]>(() => [...sessionHistory]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMsg, setLastMsg] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [showChips, setShowChips] = useState(sessionHistory.length > 1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);

  const listRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToEnd(); }, [messages.length]);

  // ── Grabación de voz ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError('Permiso de micrófono denegado'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecordingObj(recording);
      setIsRecording(true);
    } catch {
      setError('No se pudo iniciar la grabación');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingObj) return;
    setIsRecording(false);
    try {
      await recordingObj.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setInput(prev => prev || '🎙️ Mensaje de voz');
      setRecordingObj(null);
    } catch {
      setRecordingObj(null);
    }
  }, [recordingObj]);

  // ── Enviar mensaje ────────────────────────────────────────────────
  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    setLastMsg(msg);
    const time = formatTime();
    const userMsg: LIAMessage = { id: Date.now().toString(), role: 'user', content: msg, time };
    setMessages(prev => { const next = [...prev, userMsg]; sessionHistory = next; return next; });
    setLoading(true);
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const history = sessionHistory.slice(-7, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await liaAPI.chat(msg, history);
      const aiMsg: LIAMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply, time };
      setMessages(prev => { const next = [...prev, aiMsg]; sessionHistory = next; return next; });
      setShowChips(true);
      if (res.reply.length < 250) {
        setSpeaking(true);
        Speech.speak(res.reply, {
          language: 'es-ES', rate: 1.0,
          onDone: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con LIA-25. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, sendScale]);

  const retry = useCallback(() => { if (lastMsg) send(lastMsg); }, [lastMsg, send]);
  const stopSpeaking = () => { Speech.stop(); setSpeaking(false); };

  const isFirstVisit = messages.length <= 1 && !loading && !showChips;
  const statusLabel = loading
    ? '● Escribiendo...'
    : speaking
    ? '🔊 Hablando...'
    : isRecording
    ? '🎙️ Escuchando...'
    : '● Asistente inteligente';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: isDark ? C.bgPrimary : '#F4FBFF' }]} edges={['top', 'left', 'right']}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <View style={s.headerLeft}>
          <LiaAvatar size={42} speaking={speaking} />
          <View style={{ flex: 1 }}>
            <Text style={s.headerName}>Lia-25</Text>
            <Text style={s.headerSub}>{statusLabel}</Text>
          </View>
          {(speaking || isRecording) && (
            <LiaWave active={speaking || isRecording} color="rgba(255,255,255,0.85)" />
          )}
        </View>
        {speaking && (
          <TouchableOpacity onPress={stopSpeaking} style={s.stopBtn} activeOpacity={0.8}>
            <Text style={s.stopBtnText}>■ Parar</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Contenedor principal con espacio para el tab bar absoluto */}
        <View style={{ flex: 1, paddingBottom: tabBarOffset }}>

        {/* ── Pantalla de bienvenida ───────────────────────────────── */}
        {isFirstVisit ? (
          <ScrollView
            contentContainerStyle={[s.welcomeScroll, { paddingBottom: tabBarOffset + 16 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar grande con halo */}
            <View style={s.avatarHaloWrap}>
              <View style={s.avatarHalo3} />
              <View style={s.avatarHalo2} />
              <View style={s.avatarHalo1} />
              <LiaAvatar size={80} speaking={false} />
            </View>

            {/* Onda decorativa */}
            <View style={{ marginVertical: 10 }}>
              <LiaWave active={false} />
            </View>

            <Text style={[s.welcomeTitle, { color: C.textPrimary }]}>Hola, soy Lia-25</Text>
            <Text style={[s.welcomeSub, { color: C.textSecondary }]}>
              Tu asistente inteligente — Habla o escribe
            </Text>

            {/* Grid de sugerencias 2 columnas */}
            <View style={s.suggestionsGrid}>
              {SUGGESTIONS.map((sg, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.suggestionCard, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.borderLight : '#E8F4FC' }]}
                  onPress={() => send(sg.text)}
                  activeOpacity={0.75}
                >
                  <View style={[s.suggestionIconWrap, { backgroundColor: sg.bg }]}>
                    {sg.icon}
                  </View>
                  <Text style={[s.suggestionText, { color: C.textPrimary }]} numberOfLines={2}>
                    {sg.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* ── Lista de mensajes ─────────────────────────────────── */
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <View style={[s.row, isUser ? s.rowUser : s.rowAI]}>
                  {!isUser && <LiaAvatar size={30} />}
                  <View style={[
                    s.bubble,
                    isUser
                      ? s.bubbleUser
                      : [s.bubbleAI, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.borderLight : '#E4EFF7' }],
                  ]}>
                    <Text style={[s.bubbleText, isUser ? s.textUser : { color: C.textPrimary }]}>
                      {item.content}
                    </Text>
                    <Text style={[s.timeText, isUser && s.timeUser]}>{item.time}</Text>
                  </View>
                  {isUser && <View style={s.userAvatarDot} />}
                </View>
              );
            }}
            ListFooterComponent={loading ? <TypingDots /> : null}
          />
        )}

        {/* ── Banner de error ──────────────────────────────────────── */}
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={retry} style={s.retryBtn} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Quick chips (solo cuando hay conversación) ───────────── */}
        {showChips && !isFirstVisit && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsScroll}
            contentContainerStyle={s.chipsRow}
          >
            {QUICK_CHIPS.map(c => (
              <TouchableOpacity
                key={c.text}
                style={[s.quickChip, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.border : '#DFF0FA' }]}
                onPress={() => send(c.text)}
                activeOpacity={0.75}
              >
                <Text style={s.quickChipIcon}>{c.icon}</Text>
                <Text style={[s.quickChipText, { color: C.textSecondary }]}>{c.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Barra de input ───────────────────────────────────────── */}
        <View style={[
          s.inputBar,
          {
            backgroundColor: isDark ? C.bgSecondary : '#fff',
            borderTopColor: isDark ? C.borderLight : '#E4EFF7',
          },
        ]}>
          {/* Botón micrófono */}
          <TouchableOpacity
            style={[s.micBtn, isRecording && s.micBtnActive, { borderColor: isDark ? C.border : '#DFF0FA' }]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <Text style={{ fontSize: 16 }}>⏹</Text>
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="1.8" strokeLinecap="round">
                <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <Line x1="12" y1="19" x2="12" y2="23"/>
                <Line x1="8" y1="23" x2="16" y2="23"/>
              </Svg>
            )}
          </TouchableOpacity>

          {/* Input o onda de grabación */}
          {isRecording ? (
            <View style={[s.inputWrap, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' }]}>
              <LiaWave active color="#EF4444" />
            </View>
          ) : (
            <View style={[s.inputWrap, { backgroundColor: isDark ? C.bgTertiary : '#F4FBFF', borderColor: isDark ? C.border : '#DFF0FA' }]}>
              <TextInput
                style={[s.input, { color: C.textPrimary }]}
                value={input}
                onChangeText={setInput}
                placeholder="Pregunta a Lia-25..."
                placeholderTextColor={C.textTertiary}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
            </View>
          )}

          {/* Botón enviar */}
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
              onPress={() => send()}
              disabled={(!input.trim() && !isRecording) || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#9CA3AF'} strokeWidth="2.5" strokeLinecap="round">
                  <Line x1="22" y1="2" x2="11" y2="13"/>
                  <Polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </Svg>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const CARD_W = (SW - 16 * 2 - 10) / 2; // 2 columnas con gap 10 y padding 16

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '500', marginTop: 2 },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginLeft: 8,
  },
  stopBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Bienvenida
  welcomeScroll: {
    alignItems: 'center', paddingHorizontal: 16, paddingTop: 32,
  },
  avatarHaloWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarHalo3: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,200,160,0.07)',
  },
  avatarHalo2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,200,160,0.12)',
  },
  avatarHalo1: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,200,160,0.18)',
  },
  welcomeTitle: {
    fontSize: 22, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center', marginTop: 4,
  },
  welcomeSub: {
    fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, marginBottom: 24,
    lineHeight: 19,
  },
  suggestionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', width: '100%',
  },
  suggestionCard: {
    width: CARD_W, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    ...Shadow.sm,
  },
  suggestionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  // Mensajes
  list: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: '#00C8A0', borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: 1, ...Shadow.sm },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  textUser: { color: '#fff' },
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.28)', marginTop: 5, textAlign: 'right' },
  timeUser: { color: 'rgba(255,255,255,0.65)' },
  userAvatarDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#00C8A0', marginBottom: 4,
  },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4, paddingHorizontal: 12 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 13, paddingHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#E4EFF7', ...Shadow.sm,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#00C8A0' },

  // Error
  errorBanner: {
    margin: 12, padding: 12, backgroundColor: '#FEF2F2',
    borderRadius: 12, borderWidth: 1, borderColor: '#FECACA',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', lineHeight: 18 },
  retryBtn: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Quick chips
  chipsScroll: { flexGrow: 0, marginVertical: 6 },
  chipsRow: { paddingHorizontal: 12, gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1,
    ...Shadow.sm,
  },
  quickChipIcon: { fontSize: 12 },
  quickChipText: { fontSize: 12, fontWeight: '600' },

  // Barra de input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12,
    borderTopWidth: 1,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'transparent',
  },
  micBtnActive: {
    backgroundColor: '#EF4444', borderColor: '#EF4444',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  inputWrap: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44, justifyContent: 'center', borderWidth: 1,
  },
  input: { fontSize: 14, maxHeight: 100, padding: 0 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00C8A0', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  sendBtnOff: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },
});
