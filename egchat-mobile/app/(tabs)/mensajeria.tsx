// ══════════════════════════════════════════════════════════════════
// EGCHAT — Mensajería (fiel a la versión web)
// Header: logo + temp + bell + menu
// Barra búsqueda + botón +
// Secciones: Contactos Favoritos, Grupos Favoritos
// Filtros: Individual | Grupos | Dinero
// Lista de chats con avatar, nombre, último msg, hora, badge
// FAB refresh + LIA-25 flotante
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TabErrorBoundary } from '../../src/components/TabErrorBoundary';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
  ScrollView, Image, Platform, Alert, Modal, Pressable,
  FlatList, KeyboardAvoidingView, Animated, Dimensions, PanResponder,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

// En web usamos FlatList estándar — FlashList no soporta web
const ChatFlatList = (Platform.OS === 'web' ? FlatList : FlashList) as typeof FlatList;
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI, authAPI, contactsAPI } from '../../src/api';
import { onProfileUpdated } from '../../src/utils/profileEvents';
import { useChatStream } from '../../src/hooks/useChatStream';
import { useSharedContent } from '../../src/native/ShareExtension';
import { HomeWidget } from '../../src/native/HomeWidget';
import { getFavoriteGroupIds, toggleFavoriteGroup } from '../../src/utils/favorites';
import {
  loadArchivedChats, saveArchivedChats, getArchivePassword, setArchivePassword,
  type ArchivedChat,
} from '../../src/utils/chatArchive';
import { SwipeChatItem } from '../../src/components/chat/SwipeChatItem';
import { toast } from '../../src/components/Toast';
import type { WeatherCondition } from '../../src/components/EGChatHeader';
import { useAppStore } from '../../src/store/useAppStore';
import { markAllRead, clearAllNotifications, removeNotification } from '../../src/store/appStore';
import { haptics } from '../../src/hooks/useHaptics';
import { useOffline } from '../../src/hooks/useOffline';
import { EGAvatar, OfflineBanner } from '../../src/components/ui';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { ChatListSkeleton } from '../../src/components/chat/ChatSkeleton';
import { CreateGroupModal } from '../../src/components/chat/CreateGroupModal';

// ── Tipos ─────────────────────────────────────────────────────────
interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{
    user_id: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    users?: { full_name?: string; avatar_url?: string; phone?: string };
    user?: { full_name?: string; avatar_url?: string; phone?: string };
  }>;
  last_message?: { text?: string; type: string; created_at: string; sender_id: string };
  unread_count: number;
  updated_at: string;
}

type FilterType = 'individual' | 'grupos' | 'dinero' | 'archivar';
type ArchiveSubFilter = 'individual' | 'group';

// ── Helpers ───────────────────────────────────────────────────────
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

type LastMsgInfo = { icon: 'phone-missed' | 'money' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact' | 'call-out' | 'video-call' | null; label: string };

// Elimina todos los emojis de un string
const stripEmojis = (s: string) =>
  s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu, '').trim();

const getLastMessageInfo = (msg?: Chat['last_message']): LastMsgInfo => {
  if (!msg) return { icon: null, label: 'Sin mensajes' };
  const txt = msg.text || '';
  if (txt.includes('Llamada perdida')) return { icon: 'phone-missed', label: 'Llamada perdida' };
  if (txt.includes('VideoLlamada') || txt.includes('Videollamada') || txt.includes('video') && txt.includes('aliente'))
    return { icon: 'video-call', label: stripEmojis(txt).replace(/videollamada/gi, 'Videollamada') || 'Videollamada saliente' };
  if (txt.includes('Llamada') || txt.toLowerCase().includes('llamada'))
    return { icon: 'call-out', label: stripEmojis(txt) || 'Llamada' };
  if (txt.includes('Transferencia') || txt.includes('💸')) return { icon: 'money', label: 'Transferencia' };
  if (msg.type === 'image' || txt.startsWith('📷')) return { icon: 'image', label: 'Foto' };
  if (msg.type === 'video' || txt.startsWith('🎥')) return { icon: 'video', label: 'Video' };
  if (msg.type === 'audio' || txt.startsWith('🎵')) return { icon: 'audio', label: 'Audio' };
  if (msg.type === 'file' || txt.startsWith('📄') || txt.startsWith('📁')) return { icon: 'file', label: 'Archivo' };
  if (msg.type === 'location' || txt.startsWith('📍')) return { icon: 'location', label: 'Ubicación' };
  if (msg.type === 'contact' || txt.startsWith('👤')) {
    const name = stripEmojis(txt).split('\n')[0].trim();
    return { icon: 'contact', label: name || 'Contacto' };
  }
  return { icon: null, label: stripEmojis(txt) || txt || 'Mensaje' };
};

