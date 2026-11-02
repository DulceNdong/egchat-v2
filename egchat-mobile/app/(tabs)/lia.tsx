// ══════════════════════════════════════════════════════════════════
// EGCHAT — LIA-25 Asistente IA  (diseño mejorado v3)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, ScrollView, Dimensions, Keyboard, Image, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polygon, Rect, Circle, Polyline, G } from 'react-native-svg';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { liaAPI } from '../../src/api';
import { useTranslation } from '../../src/context/LanguageContext';
import { Colors, Shadow } from '../../src/theme';
import { LiaAvatar } from '../../src/components/LiaAvatar';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

const SW = Dimensions.get('window').width;

// ── Tipos ─────────────────────────────────────────────────────────
type LIAAttachmentKind = 'image' | 'document' | 'video';

interface LIAAttachment {
  uri: string;
  kind: LIAAttachmentKind;
  name: string;
  mime?: string;
  size?: number;
}

interface LIAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  attachment?: LIAAttachment;
  nav?: string | null;
  transfer?: { destinatario: string; telefono?: string | null; importe: number; concepto?: string | null } | null;
}

// Pantalla que abre cada acción que LIA decide ejecutar.
const LIA_NAV: Record<string, { labelKey: string; href: string }> = {
  cartera: { labelKey: 'wallet', href: '/(tabs)/monedero' },
  enviar: { labelKey: 'send', href: '/(tabs)/monedero' },
  recargar: { labelKey: 'topUp', href: '/(tabs)/monedero' },
  retirar: { labelKey: 'withdraw', href: '/(tabs)/monedero' },
  tarjetas: { labelKey: 'cards', href: '/(tabs)/monedero' },
  taxi: { labelKey: 'taxi', href: '/mitaxi' },
  salud: { labelKey: 'health', href: '/(tabs)/servicios' },
  supermercados: { labelKey: 'supermarket', href: '/supermercados' },
  noticias: { labelKey: 'news', href: '/(tabs)/servicios' },
  bancos: { labelKey: 'banks', href: '/bancos' },
  seguros: { labelKey: 'insurance', href: '/seguros-salud' },
  cemac: { labelKey: 'svcCemacZone', href: '/cemac' },
};

const TTS_LOCALE: Record<string, string> = { es: 'es-ES', fr: 'fr-FR', en: 'en-US', pt: 'pt-PT' };

// Elige el idioma de lectura según el texto real de la respuesta, no solo
// según el idioma de la interfaz: el historial puede estar en otro idioma.
const detectTTSLocale = (text: string, fallback: string) => {
  const s = ` ${text.toLowerCase().replace(/[.,;:!?"'(){}\[\]…—–]/g, ' ').replace(/\s+/g, ' ')} `;
  const count = (words: string[]) => words.reduce((n, w) => (s.includes(` ${w} `) ? n + 1 : n), 0);
  const marks = (re: RegExp) => ((s.match(re) || []).length) * 2;
  const scores: Record<string, number> = {
    'fr-FR': count(['le', 'les', 'votre', 'vous', 'est', 'pour', 'avec', 'bonjour', 'merci', 'des', 'une', 'du', 'nous', 'opérations', 'francs']) + marks(/[çèêàùœ]/g),
    'pt-PT': count(['você', 'seu', 'sua', 'olá', 'obrigado', 'obrigada', 'não', 'também', 'aqui', 'com', 'para', 'saldo']) + marks(/[ãõ]/g),
    'en-US': count(['the', 'your', 'you', 'is', 'are', 'balance', 'thanks', 'hello', 'please', 'what', 'how', 'can', 'with', 'and', 'for']),
    'es-ES': count(['el', 'tu', 'saldo', 'hola', 'gracias', 'para', 'con', 'una', 'los', 'las', 'puedes', 'qué', 'cómo', 'francos']) + marks(/[ñ¿¡]/g),
  };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : fallback;
};

// LIA es una niña y crecerá con la app. La edad define el tono de voz:
// a los 2 años el tono va alto (voz infantil) y baja hacia 1.0 al crecer.
const LIA_AGE = 2;
const TTS_PITCH = Math.max(1.0, 1.6 - (LIA_AGE - 2) * 0.05);

// Voces preferidas por idioma: suenan mucho más naturales que la voz
// "compact" que iOS trae por defecto. Solo voces femeninas, porque LIA
// es una niña.
const PREFERRED_VOICES: Record<string, string[]> = {
  'es-ES': ['mónica', 'monica', 'paulina', 'marisol', 'lucia', 'carmen'],
  'fr-FR': ['amélie', 'amelie', 'audrey', 'aurelie', 'julie', 'marie'],
  'en-US': ['samantha', 'ava', 'allison', 'susan', 'nicky', 'joelle', 'karen', 'moira'],
  'pt-PT': ['joana', 'catarina', 'luciana', 'ines', 'inês', 'carminho'],
};

