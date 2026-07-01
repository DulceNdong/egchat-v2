// Burbuja de mensaje — paridad App.tsx (gradiente propio, avatares 36px, no WhatsApp)
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EGAvatar } from '../ui';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import type { ChatMessage } from '../../types/chat';

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
  const isMoney = message.text?.startsWith('💸') || message.type === 'money';

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
      {(message.type === 'text' || message.type === 'contact' || message.type === 'location') && !!message.text && (
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
          <LinearGradient
            colors={isMoney ? ['#e0f2fe', '#dbeafe'] : ['#e8f5e9', '#f0fdf4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.bubble, s.ownBubble, isMoney && s.moneyBubble]}
          >
            {bubbleContent}
          </LinearGradient>
        ) : (
          <View style={[s.bubble, s.theirBubble]}>
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
