// ══════════════════════════════════════════════════════════════════
// EGCHAT — Mensajería (fiel a la versión web)
// Header: logo + temp + bell + menu
// Barra búsqueda + botón +
// Secciones: Contactos Favoritos, Grupos Favoritos
// Filtros: Individual | Grupos | Dinero
// Lista de chats con avatar, nombre, último msg, hora, badge
// FAB refresh + LIA-25 flotante
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
  ScrollView, Image, Platform, Alert, Modal, Pressable,
} from 'react-native';
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

const getLastMessageText = (msg?: Chat['last_message']) => {
  if (!msg) return 'Sin mensajes';
  const txt = msg.text || '';
  if (txt.includes('Llamada perdida')) return '📞 Llamada perdida';
  if (txt.includes('Transferencia') || txt.includes('💸')) return '💸 Transferencia';
  if (msg.type === 'image' || txt.startsWith('📷')) return '📷 Foto';
  if (msg.type === 'video' || txt.startsWith('🎥')) return '🎥 Video';
  if (msg.type === 'audio' || txt.startsWith('🎵')) return '🎵 Audio';
  if (msg.type === 'file' || txt.startsWith('📄') || txt.startsWith('📁')) return '📄 Archivo';
  // Ubicación — puede tener URL larga, mostrar solo el label
  if (msg.type === 'location' || txt.startsWith('📍')) return '📍 Ubicación';
  // Contacto compartido — mostrar solo nombre, no el teléfono
  if (msg.type === 'contact' || txt.startsWith('👤')) {
    const name = txt.replace(/^👤\s*/, '').split('\n')[0].trim();
    return `👤 ${name || 'Contacto'}`;
  }
  if (msg.type === 'text') return txt;
  return txt || 'Mensaje';
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
  !url.includes('egchat-api.onrender.com/static/avatars/');

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

// ── Iconos SVG ────────────────────────────────────────────────────
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
  const other = chat.participants.find(p => p.user_id !== currentUserId);
  const chatName = chat.type === 'private'
    ? (getParticipantName(other) || 'Usuario')
    : (chat.name || 'Grupo');
  const avatarSrc = chat.type === 'private' ? getParticipantAvatar(other) : chat.avatar_url;
  const lastMsg = getLastMessageText(chat.last_message);
  const time = formatTime(chat.updated_at);
  const hasUnread = chat.unread_count > 0;

  const body = (
    <>
      <EGAvatar src={avatarSrc} name={chatName} size={50} />
      <View style={st.chatInfo}>
        <View style={st.chatRow}>
          <Text style={st.chatName} numberOfLines={1}>{chatName}</Text>
          {time ? <Text style={[st.chatTime, hasUnread && st.chatTimeUnread]}>{time}</Text> : null}
        </View>
        <View style={st.chatRow}>
          <Text style={st.chatMsg} numberOfLines={1}>{lastMsg}</Text>
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
export default function MensajeriaScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<Array<{ chatId: string; chatName: string; messageText: string; messageTime: string }>>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('individual');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
  const [temp, setTemp] = useState(27);
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('cloudy');
  const { isDark } = useThemeContext();
  const { saveCache, readCache } = useOffline();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // ── SSE Stream — actualizar lista de chats al instante ────────────
  useChatStream(currentUserId || undefined, (event) => {
    if (event.type === 'new_message' || event.type === 'chat_updated') {
      loadChats();
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
          const other = chat.participants.find((p: any) => p.user_id !== currentUserId);
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
    const other = chat.participants.find(p => p.user_id !== currentUserId);
    const name = chat.type === 'private' ? (getParticipantName(other) || 'Usuario') : (chat.name || 'Grupo');
    const avatar = chat.type === 'private' ? getParticipantAvatar(other) : chat.avatar_url;
    return { name, avatar, other };
  }, [currentUserId]);

  // ── Carga ───────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    try {
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
          const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api.onrender.com').replace(/\/$/, '');
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
        const other = c.participants.find((p: any) => p.user_id !== currentUserId);
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
    } catch {
      const cachedChats = await readCache<Chat[]>('chat_list');
      if (cachedChats?.length) setChats(sortChatsByActivity(cachedChats));
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [readCache, saveCache]);

  useEffect(() => {
    loadChats();
    loadArchivedChats().then(setArchivedChats);
    getArchivePassword().then(setArchivePasswordState);
    authAPI.me().then(me => setCurrentUserId(me?.id || '')).catch(() => {});
    fetch('https://api.open-meteo.com/v1/forecast?latitude=3.75&longitude=8.78&current=temperature_2m,weather_code&timezone=auto')
      .then(r => r.json())
      .then(d => {
        const t = Math.round(d?.current?.temperature_2m ?? 27);
        setTemp(t);
        const code = d?.current?.weather_code ?? 0;
        if (code <= 1) setWeatherCondition('sunny');
        else if (code >= 51) setWeatherCondition('rain');
        else setWeatherCondition('cloudy');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    let realtimeWorking = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const { subscribeToUserChats } = require('../../src/supabase');
    const unsub = subscribeToUserChats(currentUserId, () => {
      realtimeWorking = true;
      loadChats();
    });

    // Si Realtime no funciona en 5s, polling cada 3s
    const realtimeCheck = setTimeout(() => {
      if (!realtimeWorking) {
        pollInterval = setInterval(loadChats, 3000);
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
          p.user_id === currentUserId
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

  const onRefresh = () => { setRefreshing(true); loadChats(); };

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
    await loadChats();
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
    const other = chat.participants.find(p => p.user_id !== currentUserId);
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
  const filtered = chats.filter(c => {
    if (archivedIds.has(c.id)) return false;
    const other = c.participants.find(p => p.user_id !== currentUserId);
    const name = c.type === 'private' ? getParticipantName(other) : (c.name || 'Grupo');
    const last = c.last_message?.text || '';
    if (!matchesSearch(name, last)) return false;
    if (filter === 'individual') return c.type === 'private';
    if (filter === 'grupos') return c.type === 'group';
    if (filter === 'dinero') {
      return last.includes('XAF') || last.includes('💸') || last.includes('Transferencia') || last.includes('📌');
    }
    if (filter === 'archivar') return false;
    return true;
  });

  const filteredArchived = archivedChats.filter(c => {
    const isGrp = c.isGroup || c.type === 'group';
    if (archiveSubFilter === 'group' ? !isGrp : isGrp) return false;
    const name = c.name || c.title || 'Chat';
    return matchesSearch(name, c.last_message?.text);
  });

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['bottom', 'left', 'right']}>
      <OfflineBanner />

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo + Temp + Bell + Menu (igual que Home)
      ══════════════════════════════════════════════════════════ */}
      <EGChatHeader
        temp={temp}
        city="Malabo"
        weatherCondition={weatherCondition}
        unreadCount={notifications.filter(n => !n.read).length}
        notificationsOpen={showNotifications}
        menuOpen={showMenu}
        onWeatherPress={() => setShowWeather(true)}
        onNotificationsPress={() => {
          setShowNotifications(true);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
        {/* Botón + nuevo chat */}
        <TouchableOpacity
          style={st.newChatBtn}
          onPress={() => router.push('/new-chat' as any)}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
        }
        stickyHeaderIndices={[2]} // los filtros se quedan fijos al hacer scroll
      >
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
            FILTROS — Individual | Grupos | Dinero (sticky)
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

        {/* ══════════════════════════════════════════════════════
            LISTA DE CHATS
        ══════════════════════════════════════════════════════ */}
        {loading ? (
          <View style={st.center}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : filter === 'archivar' && !archiveUnlocked ? (
          <View style={st.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>Archivo protegido</Text>
            <Text style={[st.emptySub, { color: C.textSecondary, marginBottom: 20 }]}>
              Introduce tu contraseña para ver chats archivados
            </Text>
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
            {filteredArchived.length === 0 ? (
              <View style={st.center}>
                <Text style={{ fontSize: 32 }}>📦</Text>
                <Text style={[st.emptyTitle, { color: C.textPrimary }]}>
                  Sin {archiveSubFilter === 'group' ? 'grupos' : 'chats'} archivados
                </Text>
                <Text style={[st.emptySub, { color: C.textSecondary }]}>
                  Desliza un chat a la izquierda para archivarlo
                </Text>
              </View>
            ) : filteredArchived.map(chat => {
              const name = chat.name || chat.title || 'Chat';
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={st.archivedRow}
                  onPress={() => openChat(chat)}
                  activeOpacity={0.7}
                >
                  <EGAvatar src={chat.avatar_url || chat.avatarUrl} name={name} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.archivedName} numberOfLines={1}>{name}</Text>
                    <Text style={st.archivedSub}>Archivado</Text>
                  </View>
                  <TouchableOpacity style={st.restoreBtn} onPress={() => unarchiveChat(chat)}>
                    <Text style={st.restoreBtnText}>Restaurar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 100 }} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={st.center}>
            <Text style={st.emptyIcon}>{filter === 'dinero' ? '💸' : '💬'}</Text>
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>
              {filter === 'dinero'
                ? 'Sin transferencias recientes'
                : searchQuery ? 'Sin resultados' : 'No tienes chats aún'}
            </Text>
            <Text style={[st.emptySub, { color: C.textSecondary }]}>
              {filter === 'dinero'
                ? 'Los chats con movimientos XAF aparecerán aquí'
                : searchQuery ? 'Prueba con otro nombre' : 'Toca + para empezar una conversación'}
            </Text>
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
          </View>
        ) : (
          <View>
            {filtered.map((item, i) => (
              <View key={item.id}>
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
                {i < filtered.length - 1 && (
                  <View style={[st.separator, { backgroundColor: C.borderLight }]} />
                )}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

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

      {/* ══════════════════════════════════════════════════════════
          LIA-25 — asistente flotante (igual que Home)
      ══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.liaBtn}
        onPress={() => router.push('/(tabs)/lia' as any)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.liaBtnGrad}
        >
          <SpinningLogo size={36} glow={false} />
        </LinearGradient>
      </TouchableOpacity>

      {/* ══════════════════════════════════════════════════════════
          PANELES DEL HEADER
      ══════════════════════════════════════════════════════════ */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onNotifPress={(n) => {
          setNotifications(prev => prev.filter(x => x.id !== n.id));
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
        temp={`${temp}°`}
        city="Malabo"
        condition={weatherCondition}
      />

      {/* Modal contraseña archivo */}
      <Modal
        visible={showArchiveSetup || showArchiveUnlock}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowArchiveSetup(false); setShowArchiveUnlock(false); setArchivePwdInput(''); setArchivePwdError(''); }}
      >
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
      </Modal>

    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

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
  chatMsg: { ...Typography.subtitle, color: Colors.textSecondary, flex: 1, marginRight: Spacing.sm },
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
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
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