const TTS_RATE: Record<string, number> = {
  'es-ES': 0.95, 'fr-FR': 0.95, 'en-US': 0.95, 'pt-PT': 0.95,
};

const CURRENCY_WORDS: Record<string, Record<string, string>> = {
  es: { XAF: 'francos CFA', XOF: 'francos CFA', FCFA: 'francos CFA', EUR: 'euros', USD: 'dólares' },
  fr: { XAF: 'francs CFA', XOF: 'francs CFA', FCFA: 'francs CFA', EUR: 'euros', USD: 'dollars' },
  en: { XAF: 'CFA francs', XOF: 'CFA francs', FCFA: 'CFA francs', EUR: 'euros', USD: 'dollars' },
  pt: { XAF: 'francos CFA', XOF: 'francos CFA', FCFA: 'francos CFA', EUR: 'euros', USD: 'dólares' },
};

// Prepara el texto para que suene como una persona: quita formato, enlaces
// y emojis, y convierte los códigos de moneda en palabras.
const prepareSpeech = (text: string, lang: string) => {
  let out = (text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_#`>~|]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ');
  const map = CURRENCY_WORDS[lang] || CURRENCY_WORDS.es;
  Object.entries(map).forEach(([code, words]) => {
    out = out.replace(new RegExp(`\\b${code}\\b`, 'gi'), words);
  });
  return out.replace(/\s+([.,;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
};

let voiceCache: Speech.Voice[] | null = null;

const loadVoices = async (): Promise<Speech.Voice[]> => {
  if (voiceCache) return voiceCache;
  try { voiceCache = await Speech.getAvailableVoicesAsync(); } catch { voiceCache = []; }
  return voiceCache;
};

// Elige la mejor voz instalada para el idioma: primero las voces
// mejoradas/premium, luego las de nombre conocido, luego el resto.
const pickVoice = async (locale: string): Promise<string | undefined> => {
  const voices = await loadVoices();
  if (!voices.length) return undefined;
  const target = locale.toLowerCase();
  const base = target.split('-')[0];
  const candidates = voices.filter(v => {
    const lang = (v.language || '').replace('_', '-').toLowerCase();
    return lang === target || lang.split('-')[0] === base;
  });
  if (!candidates.length) return undefined;
  const preferred = PREFERRED_VOICES[locale] || [];
  // Algunas voces del sistema (Siri, personales, de broma) no se pueden usar
  // desde una app: si se fuerzan, iOS no reproduce nada.
  const risky = /(siri|personal|compact|eloquence|novelty|zarvox|bells|bubbles|jester|whisper|albert|bahh|boing|cellos|organ|superstar|trinoids|wobble|good news|bad news)/;
  // Las voces masculinas suenan irreales con el tono infantil de LIA.
  const male = /(jorge|diego|enrique|thomas|paul|tom|alex|felipe|daniel|aaron|fred|gordon|arthur|rishi|xander|oliver|serge|yannick|jacques|david|mark|richard)/;
  const score = (v: Speech.Voice) => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.language || '').replace('_', '-').toLowerCase();
    if (risky.test(name)) return -1000;
    if (male.test(name)) return -900;
    let n = 0;
    if (v.quality === Speech.VoiceQuality.Enhanced) n += 100;
    if (name.includes('premium')) n += 70;
    if (lang === target) n += 40;
    const idx = preferred.findIndex(p => name.includes(p));
    if (idx >= 0) n += 30 - idx;
    return n;
  };
  const best = candidates.sort((a, b) => score(b) - score(a))[0];
  return best && score(best) > 0 ? best.identifier : undefined;
};

const makeWelcome = (content: string): LIAMessage => ({ id: '0', role: 'assistant', content, time: '00:00' });
let sessionHistory: LIAMessage[] = [];

const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatStamp = (iso?: string) => {
  if (!iso) return formatTime();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? formatTime() : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MSG_IMAGE = Math.min(220, SW * 0.52);

// ── Sugerencias ───────────────────────────────────────────────────
// El texto visible sale de t(key); al enviarlo el servidor reconoce la
// intención en los cuatro idiomas.
const SUGGESTIONS = [
  {
    key: 'liaSugBalance', color: '#00C8A0', bg: '#E6FAF6',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="1.8" strokeLinecap="round"><Rect x="2" y="5" width="20" height="14" rx="2"/><Line x1="2" y1="10" x2="22" y2="10"/><Circle cx="12" cy="15" r="2" fill="#00C8A0" stroke="none"/></Svg>,
  },
  {
    key: 'liaSugActivity', color: '#6B5BD6', bg: '#F0EEFF',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round"><Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/><Line x1="6" y1="20" x2="6" y2="14"/></Svg>,
  },
  {
    key: 'liaSugNews', color: '#F59E0B', bg: '#FFF8E6',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"><Rect x="2" y="9" width="4" height="12" rx="1"/><Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><Path d="M10 11h8"/><Path d="M10 15h8"/></Svg>,
  },
  {
    key: 'liaSugWeather', color: '#00B4E6', bg: '#E6F8FF',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00B4E6" strokeWidth="1.8" strokeLinecap="round"><Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></Svg>,
  },
  {
    key: 'liaSugSend', color: '#00C8A0', bg: '#E6FAF6',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="1.8" strokeLinecap="round"><Line x1="22" y1="2" x2="11" y2="13"/><Polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
  },
  {
    key: 'liaSugHealth', color: '#EF4444', bg: '#FEF2F2',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><Path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Svg>,
  },
  {
    key: 'liaSugTaxi', color: '#F59E0B', bg: '#FFF8E6',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"><Path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><Circle cx="7" cy="17" r="2"/><Circle cx="17" cy="17" r="2"/></Svg>,
  },
  {
    key: 'liaSugMarket', color: '#6B5BD6', bg: '#F0EEFF',
    icon: <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round"><Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><Line x1="3" y1="6" x2="21" y2="6"/><Path d="M16 10a4 4 0 0 1-8 0"/></Svg>,
  },
];

const QUICK_CHIPS = [
  { icon: '💳', key: 'liaChipBalance' },
  { icon: '📰', key: 'liaChipNews' },
  { icon: '🚕', key: 'liaChipTaxi' },
  { icon: '↗️', key: 'liaChipSend' },
  { icon: '🏥', key: 'liaChipHealth' },
  { icon: '🛒', key: 'liaChipShopping' },
  { icon: '☀️', key: 'liaChipWeather' },
];

// ── Animación onda LIA ────────────────────────────────────────────
const BARS = [3, 5, 8, 12, 16, 20, 16, 12, 8, 5, 3, 5, 8, 12, 16, 20, 16, 12, 8, 5, 3];

const LiaWave = ({ active, color = '#00C8A0' }: { active: boolean; color?: string }) => {
  const anims = useRef(BARS.map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    if (active) {
      const loops = anims.map((anim, i) =>
        Animated.loop(Animated.sequence([
          Animated.delay(i * 40),
          Animated.timing(anim, { toValue: 1, duration: 300 + (i % 4) * 80, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300 + (i % 4) * 80, useNativeDriver: true }),
        ]))
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
        <Animated.View key={i} style={{ width: 3, borderRadius: 2, backgroundColor: color, height: h, transform: [{ scaleY: anims[i] }], opacity: anims[i] }} />
      ))}
    </View>
  );
};

// ── Typing dots ───────────────────────────────────────────────────
const TypingDots = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((dot, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 150),
      Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
    ])).start());
  }, []);
  return (
    <View style={s.typingRow}>
      <LiaAvatar size={30} />
      <View style={s.typingBubble}>
        {dots.map((dot, i) => <Animated.View key={i} style={[s.dot, { transform: [{ translateY: dot }] }]} />)}
      </View>
    </View>
  );
};