// Icono vectorial limpio para el último mensaje
const LastMsgIcon = ({ type, color }: { type: LastMsgInfo['icon']; color: string }) => {
  if (!type) return null;
  const props = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'phone-missed':
      return <Svg {...props}><Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A2 2 0 0 1 10.68 13.31z"/><Path d="M23 1L17 7"/><Path d="M17 1l6 6"/></Svg>;
    case 'call-out':
      return <Svg {...props}><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>;
    case 'video-call':
    case 'video':
      return <Svg {...props}><Rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><Path d="M8 21l8 0"/><Path d="M12 17l0 4"/><Circle cx="12" cy="9" r="1"/></Svg>;
    case 'image':
      return <Svg {...props}><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></Svg>;
    case 'audio':
      return <Svg {...props}><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2"/><Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/></Svg>;
    case 'file':
      return <Svg {...props}><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><Polyline points="14 2 14 8 20 8"/></Svg>;
    case 'location':
      return <Svg {...props}><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle cx="12" cy="10" r="3"/></Svg>;
    case 'contact':
      return <Svg {...props}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>;
    case 'money':
      return <Svg {...props}><Rect x="2" y="5" width="20" height="14" rx="2"/><Line x1="2" y1="10" x2="22" y2="10"/></Svg>;
    default:
      return null;
  }
};

const getParticipantName = (participant?: Chat['participants'][number]) =>
  participant?.full_name || participant?.users?.full_name || participant?.user?.full_name || '';

const isValidAvatarUrl = (url?: string | null): url is string =>
  !!url &&
  url.trim().length > 0 &&
  (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://')
  ) &&
  !url.includes('egchat-api-xlxj.onrender.com/static/avatars/');

const getParticipantAvatar = (participant?: Chat['participants'][number]) => {
  // Buscar en todos los niveles posibles de la respuesta del backend
  const raw =
    participant?.avatar_url ||
    participant?.users?.avatar_url ||
    participant?.user?.avatar_url ||
    (participant as any)?.users?.[0]?.avatar_url;
  return isValidAvatarUrl(raw) ? raw : undefined;
};

const sortChatsByActivity = (items: Chat[] = []) =>
  [...items].sort((a, b) => {
    const bTime = new Date(b.updated_at || b.last_message?.created_at || 0).getTime();
    const aTime = new Date(a.updated_at || a.last_message?.created_at || 0).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });

const IconUser = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);
const IconUsers = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);
const IconMoney = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" /><Line x1="2" y1="10" x2="22" y2="10" /><Circle cx="12" cy="15" r="2" />
  </Svg>
);
const IconArchive = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Polyline points="21 8 21 21 3 21 3 8" /><Rect x="1" y="3" width="22" height="5" /><Line x1="10" y1="12" x2="14" y2="12" />
  </Svg>
);
const IconSearch = ({ color = Colors.textTertiary }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="11" cy="11" r="8"/>
    <Path d="M21 21l-4.35-4.35"/>
  </Svg>
);
const IconRefresh = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 4 23 10 17 10"/>
    <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </Svg>
);

