/**
 * EGChat — Historial de llamadas
 * Lista todas las llamadas con filtros: Todas, Perdidas, Salientes, Entrantes
 * Botón para devolver la llamada directamente
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Polygon, Rect, Line } from 'react-native-svg';
import { EGAvatar } from '../src/components/ui';
import { chatAPI, getToken, getApiBase, authAPI } from '../src/api';

type CallFilter = 'all' | 'missed' | 'outgoing' | 'incoming';

interface CallRecord {
  id: string;
  callId: string;
  contactName: string;
  contactAvatar?: string;
  contactUserId: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration?: number;   // segundos
  timestamp: string;
}

function formatDuration(s?: number): string {
  if (!s) return '';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

const PhoneIcon = ({ color, size = 16 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l1.86-1.86a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </Svg>
);

const VideoIcon = ({ color, size = 16 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/>
  </Svg>
);

export default function CallHistoryScreen() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CallFilter>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    authAPI.getProfile()
      .then((p: any) => {
        const uid = p?.id || '';
        setCurrentUserId(uid);
        loadCallHistory();
      })
      .catch(() => loadCallHistory());
  }, []);

  // Extrae el nombre real del otro participante en un chat privado
  const getContactName = (chat: any, userId: string): string => {
    if (chat.type === 'group') return chat.name || 'Grupo';
    const other = (chat.participants || []).find((p: any) => p.user_id !== userId);
    return (
      other?.full_name ||
      other?.users?.full_name ||
      other?.user?.full_name ||
      chat.name ||
      'Sin nombre'
    );
  };

  const getContactAvatar = (chat: any, userId: string): string | undefined => {
    if (chat.type === 'group') return chat.avatar_url;
    const other = (chat.participants || []).find((p: any) => p.user_id !== userId);
    const raw = other?.avatar_url || other?.users?.avatar_url || other?.user?.avatar_url;
    if (!raw || !raw.startsWith('http')) return undefined;
    return raw;
  };

  const getContactUserId = (chat: any, userId: string, senderId: string): string => {
    // Si el mensaje lo envió el usuario actual, el contacto es el otro participante
    if (senderId === userId) {
      const other = (chat.participants || []).find((p: any) => p.user_id !== userId);
      return other?.user_id || senderId;
    }
    return senderId;
  };

  useEffect(() => { loadCallHistory(); }, []);

  const loadCallHistory = async () => {
    setLoading(true);
    try {
      // Obtener userId actual si aún no está cargado
      let userId = currentUserId;
      if (!userId) {
        const profile = await authAPI.getProfile().catch(() => null);
        userId = profile?.id || '';
        if (userId) setCurrentUserId(userId);
      }

      const chats = await chatAPI.getChats();
      const records: CallRecord[] = [];

      for (const chat of chats.slice(0, 20)) {
        const msgs = await chatAPI.getMessages(chat.id, 1, 50).catch(() => []);
        const callMsgs = (msgs || []).filter((m: any) =>
          m.text?.includes('Llamada') || m.text?.includes('llamada') || m.type === 'call'
        );
        for (const msg of callMsgs) {
          const txt = msg.text || '';
          records.push({
            id: msg.id,
            callId: msg.id,
            contactName: getContactName(chat, userId),
            contactAvatar: getContactAvatar(chat, userId),
            contactUserId: getContactUserId(chat, userId, msg.sender_id || ''),
            type: txt.includes('📹') || txt.toLowerCase().includes('video') ? 'video' : 'audio',
            direction: txt.includes('saliente') ? 'outgoing'
              : txt.includes('perdida') ? 'missed' : 'incoming',
            duration: undefined,
            timestamp: msg.created_at,
          });
        }
      }

      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setCalls(records);
    } catch {}
    setLoading(false);
  };

  const filtered = filter === 'all' ? calls : calls.filter(c => c.direction === filter);

  const callBack = (record: CallRecord) => {
    router.push({
      pathname: '/call/[callId]',
      params: {
        callId: `call_${Date.now()}`,
        targetName: record.contactName,
        callType: record.type,
        role: 'caller',
        targetUserId: record.contactUserId,
      },
    } as any);
  };

  const dirColor = (d: string) =>
    d === 'missed' ? '#ef4444' : d === 'outgoing' ? '#00c8a0' : '#6b7280';

  const dirLabel = (d: string) =>
    d === 'missed' ? 'Perdida' : d === 'outgoing' ? 'Saliente' : 'Entrante';

  const dirArrow = (d: string, color: string) => d === 'outgoing'
    ? <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"><Path d="M7 17L17 7M7 7h10v10"/></Svg>
    : <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"><Path d="M17 7L7 17M17 17H7V7"/></Svg>;

  return (
    <View style={s.root}>
      <LinearGradient colors={['#00b4e6', '#0088cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.back} hitSlop={10}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 19l-7-7 7-7"/>
              </Svg>
            </TouchableOpacity>
            <Text style={s.title}>Historial de llamadas</Text>
            <TouchableOpacity onPress={loadCallHistory} style={s.back} hitSlop={10}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 4v6h-6"/>
                <Path d="M1 20v-6h6"/>
                <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtros */}
      <View style={s.filters}>
        {(['all','missed','outgoing','incoming'] as CallFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>
              {f === 'all' ? 'Todas' : f === 'missed' ? 'Perdidas' : f === 'outgoing' ? 'Salientes' : 'Entrantes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#00c8a0" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📞</Text>
              <Text style={s.emptyText}>Sin llamadas recientes</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = dirColor(item.direction);
            return (
              <View style={s.row}>
                <EGAvatar name={item.contactName} src={item.contactAvatar} size={48} />
                <View style={s.info}>
                  <Text style={s.name}>{item.contactName}</Text>
                  <View style={s.meta}>
                    {dirArrow(item.direction, color)}
                    {item.type === 'video'
                      ? <VideoIcon color={color} size={12}/>
                      : <PhoneIcon color={color} size={12}/>}
                    <Text style={[s.dir, { color }]}>{dirLabel(item.direction)}</Text>
                    {item.duration ? <Text style={s.dur}> · {formatDuration(item.duration)}</Text> : null}
                  </View>
                </View>
                <View style={s.right}>
                  <Text style={s.time}>{formatTime(item.timestamp)}</Text>
                  <TouchableOpacity onPress={() => callBack(item)} style={s.callBtn}>
                    {item.type === 'video'
                      ? <VideoIcon color="#00c8a0" size={20}/>
                      : <PhoneIcon color="#00c8a0" size={20}/>}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6 },
  back: { padding: 6, borderRadius: 20 },
  title: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  filters: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f2f5',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#00c8a0', borderColor: '#00c8a0' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', marginBottom: 1,
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dir: { fontSize: 12, fontWeight: '600' },
  dur: { fontSize: 12, color: '#9ca3af' },
  right: { alignItems: 'flex-end', gap: 8 },
  time: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  callBtn: {
    padding: 8, borderRadius: 20,
    backgroundColor: 'rgba(0,200,160,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,200,160,0.25)',
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
});
