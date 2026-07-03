// Burbuja de mensaje — paridad EGCHAT v2.5.2
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Linking, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { EGAvatar } from '../ui';
import { MessageStatusIndicator } from './MessageStatusIndicator';
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

// ── Tarjeta AUDIO — estilo WhatsApp (web: <audio> HTML5, nativo: expo-av) ────
const BARS = [0.3, 0.5, 0.8, 0.6, 1.0, 0.7, 0.4, 0.9, 0.5, 0.8, 0.6, 0.3, 0.7, 1.0, 0.5, 0.4, 0.9, 0.6, 0.8, 0.3, 0.5, 0.7, 1.0, 0.4, 0.6, 0.9, 0.5, 0.3, 0.8, 0.6];

// Limpia nombre de archivo: quita emoji, hash técnico y tamaño " (X MB)"
const cleanAudioName = (text: string, fallback: string) => {
  let name = (text || '').replace(/^🎵\s*/, '').replace(/\s*\(\d+(\.\d+)?\s*(MB|KB|GB|B)\)/i, '').trim();
  if (!name) return fallback;
  const base = name.split('.')[0];
  if (/^[a-z0-9_\-]{20,}$/i.test(base)) return fallback; // hash técnico
  return name;
};

const AudioCard = ({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isWeb = typeof document !== 'undefined';

  const rawText = message.text || message.file_url?.split('/').pop() || '';
  const fileName = cleanAudioName(rawText, 'Audio');
  const ext = (rawText.split('.').pop()?.toLowerCase().replace(/\s.*$/, '') || 'mp3').substring(0, 4);
  const url = message.file_url || '';

  const formatDur = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // Pulso animado
  useEffect(() => {
    if (playing) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [playing]);

  // Web: crear elemento <audio> oculto al montar
  useEffect(() => {
    if (!isWeb || !url) return;
    const el = new window.Audio(url);
    el.preload = 'metadata';
    el.onloadedmetadata = () => setDuration(el.duration * 1000);
    el.ontimeupdate = () => {
      setPosition(el.currentTime * 1000);
      setProgress(el.duration ? el.currentTime / el.duration : 0);
    };
    el.onended = () => { setPlaying(false); setProgress(0); setPosition(0); el.currentTime = 0; };
    audioElRef.current = el;
    return () => { el.pause(); el.src = ''; audioElRef.current = null; };
  }, [isWeb, url]);

  const togglePlay = useCallback(async () => {
    if (!url) return;
    // ── WEB ──
    if (isWeb) {
      const el = audioElRef.current;
      if (!el) return;
      if (playing) { el.pause(); setPlaying(false); }
      else { el.play().catch(() => {}); setPlaying(true); }
      return;
    }
    // ── NATIVO ──
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) { await soundRef.current.pauseAsync(); setPlaying(false); }
          else { await soundRef.current.playAsync(); setPlaying(true); }
          return;
        }
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          setProgress(status.durationMillis ? (status.positionMillis || 0) / status.durationMillis : 0);
          if (status.didJustFinish) {
            setPlaying(false); setProgress(0); setPosition(0);
            sound.setPositionAsync(0).catch(() => {});
          }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
    } catch {}
  }, [url, playing, isWeb]);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const accent = isOwn ? '#00c8a0' : '#00b4e6';
  const accentFade = isOwn ? 'rgba(0,200,160,0.18)' : 'rgba(0,180,230,0.18)';
  const barFill = isOwn ? '#00c8a0' : '#00b4e6';
  const barEmpty = isOwn ? 'rgba(0,200,160,0.25)' : 'rgba(0,180,230,0.25)';

  return (
    <View style={au.card}>
      <TouchableOpacity onPress={togglePlay} activeOpacity={0.8} style={au.btnWrap}>
        <Animated.View style={[au.btn, { backgroundColor: accentFade, transform: [{ scale: pulseAnim }] }]}>
          <View style={[au.btnInner, { backgroundColor: accent }]}>
            {playing ? (
              <View style={au.pauseIcon}>
                <View style={[au.pauseBar, { backgroundColor: '#fff' }]} />
                <View style={[au.pauseBar, { backgroundColor: '#fff' }]} />
              </View>
            ) : (
              <View style={[au.playIcon, { borderLeftColor: '#fff' }]} />
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
      <View style={au.right}>
        <View style={au.waveRow}>
          {BARS.map((h, i) => {
            const filled = progress > 0 && i / BARS.length < progress;
            return <View key={i} style={[au.bar, { height: Math.max(4, h * 26), backgroundColor: filled ? barFill : barEmpty }]} />;
          })}
        </View>
        <View style={au.metaRow}>
          <Text style={au.audioName} numberOfLines={1}>{fileName}</Text>
          <Text style={[au.audioDur, { color: accent }]}>
            {playing && position > 0 ? formatDur(position) : duration > 0 ? formatDur(duration) : ext.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const au = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, maxWidth: 280, paddingVertical: 4 },
  btnWrap: { flexShrink: 0 },
  btn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  btnInner: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playIcon: { width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 13, borderTopColor: 'transparent', borderBottomColor: 'transparent', marginLeft: 3 },
  pauseIcon: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pauseBar: { width: 3, height: 14, borderRadius: 2 },
  right: { flex: 1, gap: 6 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  bar: { width: 3, borderRadius: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  audioName: { fontSize: 12, color: '#374151', fontWeight: '600', flex: 1, marginRight: 6 },
  audioDur: { fontSize: 11, fontWeight: '700' },
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
}: ChatMessageBubbleProps) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const time = formatTime(message.created_at);
  const canRetry = isOwn && message.status === 'failed';
  const imageUri = message.type === 'image' ? message.imageUrl || message.file_url : undefined;
  const canOpenImage = !!imageUri && !canRetry;
  const showUploadState = isOwn && message.status === 'pending' && !!message.uploadState;
  const uploadPercent = Math.max(5, Math.min(99, Math.round((message.uploadProgress || 0.05) * 100)));

  const isMoneyMsg = message.text?.startsWith('💸') || message.type === 'money';
  const isContactMsg = message.type === 'contact'
    || (message.type === 'text' && !!message.text?.startsWith('👤'));
  const isLocationMsg = message.type === 'location'
    || (message.type === 'text' && !!message.text?.startsWith('📍'));
  const isCardType = isMoneyMsg || isContactMsg || isLocationMsg;

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
        <Text style={s.bubbleText}>📷 Foto</Text>
      ) : null}
      {message.type === 'video' && (
        <VideoCard message={message} isOwn={isOwn} />
      )}
      {message.type === 'audio' && (
        <AudioCard message={message} isOwn={isOwn} />
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
                <View style={[s.fileIconBox, { backgroundColor: fileColor + '18' }]}>
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
