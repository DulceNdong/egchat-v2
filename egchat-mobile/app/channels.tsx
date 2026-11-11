// ══════════════════════════════════════════════════════════════════
// Channels — canales de Espacio Dulce
// Lee /api/spaces, que es la superficie real del servidor: la ruta
// /api/channels no existe, la peticion fallaba y la pantalla mostraba
// canales y seguidores inventados.
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polyline, Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { getToken, getApiBase } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { toast } from '../src/components/Toast';
import { useThemeContext } from '../src/theme/ThemeContext';
import { useTranslation } from '../src/context/LanguageContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';

interface Canal {
  id: string;
  name: string;
  description?: string;
  tipo: string;
  emoji: string;
  seguidores: number;
  siguiendo: boolean;
}

interface PostCanal {
  id: string;
  author: string;
  avatarUrl?: string;
  text: string;
  imageUrl?: string | null;
  time?: string;
  likes: number;
  comments: number;
  liked: boolean;
}

const mapearCanal = (s: any): Canal => ({
  id: s.id,
  name: s.name || 'Canal',
  description: s.description || undefined,
  tipo: s.type || 'publico',
  emoji: s.emoji || '📢',
  seguidores: Number(s.followers_count) || 0,
  siguiendo: !!s.following,
});

const obtenerCanales = async (): Promise<Canal[]> => {
  const res = await fetch(`${getApiBase()}/api/spaces`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('respuesta inesperada');
  return data.map(mapearCanal);
};

const obtenerPosts = async (spaceId: string): Promise<PostCanal[]> => {
  const res = await fetch(`${getApiBase()}/api/spaces/${spaceId}/posts`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ChannelsScreen() {
  const [channels, setChannels] = useState<Canal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cargaFallo, setCargaFallo] = useState(false);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [tab, setTab] = useState<'discover' | 'following'>('discover');
  const [detalle, setDetalle] = useState<Canal | null>(null);
  const [posts, setPosts] = useState<PostCanal[]>([]);
  const [postsCargando, setPostsCargando] = useState(false);
  const [postsFallo, setPostsFallo] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      setChannels(await obtenerCanales());
      setCargaFallo(false);
    } catch {
      setCargaFallo(true);
      toast.error(t('xtNoSePudoCargar'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { load(); }, []);

  const handleFollow = useCallback(async (ch: Canal) => {
    try {
      const res = await fetch(`${getApiBase()}/api/spaces/${ch.id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { following } = await res.json();
      const nuevo = !!following;
      setDetalle(prev => (prev && prev.id === ch.id ? { ...prev, siguiendo: nuevo } : prev));
      // El contador lo mueve la base con un delta: se vuelve a leer, no se suma
      // ni se resta aqui, que es como se inflaban los seguidores.
      try {
        setChannels(await obtenerCanales());
      } catch {
        setChannels(prev => prev.map(c => (c.id === ch.id ? { ...c, siguiendo: nuevo } : c)));
      }
      toast.info(nuevo ? `${t('chtChSiguiendo')} ${ch.name}` : `${t('chtChDejasteDeSeguir')} ${ch.name}`);
    } catch {
      toast.error(t('xtNoSePudoCargar'));
    }
  }, [t]);

  const abrir = useCallback(async (ch: Canal) => {
    setDetalle(ch);
    setPosts([]);
    setPostsFallo(false);
    setPostsCargando(true);
    try {
      setPosts(await obtenerPosts(ch.id));
    } catch {
      setPostsFallo(true);
    } finally {
      setPostsCargando(false);
    }
  }, []);

  // Las categorias son los tipos que hay en la tabla, no una lista inventada.
  const categorias = ['Todos', ...Array.from(new Set(channels.map(c => c.tipo)))];

  const filtered = channels.filter(ch => {
    if (tab === 'following' && !ch.siguiendo) return false;
    if (categoria !== 'Todos' && ch.tipo !== categoria) return false;
    if (search && !ch.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderChannel = ({ item }: { item: Canal }) => (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.bgPrimary, borderBottomColor: C.borderLight }]}
      onPress={() => abrir(item)}
      activeOpacity={0.75}
    >
      <View style={s.cardLeft}>
        <View style={[s.avatarWrap, { backgroundColor: C.bgTertiary }]}>
          <Text style={s.avatarEmoji}>{item.emoji}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.channelName, { color: C.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.channelCat, { color: C.brand }]}>{item.tipo}</Text>
          {!!item.description && (
            <Text style={[s.channelDesc, { color: C.textTertiary }]} numberOfLines={1}>{item.description}</Text>
          )}
          <Text style={[s.followers, { color: C.textTertiary }]}>
            {`${formatCount(item.seguidores)} ${t('chtChSeguidores')}`}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[s.followBtn, item.siguiendo && s.followBtnActive]}
        onPress={() => handleFollow(item)}
        activeOpacity={0.8}
      >
        <Text style={[s.followBtnText, item.siguiendo && s.followBtnTextActive]}>
          {item.siguiendo ? t('chtChSiguiendo') : t('chtChSeguir')}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bgPrimary }]} edges={['left','right']}>
      {/* Header */}
      <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('channels')}</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {(['discover', 'following'] as const).map(tabKey => (
          <TouchableOpacity key={tabKey} style={[s.tab, tab === tabKey && s.tabActive]} onPress={() => setTab(tabKey)}>
            <Text style={[s.tabText, { color: tab === tabKey ? C.brand : C.textTertiary }]}>
              {tabKey === 'discover' ? t('chtChDescubrir') : t('chtChSiguiendo')}
            </Text>
            {tab === tabKey && <View style={s.tabIndicator} />}
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
          placeholder={t('chtChBuscarCanales')}
          placeholderTextColor={C.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categorías reales */}
      {tab === 'discover' && categorias.length > 1 && (
        <FlatList
          horizontal
          data={categorias}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[s.catChip, categoria === cat && s.catChipActive]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[s.catChipText, categoria === cat && s.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Lista */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={C.brand} size="large" />
      ) : cargaFallo && channels.length === 0 ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: C.textTertiary }]}>{t('xtNoSePudoCargar')}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load(true)}>
            <Text style={s.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={renderChannel}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#00C8A0']} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, flexGrow: 1, backgroundColor: C.bgPrimary }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📡</Text>
              <Text style={[s.emptyText, { color: C.textTertiary }]}>
                {tab === 'following' ? t('chtChNoSiguesNinguno') : t('chtChSinCanalesDisponibles')}
              </Text>
            </View>
          }
        />
      )}

      {/* Detalle: los posts del canal, leidos del servidor al abrir */}
      <Modal visible={!!detalle} animationType="slide" onRequestClose={() => setDetalle(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPrimary }} edges={['top']}>
          {detalle && (
            <>
              <LinearGradient colors={['#00C8A0', '#00B4E6']} style={s.detailHeader}>
                <TouchableOpacity onPress={() => setDetalle(null)} style={s.headerBtn}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                    <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={s.detailEmoji}>{detalle.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.headerTitle}>{detalle.name}</Text>
                  <Text style={s.detailTipo}>{detalle.tipo}</Text>
                </View>
                <TouchableOpacity
                  style={[s.followBtn, detalle.siguiendo && s.followBtnActive]}
                  onPress={() => handleFollow(detalle)}
                >
                  <Text style={[s.followBtnText, detalle.siguiendo && s.followBtnTextActive]}>
                    {detalle.siguiendo ? t('chtChSiguiendo') : t('chtChSeguir')}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={s.detailInfo}>
                {!!detalle.description && (
                  <Text style={{ fontSize: 13, color: C.textTertiary, lineHeight: 20 }}>{detalle.description}</Text>
                )}
                <Text style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>
                  {`${formatCount(detalle.seguidores)} ${t('chtChSeguidores')}`}
                </Text>
              </View>

              <FlatList
                data={posts}
                keyExtractor={p => p.id}
                contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30 }}
                ListHeaderComponent={
                  postsCargando
                    ? <ActivityIndicator color={C.brand} size="large" style={{ marginVertical: 30 }} />
                    : postsFallo
                      ? (
                        <View style={s.empty}>
                          <Text style={[s.emptyText, { color: C.textTertiary }]}>{t('xtNoSePudoCargar')}</Text>
                          <TouchableOpacity style={s.retryBtn} onPress={() => abrir(detalle)}>
                            <Text style={s.retryText}>{t('retry')}</Text>
                          </TouchableOpacity>
                        </View>
                      )
                      : null
                }
                renderItem={({ item: p }) => (
                  <View style={[s.postCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <EGAvatar src={p.avatarUrl} name={p.author || detalle.name} size={30} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '700' }}>{p.author || detalle.name}</Text>
                        {!!p.time && <Text style={{ color: C.textTertiary, fontSize: 11 }}>{p.time}</Text>}
                      </View>
                    </View>
                    <Text style={{ color: C.textPrimary, fontSize: 14, lineHeight: 21 }}>{p.text}</Text>
                    {!!p.imageUrl && (
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={{ width: '100%', height: 180, borderRadius: 10, marginTop: 10 }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                      <Text style={{ fontSize: 12, color: C.textTertiary }}>{`♥ ${p.likes || 0}`}</Text>
                      <Text style={{ fontSize: 12, color: C.textTertiary }}>{`💬 ${p.comments || 0}`}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  !postsCargando && !postsFallo ? (
                    <View style={s.empty}>
                      <Text style={[s.emptyText, { color: C.textTertiary }]}>{t('xtSinPublicacionesAun')}</Text>
                      <Text style={[s.emptySub, { color: C.textTertiary }]}>{t('xtLasPublicacionesDelCanalApareceranAqui')}</Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 32, height: 2.5, borderRadius: 2, backgroundColor: '#00C8A0' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)' },
  catChipActive: { backgroundColor: '#00C8A0' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  catChipTextActive: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '700', flex: 1 },
  channelCat: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  channelDesc: { fontSize: 12, marginTop: 2 },
  followers: { fontSize: 11, marginTop: 3 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: '#00C8A0' },
  followBtnActive: { backgroundColor: '#00C8A020', borderColor: '#00C8A0' },
  followBtnText: { fontSize: 13, fontWeight: '700', color: '#00C8A0' },
  followBtnTextActive: { color: '#00C8A0' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryBtn: { marginTop: 14, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20, backgroundColor: '#00C8A0' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 14, paddingTop: 10 },
  detailEmoji: { fontSize: 30 },
  detailTipo: { fontSize: 12, fontWeight: '700', color: '#e6fff9', marginTop: 2 },
  detailInfo: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  postCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10 },
});
