import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Platform, ActivityIndicator,
  Animated, Modal, Pressable, Alert, Image, Share, Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { chatAPI, authAPI, getToken } from '../../src/api';
import { ChatAttachPanel, AttachAction } from '../../src/components/chat/ChatAttachPanel';
import { ChatContactPickerModal } from '../../src/components/chat/ChatContactPickerModal';
import { ChatEmojiPanel } from '../../src/components/chat/ChatEmojiPanel';
import { StickerPanel } from '../../src/components/chat/StickerPanel';
import { QuickTransferModal } from '../../src/components/chat/QuickTransferModal';
import { TransferDetailsModal } from '../../src/components/chat/TransferDetailsModal';
import { ChatMenuPanel, ChatMenuItem } from '../../src/components/chat/ChatMenuPanel';
import { ChatMessageBubble } from '../../src/components/chat/ChatMessageBubble';
import { ChatHeader } from '../../src/components/chat/ChatHeader';
import { ChatInputBar } from '../../src/components/chat/ChatInputBar';
import { ScheduledMessageModal } from '../../src/components/chat/ScheduledMessageModal';
import { processScheduledMessages } from '../../src/services/scheduledMessages';
import { EditHistoryModal } from '../../src/components/chat/EditHistoryModal';
import { ChatWallpaperBackground } from '../../src/components/chat/ChatWallpaperBackground';
import { ChatWallpaperModal } from '../../src/components/chat/ChatWallpaperModal';
import { ChatSearchBar } from '../../src/components/chat/ChatSearchBar';
import { ChatStarredModal } from '../../src/components/chat/ChatStarredModal';
import { ChatMediaGallery } from '../../src/components/chat/ChatMediaGallery';
import { ForwardWithCommentModal } from '../../src/components/chat/ForwardWithCommentModal';
import { ChatContextMenu } from '../../src/components/chat/ChatContextMenu';
import { GroupInfoModal } from '../../src/components/chat/GroupInfoModal';
import { EphemeralSettingsModal } from '../../src/components/chat/EphemeralSettingsModal';
import { EditMessageBar } from '../../src/components/chat/EditMessageBar';
import { LiveLocationBar } from '../../src/components/chat/LiveLocationBar';
import {
  getEphemeralDuration, setEphemeralDuration, filterExpiredMessages,
  type EphemeralDuration,
} from '../../src/services/ephemeralMessages';
import { editMessage, applyEditLocally } from '../../src/services/editMessage';
import { startLiveLocation, stopLiveLocation, isLiveLocationActive } from '../../src/services/liveLocation';
import { MentionSuggestions, detectMentionQuery, applyMention, type MentionUser } from '../../src/components/chat/MentionSuggestions';
import { GroupPaymentModal } from '../../src/components/chat/GroupPaymentModal';
import { ChatToneModal } from '../../src/components/chat/ChatToneModal';
import { ChatLabelsModal } from '../../src/components/chat/ChatLabelsModal';
import { getChatTone, setChatTone } from '../../src/services/chatTones';
import { CreatePollModal } from '../../src/components/chat/CreatePollModal';
import { MessageReadReceiptsModal } from '../../src/components/chat/MessageReadReceiptsModal';
import { MediaPreviewModal, type MediaPreviewItem } from '../../src/components/chat/MediaPreviewModal';
import { QuickReplyPanel } from '../../src/components/chat/QuickReplyPanel';
import { PushToTalkButton } from '../../src/components/chat/PushToTalkButton';
import { toggleReaction, applyReactionOptimistic, type ReactionsMap } from '../../src/services/messageReactions';
import { getAllQuickReplies, searchQuickReplies, type QuickReply } from '../../src/services/quickReplies';
import {
  scheduleReadReceipt,
  clearAllMessageStatusTimers,
  markChatAsRead,
  markMessageRead,
} from '../../src/features/chat/messageStatus';
import { CFG, getCfgBool } from '../../src/services/settingsPrefs';
import { getChatWallpaperId, setChatWallpaperId } from '../../src/utils/chatWallpaper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactProfileModal } from '../../src/components/ContactProfileModal';
import { onProfileUpdated } from '../../src/utils/profileEvents';
import { AvatarCropModal } from '../../src/components/AvatarCropModal';
import { PhotoEditorModal } from '../../src/components/PhotoEditorModal';
import {
  pickImageFromLibrary, pickImageFromCamera, pickVideo, pickVideoFromCamera,
  pickDocument, pickContact, pickFile, pickAudio,
  getCurrentLocationLabel, uploadAndSend, pickMultipleImages,
} from '../../src/utils/chatMedia';
import { haptics } from '../../src/hooks/useHaptics';
import { useAudioRecorder } from '../../src/hooks/useAudioRecorder';
import { useOffline } from '../../src/hooks/useOffline';
import { toast } from '../../src/components/Toast';
import {
  createChatTypingChannel,
  subscribeToChat,
  subscribeToOnlineUsers,
  subscribeToReadBroadcast,
  broadcastReadReceipt,
} from '../../src/supabase';
import { useChatStream } from '../../src/hooks/useChatStream';
import { playMessageReceived } from '../../src/hooks/useSounds';
import { notifyReaction } from '../../src/notifications';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { isIncognitoChat, setIncognitoMode } from '../../src/services/incognitoMode';
import { pinMessage, getPinnedMessages, type PinnedMessage } from '../../src/services/pinnedMessages';
import { translateText } from '../../src/services/translator';
import { ReactionDetailModal } from '../../src/components/chat/ReactionDetailModal';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import type { ChatMessage as Message } from '../../src/types/chat';
import {
  createTempMessageId,
  getLastReadableMessageId,
  isTempMessage,
  markMessageFailed,
  mergeMessages,
  normalizeMessage,
  normalizeMessages,
  replaceTempMessage,
} from '../../src/features/chat/messageUtils';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

// ── Tipos ─────────────────────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────────────────
const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const getParticipantName = (participant?: any) =>
  participant?.full_name || participant?.users?.full_name || participant?.user?.full_name || '';

const isValidAvatarUrl = (url?: string | null): url is string =>
  !!url &&
  url.trim().length > 0 &&
  (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'));

const getParticipantAvatar = (participant?: any) => {
  const raw =
    participant?.avatar_url || participant?.users?.avatar_url || participant?.user?.avatar_url;
  return isValidAvatarUrl(raw) ? raw : undefined;
};

const getParticipantPhone = (participant?: any) =>
  participant?.phone || participant?.users?.phone || participant?.user?.phone || '';

// ── TypingIndicator ───────────────────────────────────────────────
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
};

// ── ReplyPreview ──────────────────────────────────────────────────
const ReplyPreview = ({
  author, text, onCancel,
}: { author: string; text: string; onCancel: () => void }) => (
  <View style={styles.replyPreview}>
    <View style={styles.replyInner}>
      <Text style={styles.replyAuthor} numberOfLines={1}>{author}</Text>
      <Text style={styles.replyText} numberOfLines={1}>{text}</Text>
    </View>
    <TouchableOpacity onPress={onCancel} style={styles.replyCancel}>
      <Text style={styles.replyCancelText}>✕</Text>
    </TouchableOpacity>
  </View>
);

