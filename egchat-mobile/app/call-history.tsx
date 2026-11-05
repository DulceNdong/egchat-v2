/**
 * EGChat — Historial de llamadas
 * Fuente de verdad: tabla call_sessions via RPC get_call_history
 * Filtros: Todas | Perdidas | Salientes | Entrantes
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';
import { EGAvatar } from '../src/components/ui';
import { chatAPI, userAPI } from '../src/api';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme';
import { DarkColors } from '../src/theme/darkMode';
import {
  getCallHistory,
  getCallDirection,
  formatCallDuration,
  type CallHistoryEntry,
  type CallDirection,
} from '../src/call/callHistory';

// ── Tipos ────────────────────────────────────────────────────────

type CallFilter = 'all' | 'missed' | 'outgoing' | 'incoming';

interface CallRecord {
  entry:         CallHistoryEntry;
  direction:     CallDirection;
  contactName:   string;
  contactAvatar: string | undefined;
  chatId:        string | null;
}

// ── Helpers de formato ────────────────────────────────────────────

function formatTime(ts: string): string {
  const d   = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function statusLabel(entry: CallHistoryEntry, dir: CallDirection): string {
  if (entry.status === 'missed')    return 'Perdida';
  if (entry.status === 'rejected')  return 'Rechazada';
  if (entry.status === 'failed')    return 'No conectó';
  if (entry.end_reason === 'cancelled_by_caller') return 'Cancelada';
  return dir === 'outgoing' ? 'Saliente' : 'Entrante';
}

function statusColor(entry: CallHistoryEntry): string {
  if (entry.status === 'missed' || entry.status === 'failed') return '#ef4444';
  if (entry.status === 'rejected') return '#f97316';
  if (entry.end_reason === 'cancelled_by_caller') return '#f97316';
  return '#22c55e';
}

// ── Iconos SVG ───────────────────────────────────────────────────

const PhoneIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l1.86-1.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </Svg>
);

const VideoIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="23 7 16 12 23 17 23 7"/>
    <Rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </Svg>
);

const ArrowUpRight = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 17L17 7M7 7h10v10"/>
  </Svg>
);

const ArrowDownLeft = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 7L7 17M17 17H7V7"/>
  </Svg>
);

const RefreshIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 4v6h-6"/><Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </Svg>
);

// ── Pantalla principal ────────────────────────────────────────────

export default function CallHistoryScreen() {
  const { isDark }    = useThemeContext();
  const C             = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets        = useSafeAreaInsets();

  const [records,   setRecords]   = useState<CallRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [filter,    setFilter]    = useState<CallFilter>('all');
  const [myUserId,  setMyUserId]  = useState('');

  // Mapa chatId → nombre/avatar del contacto (para enriquecer la lista)
  const [chatMap, setChatMap] = useState<Record<string, { name: string; avatar?: string }>>({});

  // ── Cargar chats (para nombres) ──────────────────────────────
  const loadChats = useCallback(async () => {
    try {
      const chats = await chatAPI.getChats();
      const map: Record<string, { name: string; avatar?: string }> = {};
      for (const c of (chats || [])) {
        if (c.id) map[c.id] = { name: c.name || c.title || 'Contacto', avatar: c.avatar_url };
      }
      setChatMap(map);
    } catch { /* ignorar */ }
  }, []);

  // ── Cargar historial desde call_sessions ─────────────────────
  const load = useCallback(async (uid: string) => {
    if (!uid) return;
    const entries = await getCallHistory(uid, 100);

    const recs: CallRecord[] = entries.map(entry => {
      const dir         = getCallDirection(entry, uid);
      const contactId   = entry.caller_id === uid ? entry.target_user_id : entry.caller_id;
      const chatInfo    = entry.chat_id ? chatMap[entry.chat_id] : undefined;
      return {
        entry,
        direction:     dir,
        contactName:   chatInfo?.name ?? contactId.slice(0, 8) + '…',
        contactAvatar: chatInfo?.avatar,
        chatId:        entry.chat_id,
      };
    });

    setRecords(recs);
  }, [chatMap]);

  // ── Inicialización ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadChats();
        const profile = await userAPI.getProfile().catch(() => null);
        const uid     = profile?.id || '';
        setMyUserId(uid);
        await load(uid);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-cargar si chatMap cambia (segunda pasada con nombres reales)
  useEffect(() => {
    if (myUserId) load(myUserId);
  }, [chatMap, myUserId, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    await load(myUserId);
    setRefreshing(false);
  }, [myUserId, load, loadChats]);

  // ── Filtrado ─────────────────────────────────────────────────
  const filtered: CallRecord[] = filter === 'all'
    ? records
    : records.filter(r => {
        if (filter === 'missed')   return r.entry.status === 'missed';
        if (filter === 'outgoing') return r.direction === 'outgoing';
        if (filter === 'incoming') return r.direction === 'incoming';
        return true;
      });

  // ── Acción: devolver llamada ─────────────────────────────────
  const callBack = useCallback((rec: CallRecord) => {
    const contactId = rec.entry.caller_id === myUserId
      ? rec.entry.target_user_id
      : rec.entry.caller_id;

    router.push({
      pathname: '/call/[callId]' as any,
      params: {
        callId:       `call_${Date.now()}`,
        targetName:   rec.contactName,
        callType:     rec.entry.call_type,
        role:         'caller',
        targetUserId: contactId,
      },
    });
  }, [myUserId]);

  // ── Labels de filtro ─────────────────────────────────────────
  const FILTER_LABELS: Record<CallFilter, string> = {
    all:      'Todas',
    missed:   'Perdidas',
    outgoing: 'Salientes',
    incoming: 'Entrantes',
  };

  // ── Item de lista ────────────────────────────────────────────
  const renderItem = ({ item }: { item: CallRecord }) => {
    const e        = item.entry;
    const isVideo  = e.call_type === 'video';
    const dir      = item.direction;
    const sc       = statusColor(e);
    const dur      = formatCallDuration(e.duration_seconds);
    const canCB    = e.status === 'missed' || e.status === 'rejected';

    return (
      <TouchableOpacity
        style={[s.item, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}
        onPress={canCB ? () => callBack(item) : undefined}
        activeOpacity={canCB ? 0.7 : 1}
      >
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <EGAvatar
            uri={item.contactAvatar}
            name={item.contactName}
            size={46}
          />
          {/* Badge audio/video */}
          <View style={[s.typeBadge, { backgroundColor: isVideo ? '#3b82f6' : '#22c55e' }]}>
            {isVideo
              ? <VideoIcon color="#fff" size={9} />
              : <PhoneIcon color="#fff" size={9} />}
          </View>
        </View>

        {/* Info central */}
        <View style={s.mid}>
          <Text style={[s.name, { color: C.textPrimary }]} numberOfLines={1}>
            {item.contactName}
          </Text>
          <View style={s.subRow}>
            {/* Flecha dirección */}
            {dir === 'outgoing'
              ? <ArrowUpRight   color={sc} size={12} />
              : dir === 'missed'
                ? <ArrowDownLeft color="#ef4444" size={12} />
                : <ArrowDownLeft color="#22c55e" size={12} />}
            <Text style={[s.sub, { color: sc }]}>
              {statusLabel(e, dir)}
            </Text>
            {dur !== '' && (
              <Text style={[s.sub, { color: C.textTertiary }]}>· {dur}</Text>
            )}
          </View>
        </View>

        {/* Derecha: hora + botón llamar */}
        <View style={s.right}>
          <Text style={[s.time, { color: C.textTertiary }]}>
            {formatTime(e.created_at)}
          </Text>
          <TouchableOpacity
            onPress={() => callBack(item)}
            style={[s.callBtn, { backgroundColor: isVideo ? 'rgba(59,130,246,0.12)' : 'rgba(0,200,160,0.10)' }]}
            hitSlop={8}
          >
            {isVideo
              ? <VideoIcon color="#3b82f6" size={18} />
              : <PhoneIcon color="#00c8a0" size={18} />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: C.bgPrimary }]}>
      {/* Header */}
      <LinearGradient
        colors={['#0d1b2a', '#1a2f4e']}
        style={[s.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.back} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.title}>Historial de llamadas</Text>
        <TouchableOpacity onPress={onRefresh} style={s.back} hitSlop={10}>
          <RefreshIcon color="#fff" size={20} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filtros */}
      <View style={[s.filters, { backgroundColor: C.bgPrimary, borderBottomColor: C.borderLight }]}>
        {(Object.keys(FILTER_LABELS) as CallFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[s.filterBtn, filter === f && s.filterActive]}
          >
            <Text style={[s.filterTxt, { color: filter === f ? '#00c8a0' : C.textSecondary }]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#00c8a0" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <PhoneIcon color={C.textTertiary} size={40} />
          <Text style={[s.empty, { color: C.textTertiary }]}>Sin llamadas</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.entry.call_id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00c8a0"
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  back:       { padding: 4 },
  title:      { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center' },
  filters:    { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
  filterBtn:  { flex: 1, alignItems: 'center', paddingVertical: 10 },
  filterActive: { borderBottomWidth: 2, borderBottomColor: '#00c8a0' },
  filterTxt:  { fontSize: 13, fontWeight: '600' },
  item:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarWrap: { position: 'relative' },
  typeBadge:  { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  mid:        { flex: 1, gap: 3 },
  name:       { fontSize: 15, fontWeight: '600' },
  subRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub:        { fontSize: 13, fontWeight: '500' },
  right:      { alignItems: 'flex-end', gap: 8 },
  time:       { fontSize: 11, fontWeight: '500' },
  callBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty:      { fontSize: 15, fontWeight: '500', marginTop: 8 },
});