// ── Texto con negritas (la IA responde con **...**) ───────────────
const RichText = ({ text, style }: { text: string; style?: any }) => {
  const parts = String(text).split(/(\*\*[^*\n]+\*\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <Text key={index} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

// ── Panel de adjuntos ─────────────────────────────────────────────
interface AttachPanelProps {
  visible: boolean;
  onClose: () => void;
  onOpenKeyboard: () => void;
  onSendText: (text: string) => void;
  onAttach: (attachment: LIAAttachment) => void;
  isDark: boolean;
  C: typeof Colors;
}

// Iconos SVG para cada opción
const AttachIcons: Record<string, React.ReactElement> = {
  photo: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="3"/>
      <Circle cx="8.5" cy="8.5" r="1.5" fill="#00C8A0" stroke="none"/>
      <Polyline points="21 15 16 10 5 21"/>
    </Svg>
  ),
  video: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="23 7 16 12 23 17 23 7" fill="#6B5BD6" fillOpacity="0.15"/>
      <Rect x="1" y="5" width="15" height="14" rx="2"/>
    </Svg>
  ),
  document: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <Polyline points="14 2 14 8 20 8"/>
      <Line x1="9" y1="13" x2="15" y2="13"/>
      <Line x1="9" y1="17" x2="13" y2="17"/>
    </Svg>
  ),
  file: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#00B4A0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </Svg>
  ),
  location: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <Circle cx="12" cy="10" r="3" fill="#EF4444" fillOpacity="0.2"/>
    </Svg>
  ),
  contact: (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#00B4E6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <Circle cx="12" cy="7" r="4" fill="#00B4E6" fillOpacity="0.15"/>
    </Svg>
  ),
};

