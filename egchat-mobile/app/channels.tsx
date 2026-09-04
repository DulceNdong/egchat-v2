// ══════════════════════════════════════════════════════════════════
// Channels — Canales oficiales / perfiles verificados
// Estilo WeChat/WhatsApp Business: feed de posts de canales
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { getToken, getApiBase } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { toast } from '../src/components/Toast';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Channel {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  verified: boolean;
  category: string;
  followers_count?: number;
  followers?: number; 
  followed: boolean;
  last_post?: {
    text: string;
    created_at: string;
  };
}

const CATEGORIES = ['Todos', 'Noticias', 'Tecnología', 'Negocios', 'Deportes', 'Salud', 'Entretenimiento'];

const FOLLOWED_KEY = 'egchat_followed_channels';

async function getFollowed(): Promise<string[]> {
  try { const r = await AsyncStorage.getItem(FOLLOWED_KEY); return r ? JSON.parse(r) : ['c1']; } catch { return ['c1']; }
}
async function toggleFollow(id: string): Promise<void> {
  const followed = await getFollowed();
  const next = followed.includes(id) ? followed.filter(x => x !== id) : [...followed, id];
  await AsyncStorage.setItem(FOLLOWED_KEY, JSON.stringify(next));
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ChannelsScreen() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [tab, setTab] = useState<'discover' | 'following'>('discover');
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/channels`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Channel[] = await res.json();
        setChannels(data);
      } else {
        // Error en API - mantener canales actuales
        toast.error('Error cargando canales');
      }
    } catch (error) {
      // Error de conexión - mantener canales actuales
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleFollow = useCallback(async (ch: Channel) => {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/channels/${ch.id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { followed } = await res.json();
        setChannels(prev => prev.map(c => c.id === ch.id ? { 
          ...c, 
          followed,
          followers_count: followed ? 
            (c.followers_count || c.followers || 0) + 1 : 
            Math.max((c.followers_count || c.followers || 0) - 1, 0),
          followers: followed ? 
            (c.followers_count || c.followers || 0) + 1 : 
            Math.max((c.followers_count || c.followers || 0) - 1, 0)
        } : c));
        toast.info(followed ? `Siguiendo a ${ch.name}` : `Dejaste de seguir a ${ch.name}`);
      } else {
        // Fallback a AsyncStorage si API falla
        await toggleFollow(ch.id);
        setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, followed: !c.followed } : c));
        toast.info(ch.followed ? `Dejaste de seguir a ${ch.name}` : `Siguiendo a ${ch.name}`);
      }
    } catch (error) {
      // Fallback a AsyncStorage si hay error
      await toggleFollow(ch.id);
      setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, followed: !c.followed } : c));
      toast.info(ch.followed ? `Dejaste de seguir a ${ch.name}` : `Siguiendo a ${ch.name}`);
    }
  }, []);

  const handleOpen = useCallback((ch: Channel) => {
    router.push({ pathname: '/channel-detail', params: { id: ch.id, name: ch.name } } as any);
  }, []);

  const filtered = channels.filter(ch => {
    if (tab === 'following' && !ch.followed) return false;
    if (category !== 'Todos' && ch.category !== category) return false;
    if (search && !ch.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.bgPrimary, borderBottomColor: C.borderLight }]}
      onPress={() => handleOpen(item)}
      activeOpacity={0.75}
    >
      <View style={s.cardLeft}>
        <View style={{ position: 'relative' }}>
          <EGAvatar src={item.avatar_url} name={item.name} size={52} />
          {item.verified && (
            <View style={s.verifiedBadge}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="#07a472">
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <Polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"/>
              </Svg>
            </View>
          )}
        </View>
        <View style={s.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[s.channelName, { color: C.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          </View>
          <Text style={[s.channelCat, { color: '#07a472' }]}>{item.category}</Text>
          {item.description && (
            <Text style={[s.channelDesc, { color: C.textTertiary }]} numberOfLines={1}>{item.description}</Text>
          )}
          <Text style={[s.followers, { color: C.textTertiary }]}>
            {formatCount(item.followers_count || item.followers || 0)} seguidores
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[s.followBtn, item.followed && s.followBtnActive]}
        onPress={() => handleFollow(item)}
        activeOpacity={0.8}
      >
        <Text style={[s.followBtnText, item.followed && s.followBtnTextActive]}>
          {item.followed ? 'Siguiendo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: '#07a472' }]} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Canales</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {(['discover', 'following'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, { color: tab === t ? '#07a472' : C.textTertiary }]}>
              {t === 'discover' ? 'Descubrir' : 'Siguiendo'}
            </Text>
            {tab === t && <View style={s.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Búsqueda */}
      <View style={[s.searchWrap, { backgroundColor: C.bgSecondary }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
          <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
        </Svg>
        <TextInput
          style={[s.searchInput, { color: C.textPrimary }]}
          placeholder="Buscar canales..."
          placeholderTextColor={C.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categorías */}
      {tab === 'discover' && (
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[s.catChip, category === cat && s.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[s.catChipText, category === cat && s.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Lista */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={Colors.accent} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={renderChannel}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#07a472']} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📡</Text>
              <Text style={[s.emptyText, { color: C.textTertiary }]}>
                {tab === 'following' ? 'No sigues ningún canal aún' : 'Sin canales disponibles'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 32, height: 2.5, borderRadius: 2, backgroundColor: '#07a472' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)' },
  catChipActive: { backgroundColor: '#07a472' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  catChipTextActive: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardInfo: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '700', flex: 1 },
  channelCat: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  channelDesc: { fontSize: 12, marginTop: 2 },
  followers: { fontSize: 11, marginTop: 3 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: '#07a472' },
  followBtnActive: { backgroundColor: '#07a47220', borderColor: '#07a472' },
  followBtnText: { fontSize: 13, fontWeight: '700', color: '#07a472' },
  followBtnTextActive: { color: '#07a472' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 30 },
});