// ── DateSeparator ─────────────────────────────────────────────────
const DateSeparator = ({ label }: { label: string }) => (
  <View style={styles.dateSeparator}>
    <Text style={styles.dateSeparatorText}>{label}</Text>
  </View>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [contextVisible, setContextVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  const [showQuickTransfer, setShowQuickTransfer] = useState(false);
  const [myProfile, setMyProfile] = useState<{ full_name?: string; avatar_url?: string; phone?: string }>({});
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // Contacto de tarjeta compartida — para abrir su perfil al tocar nombre/foto
  const [cardContact, setCardContact] = useState<{ phone: string; name: string; avatarUrl?: string } | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [photoEditUri, setPhotoEditUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [wallpaperId, setWallpaperId] = useState('default');
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'photo' | 'video' | null>(null);
  // ── Sprint 1.1 Grupos ──────────────────────────────────────────
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  // ── Sprint 1.2 Mensajes temporales ────────────────────────────
  const [ephemeralDuration, setEphemeralDurationState] = useState<EphemeralDuration>(0);
  const [showEphemeralModal, setShowEphemeralModal] = useState(false);
  // ── Sprint 1.3 Editar mensajes ────────────────────────────────
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  // ── Sprint 1.4 Ubicación en vivo ──────────────────────────────
  const [liveLocationActive, setLiveLocationActive] = useState(false);
  // ── Sprint 2.2 Menciones ──────────────────────────────────────
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  // ── Sprint 2.4 Pago grupal ─────────────────────────────────────
  const [showGroupPayment, setShowGroupPayment] = useState(false);
  // ── Transfer Details Modal ─────────────────────────────────────
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [transferDetailsData, setTransferDetailsData] = useState<any>(null);
  // ── Sprint 3.1 Tono personalizado ─────────────────────────────
  const [chatTone, setChatToneState] = useState('default');
  const [showToneModal, setShowToneModal] = useState(false);
  // ── Sprint 3.5 Etiquetas ──────────────────────────────────────
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  // ── C3 Encuestas ───────────────────────────────────────────────
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  // ── F4 Media preview ──────────────────────────────────────────
  const [mediaPreviewItem, setMediaPreviewItem] = useState<MediaPreviewItem | null>(null);
  const [mediaSending, setMediaSending] = useState(false);
  // ── PTT Walkie-talkie ─────────────────────────────────────────
  const [showPTT, setShowPTT] = useState(false);
  // ── C4 Reacciones reales ───────────────────────────────────────
  const [reactionsMap, setReactionsMap] = useState<Record<string, ReactionsMap>>({});
  // ── C9 Receipts de lectura ─────────────────────────────────────
  const [receiptsMsgId, setReceiptsMsgId] = useState<string | null>(null);
  // ── #9 Contador de no leídos al scrollear ─────────────────────
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);
  // ── #8 ID del primer mensaje no leído al abrir ─────────────────
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  // ── #7 Modal de quién reaccionó ────────────────────────────────
  const [reactionDetailMsgId, setReactionDetailMsgId] = useState<string | null>(null);
  const [reactionDetailCounts, setReactionDetailCounts] = useState<Record<string, number>>({});
  // ── #12 Selección múltiple de mensajes ─────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // ── A2 Mensajes programados ────────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  // ── A3 Historial de ediciones ──────────────────────────────────
  const [editHistoryMsg, setEditHistoryMsg] = useState<Message | null>(null);
  // ── C5 Galería multimedia ──────────────────────────────────────
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  // ── C7 Reenvío con comentario ──────────────────────────────────
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  // ── F1 Respuestas rápidas ──────────────────────────────────────
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [quickReplySuggestions, setQuickReplySuggestions] = useState<QuickReply[]>([]);
  const groupMembers: MentionUser[] = (chat?.type === 'group' && chat?.participants)
    ? (chat.participants as any[])
        .filter((p: any) => String(p.user_id) !== String(currentUserId))
        .map((p: any) => ({
          user_id: p.user_id,
          full_name: p.full_name || p.users?.full_name || p.user?.full_name || 'Usuario',
          avatar_url: p.avatar_url || p.users?.avatar_url,
        }))
    : [];
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof createChatTypingChannel> | null>(null);
  const retryingMessagesRef = useRef<Set<string>>(new Set());
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();
  const { isRecording, durationFormatted, startRecording, stopRecording, cancelRecording } = useAudioRecorder();
  const { isOnline, saveCache, readCache } = useOffline();
  const { keyboardVisible } = useKeyboardHeight();
  const activePanelHeight = showAttach
    ? 290
    : showEmojis
      ? 300
      : showStickers
        ? 320
        : 0;

  useEffect(() => {
    getCfgBool(CFG.readReceipts, true).then(setShowReadReceipts);
    return () => clearAllMessageStatusTimers();
  }, []);

  // ── A2 Procesar mensajes programados cada 30s ──────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      processScheduledMessages().catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── SSE Stream — mensajes instantáneos desde el backend ──────────
  useChatStream(currentUserId || undefined, (event) => {
    if (event.type === 'new_message' && event.chatId === chatId && event.message) {
      const msg = event.message;
      if (msg.sender_id === currentUserId) return;
      const enriched = normalizeMessage(msg);
      setMessages(prev => mergeMessages(prev, [enriched]));
      // Marcar como leído y notificar al emisor con checks azules
      chatAPI.markAsRead(chatId, msg.id).catch(() => {});
      broadcastReadReceipt(chatId, currentUserId, [msg.id]);
      setIsTyping(false);
      playMessageReceived(); // ← sonido de mensaje recibido
    }

    if (event.type === 'typing' && event.chatId === chatId) {
      const typing = Boolean(event.isTyping);
      setIsTyping(typing);
      if (typing) {
        if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
        remoteTypingTimer.current = setTimeout(() => setIsTyping(false), 3500);
      }
    }

    // Evento 'read' emitido por el backend cuando el receptor abre el chat
    // Puede venir con un messageId individual o con messageIds (array)
    if (event.type === 'read' && event.chatId === chatId) {
      const ids: string[] = (event as any).messageIds || (event.messageId ? [event.messageId] : []);
      if (ids.length > 0) {
        setMessages(prev =>
          prev.map(m =>
            ids.includes(m.id) && m.sender_id === currentUserId
              ? { ...m, status: 'read' as const }
              : m,
          ),
        );
      }
    }

    // 4a — Notificación push de reacción
    if ((event as any).type === 'reaction_added' && (event as any).chatId === chatId) {
      const ev = event as any;
      // Solo notificar si el mensaje es nuestro (el servidor ya lo filtra, pero doble check)
      notifyReaction({
        senderName: ev.reactorName || 'Alguien',
        emoji: ev.emoji,
        messagePreview: ev.messagePreview,
        chatId: ev.chatId,
        chatName: chatName,
      }).catch(() => {});
      // Actualizar el mapa de reacciones localmente
      if (ev.messageId) {
        setMessageReactions(prev => {
          const cur = prev[ev.messageId] || {};
          return { ...prev, [ev.messageId]: { ...cur, [ev.emoji]: (cur[ev.emoji] || 0) + 1 } };
        });
      }
    }
  });

  useEffect(() => {
    if (!chatId) return;
    getChatWallpaperId(chatId).then(setWallpaperId);
    AsyncStorage.getItem('egchat_starred_msgs').then(raw => {
      if (!raw) return;
      try {
        const map = JSON.parse(raw) as Record<string, string[]>;
        setStarredIds(map[chatId] ?? []);
      } catch { /* ignore */ }
    });
    AsyncStorage.getItem('egchat_pinned_chats').then(raw => {
      if (!raw) return;
      try {
        const ids = JSON.parse(raw) as string[];
        setIsPinned(ids.includes(chatId));
      } catch { /* ignore */ }
    });
    AsyncStorage.getItem(`egchat_muted_${chatId}`).then(v => setIsMuted(v === '1'));
    isIncognitoChat(chatId).then(setIsIncognito);
    getPinnedMessages(chatId).then(setPinnedMessages);
    // Sprint 1.2 — cargar duración efímera
    getEphemeralDuration(chatId).then(setEphemeralDurationState);
    // Sprint 1.4 — verificar si hay sesión live activa
    setLiveLocationActive(isLiveLocationActive(chatId));
    // Sprint 3.1 — cargar tono
    getChatTone(chatId).then(setChatToneState);
    // F1 — cargar respuestas rápidas
    getAllQuickReplies().then(setQuickReplies);
  }, [chatId]);

  const applyMessageStatus = useCallback((messageId: string, status: Message['status']) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, status } : m)));
  }, []);

  // Aplica 'delivered' al mensaje propio recién enviado.
  // El estado 'read' llegará de verdad cuando el receptor abra el chat
  // vía SSE o Supabase broadcast — ya NO hay timer falso.
  const markDeliveredAndScheduleRead = useCallback((messageId: string) => {
    applyMessageStatus(messageId, 'delivered');
    // scheduleReadReceipt ahora solo hace el POST real al backend, no un timer visual
    scheduleReadReceipt(messageId, applyMessageStatus, chatId);
  }, [applyMessageStatus, chatId]);

  // Actualizar mi avatar/nombre cuando cambia el perfil
  useEffect(() => {
    return onProfileUpdated(patch => {
      if (patch.avatar_url || patch.full_name) {
        setMyProfile(prev => ({
          ...prev,
          ...(patch.avatar_url ? { avatar_url: patch.avatar_url } : {}),
          ...(patch.full_name ? { full_name: patch.full_name } : {}),
        }));
      }
    });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      // Timeout de seguridad: si la carga tarda más de 20s, salir del spinner
      const safetyTimeout = setTimeout(() => setLoading(false), 20000);
      try {
        // Obtener usuario actual via API (no decodificar JWT en RN)
        const me = await authAPI.me();
        setCurrentUserId(me?.id || '');
        setMyProfile({ full_name: me?.full_name, avatar_url: me?.avatar_url, phone: me?.phone });

        // Cargar chat y mensajes en paralelo
        const [chats, msgs] = await Promise.all([
          chatAPI.getChats(),
          chatAPI.getMessages(chatId, 1, 50),
        ]);

        const current = chats.find((c: any) => c.id === chatId);
        if (current) {
          setChat(current);
          // Enriquecer participantes con datos completos del endpoint dedicado
          try {
            const token = await (await import('../../src/api')).getToken();
            const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/$/, '');
            const enrichedParticipants = await fetch(
              `${BASE}/api/chats/${chatId}/participants`,
              { headers: { Authorization: `Bearer ${token}` } }
            ).then(r => r.json()).catch(() => null);
            if (Array.isArray(enrichedParticipants) && enrichedParticipants.length > 0) {
              setChat((prev: any) => prev ? { ...prev, participants: enrichedParticipants } : prev);
            }
          } catch (e) {
            // silent — enriquecimiento opcional
          }
        }

        const msgList = normalizeMessages(msgs || []);
        setMessages(msgList);
        saveCache(`chat_messages_${chatId}`, msgList);
        setHasMore(msgList.length === 50);

        // ── #8 Detectar primer mensaje no leído ─────────────────────
        const meId = me?.id || '';
        const firstUnread = msgList.find(
          m => m.sender_id !== meId && m.status !== 'read'
        );
        if (firstUnread) setFirstUnreadId(firstUnread.id);

        // ── #9 Contar no leídos ─────────────────────────────────────
        const unreadCnt = msgList.filter(
          m => m.sender_id !== meId && m.status !== 'read'
        ).length;
        if (unreadCnt > 0) setUnreadScrollCount(unreadCnt);

        // ── Lectura real (doble check azul) ──────────────────────────
        // 1. Marcar el último mensaje leído en BD (endpoint existente)
        const lastReadableId = getLastReadableMessageId(msgList, me?.id || '');
        if (lastReadableId) {
          chatAPI.markAsRead(chatId, lastReadableId).catch(() => {});
        }
        // 2. Marcar TODOS los mensajes del chat como leídos (nuevo endpoint)
        //    Esto actualiza status → 'read' en BD y el backend emite SSE al emisor
        markChatAsRead(chatId);
        // 3. Emitir broadcast inmediato por Supabase para máxima velocidad
        //    (el emisor lo recibe en < 200ms antes de que BD propague)
        if (me?.id) {
          const unreadIds = msgList
            .filter(m => m.sender_id !== me.id && m.status !== 'read')
            .map(m => m.id);
          if (unreadIds.length > 0) {
            broadcastReadReceipt(chatId, me.id, unreadIds);
          }
        }
      } catch (e) {
        console.error('Error cargando chat:', e);
        const cached = await readCache<Message[]>(`chat_messages_${chatId}`);
        if (cached?.length) {
          setMessages(normalizeMessages(cached));
        }
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };
    init();
  }, [chatId, readCache, saveCache]);

  useEffect(() => {
    if (!chatId || messages.length === 0) return;
    saveCache(`chat_messages_${chatId}`, messages);
  }, [chatId, messages, saveCache]);

  // Supabase Realtime + polling de respaldo (por si Realtime no está habilitado)
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let realtimeWorking = false;

    const unsubscribe = subscribeToChat(chatId, (newMsg, event) => {
      realtimeWorking = true;
      if (event === 'DELETE') {
        setMessages(prev => prev.filter(message => message.id !== newMsg.id));
        return;
      }
      if (newMsg.sender_id !== currentUserId) {
        // Enriquecer con datos del sender del chat actual
        setChat((currentChat: any) => {
          const participant = currentChat?.participants?.find(
            (p: any) => p.user_id === newMsg.sender_id
          );
          const enriched = normalizeMessage({
            ...newMsg,
            sender: newMsg.sender || (participant ? {
              id: participant.user_id,
              full_name: participant.full_name || '',
              avatar_url: participant.avatar_url || '',
            } : undefined),
          });
          setMessages(prev => mergeMessages(prev, [enriched]));
          return currentChat;
        });
        if (event === 'INSERT') {
          // Marcar como leído inmediatamente (estamos en el chat activo)
          chatAPI.markAsRead(chatId, newMsg.id).catch(() => {});
          // Broadcast de lectura para que el emisor vea checks azules al instante
          broadcastReadReceipt(chatId, currentUserId, [newMsg.id]);
          playMessageReceived(); // ← sonido en mensajes via Realtime
        }
        setIsTyping(false);
      } else if (event === 'UPDATE') {
        setMessages(prev => mergeMessages(prev, [newMsg]));
      }
    });

    // ── Suscripción a read receipts (checks azules en tiempo real) ──
    // El emisor escucha cuándo el receptor lee sus mensajes
    const unsubscribeRead = subscribeToReadBroadcast(chatId, currentUserId, (messageIds) => {
      setMessages(prev =>
        prev.map(m =>
          messageIds.includes(m.id) && m.sender_id === currentUserId
            ? { ...m, status: 'read' as const }
            : m,
        ),
      );
    });

    // Si Realtime no responde en 5s, polling cada 2s
    const realtimeCheck = setTimeout(() => {
      if (!realtimeWorking) {
        pollInterval = setInterval(async () => {
          try {
            const fresh = await chatAPI.getMessages(chatId, 1, 20);
            if (!fresh?.length) return;
            setMessages(prev => mergeMessages(prev, normalizeMessages(fresh)));
          } catch {}
        }, 2000);
      }
    }, 5000);

    return () => {
      unsubscribe();
      unsubscribeRead();
      clearTimeout(realtimeCheck);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    return subscribeToOnlineUsers(setOnlineUserIds);
  }, [currentUserId]);

  // Fallback: consultar online_status del otro usuario cada 15s
  // (por si Supabase Presence no funciona en web)
  useEffect(() => {
    const _isGroup = chat?.type === 'group';
    const _otherParticipant = chat?.participants?.find((p: any) => String(p.user_id) !== String(currentUserId));
    if (!_otherParticipant?.user_id || _isGroup) return;
    const uid = String(_otherParticipant.user_id);

    const check = async () => {
      try {
        const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/$/, '');
        const token = await getToken();
        const res = await fetch(`${BASE}/api/users/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();
        if (user?.online_status) {
          setOnlineUserIds(prev => prev.includes(uid) ? prev : [...prev, uid]);
        } else {
          setOnlineUserIds(prev => prev.filter(id => id !== uid));
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [chat, currentUserId]);

  useEffect(() => {
    if (!chatId || !currentUserId) return;

    typingChannelRef.current?.unsubscribe();
    typingChannelRef.current = createChatTypingChannel(chatId, currentUserId, (typing) => {
      setIsTyping(typing);
      if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
      if (typing) {
        remoteTypingTimer.current = setTimeout(() => setIsTyping(false), 3500);
      }
    });

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
      typingChannelRef.current?.unsubscribe();
      typingChannelRef.current = null;
    };
  }, [chatId, currentUserId]);

  const scrollToBottom = useCallback((animated = false) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  // Mantener visible el último mensaje, el indicador de escritura y el input al cambiar teclado
  useEffect(() => {
    if (messages.length === 0) return;
    const delay = keyboardVisible ? 40 : 0;
    const timer = setTimeout(() => scrollToBottom(false), delay);
    return () => clearTimeout(timer);
  }, [messages.length, keyboardVisible, inputBarHeight, isTyping, replyTo?.id, scrollToBottom]);

  // Cargar más mensajes (scroll hacia arriba)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const older = await chatAPI.getMessages(chatId, nextPage, 50);
      if (older && older.length > 0) {
        setMessages(prev => mergeMessages(normalizeMessages(older), prev));
        setPage(nextPage);
        setHasMore(older.length === 50);
      } else {
        setHasMore(false);
      }
    } catch {}
    finally { setLoadingMore(false); }
  }, [chatId, page, hasMore, loadingMore]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setText('');
    setReplyTo(null);
    setQuickReplySuggestions([]);
    setSending(true);
    haptics.light();

    // Animación de vuelo: escala abajo → rebote hacia arriba
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1.15, useNativeDriver: true, speed: 40, bounciness: 14 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
    ]).start();

    const tempId = createTempMessageId();
    const tempMsg: Message = {
      id: tempId,
      text: trimmed,
      type: 'text',
      sender_id: currentUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
      reply_to: replyTo?.id,
    };
    setMessages(prev => mergeMessages(prev, [tempMsg]));

    if (!isOnline) {
      setMessages(prev => markMessageFailed(prev, tempId));
      setSending(false);
      toast.info('Sin conexión', 'El mensaje queda listo para reintentar');
      return;
    }

    try {
      const real = await chatAPI.sendMessage(chatId, {
        text: trimmed,
        type: 'text',
        reply_to: replyTo?.id,
      });
      const realId = real.id;
      setMessages(prev => replaceTempMessage(prev, tempId, { ...real, status: 'delivered' }));
      markDeliveredAndScheduleRead(realId);
    } catch {
      setMessages(prev => markMessageFailed(prev, tempId));
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, currentUserId, replyTo, isOnline, markDeliveredAndScheduleRead]);

  const handleLongPress = useCallback((msg: Message) => {
    haptics.medium();
    setContextMsg(msg);
    setContextVisible(true);
  }, []);

  const persistStarred = useCallback(async (ids: string[]) => {
    if (!chatId) return;
    setStarredIds(ids);
    try {
      const raw = await AsyncStorage.getItem('egchat_starred_msgs');
      const map = raw ? JSON.parse(raw) as Record<string, string[]> : {};
      map[chatId] = ids;
      await AsyncStorage.setItem('egchat_starred_msgs', JSON.stringify(map));
    } catch { /* ignore */ }
  }, [chatId]);

  const handleStarMessage = useCallback(() => {
    if (!contextMsg) return;
    const next = starredIds.includes(contextMsg.id)
      ? starredIds.filter(id => id !== contextMsg.id)
      : [...starredIds, contextMsg.id];
    persistStarred(next);
    toast.info('Destacado', starredIds.includes(contextMsg.id) ? 'Quitado de destacados' : 'Mensaje destacado');
  }, [contextMsg, starredIds, persistStarred]);

  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  const handleTranslate = useCallback(async () => {
    if (!contextMsg?.text) return;
    setContextVisible(false);
    toast.info('🌐 Traduciendo...');
    const translated = await translateText(contextMsg.text, 'es');
    if (translated !== contextMsg.text) {
      setTranslatedMessages(prev => ({ ...prev, [contextMsg.id]: translated }));
      toast.success('Traducido', translated.slice(0, 50) + (translated.length > 50 ? '...' : ''));
    } else {
      toast.info('Ya está en español o no se pudo traducir');
    }
  }, [contextMsg]);

  const handleReaction = useCallback((emoji: string) => {
    if (!contextMsg || !chatId) return;
    const msgId = contextMsg.id;
    // Actualizar optimísticamente en local
    setReactionsMap(prev => ({
      ...prev,
      [msgId]: applyReactionOptimistic(prev[msgId] || {}, emoji, currentUserId),
    }));
    // También actualizar el mapa legado para compatibilidad con ChatMessageBubble
    setMessageReactions(prev => {
      const current = prev[msgId] || {};
      const alreadyReacted = Object.values(reactionsMap[msgId] || {}).find(r => r.emoji === emoji && r.reactedByMe);
      const count = alreadyReacted ? Math.max(0, (current[emoji] || 1) - 1) : (current[emoji] || 0) + 1;
      return { ...prev, [msgId]: { ...current, [emoji]: count } };
    });
    setContextVisible(false);
    // Guardar en BD
    toggleReaction(msgId, emoji, currentUserId).catch(() => {});
  }, [contextMsg, chatId, currentUserId, reactionsMap]);

  const exportChat = useCallback(() => {
    const other = chat?.participants?.find((p: any) => String(p.user_id) !== String(currentUserId));
    const name = chat?.type === 'group'
      ? (chat?.name || 'Grupo')
      : (getParticipantName(other) || 'Usuario');
    const body = messages.map(m => {
      const who = m.sender_id === currentUserId ? 'Yo' : name;
      return `[${formatTime(m.created_at)}] ${who}: ${m.text || `[${m.type}]`}`;
    }).join('\n');
    Share.share({ message: body, title: `Chat ${name}` }).catch(() => {});
  }, [messages, currentUserId, chat]);

  const togglePin = useCallback(async () => {
    if (!chatId) return;
    const raw = await AsyncStorage.getItem('egchat_pinned_chats');
    const ids = raw ? JSON.parse(raw) as string[] : [];
    const next = isPinned ? ids.filter(id => id !== chatId) : [...ids, chatId];
    await AsyncStorage.setItem('egchat_pinned_chats', JSON.stringify(next));
    setIsPinned(!isPinned);
    toast.info(isPinned ? 'Chat desfijado' : 'Chat fijado');
  }, [chatId, isPinned]);

  const toggleMute = useCallback(async () => {
    if (!chatId) return;
    const next = !isMuted;
    await AsyncStorage.setItem(`egchat_muted_${chatId}`, next ? '1' : '0');
    setIsMuted(next);
    toast.info(next ? 'Chat silenciado' : 'Notificaciones activadas');
  }, [chatId, isMuted]);

  const getReplyPreview = useCallback((msg: Message) => {
    if (!msg.reply_to) return undefined;
    const parent = messages.find(m => m.id === msg.reply_to);
    if (!parent) return undefined;
    const other = chat?.participants?.find((p: any) => String(p.user_id) !== String(currentUserId));
    const fallbackName = chat?.type === 'group'
      ? (chat?.name || 'Grupo')
      : (getParticipantName(other) || 'Usuario');
    // #6 — incluir thumbnail si el mensaje padre es imagen
    const imageUri =
      parent.type === 'image'
        ? (parent.imageUrl || parent.file_url || undefined)
        : undefined;
    return {
      author: parent.sender_id === currentUserId ? 'Tú' : (parent.sender?.full_name || fallbackName),
      text: parent.type === 'image' ? '📷 Foto' : (parent.text || 'Mensaje'),
      imageUri,
    };
  }, [messages, currentUserId, chat]);

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollBottom(distBottom > 200);
    if (contentOffset.y < 60 && hasMore && !loadingMore) loadMore();
  }, [hasMore, loadingMore, loadMore]);

  const handleCopy = useCallback(async () => {
    if (contextMsg?.text) await Clipboard.setStringAsync(contextMsg.text);
    setContextVisible(false);
  }, [contextMsg]);

  const handleReply = useCallback(() => {
    if (contextMsg) setReplyTo(contextMsg);
    setContextVisible(false);
  }, [contextMsg]);

  // ── Sprint 1.3: Editar mensaje ─────────────────────────────────
  const handleEditMessage = useCallback(() => {
    if (!contextMsg || contextMsg.type !== 'text') return;
    setEditingMessage(contextMsg);
    setEditText(contextMsg.text || '');
    setContextVisible(false);
  }, [contextMsg]);

  const handleConfirmEdit = useCallback(async () => {
    if (!editingMessage || !editText.trim()) return;
    const newText = editText.trim();
    // Optimista
    setMessages(prev => applyEditLocally(prev, editingMessage.id, newText));
    setEditingMessage(null);
    setEditText('');
    // Sincronizar con backend
    const result = await editMessage(editingMessage.id, newText);
    if (!result.success) {
      toast.error('No se pudo editar', result.error || 'Error desconocido');
      // Revertir
      setMessages(prev => applyEditLocally(prev, editingMessage.id, editingMessage.text || ''));
    }
  }, [editingMessage, editText]);

  // ── Sprint 1.3: Reenviar mensaje ───────────────────────────────
  const handleForwardMessage = useCallback(() => {
    if (!contextMsg) return;
    setContextVisible(false);
    // C7 — abrir modal de reenvío con comentario
    setForwardMsg(contextMsg);
    setShowForwardModal(true);
  }, [contextMsg]);

  // ── Sprint 1.4: Ubicación en vivo ──────────────────────────────
  const handleStartLiveLocation = useCallback(async () => {
    if (!chatId) return;
    try {
      setShowAttach(false);
      await startLiveLocation(chatId, () => setLiveLocationActive(true));
      setLiveLocationActive(true);
      toast.info('📍 Ubicación en vivo', 'Compartiendo tu posición en tiempo real');
    } catch (e: any) {
      toast.error('Ubicación', e?.message || 'No se pudo iniciar');
    }
  }, [chatId]);

  const handleStopLiveLocation = useCallback(() => {
    if (!chatId) return;
    stopLiveLocation(chatId);
    setLiveLocationActive(false);
    toast.info('Ubicación detenida');
  }, [chatId]);

  const handleDelete = useCallback(() => {
    setContextVisible(false);
    Alert.alert('Eliminar mensaje', '¿Eliminar para todos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          if (!contextMsg) return;
          try {
            await chatAPI.deleteMessage(contextMsg.id);
            setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
          } catch {}
        },
      },
    ]);
  }, [contextMsg]);

  const handleDeleteForMe = useCallback(() => {
    setContextVisible(false);
    if (!contextMsg) return;
    chatAPI.deleteMessageForMe(contextMsg.id).catch(() => {});
    setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
  }, [contextMsg]);

  // ── Descargar imagen / video / archivo ────────────────────────
  const handleDownloadMedia = useCallback(async () => {
    setContextVisible(false);
    if (!contextMsg) return;

    const url = (contextMsg as any).file_url || (contextMsg as any).imageUrl;
    if (!url) {
      toast.error('No hay archivo para descargar');
      return;
    }

    // En web: abrir en nueva pestaña
    if (Platform.OS === 'web') {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop() || 'archivo';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Descarga iniciada');
      } catch {
        toast.error('No se pudo descargar');
      }
      return;
    }

    // En nativo: descargar a directorio temporal y compartir/guardar
    try {
      toast.info('Descargando...');
      const fs = await import('expo-file-system/legacy');
      const FS = (fs as any).default ?? fs;
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `egchat_${Date.now()}.${ext}`;
      const destPath = `${FS.cacheDirectory}${fileName}`;

      const dlResult = await FS.downloadAsync(url, destPath);
      if (dlResult.status !== 200) throw new Error('Error al descargar');

      // Intentar guardar en galería si es imagen/video
      const isPhoto = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'].includes(ext);
      if (isPhoto) {
        try {
          // Usar Sharing nativo si está disponible (no requiere dependencia extra)
          const Sharing = await import('expo-sharing').catch(() => null);
          if (Sharing && (await (Sharing as any).isAvailableAsync?.())) {
            await (Sharing as any).shareAsync(destPath, { dialogTitle: 'Guardar archivo' });
            return;
          }
        } catch { /* usar Share de RN */ }
      }

      // Fallback: Share nativo
      await Share.share({ url: destPath, title: fileName });
    } catch (e: any) {
      toast.error('No se pudo descargar', e?.message || '');
    }
  }, [contextMsg]);

  // Emitir "escribiendo..." al servidor con debounce
  const handleTextChange = useCallback((val: string) => {
    setText(val);
    // Sprint 2.2 — detectar mención
    if (chat?.type === 'group') {
      const detection = detectMentionQuery(val);
      setMentionQuery(detection ? detection.query : null);
    }
    // F1 — detectar respuestas rápidas (/)
    if (val.startsWith('/')) {
      setQuickReplySuggestions(searchQuickReplies(quickReplies, val));
    } else {
      setQuickReplySuggestions([]);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (val.trim()) {
      typingChannelRef.current?.sendTyping(true);
      typingTimer.current = setTimeout(() => {
        typingChannelRef.current?.sendTyping(false);
      }, 2000);
    } else {
      typingChannelRef.current?.sendTyping(false);
    }
  }, [chat, chatId, quickReplies]);

  const pushOptimistic = useCallback((msg: Message) => {
    setMessages(prev => mergeMessages(prev, [msg]));
  }, []);

  const replaceOptimistic = useCallback((tempId: string, real: Message) => {
    const realId = real.id;
    setMessages(prev => replaceTempMessage(prev, tempId, { ...real, status: 'delivered' }));
    markDeliveredAndScheduleRead(realId);
  }, [markDeliveredAndScheduleRead]);

  const failOptimistic = useCallback((tempId: string) => {
    setMessages(prev => markMessageFailed(prev, tempId));
  }, []);

  const retryMessage = useCallback(async (message: Message) => {
    if (!chatId || message.status !== 'failed') return;
    if (!isOnline) {
      toast.info('Sin conexión', 'Se reintentará cuando recuperes internet');
      return;
    }

    setMessages(prev => prev.map(item =>
      item.id === message.id
        ? {
            ...item,
            status: 'pending',
            uploadState: message.type === 'text' ? undefined : 'uploading',
            uploadProgress: message.type === 'text' ? undefined : 0.2,
          }
        : item,
    ));

    try {
      const localUri = message.imageUrl || message.file_url;
      const isLocalMedia = !!localUri && !/^https?:\/\//i.test(localUri);
      let sent: Message;

      if (isLocalMedia && message.type !== 'text') {
        const fileName = localUri.split('/').pop() || `${message.type}.dat`;
        const asset = {
          uri: localUri,
          fileName,
          mimeType: message.type === 'image'
            ? 'image/jpeg'
            : message.type === 'video'
              ? 'video/mp4'
              : message.type === 'audio'
                ? 'audio/m4a'
                : 'application/octet-stream',
        };
        sent = await uploadAndSend(chatId, asset, {
          text: message.text || '',
          type: message.type,
        });
      } else {
        sent = await chatAPI.sendMessage(chatId, {
          text: message.text || '',
          type: message.type,
          reply_to: message.reply_to,
          file_url: message.file_url,
        });
      }

      replaceOptimistic(message.id, sent);
    } catch {
      failOptimistic(message.id);
      toast.error('Error', 'No se pudo reenviar el mensaje');
    } finally {
      retryingMessagesRef.current.delete(message.id);
    }
  }, [chatId, failOptimistic, isOnline, replaceOptimistic]);

  useEffect(() => {
    if (!isOnline || !currentUserId) return;

    const retryable = messages.filter(message =>
      message.sender_id === currentUserId
      && message.status === 'failed'
      && isTempMessage(message.id)
      && !retryingMessagesRef.current.has(message.id),
    );

    retryable.slice(0, 3).forEach((message, index) => {
      retryingMessagesRef.current.add(message.id);
      setTimeout(() => retryMessage(message), 350 * index);
    });
  }, [currentUserId, isOnline, messages, retryMessage]);

  const sendMedia = useCallback(async (
    asset: { uri: string; fileName: string; mimeType: string },
    payload: { text: string; type: string },
    extra?: Partial<Message>,
  ) => {
    const tempId = createTempMessageId();
    pushOptimistic({
      id: tempId,
      text: payload.text,
      type: payload.type,
      sender_id: currentUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
      imageUrl: payload.type === 'image' ? asset.uri : undefined,
      file_url: payload.type !== 'image' ? asset.uri : undefined,
      uploadState: 'queued',
      uploadProgress: 0.05,
      ...extra,
    });
    setShowAttach(false);
    haptics.light();

    if (!isOnline) {
      failOptimistic(tempId);
      toast.info('Sin conexion', 'El archivo queda listo para reintentar');
      return;
    }

    try {
      setMessages(prev => prev.map(message =>
        message.id === tempId ? { ...message, uploadState: 'uploading', uploadProgress: 0.35 } : message,
      ));
      const sent = await uploadAndSend(chatId!, asset, payload);
      setMessages(prev => prev.map(message =>
        message.id === tempId ? { ...message, uploadState: 'processing', uploadProgress: 0.9 } : message,
      ));
      replaceOptimistic(tempId, { ...sent, imageUrl: sent.file_url, file_url: sent.file_url });
    } catch {
      failOptimistic(tempId);
      toast.error('Error', 'No se pudo enviar el archivo');
    }
  }, [chatId, currentUserId, pushOptimistic, replaceOptimistic, failOptimistic, isOnline]);

  const handleAttachAction = useCallback(async (action: AttachAction) => {
    if (!chatId) return;

    // ── FOTO ─────────────────────────────────────────────────────
    if (action === 'photo') {
      setShowAttach(false);
      setMediaPickerMode('photo');
      return;
    }

    // ── ÁLBUM ─────────────────────────────────────────────────────
    if (action === 'album') {
      setShowAttach(false);
      const assets = await pickMultipleImages();
      if (!assets.length) return;
      if (assets.length === 1) {
        // Una sola foto → enviar como imagen normal
        setMediaPreviewItem({ uri: assets[0].uri, fileName: assets[0].fileName, mimeType: assets[0].mimeType, type: 'image' });
        return;
      }
      // Múltiples → subir en paralelo y enviar como álbum
      toast.info('📷 Subiendo álbum...', `${assets.length} fotos`);
      const tempId = createTempMessageId();
      pushOptimistic({
        id: tempId, text: `📷 Álbum (${assets.length} fotos)`, type: 'album',
        sender_id: currentUserId, status: 'pending',
        created_at: new Date().toISOString(),
        album_urls: assets.map(a => a.uri), // URIs locales mientras sube
      });
      try {
        const uploadedUrls = await Promise.all(
          assets.map(asset =>
            uploadAndSend(chatId, asset, { text: asset.fileName, type: 'image' })
              .then(msg => msg?.file_url || msg?.imageUrl || asset.uri)
              .catch(() => asset.uri)
          )
        );
        const sent = await chatAPI.sendMessage(chatId, {
          text: `📷 Álbum (${uploadedUrls.length} fotos)`,
          type: 'album',
          album_urls: uploadedUrls,
        });
        replaceOptimistic(tempId, { ...sent, album_urls: uploadedUrls });
      } catch {
        failOptimistic(tempId);
        toast.error('Error', 'No se pudo enviar el álbum');
      }
      return;
    }

    // ── VIDEO ─────────────────────────────────────────────────────
    if (action === 'video') {
      setShowAttach(false);
      setMediaPickerMode('video');
      return;
    }
    if (action === 'file') {
      setShowAttach(false);
      const asset = await pickDocument();
      if (asset) {
        // Mostrar preview antes de enviar — el usuario confirma con caption opcional
        setMediaPreviewItem({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType, type: 'file' });
      }
      return;
    }
    if (action === 'contact') {
      setShowAttach(false);
      setShowContactPicker(true);
      return;
    }
    if (action === 'location') {
      setShowAttach(false);
      // Preguntar: ubicación puntual o en vivo
      Alert.alert('Compartir ubicación', '¿Cómo quieres compartirla?', [
        {
          text: 'Ubicación actual',
          onPress: async () => {
            toast.info('GPS', 'Obteniendo tu ubicación...');
            const location = await getCurrentLocationLabel();
            if (!location) {
              toast.error('Ubicación', 'No se pudo obtener tu ubicación');
              return;
            }
            const { lat, lng, label } = location;
            const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
            const msgText = `📍 ${label}\n${mapsUrl}`;
            const tempId = createTempMessageId();
            pushOptimistic({
              id: tempId, text: msgText, type: 'location', sender_id: currentUserId,
              status: 'pending', created_at: new Date().toISOString(),
            });
            try {
              const sent = await chatAPI.sendMessage(chatId, { text: msgText, type: 'location' });
              replaceOptimistic(tempId, sent);
            } catch {
              failOptimistic(tempId);
            }
          },
        },
        {
          text: liveLocationActive ? 'Detener ubicación en vivo' : 'Ubicación en vivo',
          onPress: liveLocationActive ? handleStopLiveLocation : handleStartLiveLocation,
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    if (action === 'music') {
      setShowAttach(false);
      const asset = await pickAudio();
      if (asset) {
        await sendMedia(asset, { text: asset.fileName, type: 'music' });
      }
      return;
    }
    if (action === 'money') {
      setShowAttach(false);
      setShowQuickTransfer(true);
    }
    if (action === 'poll') {
      setShowAttach(false);
      setShowCreatePoll(true);
    }
  }, [chatId, sendMedia, pushOptimistic, replaceOptimistic, failOptimistic]);

  const sendTransferMessage = useCallback(async (msgText: string) => {
    if (!chatId) return;
    const tempId = createTempMessageId();
    pushOptimistic({
      id: tempId, text: msgText, type: 'text', sender_id: currentUserId,
      status: 'pending', created_at: new Date().toISOString(),
    });
    try {
      const sent = await chatAPI.sendMessage(chatId, { text: msgText, type: 'text' });
      replaceOptimistic(tempId, sent);
    } catch {
      failOptimistic(tempId);
    }
  }, [chatId, currentUserId, pushOptimistic, replaceOptimistic, failOptimistic]);

  const insertEmoji = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
  }, []);

  const sendStickerMessage = useCallback(async (stickerText: string) => {
    if (!chatId) return;
    setShowEmojis(false);
    const tempId = createTempMessageId();
    pushOptimistic({
      id: tempId, text: stickerText, type: 'text', sender_id: currentUserId,
      status: 'pending', created_at: new Date().toISOString(),
    });
    try {
      const sent = await chatAPI.sendMessage(chatId, { text: stickerText, type: 'text' });
      replaceOptimistic(tempId, sent);
    } catch {
      failOptimistic(tempId);
    }
  }, [chatId, currentUserId, pushOptimistic, replaceOptimistic, failOptimistic]);

  const handleShareContact = useCallback(async (contact: any) => {
    if (!chatId) return;
    const name = contact.full_name || contact.name || 'Contacto';
    const phone = contact.phone || '';
    const avatarUrl = contact.avatar_url || '';
    // Formato: línea 0 = nombre, línea 1 = teléfono, línea 2 = avatar_url
    const msgText = `${name}\n${phone}\n${avatarUrl}`;
    const tempId = createTempMessageId();
    pushOptimistic({
      id: tempId, text: msgText, type: 'contact', sender_id: currentUserId,
      status: 'pending', created_at: new Date().toISOString(),
    });
    try {
      const sent = await chatAPI.sendMessage(chatId, { text: msgText, type: 'contact' });
      replaceOptimistic(tempId, sent);
      toast.success('Contacto compartido');
    } catch {
      failOptimistic(tempId);
    }
  }, [chatId, pushOptimistic, replaceOptimistic, failOptimistic]);

  const uploadChatAvatar = useCallback(async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const token = await getToken();
      const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/$/, '');
      const formData = new FormData();
      formData.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      const res = await fetch(`${BASE}/api/user/avatar`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { avatar_url } = await res.json();
        await authAPI.updateProfile({ avatar_url });
        setChat((prev: any) => {
          if (!prev) return prev;
          if (prev.type === 'group') return { ...prev, avatar_url };
          return {
            ...prev,
            participants: prev.participants?.map((p: any) =>
              String(p.user_id) === String(currentUserId) ? { ...p, avatar_url } : p,
            ),
          };
        });
        toast.success('Foto actualizada', 'Todos los contactos la verán');
      }
    } catch {
      toast.error('Error', 'No se pudo actualizar la foto');
    } finally {
      setUploadingAvatar(false);
      setCropUri(null);
    }
  }, [currentUserId]);

  const pickProfilePhoto = useCallback(() => {
    Alert.alert('Foto de perfil', 'Elige una opción', [
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const r = await ImagePicker.launchCameraAsync({ quality: 0.9 });
          if (!r.canceled && r.assets[0]) setCropUri(r.assets[0].uri);
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
          });
          if (!r.canceled && r.assets[0]) setCropUri(r.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const isGroup = chat?.type === 'group';
  const otherParticipant = chat?.participants?.find((p: any) => String(p.user_id) !== String(currentUserId));
  const chatName = chat
    ? isGroup ? (chat.name || 'Grupo') : (getParticipantName(otherParticipant) || 'Usuario')
    : '...';
  const chatAvatar = isGroup ? chat?.avatar_url : getParticipantAvatar(otherParticipant);
  const otherPhone = getParticipantPhone(otherParticipant);
  const isOtherOnline = !!otherParticipant?.user_id && onlineUserIds.includes(String(otherParticipant.user_id));
  const chatSubtitle = isGroup
    ? `${chat?.participants?.length || 0} miembros`
    : isOtherOnline ? 'En línea' : 'Desconectado';

  // C3 — broadcast mode: solo admins escriben
  const broadcastMode = isGroup && chat?.settings?.broadcast_mode === true;
  const isGroupAdmin = isGroup && (chat?.participants || []).find((p: any) => String(p.user_id) === String(currentUserId))?.role === 'admin';
  const canWrite = !broadcastMode || isGroupAdmin;

  // ── Items del drawer ──────────────────────────────────────────
  const IC = '#374151'; // color base
  const drawerItems: ChatMenuItem[] = [
    // ── Sección principal ──
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/><Circle cx="12" cy="7" r="4"/></Svg>,
      label: isGroup ? 'Info del grupo' : 'Ver perfil',
      color: IC,
      onPress: () => {
        setDrawerVisible(false);
        if (isGroup) setShowGroupInfo(true);
        else setShowProfile(true);
      },
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35" strokeLinecap="round"/></Svg>,
      label: 'Buscar en el chat',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowChatSearch(true); setChatSearchQuery(''); },
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>,
      label: 'Mensajes destacados',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowStarredModal(true); },
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/><Line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/><Circle cx="12" cy="12" r="10"/></Svg>,
      label: isPinned ? 'Desfijar chat' : 'Fijar chat',
      color: IC,
      onPress: () => { setDrawerVisible(false); togglePin(); },
    },
    // ── C5 Galería multimedia ──
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></Svg>,
      label: 'Archivos multimedia',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowMediaGallery(true); },
    },
    // ── Sección configuración ──
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={1.8}><Circle cx="12" cy="12" r="10"/><Polyline points="12 6 12 12 16 14"/></Svg>,
      label: ephemeralDuration > 0 ? `⏱ Mensajes temporales (activo)` : '⏱ Mensajes temporales',
      color: ephemeralDuration > 0 ? '#07a472' : IC,
      onPress: () => { setDrawerVisible(false); setShowEphemeralModal(true); },
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/><Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round"/></Svg>,
      label: isMuted ? 'Activar notificaciones' : 'Silenciar',
      color: IC,
      onPress: () => { setDrawerVisible(false); toggleMute(); },
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isIncognito ? '#8b5cf6' : IC} strokeWidth={1.8}><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" strokeLinecap="round"/><Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" strokeLinecap="round"/><Line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></Svg>,
      label: isIncognito ? 'Desactivar incógnito' : '🕵️ Modo incógnito',
      color: isIncognito ? '#8b5cf6' : IC,
      onPress: async () => {
        const next = !isIncognito;
        await setIncognitoMode(chatId, next);
        setIsIncognito(next);
        setDrawerVisible(false);
        toast.info(next ? '🕵️ Incógnito activado' : 'Incógnito desactivado');
      },
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Rect x="3" y="3" width="18" height="18" rx="2"/><Line x1="3" y1="9" x2="21" y2="9" strokeLinecap="round"/><Line x1="9" y1="21" x2="9" y2="9" strokeLinecap="round"/></Svg>,
      label: 'Fondo de pantalla',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowWallpaperModal(true); },
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.8}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round"/></Svg>,
      label: 'Cifrado E2E',
      color: '#00c8a0',
      onPress: () => Alert.alert('🔒 Cifrado E2E', 'Este chat está cifrado de extremo a extremo.'),
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/><Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round"/></Svg>,
      label: `🔔 Tono del chat`,
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowToneModal(true); },
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round"/><Line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/></Svg>,
      label: '🏷️ Etiquetas',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowLabelsModal(true); },
    },
    // ── Sección acciones ──
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round"/></Svg>,
      label: '🎙 Walkie-talkie',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowPTT(true); },
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round"/><Polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
      label: 'Enviar dinero',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowQuickTransfer(true); },
    },
    ...(isGroup ? [{
      section: 'actions' as const,
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/></Svg>,
      label: '💰 Dividir pago',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowGroupPayment(true); },
    }] : []),
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/></Svg>,
      label: 'Compartir contacto',
      color: IC,
      onPress: () => { setDrawerVisible(false); setShowContactPicker(true); },
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round"/></Svg>,
      label: 'Crear grupo con este contacto',
      color: IC,
      onPress: () => { setDrawerVisible(false); router.push('/new-chat' as any); },
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round"/><Polyline points="7 10 12 15 17 10"/><Line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/></Svg>,
      label: 'Exportar chat',
      color: IC,
      onPress: () => { setDrawerVisible(false); exportChat(); },
    },
    // ── Sección peligrosa ──
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={1.8}><Polyline points="3 6 5 6 21 6"/><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/><Path d="M10 11v6" strokeLinecap="round"/><Path d="M14 11v6" strokeLinecap="round"/></Svg>,
      label: 'Vaciar chat',
      color: '#F59E0B',
      onPress: () =>
        Alert.alert('Vaciar chat', '¿Eliminar todos los mensajes?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar', style: 'destructive', onPress: () => setMessages([]) },
        ]),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round"/><Line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/><Line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></Svg>,
      label: 'Reportar',
      color: '#EF4444',
      onPress: () => Alert.alert('Reportar', `"${chatName}" reportado.`),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Circle cx="12" cy="12" r="10"/><Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round"/></Svg>,
      label: 'Bloquear',
      color: '#EF4444',
      onPress: () =>
        Alert.alert('Bloquear', `¿Bloquear a ${chatName}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Bloquear', style: 'destructive', onPress: () => router.back() },
        ]),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><Circle cx="9" cy="7" r="4"/><Line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round"/></Svg>,
      label: 'Eliminar contacto',
      color: '#EF4444',
      onPress: () =>
        Alert.alert('Eliminar contacto', `¿Eliminar a ${chatName}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => router.back() },
        ]),
    },
  ];

  const displayMessages = useMemo(() =>
    chatSearchQuery.trim()
      ? messages.filter(m => m.text?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
      : filterExpiredMessages(messages, ephemeralDuration),
  [messages, chatSearchQuery, ephemeralDuration]);

  const starredMessages = messages.filter(m => starredIds.includes(m.id));

  // ── Función para manejar click en tarjeta de transferencia ──────
  // ── #4 Jump to message al tocar reply preview ─────────────────
  const handleJumpToMessage = useCallback((parentId: string) => {
    const idx = displayMessages.findIndex(m => m.id === parentId);
    if (idx === -1) return;
    try {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    } catch { /* scrollToItem como fallback */ }
  }, [displayMessages]);

  // ── #1 Swipe-to-reply handler ──────────────────────────────────
  const handleSwipeReply = useCallback((msg: Message) => {
    setReplyTo(msg);
    haptics.light();
  }, []);

  // ── #12 Selección múltiple ──────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    Alert.alert(
      'Eliminar mensajes',
      `¿Eliminar ${selectedIds.size} mensaje${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const ids = Array.from(selectedIds);
            await Promise.allSettled(ids.map(id => chatAPI.deleteMessage(id)));
            setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
            exitSelectMode();
          },
        },
      ]
    );
  }, [selectedIds, exitSelectMode]);

  const handleForwardSelected = useCallback(() => {
    const msgs = messages.filter(m => selectedIds.has(m.id));
    if (msgs.length === 0) return;
    exitSelectMode();
    // Reenviar el primero con el modal; si hay varios, los encola en globals para el modal
    (global as any).__egchat_forward_msgs = msgs;
    setForwardMsg(msgs[0]);
    setShowForwardModal(true);
  }, [messages, selectedIds, exitSelectMode]);

  const handleTransferPress = useCallback((transferData: any) => {
    setTransferDetailsData(transferData);
    setShowTransferDetails(true);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === currentUserId;
    const prevMsg = index > 0 ? displayMessages[index - 1] : null;
    const showDate = !prevMsg || getDateLabel(item.created_at) !== getDateLabel(prevMsg.created_at);
    const searchHit = !!chatSearchQuery.trim() && !!item.text?.toLowerCase().includes(chatSearchQuery.toLowerCase());
    // #8 — Separador de mensajes no leídos
    const showUnreadSeparator = !!firstUnreadId && item.id === firstUnreadId;
    // #12 — estado de selección
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={isSelectMode ? 0.7 : 1}
        onPress={isSelectMode ? () => toggleSelect(item.id) : undefined}
        style={isSelected ? styles.selectedRow : undefined}
      >
        {showDate && <DateSeparator label={getDateLabel(item.created_at)} />}
        {showUnreadSeparator && (
          <View style={styles.unreadSeparator}>
            <View style={styles.unreadLine} />
            <Text style={styles.unreadLabel}>Mensajes nuevos</Text>
            <View style={styles.unreadLine} />
          </View>
        )}
        {/* Checkmark de selección */}
        {isSelectMode && (
          <View style={[styles.selectCheck, isOwn ? styles.selectCheckOwn : styles.selectCheckTheir]}>
            <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
              {isSelected && <Text style={styles.selectTick}>✓</Text>}
            </View>
          </View>
        )}
        <ChatMessageBubble
          message={item}
          isOwn={isOwn}
          isGroup={isGroup}
          myAvatar={myProfile.avatar_url}
          myName={myProfile.full_name}
          otherName={chatName}
          otherAvatar={chatAvatar}
          replyPreview={getReplyPreview(item)}
          showReadReceipts={showReadReceipts}
          highlight={searchHit || isSelected}
          reactions={messageReactions[item.id]}
          onLongPress={(msg) => {
            if (isSelectMode) {
              toggleSelect(msg.id);
              return;
            }
            haptics.medium();
            setIsSelectMode(true);
            setSelectedIds(new Set([msg.id]));
            handleLongPress(msg);
            if (isGroup && msg.sender_id === currentUserId) {
              setReceiptsMsgId(msg.id);
            }
          }}
          onRetry={retryMessage}
          onOpenImage={setPreviewImageUri}
          onTransferPress={handleTransferPress}
          onSwipeReply={isSelectMode ? undefined : handleSwipeReply}
          onReplyTap={handleJumpToMessage}
          onReactionPress={(msgId, rxns) => {
            setReactionDetailMsgId(msgId);
            setReactionDetailCounts(rxns);
          }}
          onCallback={() => {
            const txt = item.text?.toLowerCase() || '';
            const isVideo = txt.includes('video') || txt.includes('📹') || txt.includes('videollamada');
            goToCall(isVideo ? 'video' : 'audio');
          }}
          onTranscribed={(msgId, transcriptText) => {
            // C8 — guardar transcripción en el estado del mensaje
            setMessages(prev => prev.map(m =>
              m.id === msgId ? { ...m, voice_transcript: transcriptText } : m
            ));
          }}
          onOpenContact={(phone, name, avatarUrl) => {
            setCardContact({ phone, name, avatarUrl });
          }}
          onContactCall={(type, phone, name) => {
            router.push({
              pathname: '/call/[callId]',
              params: {
                callId: `call_${Date.now()}`,
                targetName: name,
                targetAvatar: '',
                callType: type,
                role: 'caller',
                targetPhone: phone,
              },
            } as any);
          }}
          onContactMessage={(phone, name) => {
            router.push({ pathname: '/chat/[id]', params: { id: phone, name } } as any);
          }}
        />
      </TouchableOpacity>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId, displayMessages, chatSearchQuery, firstUnreadId,
    selectedIds, isSelectMode, isGroup, myProfile, chatName, chatAvatar,
    showReadReceipts, messageReactions, toggleSelect, retryMessage,
    setPreviewImageUri, handleTransferPress, handleSwipeReply,
    handleJumpToMessage, handleLongPress,
  ]);

  const goToCall = (callType: 'audio' | 'video') => {
    // Si es chat grupal → llamada grupal
    if (isGroup && chat?.participants?.length > 2) {
      const otherIds = chat.participants
        .filter((p: any) => String(p.user_id) !== String(currentUserId))
        .map((p: any) => p.user_id);
      const names: Record<string, string> = {};
      chat.participants.forEach((p: any) => {
        names[p.user_id] = p.full_name || p.user_id;
      });
      router.push({
        pathname: '/group-call',
        params: {
          groupId: `group_${chatId}_${Date.now()}`,
          myUserId: currentUserId,
          participantIds: JSON.stringify(otherIds),
          callType,
          participantNames: JSON.stringify(names),
        },
      } as any);
      return;
    }
    // Chat privado → llamada 1:1
    router.push({
      pathname: '/call/[callId]',
      params: {
        callId: `call_${Date.now()}`,
        targetName: chatName,
        targetAvatar: chatAvatar || '',
        callType,
        role: 'caller',
        targetUserId: otherParticipant?.user_id || '',
      },
    } as any);
  };

  // Guard: chatId debe ser un string válido (no undefined, no array)
  if (!chatId || Array.isArray(chatId)) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textSecondary }}>Chat no encontrado</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgTertiary }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ChatHeader
        chatName={chatName}
        chatAvatar={chatAvatar}
        subtitle={chatSubtitle}
        isTyping={isTyping}
        isOnline={isOtherOnline}
        isGroup={isGroup}
        onBack={() => router.back()}
        onProfilePress={() => isGroup ? setShowGroupInfo(true) : setShowProfile(true)}
        onAudioCall={() => goToCall('audio')}
        onVideoCall={() => goToCall('video')}
        onGroupCall={() => goToCall('audio')}
        onMenuPress={() => setDrawerVisible(true)}
      />

      {/* Sprint 1.4 — barra de ubicación en vivo */}
      <LiveLocationBar active={liveLocationActive} onStop={handleStopLiveLocation} />

      {showChatSearch && (
        <ChatSearchBar
          value={chatSearchQuery}
          onChange={setChatSearchQuery}
          onClose={() => { setShowChatSearch(false); setChatSearchQuery(''); }}
        />
      )}

      {/* Barra de mensaje fijado */}
      {pinnedMessages.length > 0 && (
        <TouchableOpacity
          style={styles.pinnedBar}
          onPress={() => {
            const first = pinnedMessages[pinnedMessages.length - 1];
            const msg = messages.find(m => m.id === first.id);
            if (msg) flatListRef.current?.scrollToItem({ item: msg, animated: true });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedIcon}>📌</Text>
          <View style={styles.pinnedContent}>
            <Text style={styles.pinnedName}>{pinnedMessages[pinnedMessages.length - 1].senderName}</Text>
            <Text style={styles.pinnedText} numberOfLines={1}>
              {pinnedMessages[pinnedMessages.length - 1].text}
            </Text>
          </View>
          {pinnedMessages.length > 1 && (
            <Text style={styles.pinnedCount}>{pinnedMessages.length}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Badge incógnito */}
      {isIncognito && (
        <View style={styles.incognitoBadge}>
          <Text style={styles.incognitoText}>🕵️ Modo incógnito</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={[styles.chatBg, { flex: 1 }]}>
          <ChatWallpaperBackground wallpaperId={wallpaperId} />
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.messagesList, { paddingBottom: inputBarHeight + activePanelHeight + 16 }]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            // ── Optimizaciones de rendimiento ──────────────────────
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            // ────────────────────────────────────────────────────────
            ListHeaderComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 8 }} /> : null}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>Empieza la conversación</Text>
              </View>
            }
          />

          {showScrollBottom && (
            <TouchableOpacity
              style={styles.scrollBottomBtn}
              onPress={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
                setUnreadScrollCount(0);
                setFirstUnreadId(null);
              }}
              activeOpacity={0.85}
            >
              {unreadScrollCount > 0 && (
                <View style={styles.scrollBottomBadge}>
                  <Text style={styles.scrollBottomBadgeText}>
                    {unreadScrollCount > 99 ? '99+' : unreadScrollCount}
                  </Text>
                </View>
              )}
              <Text style={styles.scrollBottomIcon}>↓</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.liaFloat}
            onPress={() => router.push('/(tabs)/lia' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00C8A0', '#00B4E6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liaFloatGrad}
            >
              <Image
                source={require('../../assets/logo-transparent.png')}
                style={styles.liaFloatLogo}
                resizeMode="cover"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── BOTTOM DOCK — sube/baja animado con el teclado ── */}
        <Animated.View style={styles.bottomDock}>

            {replyTo && (
              <ReplyPreview
                author={replyTo.sender_id === currentUserId ? 'Tú' : (replyTo.sender?.full_name || chatName)}
                text={replyTo.text || 'Mensaje'}
                onCancel={() => setReplyTo(null)}
              />
            )}

            {/* Sprint 1.3 — Barra de edición */}
            {editingMessage && (
              <EditMessageBar
                message={editingMessage}
                editText={editText}
                onChangeText={setEditText}
                onConfirm={handleConfirmEdit}
                onCancel={() => { setEditingMessage(null); setEditText(''); }}
              />
            )}

            {/* #12 — Barra de acciones de selección múltiple */}
            {isSelectMode && (
              <View style={styles.multiSelectBar}>
                {/* Botón cerrar */}
                <TouchableOpacity style={styles.multiSelectClose} onPress={exitSelectMode} activeOpacity={0.7}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5}>
                    <Line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                    <Line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                  </Svg>
                </TouchableOpacity>

                {/* Contador */}
                <View style={styles.multiSelectCountWrap}>
                  <Text style={styles.multiSelectCountNum}>{selectedIds.size}</Text>
                  <Text style={styles.multiSelectCountLabel}>
                    {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.multiSelectActions}>
                  {/* Reenviar */}
                  <TouchableOpacity
                    style={[styles.multiSelectBtn, styles.multiSelectBtnForward, selectedIds.size === 0 && styles.multiSelectBtnDisabled]}
                    onPress={selectedIds.size > 0 ? handleForwardSelected : undefined}
                    activeOpacity={0.75}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                      <Path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
                      <Polyline points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                    <Text style={styles.multiSelectBtnLabel}>Reenviar</Text>
                  </TouchableOpacity>

                  {/* Eliminar */}
                  <TouchableOpacity
                    style={[styles.multiSelectBtn, styles.multiSelectBtnDanger, selectedIds.size === 0 && styles.multiSelectBtnDisabled]}
                    onPress={selectedIds.size > 0 ? handleDeleteSelected : undefined}
                    activeOpacity={0.75}
                  >
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                      <Polyline points="3 6 5 6 21 6" strokeLinecap="round"/>
                      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/>
                      <Path d="M10 11v6M14 11v6" strokeLinecap="round"/>
                      <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round"/>
                    </Svg>
                    <Text style={styles.multiSelectBtnLabelDanger}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Paneles adjuntos/emojis/stickers */}
            {!editingMessage && (showAttach || showEmojis || showStickers) && (
              <View style={{ overflow: 'hidden' }}>
                {showAttach && (
                  <View style={[styles.bottomSheet, styles.bottomSheetCompact]}>
                    <Pressable
                      style={StyleSheet.absoluteFillObject}
                      onPress={() => setShowAttach(false)}
                    />
                    <ChatAttachPanel onAction={handleAttachAction} />
                  </View>
                )}
                {showEmojis && (
                  <View style={[styles.bottomSheet, styles.bottomSheetCompact]}>
                    <ChatEmojiPanel onPick={insertEmoji} onSendSticker={sendStickerMessage} />
                  </View>
                )}
                {showStickers && (
                  <View style={[styles.bottomSheet, styles.bottomSheetCompact]}>
                    <StickerPanel
                      onSelect={async (url) => {
                        setShowStickers(false);
                        const tempId = createTempMessageId();
                        pushOptimistic({
                          id: tempId,
                      text: '🎭 Sticker',
                      type: 'image',
                      imageUrl: url,
                      file_url: url,
                      sender_id: currentUserId,
                      status: 'pending',
                      created_at: new Date().toISOString(),
                    });
                    try {
                      const sent = await chatAPI.sendMessage(chatId!, {
                        text: '🎭 Sticker',
                        type: 'image',
                        file_url: url,
                      });
                      replaceOptimistic(tempId, { ...sent, imageUrl: url, file_url: url });
                    } catch {
                      failOptimistic(tempId);
                    }
                  }}
                      onClose={() => setShowStickers(false)}
                    />
                  </View>
                )}
              </View>
            )}

            {/* F1 — Respuestas rápidas */}
            {quickReplySuggestions.length > 0 && (
              <QuickReplyPanel
                visible
                replies={quickReplySuggestions}
                onSelect={(reply) => {
                  setText(reply.text);
                  setQuickReplySuggestions([]);
                }}
              />
            )}

            {/* Sprint 2.2 — Sugerencias de menciones */}
            {isGroup && mentionQuery !== null && (
              <MentionSuggestions
                visible
                users={groupMembers}
                query={mentionQuery}
                onSelect={(user) => {
                  const newText = applyMention(text, user);
                  setText(newText);
                  setMentionQuery(null);
                }}
              />
            )}

            {/* Input bar */}
            {!editingMessage && !isSelectMode && (
              <View onLayout={e => setInputBarHeight(e.nativeEvent.layout.height)}>
                {!canWrite ? (
                  <View style={styles.broadcastBlock}>
                    <Text style={styles.broadcastBlockText}>📢 Solo los administradores pueden escribir</Text>
                  </View>
                ) : (
                <ChatInputBar
                  text={text}
                  sending={sending}
                  showAttach={showAttach}
                  showEmojis={showEmojis}
                  isRecording={isRecording}
                  durationFormatted={durationFormatted}
                  sendScale={sendScale}
                  onChangeText={handleTextChange}
                  onToggleAttach={() => {
                    setShowAttach(v => {
                      const n = !v;
                      if (n) {
                        setShowEmojis(false);
                        setShowStickers(false);
                        inputRef.current?.blur();
                        Keyboard.dismiss();
                      }
                      return n;
                    });
                  }}
                  onToggleEmojis={() => {
                    setShowEmojis(v => {
                      const n = !v;
                      if (n) {
                        setShowAttach(false);
                        setShowStickers(false);
                        inputRef.current?.blur();
                        Keyboard.dismiss();
                      }
                      return n;
                    });
                  }}
                  onToggleStickers={() => {
                    setShowStickers(v => {
                      const n = !v;
                      if (n) {
                        setShowAttach(false);
                        setShowEmojis(false);
                        inputRef.current?.blur();
                        Keyboard.dismiss();
                      }
                      return n;
                    });
                  }}
                  inputRef={inputRef}
                  onSend={sendMessage}
                  onLongPressSend={() => {
                    if (text.trim()) setShowScheduleModal(true);
                  }}
                  onStartRecording={async () => {
                    haptics.medium();
                    const ok = await startRecording();
                    if (!ok) toast.error('Sin permiso', 'Activa el micrófono en ajustes');
                  }}
                  onCancelRecording={cancelRecording}
                  onStopRecording={async () => {
                    const rec = await stopRecording();
                    if (!rec?.uri || !chatId) return;
                    haptics.success();
                    const tempId = createTempMessageId();
                    const label = `🎵 Audio (${rec.duration}s)`;
                    pushOptimistic({
                      id: tempId, text: label, type: 'audio', sender_id: currentUserId,
                      status: 'pending', created_at: new Date().toISOString(),
                    });
                    try {
                      const asset = { uri: rec.uri, fileName: 'audio.m4a', mimeType: 'audio/m4a' };
                      const sent = await uploadAndSend(chatId, asset, { text: label, type: 'audio' });
                      replaceOptimistic(tempId, sent);
                    } catch {
                      failOptimistic(tempId);
                      toast.error('Error', 'No se pudo enviar el audio');
                    }
                  }}
                />
                )}
              </View>
            )}
          {/* ── FIN BOTTOM DOCK ── */}
        </Animated.View>

      </View>

      </KeyboardAvoidingView>

      <ChatContextMenu
        visible={contextVisible}
        message={contextMsg}
        isOwn={contextMsg?.sender_id === currentUserId}
        onClose={() => setContextVisible(false)}
        onCopy={handleCopy}
        onReply={handleReply}
        onStar={handleStarMessage}
        onDelete={handleDelete}
        onDeleteForMe={handleDeleteForMe}
        onReaction={handleReaction}
        onTranslate={handleTranslate}
        onEdit={handleEditMessage}
        onForward={handleForwardMessage}
        onDownload={handleDownloadMedia}
        onSelectMode={() => {
          setContextVisible(false);
          if (contextMsg) {
            setIsSelectMode(true);
            setSelectedIds(new Set([contextMsg.id]));
          }
        }}
        onEditHistory={() => {
          if (contextMsg?.edited) setEditHistoryMsg(contextMsg);
          setContextVisible(false);
        }}
        onEphemeral={() => {
          setContextVisible(false);
          setShowEphemeralModal(true);
        }}
        onPin={() => {
          if (!contextMsg || !chatId) return;
          const senderName = contextMsg.sender_id === currentUserId
            ? (myProfile.full_name || 'Yo')
            : chatName;
          pinMessage(chatId, {
            id: contextMsg.id,
            text: contextMsg.text || '📎 Adjunto',
            senderName,
            pinnedAt: new Date().toISOString(),
          }).then(ok => {
            if (ok) {
              getPinnedMessages(chatId).then(setPinnedMessages);
              toast.info('📌 Mensaje fijado');
            }
          });
        }}
      />

      {/* Sprint 1.2 — Modal mensajes temporales */}
      <EphemeralSettingsModal
        visible={showEphemeralModal}
        current={ephemeralDuration}
        onSelect={async (d) => {
          setEphemeralDurationState(d);
          if (chatId) await setEphemeralDuration(chatId, d);
          const label = d === 0 ? 'Mensajes temporales desactivados' : `Mensajes temporales: ${d >= 86400 ? `${d/86400}d` : d >= 3600 ? `${d/3600}h` : `${d}s`}`;
          toast.info(label);
        }}
        onClose={() => setShowEphemeralModal(false)}
      />

      {/* Sprint 1.1 — Modal info del grupo */}
      {isGroup && (
        <GroupInfoModal
          visible={showGroupInfo}
          chat={chat}
          currentUserId={currentUserId}
          onClose={() => setShowGroupInfo(false)}
          onLeft={() => { setShowGroupInfo(false); router.back(); }}
        />
      )}

      {/* Sprint 3.1 — Tono personalizado */}
      <ChatToneModal
        visible={showToneModal}
        current={chatTone}
        onSelect={async (toneId) => {
          setChatToneState(toneId);
          if (chatId) await setChatTone(chatId, toneId);
        }}
        onClose={() => setShowToneModal(false)}
      />

      {/* Sprint 3.5 — Etiquetas */}
      <ChatLabelsModal
        visible={showLabelsModal}
        chatId={chatId}
        onClose={() => setShowLabelsModal(false)}
      />

      {/* C3 — Crear encuesta */}
      <CreatePollModal
        visible={showCreatePoll}
        currentUserId={currentUserId}
        onClose={() => setShowCreatePoll(false)}
        onSend={async (pollText) => {
          const tempId = createTempMessageId();
          pushOptimistic({ id: tempId, text: pollText, type: 'poll' as any, sender_id: currentUserId, status: 'pending', created_at: new Date().toISOString() });
          try {
            const sent = await chatAPI.sendMessage(chatId, { text: pollText, type: 'text' });
            replaceOptimistic(tempId, sent);
          } catch { failOptimistic(tempId); }
        }}
      />

      {/* F3 — Receipts de lectura en grupo */}
      {isGroup && (
        <MessageReadReceiptsModal
          visible={!!receiptsMsgId}
          messageId={receiptsMsgId || ''}
          chatParticipants={(chat?.participants || []).map((p: any) => ({
            user_id: p.user_id,
            full_name: p.full_name || p.users?.full_name || 'Usuario',
            avatar_url: p.avatar_url || p.users?.avatar_url,
          }))}
          currentUserId={currentUserId}
          onClose={() => setReceiptsMsgId(null)}
        />
      )}

      {/* #7 — Modal de quién reaccionó */}
      <ReactionDetailModal
        visible={!!reactionDetailMsgId}
        messageId={reactionDetailMsgId}
        localCounts={reactionDetailCounts}
        currentUserId={currentUserId}
        onClose={() => setReactionDetailMsgId(null)}
        resolveUser={(uid) => {
          const p = (chat?.participants || []).find((x: any) => x.user_id === uid);
          if (!p) return undefined;
          return {
            full_name: p.full_name || p.users?.full_name,
            avatar_url: p.avatar_url || p.users?.avatar_url,
          };
        }}
      />

      {/* A2 — Modal de mensaje programado */}
      <ScheduledMessageModal
        visible={showScheduleModal}
        chatId={chatId || ''}
        messageText={text}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={() => {
          setShowScheduleModal(false);
          setText('');
          toast.success('Programado ✓', 'El mensaje se enviará en la fecha indicada');
        }}
      />

      {/* A3 — Historial de ediciones */}
      <EditHistoryModal
        visible={!!editHistoryMsg}
        history={editHistoryMsg?.edit_history || []}
        currentText={editHistoryMsg?.text}
        onClose={() => setEditHistoryMsg(null)}
      />

      {/* C5 — Galería multimedia */}
      <ChatMediaGallery
        visible={showMediaGallery}
        chatId={chatId || ''}
        chatName={chatName}
        onClose={() => setShowMediaGallery(false)}
      />

      {/* C7 — Reenvío con comentario */}
      <ForwardWithCommentModal
        visible={showForwardModal}
        message={forwardMsg}
        currentUserId={currentUserId}
        onClose={() => { setShowForwardModal(false); setForwardMsg(null); }}
        onForwarded={() => { setShowForwardModal(false); setForwardMsg(null); }}
      />

      {/* PTT — Walkie-talkie */}
      {showPTT && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowPTT(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowPTT(false)}>
            <Pressable style={{ backgroundColor: C.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }} onPress={e => e.stopPropagation()}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 16 }}>
                🎙 Walkie-talkie con {chatName}
              </Text>
              <PushToTalkButton
                chatId={chatId}
                currentUserId={currentUserId}
                otherName={chatName}
                onRecorded={async (uri, dur) => {
                  setShowPTT(false);
                  const tempId = createTempMessageId();
                  const label = `🎙 PTT (${dur}s)`;
                  pushOptimistic({ id: tempId, text: label, type: 'audio', sender_id: currentUserId, status: 'pending', created_at: new Date().toISOString() });
                  try {
                    const asset = { uri, fileName: 'ptt.m4a', mimeType: 'audio/m4a' };
                    const sent = await uploadAndSend(chatId, asset, { text: label, type: 'audio' });
                    replaceOptimistic(tempId, sent);
                  } catch { failOptimistic(tempId); }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Sprint 2.4 — Pago grupal */}
      {isGroup && (
        <GroupPaymentModal
          visible={showGroupPayment}
          chatId={chatId}
          members={(chat?.participants || []).map((p: any) => ({
            user_id: p.user_id,
            full_name: p.full_name || p.users?.full_name || 'Usuario',
            avatar_url: p.avatar_url || p.users?.avatar_url,
          }))}
          currentUserId={currentUserId}
          onClose={() => setShowGroupPayment(false)}
          onSent={(msg) => {
            const tempId = createTempMessageId();
            pushOptimistic({ id: tempId, text: msg, type: 'text', sender_id: currentUserId, status: 'pending', created_at: new Date().toISOString() });
            chatAPI.sendMessage(chatId, { text: msg, type: 'text' })
              .then(real => replaceOptimistic(tempId, real))
              .catch(() => failOptimistic(tempId));
          }}
        />
      )}
      <ChatWallpaperModal
        visible={showWallpaperModal}
        activeId={wallpaperId}
        onClose={() => setShowWallpaperModal(false)}
        onSelect={async (id) => {
          setWallpaperId(id);
          if (chatId) await setChatWallpaperId(chatId, id);
        }}
      />

      {/* F4 — Preview antes de enviar */}
      <MediaPreviewModal
        visible={!!mediaPreviewItem}
        item={mediaPreviewItem}
        sending={mediaSending}
        onCancel={() => setMediaPreviewItem(null)}
        onSend={async (caption) => {
          if (!mediaPreviewItem || !chatId) return;
          setMediaSending(true);
          try {
            const asset = {
              uri: mediaPreviewItem.uri,
              fileName: mediaPreviewItem.fileName,
              mimeType: mediaPreviewItem.mimeType,
            };
            const type = mediaPreviewItem.type === 'image' ? 'image'
              : mediaPreviewItem.type === 'video' ? 'video' : 'file';
            const label = caption || asset.fileName;
            await sendMedia(asset, { text: label, type });
          } finally {
            setMediaSending(false);
            setMediaPreviewItem(null);
          }
        }}
      />
      <ChatStarredModal
        visible={showStarredModal}
        messages={starredMessages}
        onClose={() => setShowStarredModal(false)}
        onRemove={(id) => persistStarred(starredIds.filter(sid => sid !== id))}
      />
      <ChatMenuPanel
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        chatName={chatName}
        chatAvatar={chatAvatar}
        chatInitials={chatName?.slice(0, 2).toUpperCase()}
        isGroup={isGroup}
        isOnline={isOtherOnline}
        items={drawerItems}
        headerHeight={56}
      />
      <ChatContactPickerModal
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelect={handleShareContact}
      />

      {/* ── Transfer Details Modal ── */}
      <TransferDetailsModal
        visible={showTransferDetails}
        onClose={() => setShowTransferDetails(false)}
        transferData={transferDetailsData}
        isReceived={false}
      />

      {/* ── Bottom-sheet selector Foto / Video ── */}
      <Modal
        visible={!!mediaPickerMode}
        transparent
        animationType="slide"
        onRequestClose={() => setMediaPickerMode(null)}
      >
        <Pressable style={mpStyles.overlay} onPress={() => setMediaPickerMode(null)}>
          <Pressable style={mpStyles.sheet} onPress={e => e.stopPropagation()}>
            {/* Handle arrastrable */}
            <TouchableOpacity onPress={() => setMediaPickerMode(null)} style={mpStyles.handleWrap} activeOpacity={0.7}>
              <View style={mpStyles.handle} />
            </TouchableOpacity>

            <Text style={mpStyles.title}>
              {mediaPickerMode === 'photo' ? 'Añadir foto' : 'Añadir video'}
            </Text>

            {/* Opción Cámara */}
            <TouchableOpacity
              style={mpStyles.option}
              activeOpacity={0.7}
              onPress={async () => {
                setMediaPickerMode(null);
                if (mediaPickerMode === 'photo') {
                  const a = await pickImageFromCamera();
                  if (a) setPhotoEditUri(a.uri);
                } else {
                  const a = await pickVideoFromCamera();
                  if (a) setMediaPreviewItem({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType, type: 'video' });
                }
              }}
            >
              <View style={[mpStyles.optionIcon, { backgroundColor: '#fff3e0' }]}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <Circle cx="12" cy="13" r="4"/>
                </Svg>
              </View>
              <View style={mpStyles.optionText}>
                <Text style={mpStyles.optionLabel}>
                  {mediaPickerMode === 'photo' ? 'Hacer una foto' : 'Grabar un video'}
                </Text>
                <Text style={mpStyles.optionSub}>Abrir la cámara ahora</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={2} strokeLinecap="round"><Path d="M9 18l6-6-6-6"/></Svg>
            </TouchableOpacity>

            <View style={mpStyles.divider} />

            {/* Opción Galería */}
            <TouchableOpacity
              style={mpStyles.option}
              activeOpacity={0.7}
              onPress={async () => {
                setMediaPickerMode(null);
                if (mediaPickerMode === 'photo') {
                  const a = await pickImageFromLibrary();
                  if (a) setPhotoEditUri(a.uri);
                } else {
                  const a = await pickVideo();
                  if (a) setMediaPreviewItem({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType, type: 'video' });
                }
              }}
            >
              <View style={[mpStyles.optionIcon, { backgroundColor: '#e8f5e9' }]}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="3" width="18" height="18" rx="3"/>
                  <Circle cx="8.5" cy="8.5" r="1.5"/>
                  <Polyline points="21 15 16 10 5 21"/>
                </Svg>
              </View>
              <View style={mpStyles.optionText}>
                <Text style={mpStyles.optionLabel}>Elegir de la galería</Text>
                <Text style={mpStyles.optionSub}>Seleccionar desde el dispositivo</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={2} strokeLinecap="round"><Path d="M9 18l6-6-6-6"/></Svg>
            </TouchableOpacity>

            {/* Botón cancelar */}
            <TouchableOpacity
              style={mpStyles.cancelBtn}
              onPress={() => setMediaPickerMode(null)}
              activeOpacity={0.7}
            >
              <Text style={mpStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <ContactProfileModal
        visible={showProfile}
        contact={{
          id: chatId,
          title: chatName,
          name: chatName,
          avatarUrl: chatAvatar,
          phone: otherPhone,
          isGroup,
          type: isGroup ? 'group' : 'private',
        }}
        onClose={() => setShowProfile(false)}
        onStartCall={(type) => {
          setShowProfile(false);
          router.push({
            pathname: '/call/[callId]',
            params: {
              callId: `call_${Date.now()}`,
              targetName: chatName,
              targetAvatar: chatAvatar || '',
              callType: type,
              role: 'caller',
              targetUserId: otherParticipant?.user_id || '',
            },
          } as any);
        }}
        onSendMoney={() => { setShowProfile(false); setShowQuickTransfer(true); }}
      />
      {/* Modal de perfil para contacto compartido en tarjeta */}
      {cardContact && (
        <ContactProfileModal
          visible={!!cardContact}
          contact={{
            id: cardContact.phone,
            title: cardContact.name,
            name: cardContact.name,
            avatarUrl: cardContact.avatarUrl,
            phone: cardContact.phone,
            isGroup: false,
            type: 'private',
          }}
          onClose={() => setCardContact(null)}
          onStartCall={(type) => {
            setCardContact(null);
            router.push({
              pathname: '/call/[callId]',
              params: {
                callId: `call_${Date.now()}`,
                targetName: cardContact.name,
                targetAvatar: cardContact.avatarUrl || '',
                callType: type,
                role: 'caller',
                targetPhone: cardContact.phone,
              },
            } as any);
          }}
          onSendMoney={() => setCardContact(null)}
        />
      )}
      <QuickTransferModal
        visible={showQuickTransfer}
        onClose={() => setShowQuickTransfer(false)}
        contactName={chatName}
        contactAvatar={chatAvatar}
        recipientId={otherParticipant?.user_id}
        recipientPhone={otherPhone}
        myAvatar={myProfile.avatar_url}
        myName={myProfile.full_name || 'Yo'}
        onTransferred={sendTransferMessage}
      />
      {cropUri ? (
        <AvatarCropModal
          visible
          imageUri={cropUri}
          onClose={() => setCropUri(null)}
          onSave={uploadChatAvatar}
        />
      ) : null}
      {/* Editor de fotos antes de enviar */}
      {photoEditUri && chatId ? (
        <PhotoEditorModal
          visible
          photoUri={photoEditUri}
          chatId={chatId}
          onClose={() => setPhotoEditUri(null)}
          onSend={async (_cId, caption, editedUri) => {
            setPhotoEditUri(null);
            setShowAttach(false);
            await sendMedia(
              { uri: editedUri, fileName: 'photo.jpg', mimeType: 'image/jpeg' },
              { text: caption || '📷 Foto', type: 'image' },
            );
          }}
        />
      ) : null}
      {uploadingAvatar && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#00c8a0" />
        </View>
      )}
      <Modal visible={!!previewImageUri} transparent animationType="fade" onRequestClose={() => setPreviewImageUri(null)}>
        <Pressable style={styles.imagePreviewOverlay} onPress={() => setPreviewImageUri(null)}>
          {previewImageUri ? (
            <Image source={{ uri: previewImageUri }} style={styles.imagePreview} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 28, color: Colors.white, lineHeight: 32 },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    lineHeight: 16,
    color: '#667781',
    marginTop: 1,
  },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  headerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  headerStatusDotActive: { backgroundColor: '#b8ffdf' },
  headerStatusTyping: { color: '#00c8a0', fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: { fontSize: 18, color: Colors.white },

  chatBg: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    position: 'relative',
  },
  scrollBottomBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollBottomIcon: { fontSize: 18, color: '#00c8a0', fontWeight: '700' },
  scrollBottomBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#00c8a0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollBottomBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  // ── Separador de mensajes no leídos (#8) ──
  unreadSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  unreadLine: { flex: 1, height: 1, backgroundColor: '#00b4e6', opacity: 0.35 },
  unreadLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00b4e6',
    backgroundColor: 'rgba(0,180,230,0.10)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  // ── Selección múltiple (#12) ──
  selectedRow: {
    backgroundColor: 'rgba(0,180,230,0.10)',
  },
  selectCheck: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    marginTop: -12,
  },
  selectCheckOwn:   { right: 8 },
  selectCheckTheir: { left: 8 },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00b4e6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleActive: {
    backgroundColor: '#00b4e6',
    borderColor: '#00b4e6',
  },
  selectTick: { fontSize: 13, color: '#fff', fontWeight: '700' },
  multiSelectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  multiSelectClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiSelectCountWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  multiSelectCountNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  multiSelectCountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  multiSelectActions: { flexDirection: 'row', gap: 8 },
  multiSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  multiSelectBtnForward: {
    backgroundColor: '#00b4e6',
    shadowColor: '#00b4e6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 4,
  },
  multiSelectBtnDanger: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 4,
  },
  multiSelectBtnDisabled: { opacity: 0.35 },
  multiSelectBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  multiSelectBtnLabelDanger: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  // C3 — broadcast block
  broadcastBlock: {
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  broadcastBlockText: { fontSize: 13, color: '#f97316', fontWeight: '600' },

  // Messages
  messagesList: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm, gap: 2 },

  // Bubble
  bubbleWrapper: { marginVertical: 1, flexDirection: 'row', alignItems: 'flex-end' },
  ownWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  groupAvatarCol: { marginRight: 6, marginBottom: 2 },
  bubble: {
    maxWidth: '75%',
    paddingVertical: Spacing.bubblePaddingV,
    paddingHorizontal: Spacing.bubblePaddingH,
  },
  ownBubble: {
    backgroundColor: '#d9fdd3',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    ...Shadow.bubble,
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    ...Shadow.bubble,
  },
  senderName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    marginBottom: 2,
  },
  bubbleText: { ...Typography.messageText, color: Colors.textPrimary },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  bubbleTime: { ...Typography.timestamp, color: Colors.textTertiary },
  uploadStatus: {
    marginTop: 6,
    gap: 4,
  },
  uploadTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  uploadFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  uploadText: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  retryHint: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 3,
    textAlign: 'right',
  },

  // Date separator
  dateSeparator: { alignItems: 'center', marginVertical: Spacing.sm },
  dateSeparatorText: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Typing indicator
  typingContainer: { alignItems: 'flex-start', paddingHorizontal: Spacing.sm + 2, marginVertical: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    ...Shadow.bubble,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textTertiary },

  // Context menu
  contextOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  contextMenu: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    width: 260,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  contextItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  contextItemText: { fontSize: FontSize.md, color: Colors.textPrimary },

  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,180,230,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#00b4e6',
    marginHorizontal: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  replyInner: { flex: 1, minWidth: 0 },
  replyAuthor: { fontSize: 11, fontWeight: '700', color: '#00b4e6', marginBottom: 2 },
  replyText: { fontSize: 12, color: '#6b7280' },
  replyCancel: { padding: 4 },
  replyCancelText: { fontSize: 14, color: '#9ca3af', fontWeight: '700' },

  // Empty state
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyChatText: { ...Typography.subtitle, color: Colors.textSecondary },

  bubbleImage: {
    width: 220,
    height: 160,
    borderRadius: 10,
    marginBottom: 4,
  },

  // LIA-25 flotante en el chat (36px como web)
  liaFloat: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    zIndex: 10,
    ...Shadow.md,
  },
  liaFloatGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  liaFloatLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },

  // Bottom dock — posición absoluta, sube con el teclado sin mover la barra visualmente
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 20,
  },

  bottomSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  bottomSheetCompact: {
    marginBottom: -1,
  },

  // Panel adjuntos — grid 2 columnas
  attachPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: 'flex-start',
  },
  attachItem: {
    width: '22%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachEmoji: { fontSize: 28 },
  attachLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  // Botón + adjuntos
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  attachBtnActive: {
    backgroundColor: 'rgba(0,180,230,0.12)',
  },
  // Campo texto
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: { fontSize: FontSize.md, color: Colors.textPrimary, maxHeight: 120, padding: 0 },
  // Emoji
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(0,180,230,0.12)',
  },
  emojiBtnIcon: { fontSize: 22, opacity: 0.85 },
  // Micrófono
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Enviar
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnIcon: { color: Colors.white, fontSize: 16 },

  // Grabación de audio
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cancelRecBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.errorBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelRecText: { fontSize: 14, color: Colors.error, fontWeight: '700' },
  recordingPulse: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.errorBg,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  recordingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingTime: { fontSize: 14, fontWeight: '700', color: Colors.error },
  // Mensajes fijados
  pinnedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,200,160,0.08)', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,160,0.15)',
  },
  pinnedIcon: { fontSize: 14 },
  pinnedContent: { flex: 1 },
  pinnedName: { fontSize: 11, fontWeight: '700', color: '#00c8a0' },
  pinnedText: { fontSize: 12, color: '#6b7280' },
  pinnedCount: {
    fontSize: 11, fontWeight: '700', color: '#fff',
    backgroundColor: '#00c8a0', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
  },
  // Modo incógnito
  incognitoBadge: {
    backgroundColor: 'rgba(139,92,246,0.12)', paddingHorizontal: 14, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
  },
  incognitoText: { fontSize: 12, color: '#8b5cf6', fontWeight: '600' },
});

// ── Estilos Modal Selector Foto/Video ─────────────────────────────
const mpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingTop: 0,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  title: {
    fontSize: 17, fontWeight: '700', color: '#111827',
    textAlign: 'center', marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  optionIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  optionSub: { fontSize: 13, color: '#9ca3af', marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#f3f4f6' },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
});