const ATTACH_OPTIONS = [
  { id: 'photo',    labelKey: 'liaAttachPhoto',    bg: '#E6FAF6', color: '#00C8A0' },
  { id: 'video',    labelKey: 'liaAttachVideo',    bg: '#F0EEFF', color: '#6B5BD6' },
  { id: 'document', labelKey: 'liaAttachDocument', bg: '#FFF8E6', color: '#F59E0B' },
  { id: 'file',     labelKey: 'liaAttachFile',     bg: '#E0F7F0', color: '#00B4A0' },
  { id: 'location', labelKey: 'liaAttachLocation', bg: '#FEF2F2', color: '#EF4444' },
  { id: 'contact',  labelKey: 'liaAttachContact',  bg: '#E6F8FF', color: '#00B4E6' },
];

const AttachPanel = ({ visible, onClose, onOpenKeyboard, onSendText, onAttach, isDark, C }: AttachPanelProps) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(220)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        damping: 22, stiffness: 220, mass: 0.9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 220, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleOption = async (key: string) => {
    onClose();
    try {
      if (key === 'photo') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { onSendText(`⚠️ ${t('liaGalleryDenied')}`); return; }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        const asset = res.assets?.[0];
        if (!res.canceled && asset) {
          onAttach({
            uri: asset.uri,
            kind: 'image',
            name: asset.fileName || `imagen-${Date.now()}.jpg`,
            mime: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          });
        }
      } else if (key === 'video') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { onSendText(`⚠️ ${t('liaGalleryDenied')}`); return; }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos });
        const asset = res.assets?.[0];
        if (!res.canceled && asset) {
          onAttach({
            uri: asset.uri,
            kind: 'video',
            name: asset.fileName || `video-${Date.now()}.mp4`,
            mime: asset.mimeType || 'video/mp4',
            size: asset.fileSize,
          });
        }
      } else if (key === 'document' || key === 'file') {
        const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
        const asset = res.assets?.[0];
        if (!res.canceled && asset) {
          onAttach({
            uri: asset.uri,
            kind: 'document',
            name: asset.name || `documento-${Date.now()}`,
            mime: asset.mimeType,
            size: asset.size,
          });
        }
      } else if (key === 'location') {
        onSendText(t('liaLocationShared'));
      } else if (key === 'contact') {
        onSendText(t('liaContactShared'));
      }
    } catch {
      onSendText(`⚠️ ${t('liaAttachError')}`);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      s.attachPanel,
      { backgroundColor: isDark ? C.bgSecondary : '#FAFCFF', transform: [{ translateY: slideAnim }] },
    ]}>
      {/* Grid 3×2 */}
      <View style={s.attachGrid}>
        {ATTACH_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={s.attachItem}
            onPress={() => handleOption(opt.id)}
            activeOpacity={0.72}
          >
            <View style={[s.attachIconWrap, { backgroundColor: opt.bg }]}>
              {AttachIcons[opt.id]}
            </View>
            <Text style={[s.attachLabel, { color: isDark ? C.textSecondary : '#374151' }]}>
              {t(opt.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.attachHint, { color: isDark ? C.textTertiary : '#6B7280' }]}>
        {t('liaAttachHint')}
      </Text>

      {/* Botón para abrir teclado */}
      <TouchableOpacity
        style={s.attachKeyboardBtn}
        onPress={onOpenKeyboard}
        activeOpacity={0.75}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="5" width="20" height="14" rx="2"/>
          <Line x1="6" y1="10" x2="6" y2="10"/>
          <Line x1="10" y1="10" x2="10" y2="10"/>
          <Line x1="14" y1="10" x2="14" y2="10"/>
          <Line x1="18" y1="10" x2="18" y2="10"/>
          <Line x1="6" y1="14" x2="6" y2="14"/>
          <Line x1="18" y1="14" x2="18" y2="14"/>
          <Line x1="10" y1="14" x2="14" y2="14"/>
        </Svg>
        <Text style={s.attachKeyboardTxt}>{t('liaKeyboard')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function LiaScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const welcome = useMemo(() => makeWelcome(t('liaGreeting')), [t]);
  const [messages, setMessages] = useState<LIAMessage[]>(() =>
    sessionHistory.length > 1 ? [...sessionHistory] : [welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMsg, setLastMsg] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<'chat' | 'file' | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showChips, setShowChips] = useState(sessionHistory.length > 1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const speechRef = useRef<string | null>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // Abrir panel: cierra teclado primero
  const openAttach = useCallback(() => {
    Keyboard.dismiss();
    setShowAttach(true);
  }, []);

  // Abrir teclado: cierra panel primero
  const openKeyboard = useCallback(() => {
    setShowAttach(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToEnd(); }, [messages.length]);

  useEffect(() => () => { Speech.stop(); }, []);

  // Voz de LIA: se configura el modo de audio para que suene aunque el
  // teléfono esté en silencio y se corta cualquier lectura anterior.
  const speakMessage = useCallback(async (text: string, id: string) => {
    const locale = detectTTSLocale(text, TTS_LOCALE[language] || 'es-ES');
    const clean = prepareSpeech(text, locale.slice(0, 2));
    if (!clean) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch {}
    try { await Speech.stop(); } catch {}
    const voice = await pickVoice(locale);
    speechRef.current = id;
    setSpeakingId(id);
    setSpeaking(true);
    let started = false;
    let retried = false;
    const finish = () => {
      started = true;
      if (speechRef.current === id) { speechRef.current = null; setSpeaking(false); setSpeakingId(null); }
    };
    const start = (voiceId?: string) => Speech.speak(clean, {
      language: locale,
      ...(voiceId ? { voice: voiceId } : {}),
      rate: TTS_RATE[locale] || 0.95,
      pitch: TTS_PITCH,
      onStart: () => { started = true; },
      onDone: finish,
      onStopped: finish,
      onError: () => {
        if (voiceId && !started && !retried) { retried = true; start(undefined); }
        else finish();
      },
    });
    start(voice);
    // Si la voz elegida no arranca (iOS la rechaza en silencio), se repite
    // con la voz del sistema para ese idioma.
    if (voice) {
      setTimeout(async () => {
        if (started || retried || speechRef.current !== id) return;
        let speaking = false;
        try { speaking = await Speech.isSpeakingAsync(); } catch {}
        if (!speaking) { retried = true; start(undefined); }
      }, 1200);
    }
  }, [language]);

  useEffect(() => { loadVoices(); }, []);

  // Recuperar la conversación guardada en el servidor (solo la primera vez
  // de la sesión, y solo si aún no hay mensajes locales).
  useEffect(() => {
    if (sessionHistory.length > 1) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await liaAPI.history(20);
        if (cancelled || !res?.messages?.length) return;
        const restored: LIAMessage[] = res.messages.map((m, index) => ({
          id: `h-${index}`,
          role: m.role,
          content: m.content,
          time: formatStamp(m.time),
        }));
        sessionHistory = [welcome, ...restored];
        setMessages([...sessionHistory]);
        setShowChips(true);
      } catch {
        // sin historial: se empieza de cero
      }
    })();
    return () => { cancelled = true; };
  }, [welcome]);

  // ── Grabación de voz ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    speechRef.current = null;
    try { await Speech.stop(); } catch {}
    setSpeaking(false);
    setSpeakingId(null);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError(t('liaMicDenied')); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecordingObj(recording);
      setIsRecording(true);
    } catch {
      setError(t('liaRecordStartError'));
    }
  }, [t]);

  const stopRecording = useCallback(async () => {
    if (!recordingObj) return;
    setIsRecording(false);
    let uri: string | null = null;
    try {
      await recordingObj.stopAndUnloadAsync();
      uri = recordingObj.getURI();
    } catch {
      setRecordingObj(null);
      return;
    }
    setRecordingObj(null);
    try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
    if (!uri) return;

    setTranscribing(true);
    setError(null);
    try {
      const res = await liaAPI.transcribe(uri, language);
      const text = (res?.text || '').trim();
      if (!text) { setError(t('liaTranscribeUnavailable')); return; }
      setInput(prev => (prev.trim() ? `${prev.trim()} ${text}` : text));
    } catch {
      setError(t('liaTranscribeUnavailable'));
    } finally {
      setTranscribing(false);
    }
  }, [recordingObj, language, t]);

  // ── Enviar mensaje ────────────────────────────────────────────────
  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    setShowAttach(false);
    setLastMsg(msg);
    const time = formatTime();
    const userMsg: LIAMessage = { id: Date.now().toString(), role: 'user', content: msg, time };
    setMessages(prev => { const next = [...prev, userMsg]; sessionHistory = next; return next; });
    setLoading(true);
    setBusyKind('chat');
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const history = sessionHistory.slice(-7, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await liaAPI.chat(msg, history, language);
      const aiMsg: LIAMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        time,
        nav: res.nav || null,
        transfer: res.transfer || null,
      };
      setMessages(prev => { const next = [...prev, aiMsg]; sessionHistory = next; return next; });
      setShowChips(true);
      speakMessage(res.reply, aiMsg.id);
    } catch {
      setError(t('liaErrorConnection'));
    } finally {
      setLoading(false);
      setBusyKind(null);
    }
  }, [input, loading, sendScale, language, speakMessage, t]);

  // ── Enviar archivo (imagen, documento o vídeo) ────────────────────
  const sendAttachment = useCallback(async (attachment: LIAAttachment) => {
    if (loading) return;
    const caption = input.trim();
    setInput('');
    setError(null);
    setShowAttach(false);
    const time = formatTime();
    const userMsg: LIAMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: caption,
      time,
      attachment,
    };
    setLastMsg(caption || attachment.name);
    setMessages(prev => { const next = [...prev, userMsg]; sessionHistory = next; return next; });
    setLoading(true);
    setBusyKind('file');
    try {
      const res = await liaAPI.attach(attachment.uri, attachment.name, attachment.mime, caption, language);
      const aiMsg: LIAMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply, time };
      setMessages(prev => { const next = [...prev, aiMsg]; sessionHistory = next; return next; });
      setShowChips(true);
      speakMessage(res.reply, aiMsg.id);
    } catch (e: any) {
      setError(e?.message || t('liaAttachError'));
    } finally {
      setLoading(false);
      setBusyKind(null);
    }
  }, [input, loading, language, speakMessage, t]);

  const retry = useCallback(() => { if (lastMsg) send(lastMsg); }, [lastMsg, send]);
  const stopSpeaking = () => { speechRef.current = null; Speech.stop(); setSpeaking(false); setSpeakingId(null); };

  const goBack = useCallback(() => {
    speechRef.current = null;
    Speech.stop();
    setSpeaking(false);
    setSpeakingId(null);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  }, []);

  const isFirstVisit = messages.length <= 1 && !loading && !showChips;
  const statusLabel = loading
    ? `● ${busyKind === 'file' ? t('liaReadingFile') : t('liaStatusTyping')}`
    : transcribing
      ? `● ${t('liaTranscribing')}`
      : speaking
        ? `🔊 ${t('liaStatusTalking')}`
        : isRecording
          ? `🎙️ ${t('liaStatusListening')}`
          : `● ${t('liaStatusIdle')}`;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: isDark ? C.bgPrimary : '#F4FBFF' }]} edges={['left', 'right']}>

      {/* ── Header plano (el degradado cubre también la barra de estado) ── */}
      <LinearGradient
        colors={['#00B89A', '#00A9D8', '#2F6BEA']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={goBack}
          style={s.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </TouchableOpacity>
        <LiaAvatar size={38} speaking={speaking} />
        <View style={s.headerText}>
          <View style={s.headerNameRow}>
            <Text style={s.headerName}>Lia-25</Text>
            <View style={s.aiBadge}><Text style={s.aiBadgeText}>IA</Text></View>
          </View>
          <Text style={s.headerSub} numberOfLines={1}>{statusLabel}</Text>
        </View>
        {isRecording && <LiaWave active color="rgba(255,255,255,0.9)" />}
        {speaking && (
          <TouchableOpacity onPress={stopSpeaking} style={s.stopBtn} activeOpacity={0.8}>
            <Text style={s.stopBtnText}>■ {t('liaStop')}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── Cuerpo: KeyboardAvoidingView cubre TODO incluida la barra ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Pantalla de bienvenida ── */}
        {isFirstVisit ? (
          <ScrollView
            contentContainerStyle={s.welcomeScroll}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.avatarHaloWrap}>
              <View style={s.avatarHalo3} />
              <View style={s.avatarHalo2} />
              <View style={s.avatarHalo1} />
              <LiaAvatar size={80} speaking={false} />
            </View>
            <View style={{ marginVertical: 10 }}>
              <LiaWave active={false} />
            </View>
            <Text style={[s.welcomeTitle, { color: C.textPrimary }]}>{t('liaWelcomeTitle')}</Text>
            <Text style={[s.welcomeSub, { color: C.textSecondary }]}>{t('liaWelcomeSub')}</Text>
            <View style={s.suggestionsGrid}>
              {SUGGESTIONS.map((sg, i) => (
                <TouchableOpacity
                  key={sg.key}
                  style={[s.suggestionCard, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.borderLight : '#E8F4FC' }]}
                  onPress={() => send(t(sg.key))}
                  activeOpacity={0.75}
                >
                  <View style={[s.suggestionIconWrap, { backgroundColor: sg.bg }]}>{sg.icon}</View>
                  <Text style={[s.suggestionText, { color: C.textPrimary }]} numberOfLines={2}>{t(sg.key)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* ── Lista de mensajes ── */
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              const content = item.id === '0' ? t('liaGreeting') : item.content;
              const attachment = item.attachment;
              const isSpeakingMsg = speakingId === item.id;
              return (
                <View style={[s.row, isUser ? s.rowUser : s.rowAI]}>
                  {!isUser && <LiaAvatar size={30} />}
                  <View style={[
                    s.bubble,
                    isUser ? s.bubbleUser : [s.bubbleAI, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.borderLight : '#E4EFF7' }],
                    attachment?.kind === 'image' && s.bubbleImage,
                  ]}>
                    {attachment?.kind === 'image' && (
                      <TouchableOpacity activeOpacity={0.92} onPress={() => setPreviewUri(attachment.uri)}>
                        <Image source={{ uri: attachment.uri }} style={s.msgImage} resizeMode="cover" />
                        <View style={s.imageBadge}>
                          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <Circle cx="11" cy="11" r="7"/>
                            <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <Line x1="11" y1="8" x2="11" y2="14"/>
                            <Line x1="8" y1="11" x2="14" y2="11"/>
                          </Svg>
                        </View>
                      </TouchableOpacity>
                    )}
                    {attachment && attachment.kind !== 'image' && (
                      <View style={s.fileCard}>
                        <View style={[s.fileIconWrap, isUser && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          {attachment.kind === 'video' ? (
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={isUser ? '#fff' : '#6B5BD6'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <Polygon points="23 7 16 12 23 17 23 7"/>
                              <Rect x="1" y="5" width="15" height="14" rx="2"/>
                            </Svg>
                          ) : (
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={isUser ? '#fff' : '#F59E0B'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <Polyline points="14 2 14 8 20 8"/>
                              <Line x1="9" y1="15" x2="15" y2="15"/>
                            </Svg>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={[s.fileName, isUser && s.fileNameUser]}>{attachment.name}</Text>
                          <Text style={[s.fileMeta, isUser && s.fileMetaUser]}>
                            {attachment.kind === 'video' ? t('liaAttachVideo') : t('liaAttachDocument')}
                            {attachment.size ? ` · ${formatBytes(attachment.size)}` : ''}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!content && (
                      <RichText
                        text={content}
                        style={[s.bubbleText, attachment ? { marginTop: 8 } : null, isUser ? s.textUser : { color: C.textPrimary }]}
                      />
                    )}
                    {!isUser && (item.nav || item.transfer) && (() => {
                      const target = item.nav && LIA_NAV[item.nav] ? LIA_NAV[item.nav] : null;
                      const label = target
                        ? `${t('liaOpen')} ${t(target.labelKey)}`
                        : item.transfer
                          ? `${t('liaOpen')} ${t('wallet')}`
                          : null;
                      if (!label) return null;
                      return (
                        <TouchableOpacity
                          style={s.navBtn}
                          activeOpacity={0.85}
                          onPress={() => router.push((target ? target.href : '/(tabs)/monedero') as any)}
                        >
                          <Text style={s.navBtnText}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })()}
                    <View style={[s.metaRow, isUser && s.metaRowUser]}>
                      {!isUser && (
                        <TouchableOpacity
                          style={[s.speakBtn, isSpeakingMsg && s.speakBtnActive]}
                          onPress={() => (isSpeakingMsg ? stopSpeaking() : speakMessage(content, item.id))}
                          activeOpacity={0.7}
                          accessibilityLabel={t('liaListen')}
                        >
                          {isSpeakingMsg ? (
                            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00A38A" strokeWidth="2">
                              <Rect x="6" y="6" width="12" height="12" rx="3" fill="#00A38A" stroke="none"/>
                            </Svg>
                          ) : (
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#00A38A" strokeWidth="1.9" strokeLinecap="round">
                              <Path d="M11 5L6 9H2v6h4l5 4z"/>
                              <Path d="M15.5 8.5a5 5 0 0 1 0 7"/>
                              <Path d="M18.5 5.5a9 9 0 0 1 0 13"/>
                            </Svg>
                          )}
                          <Text style={s.speakBtnText}>{isSpeakingMsg ? t('liaStop') : t('liaListen')}</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={[s.timeText, { marginTop: 0 }, isUser && s.timeUser]}>{item.time}</Text>
                    </View>
                  </View>
                  {isUser && <View style={s.userAvatarDot} />}
                </View>
              );
            }}
            ListFooterComponent={loading ? <TypingDots /> : null}
          />
        )}

        {/* ── Error banner ── */}
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={retry} style={s.retryBtn} activeOpacity={0.8}>
              <Text style={s.retryText}>{t('liaRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Quick chips ── */}
        {showChips && !isFirstVisit && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsRow}>
            {QUICK_CHIPS.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.quickChip, { backgroundColor: isDark ? C.bgSecondary : '#fff', borderColor: isDark ? C.border : '#DFF0FA' }]}
                onPress={() => send(t(c.key))}
                activeOpacity={0.75}
              >
                <Text style={s.quickChipIcon}>{c.icon}</Text>
                <Text style={[s.quickChipText, { color: C.textSecondary }]}>{t(c.key)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Panel de adjuntos (slide up) ── */}
        <AttachPanel
          visible={showAttach}
          onClose={() => setShowAttach(false)}
          onOpenKeyboard={openKeyboard}
          onSendText={send}
          onAttach={sendAttachment}
          isDark={isDark}
          C={C}
        />

        {/* ── Barra de input ── */}
        <View style={[
          s.inputBar,
          {
            backgroundColor: isDark ? C.bgSecondary : '#fff',
            borderTopColor: isDark ? C.borderLight : '#E4EFF7',
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          },
        ]}>
          {/* Botón + (adjuntos) o × (cerrar panel) */}
          <TouchableOpacity
            style={[s.attachBtn, showAttach && s.attachBtnActive]}
            onPress={showAttach ? () => setShowAttach(false) : openAttach}
            activeOpacity={0.8}
          >
            {showAttach ? (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18"/>
                <Line x1="6" y1="6" x2="18" y2="18"/>
              </Svg>
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth="2.2" strokeLinecap="round">
                <Line x1="12" y1="5" x2="12" y2="19"/>
                <Line x1="5" y1="12" x2="19" y2="12"/>
              </Svg>
            )}
          </TouchableOpacity>

          {/* Botón micrófono */}
          <TouchableOpacity
            style={[s.micBtn, isRecording && s.micBtnActive, { borderColor: isDark ? C.border : '#DFF0FA' }]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            {transcribing ? (
              <ActivityIndicator size="small" color="#00C8A0" />
            ) : isRecording ? (
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

          {/* Input o onda */}
          {isRecording ? (
            <View style={[s.inputWrap, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' }]}>
              <LiaWave active color="#EF4444" />
            </View>
          ) : (
            <View style={[s.inputWrap, { backgroundColor: isDark ? C.bgTertiary : '#F4FBFF', borderColor: isDark ? C.border : '#DFF0FA' }]}>
              <TextInput
                ref={inputRef}
                style={[s.input, { color: C.textPrimary }]}
                value={input}
                onChangeText={setInput}
                placeholder={t('liaPlaceholder')}
                placeholderTextColor={C.textTertiary}
                onSubmitEditing={() => send()}
                onFocus={() => setShowAttach(false)}
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

      </KeyboardAvoidingView>

      {/* ── Vista previa de imagen a pantalla completa ── */}
      <Modal visible={!!previewUri} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewUri(null)}>
        <View style={s.previewBackdrop}>
          {previewUri && <Image source={{ uri: previewUri }} style={s.previewImage} resizeMode="contain" />}
          <TouchableOpacity
            style={[s.previewClose, { top: insets.top + 12 }]}
            onPress={() => setPreviewUri(null)}
            activeOpacity={0.8}
            accessibilityLabel={t('close')}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/>
              <Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const CARD_W = (SW - 16 * 2 - 10) / 2;

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header plano
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12, gap: 10,
    zIndex: 2,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerText: { flex: 1 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  aiBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginTop: 2 },
  stopBtn: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 8 },
  stopBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Bienvenida
  welcomeScroll: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 20 },
  avatarHaloWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarHalo3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,200,160,0.07)' },
  avatarHalo2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,200,160,0.12)' },
  avatarHalo1: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,200,160,0.18)' },
  welcomeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center', marginTop: 4 },
  welcomeSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 19 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  suggestionCard: { width: CARD_W, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, ...Shadow.sm },
  suggestionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  // Mensajes
  list: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleImage: { padding: 5, overflow: 'hidden' },
  bubbleUser: { backgroundColor: '#00C8A0', borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: 1, ...Shadow.sm },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  textUser: { color: '#fff' },
  msgImage: { width: MSG_IMAGE, height: MSG_IMAGE, borderRadius: 14, backgroundColor: '#E5E7EB' },
  imageBadge: {
    position: 'absolute', right: 8, bottom: 8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, paddingVertical: 2 },
  fileIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF8E6', alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 13, fontWeight: '700', color: '#111827', maxWidth: 190 },
  fileNameUser: { color: '#fff' },
  fileMeta: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  fileMetaUser: { color: 'rgba(255,255,255,0.82)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  metaRowUser: { justifyContent: 'flex-end' },
  navBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#00B4E6' },
  navBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(0,200,160,0.1)' },
  speakBtnActive: { backgroundColor: 'rgba(0,200,160,0.2)' },
  speakBtnText: { fontSize: 10, fontWeight: '700', color: '#00A38A' },
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.28)', marginTop: 5, textAlign: 'right' },
  timeUser: { color: 'rgba(255,255,255,0.65)' },
  userAvatarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C8A0', marginBottom: 4 },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4, paddingHorizontal: 12 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E4EFF7', ...Shadow.sm },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#00C8A0' },

  // Error
  errorBanner: { margin: 12, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', lineHeight: 18 },
  retryBtn: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Quick chips
  chipsScroll: { flexGrow: 0, marginVertical: 4 },
  chipsRow: { paddingHorizontal: 12, gap: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, ...Shadow.sm },
  quickChipIcon: { fontSize: 12 },
  quickChipText: { fontSize: 12, fontWeight: '600' },

  // Panel adjuntos
  attachPanel: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4EFF7',
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  attachItem: {
    width: '30%',
    alignItems: 'center',
    gap: 7,
  },
  attachIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  attachLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  attachHint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 10,
    lineHeight: 15,
  },
  attachKeyboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  attachKeyboardTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Barra de input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1 },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#00C8A0',
  },
  attachBtnActive: { backgroundColor: '#00C8A0', borderColor: '#00C8A0' },
  micBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'transparent' },
  micBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  inputWrap: { flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 6, minHeight: 40, justifyContent: 'center', borderWidth: 1 },
  input: { fontSize: 14, maxHeight: 100, padding: 0 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center', shadowColor: '#00C8A0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  sendBtnOff: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },

  // Vista previa de imagen
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '82%' },
  previewClose: {
    position: 'absolute', right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
});
