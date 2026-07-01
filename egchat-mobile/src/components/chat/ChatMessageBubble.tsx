// Burbuja de mensaje — paridad EGCHAT v2.5.2
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EGAvatar } from '../ui';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import type { ChatMessage } from '../../types/chat';

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
  replyPreview,
  showReadReceipts = true,
  highlight,
  onLongPress,
  onRetry,
  onOpenImage,
}: ChatMessageBubbleProps) => {
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

    const senderName = message.sender?.full_name || '?';
    const gradColors = isGroup ? ['#a855f7', '#6366f1'] : ['#00c8a0', '#00b4e6'];
    return (
      <View style={s.avatarCol}>
        <LinearGradient colors={gradColors as [string, string]} style={s.avatarRing}>
          <EGAvatar src={message.sender?.avatar_url} name={senderName} size={36} />
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
        <Image source={{ uri: imageUri }} style={s.bubbleImage} resizeMode="cover" />
      ) : message.type === 'image' ? (
        <Text style={s.bubbleText}>📷 Foto</Text>
      ) : null}
      {message.type === 'video' && (
        <Text style={s.bubbleText}>{message.text || '🎥 Video'}</Text>
      )}
      {message.type === 'audio' && (
        <Text style={s.bubbleText}>{message.text || '🎵 Audio'}</Text>
      )}
      {message.type === 'file' && (
        <Text style={s.bubbleText}>{message.text || `📄 ${message.file_url?.split('/').pop() || 'Archivo'}`}</Text>
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
            // La tarjeta de dinero lleva su propio gradiente — burbuja transparente
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
});