// ── ChatItem ──────────────────────────────────────────────────────
const ChatItem = React.memo(({ chat, currentUserId, onPress, onLongPress, staticRow }: {
  chat: Chat; currentUserId: string; onPress?: () => void; onLongPress?: () => void; staticRow?: boolean;
}) => {
  const other = chat.participants.find(p => String(p.user_id) !== String(currentUserId));
  const chatName = chat.type === 'private'
    ? (getParticipantName(other) || 'Usuario')
    : (chat.name || 'Grupo');
  const avatarSrc = chat.type === 'private' ? getParticipantAvatar(other) : chat.avatar_url;
  const msgInfo = getLastMessageInfo(chat.last_message);
  const time = formatTime(chat.updated_at);
  const hasUnread = chat.unread_count > 0;
  const msgIconColor = hasUnread ? Colors.accent : Colors.textTertiary;

  const body = (
    <>
      {/* Avatar con badge de grupo */}
      <View style={{ position: 'relative' }}>
        <EGAvatar src={avatarSrc} name={chatName} size={50} />
        {chat.type === 'group' && (
          <View style={st.groupBadge}>
            <Text style={st.groupBadgeText}>👥</Text>
          </View>
        )}
      </View>
      <View style={st.chatInfo}>
        <View style={st.chatRow}>
          <Text style={st.chatName} numberOfLines={1}>{chatName}</Text>
          {time ? <Text style={[st.chatTime, hasUnread && st.chatTimeUnread]}>{time}</Text> : null}
        </View>
        <View style={st.chatRow}>
          <View style={st.chatMsgRow}>
            {msgInfo.icon && (
              <View style={st.chatMsgIcon}>
                <LastMsgIcon type={msgInfo.icon} color={msgIconColor} />
              </View>
            )}
            <Text style={st.chatMsg} numberOfLines={1}>{msgInfo.label}</Text>
          </View>
          {hasUnread && (
            <View style={st.badge}>
              <Text style={st.badgeText}>{chat.unread_count > 99 ? '99+' : chat.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );

  if (staticRow) {
    return <View style={st.chatItem}>{body}</View>;
  }
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={st.chatItem} activeOpacity={0.7} delayLongPress={400}>
      {body}
    </TouchableOpacity>
  );
});

// ── Favoritos horizontales (como web) ─────────────────────────────
const FavoriteSection = ({
  title, empty, C, children,
}: { title: string; empty: string; C: typeof Colors; children?: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(true);
  const hasItems = React.Children.count(children) > 0;
  return (
    <View style={[st.favSection, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
      <TouchableOpacity style={st.favHeader} onPress={() => setCollapsed(v => !v)} activeOpacity={0.7}>
        <Text style={[st.favTitle, { color: C.textTertiary }]}>{title}</Text>
        <Text style={[st.favToggle, { color: C.textTertiary }]}>{collapsed ? '+' : '−'}</Text>
      </TouchableOpacity>
      {!collapsed && (
        hasItems ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.favScroll}>
            {children}
          </ScrollView>
        ) : (
          <Text style={[st.favEmpty, { color: C.textTertiary }]}>{empty}</Text>
        )
      )}
    </View>
  );
};

const FavoriteChip = ({ name, avatar, onPress }: { name: string; avatar?: string; onPress: () => void }) => (
  <TouchableOpacity style={st.favChip} onPress={onPress} activeOpacity={0.8}>
    <EGAvatar src={avatar} name={name} size={56} />
    <Text style={st.favChipName} numberOfLines={1}>{name}</Text>
  </TouchableOpacity>
);

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
function MensajeriaScreenInner() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [globalResults, setGlobalResults] = useState<Array<{ chatId: string; chatName: string; messageText: string; messageTime: string }>>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('individual');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  // Clima y notificaciones desde el store global
  const { weather, notifications } = useAppStore();
  const [favoriteContacts, setFavoriteContacts] = useState<any[]>([]);
  const [favoriteGroupIds, setFavoriteGroupIds] = useState<string[]>([]);
  const [archivedChats, setArchivedChats] = useState<ArchivedChat[]>([]);
  const [archivePassword, setArchivePasswordState] = useState('');
  const [archiveUnlocked, setArchiveUnlocked] = useState(false);
  const [archiveSubFilter, setArchiveSubFilter] = useState<ArchiveSubFilter>('individual');
  const [showArchiveSetup, setShowArchiveSetup] = useState(false);
  const [showArchiveUnlock, setShowArchiveUnlock] = useState(false);
  const [archivePwdInput, setArchivePwdInput] = useState('');
  const [archivePwdError, setArchivePwdError] = useState('');
  // Sprint 1.1 — Crear grupo
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { isDark } = useThemeContext();
  const { saveCache, readCache } = useOffline();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // ── SSE Stream — actualizar lista de chats al instante ────────────
  useChatStream(currentUserId || undefined, (event) => {
    if (event.type === 'new_message' || event.type === 'chat_updated') {
      loadChats(currentUserId);
    }
  });

  // ── Búsqueda global en mensajes ────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setGlobalResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingGlobal(true);
      try {
        const q = searchQuery.toLowerCase();
        const results: typeof globalResults = [];
        for (const chat of chats) {
          const other = chat.participants.find((p: any) => String(p.user_id) !== String(currentUserId));
          const chatName = chat.type === 'private'
            ? (getParticipantName(other) || 'Usuario')
            : (chat.name || 'Grupo');
          const lastText = chat.last_message?.text || '';
          if (chatName.toLowerCase().includes(q) || lastText.toLowerCase().includes(q)) {
            results.push({ chatId: chat.id, chatName, messageText: lastText, messageTime: '' });
          }
        }
        setGlobalResults(results);
      } finally { setSearchingGlobal(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, chats, currentUserId]);

  // ── Recibir contenido compartido desde otras apps ─────────────────
  useSharedContent((content) => {
    if (content.uri || content.text) {
      (global as any).__egchat_shared_content = content;
      toast.info('📎 Contenido recibido', 'Selecciona el chat donde enviarlo');
    }
  });

  const getChatMeta = useCallback((chat: Chat) => {
    const other = chat.participants.find(p => String(p.user_id) !== String(currentUserId));
    const name = chat.type === 'private' ? (getParticipantName(other) || 'Usuario') : (chat.name || 'Grupo');
    const avatar = chat.type === 'private' ? getParticipantAvatar(other) : chat.avatar_url;
    return { name, avatar, other };
  }, [currentUserId]);

  // ── Carga ───────────────────────────────────────────────────────
  const loadChats = useCallback(async (userId?: string) => {
    const uid = userId || currentUserId;

    // Mostrar caché inmediatamente mientras llega la respuesta del servidor
    const cached = await readCache<Chat[]>('chat_list');
    if (cached?.length && chats.length === 0) {
      setChats(sortChatsByActivity(cached));
    }
    // Nota: NO mostrar toast de "Conectando" — es molesto y se repite

    try {
      setLoadError('');
      const [data, favContacts, favGroups] = await Promise.all([
        chatAPI.getChats(),
        contactsAPI.getFavorites().catch(() => []),
        getFavoriteGroupIds(),
      ]);
      const sortedChats = sortChatsByActivity(data || []);

      // Enriquecer participantes que tengan full_name vacío
      const enriched = await Promise.all(sortedChats.map(async (chat) => {
        const needsEnrich = chat.participants?.some(
          (p: any) => !p.full_name && p.user_id
        );
        if (!needsEnrich) return chat;
        try {
          const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/$/, '');
          const token = await (await import('../../src/api')).getToken();
          const parts = await fetch(`${BASE}/api/chats/${chat.id}/participants`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).catch(() => null);
          if (Array.isArray(parts) && parts.length > 0) {
            return { ...chat, participants: parts };
          }
        } catch {}
        return chat;
      }));

      setChats(enriched);
      saveCache('chat_list', enriched);

      // Actualizar widget de pantalla de inicio con últimos chats
      HomeWidget.update(enriched.map(c => {
        const other = c.participants.find((p: any) => String(p.user_id) !== String(uid));
        const name = c.type === 'private'
          ? (other?.full_name || other?.users?.full_name || 'Usuario')
          : (c.name || 'Grupo');
        const avatar = c.type === 'private'
          ? (other?.avatar_url || other?.users?.avatar_url || '')
          : (c.avatar_url || '');
        return {
          id: c.id,
          name,
          lastMsg: c.last_message?.text || '',
          unread: c.unread_count || 0,
          avatar,
        };
      }));
      setFavoriteContacts(favContacts || []);
      setFavoriteGroupIds(favGroups);
    } catch (e: any) {
      const msg = e?.message || '';
      // Si es sesión expirada, el handler de _layout ya redirige al login
      if (msg.includes('expirada') || msg.includes('401') || msg.includes('autorizado')) {
        return; // el setUnauthorizedHandler se encarga
      }
      const cachedChats = await readCache<Chat[]>('chat_list');
      if (cachedChats?.length) {
        setChats(sortChatsByActivity(cachedChats));
        setLoadError('');
      } else if (msg.includes('abort') || msg.includes('timeout') || msg.includes('network')) {
        setLoadError('No se pudo conectar con el servidor. Desliza para recargar.');
      } else {
        setLoadError('No se pudieron cargar los chats. Desliza para reintentar.');
      }
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [readCache, saveCache, currentUserId]);

  useEffect(() => {
    const init = async () => {
      try {
        // Primero obtener el userId, luego cargar chats con él
        const me = await authAPI.me().catch(() => null);
        const uid = me?.id || '';
        if (uid) setCurrentUserId(uid);
        await loadChats(uid);
      } finally {
        // noop
      }
    };
    init();

    // Keep-alive: ping cada 14 min para que Render no duerma el servidor
    const keepAlive = setInterval(() => {
      fetch('https://egchat-api-xlxj.onrender.com/health', { method: 'GET' }).catch(() => {});
    }, 14 * 60 * 1000);

    loadArchivedChats().then(setArchivedChats);
    getArchivePassword().then(setArchivePasswordState);

    return () => clearInterval(keepAlive);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    let realtimeWorking = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const { subscribeToUserChats } = require('../../src/supabase');
    const unsub = subscribeToUserChats(currentUserId, () => {
      realtimeWorking = true;
      loadChats(currentUserId);
    });

    // Si Realtime no funciona en 5s, polling cada 30s (no 3s — evita bucle en web)
    const realtimeCheck = setTimeout(() => {
      if (!realtimeWorking) {
        pollInterval = setInterval(() => loadChats(currentUserId), 30000);
      }
    }, 5000);

    return () => {
      unsub();
      clearTimeout(realtimeCheck);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentUserId]);

  // Cuando el usuario actual cambia su avatar/nombre, actualizar su participante en todos los chats
  useEffect(() => {
    return onProfileUpdated(patch => {
      if (!patch.avatar_url && !patch.full_name) return;
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p =>
          String(p.user_id) === String(currentUserId)
            ? {
                ...p,
                ...(patch.avatar_url ? { avatar_url: patch.avatar_url } : {}),
                ...(patch.full_name ? { full_name: patch.full_name } : {}),
              }
            : p,
        ),
      })));
    });
  }, [currentUserId]);

  const onRefresh = () => { setRefreshing(true); loadChats(currentUserId); };

  const openChat = useCallback((chat: Chat | ArchivedChat) => {
    router.push(`/chat/${chat.id}` as any);
  }, []);

  const handleFilterPress = (id: FilterType) => {
    haptics.selection();
    if (id === 'archivar') {
      setFilter('archivar');
      if (!archivePassword) {
        setShowArchiveSetup(true);
      } else if (!archiveUnlocked) {
        setShowArchiveUnlock(true);
      }
      return;
    }
    setArchiveUnlocked(false);
    setFilter(id);
  };

  const archiveChat = useCallback(async (chat: Chat) => {
    const { name, avatar } = getChatMeta(chat);
    const entry: ArchivedChat = {
      id: chat.id,
      type: chat.type,
      name,
      avatar_url: avatar,
      isGroup: chat.type === 'group',
      participants: chat.participants,
      last_message: chat.last_message,
      unread_count: chat.unread_count,
      updated_at: chat.updated_at,
    };
    const nextArchived = [entry, ...archivedChats.filter(c => c.id !== chat.id)];
    await saveArchivedChats(nextArchived);
    setArchivedChats(nextArchived);
    setChats(prev => prev.filter(c => c.id !== chat.id));
    toast.info('Chat archivado');
  }, [archivedChats, getChatMeta]);

  const unarchiveChat = useCallback(async (chat: ArchivedChat) => {
    const nextArchived = archivedChats.filter(c => c.id !== chat.id);
    await saveArchivedChats(nextArchived);
    setArchivedChats(nextArchived);
    await loadChats(currentUserId);
    toast.info('Chat desarchivado');
  }, [archivedChats, loadChats]);

  const deleteChatLocal = useCallback((chatId: string) => {
    Alert.alert('Eliminar chat', '¿Eliminar este chat de la lista?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          setChats(prev => prev.filter(c => c.id !== chatId));
          toast.success('Chat eliminado');
        },
      },
    ]);
  }, []);

  const openFavoriteContact = useCallback(async (contact: any) => {
    try {
      const contactUserId = contact.contact_user_id || contact.user_id || contact.id;
      const existing = chats.find(c => {
        if (c.type === 'group') return false;
        return c.participants.some(p => p.user_id?.toString() === contactUserId?.toString());
      });
      if (existing) {
        openChat(existing);
        return;
      }
      const chat = await chatAPI.createPrivate(contactUserId);
      if (chat?.id) {
        await loadChats();
        openChat(chat);
      } else {
        toast.error('No se pudo abrir el chat');
      }
    } catch {
      toast.error('No se pudo abrir el chat');
    }
  }, [chats, loadChats, openChat]);

  const handleChatLongPress = useCallback(async (chat: Chat) => {
    const { name } = getChatMeta(chat);
    if (chat.type === 'group') {
      const isFav = favoriteGroupIds.includes(chat.id);
      Alert.alert(name, isFav ? 'Quitar de grupos favoritos' : 'Añadir a grupos favoritos', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isFav ? 'Quitar' : 'Favorito',
          onPress: async () => {
            const next = await toggleFavoriteGroup(chat.id);
            setFavoriteGroupIds(next);
          },
        },
      ]);
      return;
    }
    const other = chat.participants.find(p => String(p.user_id) !== String(currentUserId));
    const contact = favoriteContacts.find(
      (c: any) => c.contact_user_id === other?.user_id || c.user?.id === other?.user_id,
    );
    Alert.alert(name, 'Opciones', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: contact ? 'Quitar favorito' : 'Marcar favorito',
        onPress: async () => {
          try {
            let list = await contactsAPI.getAll();
            let row = list.find((c: any) => c.contact_user_id === other?.user_id);
            if (!row && other?.user_id) {
              await contactsAPI.add(other.user_id, undefined, name);
              list = await contactsAPI.getAll();
              row = list.find((c: any) => c.contact_user_id === other?.user_id);
            }
            if (row?.id) {
              if (row.is_favorite) await contactsAPI.unfavorite(row.id);
              else await contactsAPI.favorite(row.id);
            }
            setFavoriteContacts(await contactsAPI.getFavorites());
          } catch {}
        },
      },
    ]);
  }, [favoriteContacts, favoriteGroupIds, getChatMeta, currentUserId]);

  const favoriteGroupChats = chats.filter(c => c.type === 'group' && favoriteGroupIds.includes(c.id));
  const archivedIds = new Set(archivedChats.map(c => c.id));

  const matchesSearch = (name: string, last?: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || (last || '').toLowerCase().includes(q);
  };

  // ── Filtrado ────────────────────────────────────────────────────
  const isGenericName = (name: string) => {
    const n = name.trim();
    return !n || n === 'Usuario' || n.startsWith('Usuario ') || n === 'Usuario EGCHAT';
  };

  const filtered = useMemo(() => chats.filter(c => {
    if (archivedIds.has(c.id)) return false;
    const other = c.participants.find(p => String(p.user_id) !== String(currentUserId));
    const name = c.type === 'private' ? getParticipantName(other) : (c.name || 'Grupo');
    // Ocultar chats privados cuyo contacto tiene nombre genérico (datos incompletos)
    if (c.type === 'private' && isGenericName(name)) return false;
    const last = c.last_message?.text || '';
    if (!matchesSearch(name, last)) return false;
    if (filter === 'individual') return c.type === 'private';
    if (filter === 'grupos') return c.type === 'group';
    if (filter === 'dinero') {
      return last.includes('XAF') || last.includes('💸') || last.includes('Transferencia') || last.includes('📌');
    }
    if (filter === 'archivar') return false;
    return true;
  }), [chats, archivedIds, currentUserId, filter, searchQuery]);

  const filteredArchived = useMemo(() => archivedChats.filter(c => {
    const isGrp = c.isGroup || c.type === 'group';
    if (archiveSubFilter === 'group' ? !isGrp : isGrp) return false;
    const name = c.name || c.title || 'Chat';
    return matchesSearch(name, c.last_message?.text);
  }), [archivedChats, archiveSubFilter, searchQuery]);

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      <OfflineBanner />

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo + Temp + Bell + Menu (igual que Home)
      ══════════════════════════════════════════════════════════ */}
      <EGChatHeader
        notificationsOpen={showNotifications}
        menuOpen={showMenu}
        onWeatherPress={() => setShowWeather(true)}
        onNotificationsPress={() => {
          setShowNotifications(true);
          markAllRead();
        }}
        onMenuPress={() => setShowMenu(true)}
      />

      {/* ══════════════════════════════════════════════════════════
          BARRA BÚSQUEDA + BOTÓN +
      ══════════════════════════════════════════════════════════ */}
      <View style={[st.searchBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <View style={[st.searchInput, { backgroundColor: C.bgTertiary, borderColor: C.border }]}>
          <IconSearch color={C.textTertiary} />
          <TextInput
            style={[st.searchText, { color: C.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar chat o contacto..."
            placeholderTextColor={C.textTertiary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={st.searchClear}>
              <Text style={{ color: C.textTertiary, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* 4c — Búsqueda global */}
        <TouchableOpacity
          style={[st.globalSearchBtn, { backgroundColor: C.bgTertiary, borderColor: C.border }]}
          onPress={() => router.push('/global-search' as any)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth={2} strokeLinecap="round">
            <Circle cx="11" cy="11" r="8"/>
            <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </Svg>
          <Text style={{ fontSize: 10, color: C.textTertiary, marginTop: 1 }}>Global</Text>
        </TouchableOpacity>
        {/* Botón + nuevo chat */}
        <TouchableOpacity
          style={st.newChatBtn}
          onPress={() => {
            Alert.alert('Nueva conversación', '¿Qué quieres crear?', [
              { text: 'Chat privado', onPress: () => router.push('/new-chat' as any) },
              { text: 'Grupo', onPress: () => setShowCreateGroup(true) },
              { text: 'Cancelar', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.newChatBtnGrad}
          >
            <Text style={st.newChatBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

<View style={st.contentArea}>
        <View style={st.fixedContent}>


          {/* ══════════════════════════════════════════════════════
              CONTACTOS FAVORITOS
          ══════════════════════════════════════════════════════ */}
          <FavoriteSection title="Contactos Favoritos" empty="No tienes contactos favoritos aún" C={C}>
            {favoriteContacts.map((contact: any) => {
              const name = contact.name || contact.user?.full_name || contact.user?.name || 'Usuario';
              const avatar = contact.avatar_url || contact.user?.avatar_url;
              return (
                <FavoriteChip
                  key={contact.id || contact.contact_user_id}
                  name={name}
                  avatar={avatar}
                  onPress={() => openFavoriteContact(contact)}
                />
              );
            })}
          </FavoriteSection>

          <FavoriteSection title="Grupos Favoritos" empty="No tienes grupos favoritos aún" C={C}>
            {favoriteGroupChats.map(chat => {
              const { name, avatar } = getChatMeta(chat);
              return <FavoriteChip key={chat.id} name={name} avatar={avatar} onPress={() => openChat(chat)} />;
            })}
          </FavoriteSection>

          {/* ══════════════════════════════════════════════════════
              FILTROS — Individual | Grupos | Dinero
          ══════════════════════════════════════════════════════ */}
          <View style={[st.filtersWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtersRow}>
              {([
                { id: 'individual' as FilterType, label: 'Individual', Icon: IconUser },
                { id: 'grupos' as FilterType, label: 'Grupos', Icon: IconUsers },
                { id: 'dinero' as FilterType, label: 'Dinero', Icon: IconMoney },
                { id: 'archivar' as FilterType, label: 'Archivar', Icon: IconArchive },
              ]).map(f => {
                const active = filter === f.id;
                const iconColor = active ? '#fff' : '#374151';
                const isArchive = f.id === 'archivar';
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      st.filterChip,
                      active && (isArchive ? st.filterChipArchive : st.filterChipActive),
                    ]}
                    onPress={() => handleFilterPress(f.id)}
                    activeOpacity={0.75}
                  >
                    <f.Icon color={iconColor} />
                    <Text style={[st.filterText, active && st.filterTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>


        {/* ══════════════════════════════════════════════════════
            LISTA DE CHATS — FlashList para rendimiento óptimo
        ══════════════════════════════════════════════════════ */}
        {loading ? (
          <View style={st.listScroll}>
            <ChatListSkeleton count={8} />
          </View>
        ) : filter === 'archivar' && !archiveUnlocked ? (
          <View style={[st.listScroll, st.center]}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
              <Text style={[st.emptyTitle, { color: C.textPrimary }]}>Archivo protegido</Text>
              <Text style={[st.emptySub, { color: C.textSecondary, marginBottom: 20 }]}>{'Introduce tu contraseña para ver chats archivados'}</Text>
              <TouchableOpacity
                style={st.archiveUnlockBtn}
                onPress={() => (archivePassword ? setShowArchiveUnlock(true) : setShowArchiveSetup(true))}
              >
                <Text style={st.archiveUnlockBtnText}>
                  {archivePassword ? 'Desbloquear' : 'Crear contraseña'}
                </Text>
              </TouchableOpacity>
          </View>
        ) : filter === 'archivar' && archiveUnlocked ? (
          <ChatFlatList
            data={filteredArchived as any[]}
            keyExtractor={(item: any) => item.id}
            ListHeaderComponent={
              <View style={{ paddingHorizontal: 8 }}>
                <View style={st.archiveSubTabs}>
                  {(['individual', 'group'] as ArchiveSubFilter[]).map(sub => (
                    <TouchableOpacity
                      key={sub}
                      style={[st.archiveSubTab, archiveSubFilter === sub && st.archiveSubTabActive]}
                      onPress={() => setArchiveSubFilter(sub)}
                    >
                      <Text style={[st.archiveSubTabText, archiveSubFilter === sub && st.archiveSubTabTextActive]}>
                        {sub === 'individual' ? 'Individuales' : 'Grupos'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={st.center}>
                <Text style={{ fontSize: 32 }}>📦</Text>
                <Text style={[st.emptyTitle, { color: C.textPrimary }]}>{`Sin ${archiveSubFilter === 'group' ? 'grupos' : 'chats'} archivados`}</Text>
                <Text style={[st.emptySub, { color: C.textSecondary }]}>{'Desliza un chat a la izquierda para archivarlo'}</Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
            }
            renderItem={({ item: chat }) => {
              const name = (chat as any).name || (chat as any).title || 'Chat';
              return (
                <TouchableOpacity
                  style={st.archivedRow}
                  onPress={() => openChat(chat)}
                  activeOpacity={0.7}
                >
                  <EGAvatar src={(chat as any).avatar_url || (chat as any).avatarUrl} name={name} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.archivedName} numberOfLines={1}>{name}</Text>
                    <Text style={st.archivedSub}>Archivado</Text>
                  </View>
                  <TouchableOpacity style={st.restoreBtn} onPress={() => unarchiveChat(chat)}>
                    <Text style={st.restoreBtnText}>Restaurar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        ) : filtered.length === 0 ? (
          <ScrollView
            style={st.listScroll}
            contentContainerStyle={[st.listScrollContent, st.center]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
            }
          >
            <Text style={st.emptyIcon}>{filter === 'dinero' ? '💸' : '💬'}</Text>
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>
              {filter === 'dinero'
                ? 'Sin transferencias recientes'
                : searchQuery ? 'Sin resultados' : 'No tienes chats aún'}
            </Text>
            <Text style={[st.emptySub, { color: C.textSecondary }]}>
              {loadError && !searchQuery && filter !== 'dinero'
                ? loadError
                : filter === 'dinero'
                ? 'Los chats con movimientos XAF aparecerán aquí'
                : searchQuery ? 'Prueba con otro nombre' : 'Toca + para empezar una conversación'}
            </Text>
            {loadError && !searchQuery && filter !== 'dinero' && (
              <TouchableOpacity
                style={st.retryBtn}
                onPress={() => { setRefreshing(true); loadChats(currentUserId); }}
                activeOpacity={0.85}
              >
                <Text style={st.retryBtnText}>Recargar chats</Text>
              </TouchableOpacity>
            )}
            {filter === 'dinero' && (
              <TouchableOpacity
                style={st.dineroCta}
                onPress={() => router.push('/(tabs)/monedero' as any)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.dineroCtaGrad}>
                  <Text style={st.dineroCtaText}>Abrir Mi Cartera</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ChatFlatList
            data={filtered as any[]}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 100 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
            }
            ItemSeparatorComponent={() => (
              <View style={[st.separator, { backgroundColor: C.borderLight }]} />
            )}
            renderItem={({ item }) => (
              <SwipeChatItem
                onOpen={() => openChat(item)}
                onArchive={() => archiveChat(item)}
                onDelete={() => deleteChatLocal(item.id)}
                onMarkUnread={() => toast.info('Marcado como no leído')}
              >
                <ChatItem
                  chat={item}
                  currentUserId={currentUserId}
                  staticRow
                  onLongPress={() => handleChatLongPress(item)}
                />
              </SwipeChatItem>
            )}
          />
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════
          FAB REFRESH — botón circular verde abajo derecha
      ══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.fabRefresh}
        onPress={onRefresh}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.fabGradient}
        >
          <IconRefresh />
        </LinearGradient>
      </TouchableOpacity>

      {/* Botón HOME flotante arrastrable */}
      <DraggableHomeButton />

      {/* ══════════════════════════════════════════════════════════
          PANELES DEL HEADER
      ══════════════════════════════════════════════════════════ */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => markAllRead()}
        onClearAll={() => clearAllNotifications()}
        onNotifPress={(n) => {
          removeNotification(n.id);
          setShowNotifications(false);
          if (n.chatId) router.push(`/chat/${n.chatId}` as any);
        }}
      />
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
      />
      <WeatherModal
        visible={showWeather}
        onClose={() => setShowWeather(false)}
        temp={`${weather.temp}°`}
        city={weather.city}
        condition={weather.condition}
      />

      {/* Sprint 1.1 — Modal crear grupo */}
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(newChat) => {
          setShowCreateGroup(false);
          loadChats(currentUserId);
          router.push(`/chat/${newChat.id}` as any);
        }}
      />

      {/* Modal contraseña archivo */}
      <Modal
        visible={showArchiveSetup || showArchiveUnlock}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowArchiveSetup(false); setShowArchiveUnlock(false); setArchivePwdInput(''); setArchivePwdError(''); }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={st.modalOverlay} onPress={() => { setShowArchiveSetup(false); setShowArchiveUnlock(false); }}>
          <Pressable style={st.modalSheet} onPress={() => {}}>
            <Text style={st.modalTitle}>
              {showArchiveSetup ? (archivePassword ? 'Cambiar contraseña' : 'Crear contraseña') : 'Desbloquear archivo'}
            </Text>
            <TextInput
              secureTextEntry
              value={archivePwdInput}
              onChangeText={setArchivePwdInput}
              placeholder="Contraseña"
              placeholderTextColor="#9ca3af"
              style={st.modalInput}
            />
            {archivePwdError ? <Text style={st.modalError}>{archivePwdError}</Text> : null}
            <View style={st.modalActions}>
              <TouchableOpacity
                style={[st.modalBtn, { backgroundColor: '#f3f4f6' }]}
                onPress={() => { setShowArchiveSetup(false); setShowArchiveUnlock(false); setArchivePwdInput(''); }}
              >
                <Text style={{ fontWeight: '600', color: '#374151' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtn, { backgroundColor: '#6B5BD6' }]}
                onPress={async () => {
                  if (showArchiveSetup) {
                    if (archivePwdInput.length < 4) {
                      setArchivePwdError('Mínimo 4 caracteres');
                      return;
                    }
                    await setArchivePassword(archivePwdInput);
                    setArchivePasswordState(archivePwdInput);
                    setArchiveUnlocked(true);
                    setShowArchiveSetup(false);
                    setArchivePwdInput('');
                    toast.success('Contraseña guardada');
                  } else {
                    if (archivePwdInput !== archivePassword) {
                      setArchivePwdError('Contraseña incorrecta');
                      return;
                    }
                    setArchiveUnlocked(true);
                    setShowArchiveUnlock(false);
                    setArchivePwdInput('');
                  }
                }}
              >
                <Text style={{ fontWeight: '700', color: '#fff' }}>
                  {showArchiveSetup ? (archivePassword ? 'Cambiar' : 'Crear') : 'Desbloquear'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  contentArea: { flex: 1 },
  fixedContent: { flexShrink: 0 },
  listScroll: { flex: 1 },
  listScrollContent: { paddingBottom: 100 },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoWrap: {
    width: 34, height: 34, borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: 30, height: 30 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  headerPillText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1.5, borderColor: Colors.brand,
  },

  // ── Barra búsqueda ───────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchClear: { padding: 2 },
  globalSearchBtn: {
    width: 40, height: 44, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  newChatBtn: {
    width: 44, height: 44, borderRadius: 10,
    ...Shadow.sm,
  },
  newChatBtnGrad: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  newChatBtnIcon: {
    fontSize: 26, color: '#fff', fontWeight: '300', lineHeight: 30,
  },

  // ── Secciones favoritos ──────────────────────────────────────────
  favSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  favHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  favTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  favToggle: {
    fontSize: 18,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  favEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    paddingVertical: Spacing.sm,
  },
  favScroll: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  favChip: { alignItems: 'center', width: 72, gap: 6 },
  favChipName: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: 70, textAlign: 'center' },

  // ── Filtros ──────────────────────────────────────────────────────
  filtersWrap: {
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
  },
  filtersRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  filterChipActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
    shadowColor: '#00c8a0',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipArchive: {
    backgroundColor: '#6B5BD6',
    borderColor: '#6B5BD6',
    shadowColor: '#6B5BD6',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterTextActive: {
    color: '#fff',
  },

  // ── Chat item ────────────────────────────────────────────────────
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  chatInfo: { flex: 1, gap: 3 },
  chatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { ...Typography.chatName, flex: 1, marginRight: Spacing.sm },
  chatTime: { ...Typography.timestamp, color: Colors.textTertiary },
  chatTimeUnread: { color: Colors.accent, fontWeight: FontWeight.semibold },
  chatMsg: { ...Typography.subtitle, color: Colors.textSecondary, flex: 1 },
  chatMsgRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
  chatMsgIcon: { marginRight: 4, opacity: 0.7 },
  badge: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.badge,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { ...Typography.badge, color: Colors.white },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.listItemPaddingH + 50 + Spacing.listItemGap,
  },

  // ── Empty state ──────────────────────────────────────────────────
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding, paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },

  // ── Group badge ──────────────────────────────────────────────────
  groupBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  groupBadgeText: { fontSize: 10 },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  dineroCta: { marginTop: Spacing.lg, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  dineroCtaGrad: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  dineroCtaText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  archiveUnlockBtn: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#6B5BD6',
  },
  archiveUnlockBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  archiveSubTabs: {
    flexDirection: 'row', gap: 6, marginBottom: 10, marginHorizontal: 8,
    backgroundColor: 'rgba(107,91,214,0.06)', borderRadius: 10, padding: 4,
  },
  archiveSubTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  archiveSubTabActive: { backgroundColor: '#6B5BD6' },
  archiveSubTabText: { fontSize: 13, fontWeight: '500', color: '#9ca3af' },
  archiveSubTabTextActive: { color: '#fff', fontWeight: '700' },
  archivedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6,
    marginHorizontal: 4,
  },
  archivedName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  archivedSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  restoreBtn: { backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  restoreBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalInput: {
    borderWidth: 1.5, borderColor: '#6B5BD6', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 8,
  },
  modalError: { color: '#ef4444', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },

  // ── FAB Refresh ──────────────────────────────────────────────────
  fabRefresh: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    zIndex: 20,
    ...Shadow.lg,
  },
  fabGradient: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── LIA-25 flotante ──────────────────────────────────────────────
  liaBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 20,
    ...Shadow.lg,
  },
  liaBtnGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  liaLogo: { width: 36, height: 36, borderRadius: 18 },
});

export default function MensajeriaScreen() {
  return (
    <TabErrorBoundary tabName="Mensajería">
      <MensajeriaScreenInner />
    </TabErrorBoundary>
  );
}
