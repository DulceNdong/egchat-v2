// Burbuja de mensaje — paridad EGCHAT v2.5.2
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Linking, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Svg, { Path, Rect, Polygon } from 'react-native-svg';
import { EGAvatar } from '../ui';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { ReactionBubble, ReactionPopAnimation } from './ReactionBubble';
import { PollMessage, parsePoll } from './PollMessage';
import { ImageViewer } from '../ImageViewer';
import type { ChatMessage } from '../../types/chat';

// ── Tarjeta VIDEO — estilo WhatsApp ──────────────────────────────
const VideoCard = ({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<any>(null);

  const url = message.file_url || '';
  // Nombre limpio: quitar prefijo 🎥, hash técnico → mostrar "Video"
  const rawName = (message.text || '').replace(/^🎥\s*/, '').trim();
  const isHashName = /^[a-z0-9]{20,}/i.test(rawName.split('.')[0]);
  const fileName = isHashName ? 'Video' : (rawName || 'Video');
  const ext = rawName.split('.').pop()?.toLowerCase() || 'mp4';

  const togglePlay = async () => {
    if (!videoRef.current) return;
    try {
      if (playing) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setPlaying(p => !p);
    } catch {}
  };

  // En web: usar elemento <video> nativo
  if (typeof document !== 'undefined') {
    return (
      <View style={vd.card}>
        <View style={vd.videoBox}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <video
            src={url}
            controls
            style={{ width: '100%', maxWidth: 260, borderRadius: 10, display: 'block', maxHeight: 180, backgroundColor: '#000' }}
            preload="metadata"
          />
        </View>
        <View style={vd.meta}>
          <Text style={vd.name} numberOfLines={1}>{fileName}</Text>
          <Text style={vd.ext}>{ext.toUpperCase()}</Text>
        </View>
      </View>
    );
  }

  // En nativo: miniatura oscura con botón play + expo-av Video
  const { Video } = require('expo-av');
  return (
    <View style={vd.card}>
      <TouchableOpacity onPress={togglePlay} activeOpacity={0.9} style={vd.videoBox}>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={vd.video}
          resizeMode="cover"
          shouldPlay={false}
          isMuted={false}
          onReadyForDisplay={() => setReady(true)}
          onPlaybackStatusUpdate={(s: any) => {
            if (s.didJustFinish) { setPlaying(false); }
          }}
        />
        {/* Overlay oscuro cuando no reproduce */}
        {!playing && (
          <View style={vd.overlay}>
            <View style={vd.playBtn}>
              <View style={vd.playTriangle} />
            </View>
          </View>
        )}
        {!ready && !playing && (
          <View style={[vd.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
            <View style={vd.playBtn}>
              <View style={vd.playTriangle} />
            </View>
          </View>
        )}
      </TouchableOpacity>
      <View style={vd.meta}>
        <Text style={vd.name} numberOfLines={1}>{fileName}</Text>
        <Text style={[vd.ext, { color: isOwn ? '#00c8a0' : '#00b4e6' }]}>{ext.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const vd = StyleSheet.create({
  card: { minWidth: 200, maxWidth: 260 },
  videoBox: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', position: 'relative', marginBottom: 6 },
  video: { width: 260, height: 160 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#111',
    marginLeft: 4,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  name: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1, marginRight: 6 },
  ext: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});

// ── Tarjeta LLAMADA — compacta y profesional (sin fondos de color) ──

const PhoneIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l1.86-1.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </Svg>
);

const VideoIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="23 7 16 12 23 17 23 7"/>
    <Rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </Svg>
);

const ArrowDownLeft = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 7L7 17M17 17H7V7"/>
  </Svg>
);

const ArrowUpRight = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 17L17 7M7 7h10v10"/>
  </Svg>
);

const CallCard = ({ message, isOwn, onCallback }: {
  message: ChatMessage; isOwn: boolean; onCallback?: () => void;
}) => {
  const txt = message.text || '';
  const isVideo   = txt.includes('📹') || txt.toLowerCase().includes('video');
  const isPerdida = txt.toLowerCase().includes('perdida') || txt.toLowerCase().includes('missed');
  const isSaliente= txt.toLowerCase().includes('saliente') || txt.toLowerCase().includes('outgoing');

  const durMatch = txt.match(/\((\d+:\d+)\)/);
  const duration = durMatch ? durMatch[1] : null;

  const iconColor = isPerdida ? '#ef4444' : isOwn ? '#00c8a0' : '#6b7280';
  const arrowColor = isPerdida ? '#ef4444' : isSaliente ? '#00c8a0' : '#6b7280';
  const labelColor = isPerdida ? '#ef4444' : '#111827';

  const label = isPerdida
    ? (isVideo ? 'Videollamada perdida' : 'Llamada perdida')
    : isSaliente
      ? (isVideo ? 'Videollamada saliente' : 'Llamada saliente')
      : (isVideo ? 'Videollamada entrante' : 'Llamada entrante');

  return (
    <View style={cl.card}>
      {/* Ícono SVG + flecha dirección */}
      <View style={cl.iconWrap}>
        {isVideo
          ? <VideoIcon color={iconColor} size={18} />
          : <PhoneIcon color={iconColor} size={18} />}
        <View style={cl.arrowWrap}>
          {isSaliente
            ? <ArrowUpRight color={arrowColor} size={10} />
            : <ArrowDownLeft color={arrowColor} size={10} />}
        </View>
      </View>

      {/* Texto */}
      <View style={cl.info}>
        <Text style={[cl.label, { color: labelColor }]}>{label}</Text>
        {duration
          ? <Text style={cl.sub}>{duration}</Text>
          : isPerdida
            ? <Text style={[cl.sub, { color: '#ef4444' }]}>Toca ↗ para devolver</Text>
            : null}
      </View>

      {/* Botón rellamar — solo ícono, sin fondo de color */}
      {onCallback && (
        <TouchableOpacity onPress={onCallback} style={cl.callBtn} activeOpacity={0.6} hitSlop={8}>
          {isVideo
            ? <VideoIcon color={isOwn ? '#00c8a0' : '#3b82f6'} size={20} />
            : <PhoneIcon color={isOwn ? '#00c8a0' : '#3b82f6'} size={20} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const cl = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
    maxWidth: 260,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arrowWrap: {
    position: 'absolute',
    bottom: -1,
    right: -4,
  },
  info: { flex: 1, gap: 1 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  sub: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  callBtn: {
    padding: 4,
    flexShrink: 0,
  },
});


// Detecta si es mensaje de voz (grabado en app) vs canción compartida
const isVoiceMessage = (msg: ChatMessage): boolean => {
  const text = msg.text || '';
  const url  = msg.file_url || '';
  // Grabación de voz: nombre es audio.m4a / audio.wav, o texto tiene "Audio (Xs)"
  if (/audio\.(m4a|wav|ogg|aac|opus)$/i.test(url)) return true;
  if (/^🎵\s*Audio\s*(\(\d+s\))?$/i.test(text.trim())) return true;
  if (/^audio\.(m4a|wav|ogg|aac|opus)$/i.test(text.trim())) return true;
  return false;
};

const SPEED_STEPS = [1, 1.5, 2] as const;
type SpeedStep = typeof SPEED_STEPS[number];

// ── VoiceCard — mensaje de voz con velocidad ──────────────────────
const VOICE_BARS = [0.3,0.5,0.8,0.6,1.0,0.7,0.4,0.9,0.5,0.8,0.6,0.3,0.7,1.0,0.5,0.4,0.9,0.6,0.8,0.3,0.5,0.7,1.0,0.4,0.6,0.9,0.5,0.3,0.8,0.6];

const VoiceCard = ({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) => {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed]       = useState<SpeedStep>(1);
  const soundRef   = useRef<Audio.Sound | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const isWeb      = typeof document !== 'undefined';
  const url        = message.file_url || '';

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // Pulso
  useEffect(() => {
    if (playing) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }
  }, [playing]);

  // Web: Audio element
  useEffect(() => {
    if (!isWeb || !url) return;
    const el = new (window as any).Audio(url) as HTMLAudioElement;
    el.preload = 'metadata';
    el.playbackRate = speed;
    el.onloadedmetadata = () => setDuration(el.duration);
    el.ontimeupdate = () => {
      setPosition(el.currentTime);
      setProgress(el.duration ? el.currentTime / el.duration : 0);
    };
    el.onended = () => { setPlaying(false); setProgress(0); setPosition(0); el.currentTime = 0; };
    audioElRef.current = el;
    return () => { el.pause(); el.src = ''; audioElRef.current = null; };
  }, [isWeb, url]);

  // Cambiar velocidad en web
  useEffect(() => {
    if (isWeb && audioElRef.current) audioElRef.current.playbackRate = speed;
  }, [isWeb, speed]);

  const togglePlay = useCallback(async () => {
    if (!url) return;
    if (isWeb) {
      const el = audioElRef.current;
      if (!el) return;
      if (playing) { el.pause(); setPlaying(false); }
      else { el.play().catch(() => {}); setPlaying(true); }
      return;
    }
    try {
      if (soundRef.current) {
        const st = await soundRef.current.getStatusAsync();
        if (st.isLoaded) {
          if (st.isPlaying) { await soundRef.current.pauseAsync(); setPlaying(false); }
          else              { await soundRef.current.setRateAsync(speed, true); await soundRef.current.playAsync(); setPlaying(true); }
          return;
        }
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: url }, { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
        (st) => {
          if (!st.isLoaded) return;
          const dur = (st.durationMillis || 0) / 1000;
          const pos = (st.positionMillis || 0) / 1000;
          setDuration(dur); setPosition(pos);
          setProgress(dur ? pos / dur : 0);
          if (st.didJustFinish) { setPlaying(false); setProgress(0); setPosition(0); sound.setPositionAsync(0).catch(() => {}); }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
    } catch {}
  }, [url, playing, isWeb, speed]);

  // Cambiar velocidad en nativo mientras reproduce
  const cycleSpeed = useCallback(async () => {
    const idx  = SPEED_STEPS.indexOf(speed);
    const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
    setSpeed(next);
    if (!isWeb && soundRef.current) {
      try { await soundRef.current.setRateAsync(next, true); } catch {}
    }
  }, [speed, isWeb]);

  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

  const accent   = isOwn ? '#00c8a0' : '#00b4e6';
  const barFill  = isOwn ? '#00c8a0' : '#00b4e6';
  const barEmpty = isOwn ? 'rgba(0,200,160,0.25)' : 'rgba(0,180,230,0.25)';

  return (
    <View style={vc.card}>
      {/* Botón play/pause */}
      <TouchableOpacity onPress={togglePlay} activeOpacity={0.8}>
        <Animated.View style={[vc.btn, { backgroundColor: accent, transform: [{ scale: pulseAnim }] }]}>
          {playing ? (
            <View style={vc.pauseWrap}>
              <View style={[vc.pauseBar, { backgroundColor: '#fff' }]} />
              <View style={[vc.pauseBar, { backgroundColor: '#fff' }]} />
            </View>
          ) : (
            <View style={vc.playTriangle} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Onda + info */}
      <View style={vc.mid}>
        <View style={vc.waveRow}>
          {VOICE_BARS.map((h, i) => {
            const filled = progress > 0 && i / VOICE_BARS.length < progress;
            return <View key={i} style={[vc.bar, { height: Math.max(3, h * 24), backgroundColor: filled ? barFill : barEmpty }]} />;
          })}
        </View>
        <View style={vc.timeRow}>
          <Text style={vc.timeText}>
            {playing && position > 0 ? fmtTime(position) : duration > 0 ? fmtTime(duration) : '0:00'}
          </Text>
        </View>
      </View>

      {/* Botón velocidad */}
      <TouchableOpacity onPress={cycleSpeed} style={[vc.speedBtn, { borderColor: accent }]} activeOpacity={0.7}>
        <Text style={[vc.speedText, { color: accent }]}>{speed}×</Text>
      </TouchableOpacity>
    </View>
  );
};

const vc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 220, maxWidth: 280, paddingVertical: 4 },
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  playTriangle: { width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 12, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 3 },
  pauseWrap: { flexDirection: 'row', gap: 3 },
  pauseBar: { width: 3, height: 13, borderRadius: 2 },
  mid: { flex: 1, gap: 4 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 },
  bar: { width: 3, borderRadius: 2 },
  timeRow: { flexDirection: 'row' },
  timeText: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  speedBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1.5, flexShrink: 0, minWidth: 42, alignItems: 'center' },
  speedText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});


const parseTrackInfo = (raw: string) => {
  const clean = (raw || '')
    .replace(/^🎵\s*/, '')
    .replace(/\s*\(\d+(\.\d+)?\s*(MB|KB|GB|B)\)/i, '')
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .trim();
  const isHash = /^[a-z0-9_\-]{20,}$/i.test(clean);
  if (isHash || !clean) return { title: 'Sin título', artist: 'Artista desconocido' };
  const sep = clean.match(/\s[-–]\s/) ? clean.match(/\s[-–]\s/)![0] : null;
  if (sep) {
    const parts = clean.split(sep);
    return { title: parts[1]?.trim() || clean, artist: parts[0]?.trim() || 'Artista desconocido' };
  }
  return { title: clean, artist: 'Artista desconocido' };
};

// Colores de portada generados por hash del título
const COVER_PALETTES: [string, string][] = [
  ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
  ['#ffecd2', '#fcb69f'], ['#ff9a9e', '#fecfef'], ['#a1c4fd', '#c2e9fb'],
  ['#fd7043', '#ff8a65'],
];
const getCoverGradient = (title: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
};

// ── MusicCard — tarjeta de música estilo Apple Music ──────────────
const MusicCard = ({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) => {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [duration, setDuration] = useState(0);   // segundos
  const [position, setPosition] = useState(0);   // segundos
  const soundRef    = useRef<Audio.Sound | null>(null);
  const audioElRef  = useRef<HTMLAudioElement | null>(null);
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const isWeb       = typeof document !== 'undefined';

  const rawText          = message.text || message.file_url?.split('/').pop() || '';
  const { title, artist } = parseTrackInfo(rawText);
  const [gradA, gradB]   = getCoverGradient(title);
  const url              = message.file_url || '';

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // Disco giratorio cuando reproduce
  useEffect(() => {
    if (playing) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [playing]);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Web: elemento <audio> oculto
  useEffect(() => {
    if (!isWeb || !url) return;
    const el = new (window as any).Audio(url) as HTMLAudioElement;
    el.preload = 'metadata';
    el.onloadedmetadata = () => setDuration(el.duration);
    el.ontimeupdate = () => {
      setPosition(el.currentTime);
      setProgress(el.duration ? el.currentTime / el.duration : 0);
    };
    el.onended = () => {
      setPlaying(false); setProgress(0); setPosition(0);
      el.currentTime = 0;
    };
    audioElRef.current = el;
    return () => { el.pause(); el.src = ''; audioElRef.current = null; };
  }, [isWeb, url]);

  const togglePlay = useCallback(async () => {
    if (!url) return;
    if (isWeb) {
      const el = audioElRef.current;
      if (!el) return;
      if (playing) { el.pause(); setPlaying(false); }
      else { el.play().catch(() => {}); setPlaying(true); }
      return;
    }
    try {
      if (soundRef.current) {
        const st = await soundRef.current.getStatusAsync();
        if (st.isLoaded) {
          if (st.isPlaying) { await soundRef.current.pauseAsync(); setPlaying(false); }
          else              { await soundRef.current.playAsync();  setPlaying(true);  }
          return;
        }
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: url }, { shouldPlay: true },
        (st) => {
          if (!st.isLoaded) return;
          const dur = (st.durationMillis || 0) / 1000;
          const pos = (st.positionMillis || 0) / 1000;
          setDuration(dur); setPosition(pos);
          setProgress(dur ? pos / dur : 0);
          if (st.didJustFinish) {
            setPlaying(false); setProgress(0); setPosition(0);
            sound.setPositionAsync(0).catch(() => {});
          }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
    } catch {}
  }, [url, playing, isWeb]);

  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

  // Seek al tocar la barra de progreso (web)
  const handleSeek = useCallback((ratio: number) => {
    if (isWeb && audioElRef.current) {
      audioElRef.current.currentTime = ratio * audioElRef.current.duration;
    }
  }, [isWeb]);

  const initials = title.slice(0, 2).toUpperCase();

  return (
    <View style={mc.card}>
      {/* Portada de álbum */}
      <View style={mc.cover}>
        <LinearGradient colors={[gradA, gradB]} style={mc.coverGrad}>
          <Animated.View style={[mc.disc, { transform: [{ rotate: spin }] }]}>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={mc.discInner}>
              <View style={mc.discHole} />
            </LinearGradient>
          </Animated.View>
          <Text style={mc.coverInitials}>{initials}</Text>
        </LinearGradient>
        {/* Badge musical */}
        <View style={mc.badge}>
          <Text style={mc.badgeNote}>♪</Text>
        </View>
      </View>

      {/* Info + controles */}
      <View style={mc.right}>
        {/* Título y artista */}
        <View style={mc.titleRow}>
          <Text style={mc.title} numberOfLines={1}>{title}</Text>
          <Text style={mc.artist} numberOfLines={1}>{artist}</Text>
        </View>

        {/* Barra de progreso */}
        <TouchableOpacity
          style={mc.progressTrack}
          activeOpacity={0.8}
          onPress={(e) => {
            if (!isWeb) return;
            // @ts-ignore
            const rect = e.nativeEvent.target?.getBoundingClientRect?.();
            if (rect) handleSeek((e.nativeEvent.pageX - rect.left) / rect.width);
          }}
        >
          <View style={[mc.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
          <View style={[mc.progressThumb, { left: `${Math.round(progress * 100)}%` as any }]} />
        </TouchableOpacity>

        {/* Tiempo + botón play */}
        <View style={mc.controls}>
          <Text style={mc.timeText}>
            {position > 0 ? fmtTime(position) : '0:00'}
          </Text>
          <TouchableOpacity onPress={togglePlay} style={mc.playBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={isOwn ? ['#00c8a0', '#00b4e6'] : ['#667eea', '#764ba2']}
              style={mc.playBtnGrad}
            >
              {playing ? (
                <View style={mc.pauseWrap}>
                  <View style={mc.pauseBar} />
                  <View style={mc.pauseBar} />
                </View>
              ) : (
                <View style={mc.playTriangle} />
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={mc.timeText}>
            {duration > 0 ? fmtTime(duration) : '--:--'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const mc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    minWidth: 240,
    maxWidth: 300,
    paddingVertical: 6,
    alignItems: 'center',
  },
  // Portada
  cover: { position: 'relative', width: 72, height: 72, flexShrink: 0 },
  coverGrad: {
    width: 72, height: 72, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  disc: {
    position: 'absolute',
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    opacity: 0.35,
  },
  discInner: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  discHole: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  coverInitials: {
    fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  badge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#1DB954',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  badgeNote: { fontSize: 10, color: '#fff', fontWeight: '700' },
  // Info
  right: { flex: 1, gap: 6 },
  titleRow: { gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 18 },
  artist: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  // Progreso
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.10)',
    position: 'relative', overflow: 'visible',
  },
  progressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: '#1DB954',
    position: 'absolute', left: 0, top: 0,
  },
  progressThumb: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#1DB954',
    position: 'absolute', top: -3,
    marginLeft: -5,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  // Controles
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 10, color: '#9ca3af', fontWeight: '600', minWidth: 32 },
  playBtn: { marginHorizontal: 4 },
  playBtnGrad: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playTriangle: {
    width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 13,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 3,
  },
  pauseWrap: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pauseBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: '#fff' },
});

// ── Tarjeta CONTACTO ──────────────────────────────────────────────
const ContactCard = ({ text, isOwn }: { text: string; isOwn: boolean }) => {
  const lines = (text || '').split('\n');
  const name = lines[0]?.replace(/^👤\s*/, '').trim() || 'Contacto';
  const phone = lines[1]?.replace(/^📞\s*/, '').trim() || '';
  return (
    <View style={cs.card}>
      <View style={cs.row}>
        <EGAvatar name={name} size={44} />
        <View style={cs.info}>
          <Text style={cs.name} numberOfLines={1}>{name}</Text>
          {!!phone && <Text style={cs.phone}>{phone}</Text>}
        </View>
      </View>
      <View style={[cs.divider, isOwn ? cs.divOwn : cs.divTheir]} />
      <TouchableOpacity onPress={() => phone && Linking.openURL(`tel:${phone}`)} activeOpacity={0.7}>
        <Text style={[cs.action, isOwn ? cs.actionOwn : cs.actionTheir]}>📞 Llamar</Text>
      </TouchableOpacity>
    </View>
  );
};
const cs = StyleSheet.create({
  card: { minWidth: 200, maxWidth: 250 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  phone: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  divider: { height: 1, marginHorizontal: -10, marginBottom: 8 },
  divOwn: { backgroundColor: 'rgba(0,200,160,0.2)' },
  divTheir: { backgroundColor: 'rgba(0,0,0,0.07)' },
  action: { fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  actionOwn: { color: '#00c8a0' },
  actionTheir: { color: '#00b4e6' },
});

// ── Tarjeta UBICACIÓN ─────────────────────────────────────────────
const LocationCard = ({ text, isOwn }: { text: string; isOwn: boolean }) => {
  const lines = (text || '').split('\n');
  const label = lines[0]?.replace(/^📍\s*/, '').trim() || 'Ubicación';
  const url = lines[1]?.trim() || '';
  return (
    <View style={ls.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => url && Linking.openURL(url)}>
        <LinearGradient colors={['#4facfe', '#00f2fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ls.preview}>
          <View style={ls.gridH1} /><View style={ls.gridH2} />
          <View style={ls.gridV1} /><View style={ls.gridV2} />
          <View style={ls.pin}><Text style={ls.pinEmoji}>📍</Text></View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={ls.label} numberOfLines={2}>{label}</Text>
      <TouchableOpacity onPress={() => url && Linking.openURL(url)}
        style={[ls.btn, isOwn ? ls.btnOwn : ls.btnTheir]} activeOpacity={0.7}>
        <Text style={ls.btnText}>Abrir en Maps</Text>
      </TouchableOpacity>
    </View>
  );
};
const ls = StyleSheet.create({
  card: { minWidth: 220, maxWidth: 260, overflow: 'hidden', marginHorizontal: -4 },
  preview: { height: 120, borderRadius: 10, marginBottom: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  gridH1: { position: 'absolute', left: 0, right: 0, top: '33%', height: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  gridH2: { position: 'absolute', left: 0, right: 0, top: '66%', height: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  gridV1: { position: 'absolute', top: 0, bottom: 0, left: '33%', width: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  gridV2: { position: 'absolute', top: 0, bottom: 0, left: '66%', width: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  pin: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  pinEmoji: { fontSize: 18 },
  label: { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 6, paddingHorizontal: 4 },
  btn: { paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  btnOwn: { backgroundColor: 'rgba(0,200,160,0.12)' },
  btnTheir: { backgroundColor: 'rgba(0,180,230,0.10)' },
  btnText: { fontSize: 12, fontWeight: '700', color: '#00b4e6' },
});

// ── Tarjeta TRANSFERENCIA ─────────────────────────────────────────
const MoneyCard = ({ text }: { text: string }) => {
  const lines = (text || '').split('\n');
  const amountLine = lines.find(l => l.includes('💰')) || '';
  const toLine = lines.find(l => l.includes('👤')) || '';
  const refLine = lines.find(l => l.includes('🔑')) || '';
  const amount = amountLine.replace(/^💰\s*/, '').trim();
  const to = toLine.replace(/^👤 Para:\s*/i, '').trim();
  const ref = refLine.replace(/^🔑 Ref:\s*/i, '').trim();
  return (
    <LinearGradient colors={['#1a73e8', '#0d47a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ms.card}>
      <View style={ms.header}>
        <Text style={ms.headerIcon}>💸</Text>
        <Text style={ms.headerTitle}>Transferencia enviada</Text>
      </View>
      <Text style={ms.amount}>{amount}</Text>
      {!!to && <Text style={ms.to}>Para: {to}</Text>}
      <View style={ms.divider} />
      <View style={ms.footer}>
        <Text style={ms.status}>✅ Completado</Text>
        {!!ref && <Text style={ms.ref}>Ref: {ref}</Text>}
      </View>
    </LinearGradient>
  );
};
const ms = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, minWidth: 200, maxWidth: 260 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headerIcon: { fontSize: 18 },
  headerTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', flex: 1 },
  amount: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  to: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 12, color: '#a5f3fc', fontWeight: '600' },
  ref: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
});

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isGroup: boolean;
  myAvatar?: string;
  myName?: string;
  // Datos del otro participante para cuando sender no viene del servidor
  otherName?: string;
  otherAvatar?: string;
  replyPreview?: { author: string; text: string };
  showReadReceipts?: boolean;
  highlight?: boolean;
  onLongPress: (msg: ChatMessage) => void;
  onRetry?: (msg: ChatMessage) => void;
  onOpenImage?: (uri: string) => void;
  onCallback?: () => void;
  reactions?: Record<string, number>;
}

export const ChatMessageBubble = React.memo(({
  message,
  isOwn,
  isGroup,
  myAvatar,
  myName,
  otherName,
  otherAvatar,
  replyPreview,
  showReadReceipts = true,
  highlight,
  onLongPress,
  onRetry,
  onOpenImage,
  onCallback,
  reactions,
}: ChatMessageBubbleProps) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, number>>({});
  const [popEmoji, setPopEmoji] = useState<string | null>(null);
  const time = formatTime(message.created_at);
  const canRetry = isOwn && message.status === 'failed';
  const imageUri = message.type === 'image' ? message.imageUrl || message.file_url : undefined;
  const canOpenImage = !!imageUri && !canRetry;
  const showUploadState = isOwn && message.status === 'pending' && !!message.uploadState;
  const uploadPercent = Math.max(5, Math.min(99, Math.round((message.uploadProgress || 0.05) * 100)));

  const isMoneyMsg   = message.text?.startsWith('💸') || message.type === 'money';
  const isContactMsg = message.type === 'contact'
    || (message.type === 'text' && !!message.text?.startsWith('👤'));
  const isLocationMsg = message.type === 'location'
    || (message.type === 'text' && !!message.text?.startsWith('📍'));
  const isCallMsg = message.type === 'call'
    || (message.type === 'text' && !!(
      message.text?.includes('Llamada') || message.text?.includes('llamada')
    ));
  const pollData = message.type === 'poll' || message.text?.startsWith('📊')
    ? parsePoll(message.text || '') : null;
  const isCardType = isMoneyMsg || isContactMsg || isLocationMsg || isCallMsg || !!pollData;

  const renderAvatar = (side: 'left' | 'right') => {
    if (side === 'left' && isOwn) return null;
    if (side === 'right' && !isOwn) return null;

    if (isOwn) {
      return (
        <View style={s.avatarCol}>
          <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.avatarRing}>
            <EGAvatar src={myAvatar} name={myName || 'Yo'} size={36} />
          </LinearGradient>
        </View>
      );
    }

    const senderName = message.sender?.full_name || otherName || 'Usuario';
    // Usar avatar del sender si es válido; si sender existe pero no tiene avatar, caer a otherAvatar
    const rawSenderAvatar = message.sender?.avatar_url;
    const isValidSenderAvatar =
      !!rawSenderAvatar &&
      rawSenderAvatar.trim().length > 0 &&
      (rawSenderAvatar.startsWith('http://') || rawSenderAvatar.startsWith('https://') || rawSenderAvatar.startsWith('file://')) &&
      !rawSenderAvatar.includes('egchat-api.onrender.com/static/avatars/');
    const senderAvatar = isValidSenderAvatar ? rawSenderAvatar : otherAvatar;
    const gradColors = isGroup ? ['#a855f7', '#6366f1'] : ['#00c8a0', '#00b4e6'];
    return (
      <View style={s.avatarCol}>
        <LinearGradient colors={gradColors as [string, string]} style={s.avatarRing}>
          <EGAvatar src={senderAvatar} name={senderName} size={36} />
        </LinearGradient>
      </View>
    );
  };

  const bubbleContent = (
    <>
      {!isOwn && isGroup && message.sender?.full_name && (
        <Text style={s.senderName}>{message.sender.full_name}</Text>
      )}
      {replyPreview && (
        <View style={s.replyQuote}>
          <Text style={s.replyAuthor} numberOfLines={1}>{replyPreview.author}</Text>
          <Text style={s.replyText} numberOfLines={2}>{replyPreview.text}</Text>
        </View>
      )}
      {/* Tarjetas especiales */}
      {isCallMsg    && <CallCard message={message} isOwn={isOwn} onCallback={onCallback} />}
      {pollData     && <PollMessage poll={pollData} currentUserId={''} isOwn={isOwn} onVote={() => {}} />}
      {isContactMsg && !!message.text && <ContactCard text={message.text} isOwn={isOwn} />}
      {isLocationMsg && !!message.text && <LocationCard text={message.text} isOwn={isOwn} />}
      {isMoneyMsg && !!message.text && <MoneyCard text={message.text} />}

      {/* Texto normal */}
      {!isCardType && message.type === 'text' && !!message.text && (
        <Text style={s.bubbleText}>{message.text}</Text>
      )}
      {message.type === 'image' && imageUri ? (
        <TouchableOpacity onPress={() => setImageViewerOpen(true)} activeOpacity={0.9}>
          <Image source={{ uri: imageUri }} style={s.bubbleImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : message.type === 'image' ? (
        <Text style={s.bubbleText}>Foto</Text>
      ) : null}
      {message.type === 'video' && (
        <VideoCard message={message} isOwn={isOwn} />
      )}
      {message.type === 'audio' && (
        isVoiceMessage(message)
          ? <VoiceCard message={message} isOwn={isOwn} />
          : <MusicCard message={message} isOwn={isOwn} />
      )}
      {message.type === 'file' && (
        <TouchableOpacity
          onPress={() => {
            const url = message.file_url;
            if (url) {
              if (typeof window !== 'undefined') {
                window.open(url, '_blank');
              } else {
                Linking.openURL(url).catch(() => {});
              }
            }
          }}
          activeOpacity={0.7}
          style={s.fileCard}
        >
          {(() => {
            // Obtener nombre limpio del archivo (quitar emoji si ya viene en text)
            const rawName = message.text || message.file_url?.split('/').pop() || 'Archivo';
            const fileName = rawName.replace(/^📄\s*/, '').replace(/^📁\s*/, '').trim();
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const isWord = ['doc', 'docx'].includes(ext);
            const isPdf = ext === 'pdf';
            const isExcel = ['xls', 'xlsx'].includes(ext);
            const isPpt = ['ppt', 'pptx'].includes(ext);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            const fileIcon = isPdf ? '📕' : isWord ? '📘' : isExcel ? '📗' : isPpt ? '📙' : isImage ? '🖼️' : '📄';
            const fileColor = isPdf ? '#e53e3e' : isWord ? '#2b5ce6' : isExcel ? '#1d6f42' : isPpt ? '#d04a02' : '#6b7280';
            return (
              <View style={s.fileInner}>
                <View style={[s.fileIconBox, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                  <Text style={s.fileIconText}>{fileIcon}</Text>
                </View>
                <View style={s.fileInfo}>
                  <Text style={s.fileName} numberOfLines={2}>{fileName}</Text>
                  <Text style={[s.fileExt, { color: fileColor }]}>{ext.toUpperCase() || 'ARCHIVO'}</Text>
                </View>
              </View>
            );
          })()}
        </TouchableOpacity>
      )}
      <View style={s.meta}>
        <Text style={s.time}>{time}</Text>
        {isOwn && showReadReceipts && <MessageStatusIndicator status={message.status} />}
      </View>
      {showUploadState && (
        <View style={s.uploadBox}>
          <View style={s.uploadTrack}>
            <View style={[s.uploadFill, { width: `${uploadPercent}%` }]} />
          </View>
          <Text style={s.uploadText}>
            {message.uploadState === 'processing' ? 'Procesando...' : `Subiendo ${uploadPercent}%`}
          </Text>
        </View>
      )}
      {canRetry && <Text style={s.retryHint}>Toca para reintentar</Text>}
    </>
  );

  return (
    <TouchableOpacity
      onPress={canRetry ? () => onRetry?.(message) : canOpenImage ? () => onOpenImage?.(imageUri!) : undefined}
      onLongPress={() => onLongPress(message)}
      activeOpacity={0.8}
      delayLongPress={500}
    >
      <View style={[
        s.row,
        isOwn ? s.rowOwn : s.rowTheir,
        highlight && s.rowHighlight,
      ]}>
        {renderAvatar('left')}
        {isOwn ? (
          isMoneyMsg ? (
            <View style={[s.bubble, s.ownBubble, s.cardBubble]}>
              {bubbleContent}
            </View>
          ) : (
            <LinearGradient
              colors={['#e8f5e9', '#f0fdf4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.bubble, s.ownBubble, isCardType && s.cardBubble]}
            >
              {bubbleContent}
            </LinearGradient>
          )
        ) : (
          <View style={[s.bubble, s.theirBubble, isCardType && s.cardBubble]}>
            {bubbleContent}
          </View>
        )}
        {renderAvatar('right')}
      </View>

      {/* Reacciones bajo la burbuja */}
      {(reactions && Object.keys(reactions).length > 0) || Object.keys(localReactions).length > 0 ? (
        <View style={[s.reactionsRow, isOwn ? s.reactionsOwn : s.reactionsTheir]}>
          {Object.entries({ ...reactions, ...localReactions }).map(([emoji, count]) => (
            <ReactionBubble key={emoji} emoji={emoji} count={count as number} isOwn={isOwn} />
          ))}
        </View>
      ) : null}

      {/* Pop de emoji al reaccionar */}
      {popEmoji && (
        <View style={[s.popWrap, isOwn ? { right: 60 } : { left: 60 }]}>
          <ReactionPopAnimation emoji={popEmoji} onDone={() => setPopEmoji(null)} />
        </View>
      )}

      {/* Visor de imagen a pantalla completa */}
      {imageUri && (
        <ImageViewer
          visible={imageViewerOpen}
          images={[imageUri]}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </TouchableOpacity>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginVertical: 1,
    paddingHorizontal: 2,
  },
  rowOwn: { justifyContent: 'flex-end' },
  rowTheir: { justifyContent: 'flex-start' },
  rowHighlight: { backgroundColor: 'rgba(0,180,230,0.10)', borderRadius: 8 },
  avatarCol: { marginBottom: 2, flexShrink: 0 },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bubble: {
    maxWidth: '72%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  cardBubble: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  ownBubble: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.12)',
    shadowColor: '#00c8a0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moneyBubble: { padding: 0 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#00b4e6', marginBottom: 3 },
  replyQuote: {
    borderLeftWidth: 3,
    borderLeftColor: '#00b4e6',
    backgroundColor: 'rgba(0,180,230,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  replyAuthor: { fontSize: 11, fontWeight: '700', color: '#00b4e6', marginBottom: 2 },
  replyText: { fontSize: 12, color: '#6b7280' },
  bubbleText: { fontSize: 15, color: '#111827', lineHeight: 21 },
  bubbleImage: { width: 240, height: 200, borderRadius: 10, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  time: { fontSize: 11, color: '#9ca3af' },
  uploadBox: { marginTop: 6, gap: 4 },
  uploadTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' },
  uploadFill: { height: 3, backgroundColor: '#00c8a0', borderRadius: 2 },
  uploadText: { fontSize: 11, color: '#9ca3af', textAlign: 'right' },
  retryHint: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 3, textAlign: 'right' },
  // Reacciones bajo la burbuja
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2, marginHorizontal: 6 },
  reactionsOwn:  { justifyContent: 'flex-end',   paddingRight: 44 },
  reactionsTheir:{ justifyContent: 'flex-start',  paddingLeft: 44 },
  popWrap: { position: 'absolute', top: 0, zIndex: 50 },
  // ── Tarjeta archivo ──
  fileCard: {
    minWidth: 200,
    maxWidth: 260,
  },
  fileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileIconText: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  fileExt: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
