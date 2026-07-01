// ══════════════════════════════════════════════════════════════════
// EGCHAT — Estados / Stories
// Visor tipo Instagram: barra de progreso, swipe, auto-avance
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, ActivityIndicator, Image, Dimensions,
  Animated, PanResponder, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { storiesAPI, authAPI } from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import { parseStoriesResponse, initialsFor, type StoryGroup } from '../src/utils/storyParser';
import { ESPACIOS, formatFollowers, type Espacio } from '../src/data/espacioDulce';
import { EGAvatar } from '../src/components/ui';
import {
  Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow,
} from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000; // ms por historia

type StoryTab = 'recientes' | 'vistos' | 'dulce';

// ── Helpers ───────────────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h >= 1) return `hace ${h}h`;
  if (m >= 1) return `hace ${m}m`;
  return 'ahora';
};

// ── Barra de progreso de una historia ────────────────────────────
const ProgressBar = ({
  total, current, progress,
}: { total: number; current: number; progress: Animated.Value }) => (
  <View style={pv.container}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={pv.track}>
        {i < current ? (
          <View style={[pv.fill, { width: '100%' }]} />
        ) : i === current ? (
          <Animated.View
            style={[pv.fill, {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]}
          />
        ) : null}
      </View>
    ))}
  </View>
);

const pv = StyleSheet.create({
  container: { flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingTop: 8 },
  track: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2, overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
});

// ══════════════════════════════════════════════════════════════════
// VISOR DE HISTORIA — pantalla completa
// ══════════════════════════════════════════════════════════════════
const StoryViewer = ({
  groups, startGroupIndex, onClose, onStoryView,
}: {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
  onStoryView?: (group: StoryGroup) => void;
}) => {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const paused = useRef(false);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const startProgress = useCallback(() => {
    progress.setValue(0);
    timerRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    timerRef.current.start(({ finished }) => {
      if (finished && !paused.current) goNext();
    });
  }, [groupIdx, storyIdx]);

  useEffect(() => {
    startProgress();
    if (group && onStoryView) onStoryView(group);
    return () => { timerRef.current?.stop(); };
  }, [groupIdx, storyIdx]);

  const goNext = useCallback(() => {
    timerRef.current?.stop();
    const group = groups[groupIdx];
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, groups]);

  const goPrev = useCallback(() => {
    timerRef.current?.stop();
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(0);
    }
  }, [groupIdx, storyIdx]);

  if (!group || !story) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={sv.container}>
        {/* Imagen / video */}
        <Image
          source={{ uri: story.media_url }}
          style={sv.media}
          resizeMode="cover"
        />

        {/* Gradiente superior */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={sv.topGradient}
        />

        {/* Gradiente inferior */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={sv.bottomGradient}
        />

        {/* Barras de progreso */}
        <View style={sv.progressWrap}>
          <ProgressBar
            total={group.stories.length}
            current={storyIdx}
            progress={progress}
          />
        </View>

        {/* Header — avatar + nombre + tiempo + cerrar */}
        <View style={sv.header}>
          <EGAvatar src={group.userAvatar} name={group.userName} size={38} />
          <View style={sv.headerInfo}>
            <Text style={sv.headerName}>{group.userName}</Text>
            <Text style={sv.headerTime}>{timeAgo(story.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.7}>
            <Text style={sv.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {story.caption ? (
          <View style={sv.captionWrap}>
            <Text style={sv.caption}>{story.caption}</Text>
          </View>
        ) : null}

        {/* Zonas táctiles: izquierda = anterior, derecha = siguiente */}
        <View style={sv.touchZones}>
          <TouchableOpacity style={sv.touchLeft} onPress={goPrev} activeOpacity={1} />
          <TouchableOpacity style={sv.touchRight} onPress={goNext} activeOpacity={1} />
        </View>
      </View>
    </Modal>
  );
};

const sv = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  media: { ...StyleSheet.absoluteFillObject },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, zIndex: 1 },
  progressWrap: { position: 'absolute', top: 48, left: 0, right: 0, zIndex: 2 },
  header: {
    position: 'absolute', top: 64, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 2,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerTime: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
  captionWrap: {
    position: 'absolute', bottom: 60, left: 16, right: 16, zIndex: 2,
  },
  caption: {
    fontSize: 15, color: '#fff', fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 3 },
  touchLeft: { flex: 1 },
  touchRight: { flex: 2 },
});

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — Lista de estados
// ══════════════════════════════════════════════════════════════════
export default function StoriesScreen() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [myGroup, setMyGroup] = useState<StoryGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [activeTab, setActiveTab] = useState<StoryTab>('recientes');
  const [espacios, setEspacios] = useState(ESPACIOS);
  const [activeEspacio, setActiveEspacio] = useState<Espacio | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | undefined>();
  const [myStoryMenu, setMyStoryMenu] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const UI = { bg: '#fff', text: '#111', sub: '#888', border: '#f0f0f0', rowBorder: '#f9f9f9', brand: '#00c8a0' };

  const myStories = myGroup?.stories || [];
  const recentGroups = groups.filter(g => !g.seen);
  const seenGroups = groups.filter(g => g.seen);
  const displayedGroups = activeTab === 'recientes' ? recentGroups : seenGroups;

  const loadStories = useCallback(async () => {
    try {
      const [data, me] = await Promise.allSettled([
        storiesAPI.getAll(),
        authAPI.me(),
      ]);

      const meId = me.status === 'fulfilled' ? me.value?.id || '' : '';
      setCurrentUserId(meId);
      if (me.status === 'fulfilled') setMyAvatarUrl(me.value?.avatar_url || me.value?.avatarUrl);

      if (data.status === 'fulfilled' && Array.isArray(data.value)) {
        const parsed = parseStoriesResponse(data.value, meId);
        setMyGroup(parsed.myGroup);
        setGroups(parsed.groups);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  const markViewed = useCallback((group: StoryGroup) => {
    if (group.storyId) storiesAPI.registerView(group.storyId).catch(() => {});
    setGroups(prev => prev.map(g => g.userId === group.userId ? { ...g, seen: true } : g));
  }, []);

  const toggleFollow = (id: string) => {
    setEspacios(prev => prev.map(e => e.id === id ? { ...e, following: !e.following } : e));
  };

  useEffect(() => { loadStories(); }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) uploadStory(result.assets[0].uri);
  };

  const addStory = async () => {
    Alert.alert('Añadir estado', '¿Cómo quieres añadir tu estado?', [
      {
        text: '📷 Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
          if (!result.canceled && result.assets[0]) uploadStory(result.assets[0].uri);
        },
      },
      {
        text: '🖼️ Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) uploadStory(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const uploadStory = async (uri: string) => {
    setUploading(true);
    try {
      await storiesAPI.create({ media: [{ url: uri, type: 'image' }] });
      await loadStories();
    } catch { Alert.alert('Error', 'No se pudo publicar el estado'); }
    finally { setUploading(false); }
  };

  const deleteStory = (storyId: string) => {
    Alert.alert('Eliminar estado', '¿Eliminar este estado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await storiesAPI.delete(storyId); await loadStories(); } catch {}
        },
      },
    ]);
  };

  const allGroupsForViewer: StoryGroup[] = [
    ...(myGroup ? [{ ...myGroup, userName: 'Mi estado' }] : []),
    ...groups,
  ];

  const StoryAvatar = ({ group, size = 46 }: { group: StoryGroup; size?: number }) => {
    const inner = size - 4;
    const ring = group.seen ? (
      <View style={[st.ringGray, { padding: 2.5, borderRadius: size / 2 }]}>
        <View style={[st.avatarInner, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: group.avatarColor }]}>
          {group.userAvatar
            ? <Image source={{ uri: group.userAvatar }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
            : <Text style={st.avatarInitials}>{initialsFor(group.userName)}</Text>}
        </View>
      </View>
    ) : (
      <LinearGradient colors={['#00c8a0', '#00b4e6']} style={{ padding: 2.5, borderRadius: size / 2 }}>
        <View style={[st.avatarInner, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: group.avatarColor }]}>
          {group.userAvatar
            ? <Image source={{ uri: group.userAvatar }} style={{ width: inner - 4, height: inner - 4, borderRadius: (inner - 4) / 2 }} />
            : <Text style={st.avatarInitials}>{initialsFor(group.userName)}</Text>}
        </View>
      </LinearGradient>
    );
    return ring;
  };

  return (
    <SafeAreaView style={[st.container, { backgroundColor: UI.bg }]} edges={['top']}>
      <View style={[st.headerWhite, { borderBottomColor: UI.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7}>
          <Text style={[st.backIcon, { color: UI.brand }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[st.headerTitleDark, { color: UI.text }]}>Estados</Text>
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={[st.tabsRow, { backgroundColor: UI.bg, borderBottomColor: UI.border }]}>
                {([
                  { id: 'recientes' as StoryTab, label: `Recientes (${recentGroups.length})` },
                  { id: 'vistos' as StoryTab, label: `Vistos (${seenGroups.length})` },
                  { id: 'dulce' as StoryTab, label: '✦ Espacio Dulce' },
                ]).map(t => (
                  <TouchableOpacity key={t.id} style={[st.tab, activeTab === t.id && st.tabActive]} onPress={() => setActiveTab(t.id)}>
                    <Text style={[st.tabText, { color: activeTab === t.id ? UI.brand : '#888' }, activeTab === t.id && st.tabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeTab === 'dulce' ? (
                <View style={{ padding: 16 }}>
                  <Text style={[st.dulceLive, { color: Colors.brand }]}>● En vivo — Espacio Dulce</Text>
                  <Text style={[st.sectionLabel, { color: C.textTertiary, paddingHorizontal: 0 }]}>CANALES</Text>
                  <View style={st.espGrid}>
                    {espacios.filter(e => e.type === 'publico').map(esp => (
                      <TouchableOpacity key={esp.id} style={[st.espCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => setActiveEspacio(esp)}>
                        <View style={[st.espBanner, { backgroundColor: esp.coverColor }]}>
                          <Text style={{ fontSize: 28 }}>{esp.emoji}</Text>
                        </View>
                        <Text style={[st.espName, { color: C.textPrimary }]} numberOfLines={1}>{esp.name}</Text>
                        <Text style={[st.espFollowers, { color: C.textTertiary }]}>{formatFollowers(esp.followers)} seguidores</Text>
                        <TouchableOpacity style={[st.espFollowBtn, esp.following && st.espFollowing]} onPress={() => toggleFollow(esp.id)}>
                          <Text style={[st.espFollowText, esp.following && { color: C.textSecondary }]}>{esp.following ? 'Siguiendo' : 'Seguir'}</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[st.sectionLabel, { color: C.textTertiary, paddingHorizontal: 0, marginTop: 12 }]}>COMUNIDADES</Text>
                  <View style={st.espGrid}>
                    {espacios.filter(e => e.type === 'comunidad').map(esp => (
                      <TouchableOpacity key={esp.id} style={[st.espCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => setActiveEspacio(esp)}>
                        <View style={[st.espBanner, { backgroundColor: esp.coverColor }]}>
                          <Text style={{ fontSize: 28 }}>{esp.emoji}</Text>
                        </View>
                        <Text style={[st.espName, { color: C.textPrimary }]} numberOfLines={1}>{esp.name}</Text>
                        <Text style={[st.espFollowers, { color: C.textTertiary }]}>{formatFollowers(esp.followers)} miembros</Text>
                        <TouchableOpacity style={[st.espFollowBtn, esp.following && st.espFollowing]} onPress={() => toggleFollow(esp.id)}>
                          <Text style={[st.espFollowText, esp.following && { color: C.textSecondary }]}>{esp.following ? 'Unido' : 'Unirse'}</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
              <>
              {activeTab === 'recientes' && (
              <View style={[st.myStatusWrap, { borderBottomColor: '#f5f5f5' }]}>
                <View style={st.myStatusRow}>
                  <TouchableOpacity onPress={() => myStories.length > 0 ? setViewingGroup(0) : addStory()} activeOpacity={0.75}>
                    <View style={st.myAvatarWrap}>
                      <View style={[st.myAvatarCircle, myStories.length > 0 && { backgroundColor: UI.brand }]}>
                        {myAvatarUrl
                          ? <Image source={{ uri: myAvatarUrl }} style={st.myAvatarImg} />
                          : <Text style={{ fontSize: 17, fontWeight: '700', color: myStories.length ? '#fff' : '#9ca3af' }}>👤</Text>}
                      </View>
                      <View style={st.myStoryAddBadge}>
                        {uploading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name="add" size={10} color="#fff" />}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => myStories.length > 0 ? setViewingGroup(0) : addStory()} activeOpacity={0.75}>
                    <Text style={[st.myStoryName, { color: UI.text }]}>Mi estado</Text>
                    <Text style={[st.myStorySub, { color: UI.sub }]}>
                      {myStories.length > 0
                        ? `${myStories.length} publicación${myStories.length > 1 ? 'es' : ''} · ${timeAgo(myStories[0].created_at)}`
                        : 'Toca para añadir estado'}
                    </Text>
                  </TouchableOpacity>
                  <View style={st.actionIcons}>
                    {([
                      { icon: 'image-outline' as const, color: '#a855f7', onPress: pickFromGallery },
                      { icon: 'film-outline' as const, color: '#f59e0b', onPress: addStory },
                      { icon: 'videocam-outline' as const, color: '#06b6d4', onPress: addStory },
                      { icon: 'radio-outline' as const, color: '#ef4444', onPress: () => Alert.alert('En vivo', 'Próximamente') },
                    ]).map((b, i) => (
                      <TouchableOpacity key={i} onPress={b.onPress} style={st.actionIconBtn}>
                        <Ionicons name={b.icon} size={20} color={b.color} />
                      </TouchableOpacity>
                    ))}
                    <View>
                      <TouchableOpacity onPress={() => setMyStoryMenu(v => !v)} style={st.actionIconBtn}>
                        <Ionicons name="ellipsis-vertical" size={18} color="#aaa" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              )}

              {displayedGroups.length > 0 ? (
                <View style={{ backgroundColor: UI.bg }}>
                  {displayedGroups.map((group, i) => {
                    const globalIdx = groups.findIndex(g => g.userId === group.userId);
                    return (
                    <TouchableOpacity
                      key={group.userId}
                      style={[st.storyRowFlat, i < displayedGroups.length - 1 && { borderBottomColor: UI.rowBorder }]}
                      onPress={() => setViewingGroup(myGroup ? globalIdx + 1 : globalIdx)}
                      activeOpacity={0.75}
                    >
                      <StoryAvatar group={group} />
                      <View style={st.storyInfo}>
                        <Text style={[st.storyName, { color: group.seen ? '#555' : UI.text, fontWeight: group.seen ? '400' : '600' }]}>
                          {group.userName}
                        </Text>
                        <View style={st.storyMeta}>
                          <Text style={st.storyMetaText}>hace {timeAgo(group.stories[0].created_at)}</Text>
                          <Text style={st.storyMetaDot}>·</Text>
                          <Ionicons name="eye-outline" size={12} color="#aaa" />
                          <Text style={st.storyMetaText}> {group.views}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );})}
                </View>
              ) : (
                <View style={st.emptyFlat}>
                  <Text style={{ color: '#bbb', fontSize: 13 }}>
                    {activeTab === 'recientes' ? 'No hay estados nuevos' : 'No has visto ningún estado aún'}
                  </Text>
                </View>
              )}
              </>
              )}
            </>
          }
        />
      )}

      <Modal visible={myStoryMenu} transparent animationType="fade" onRequestClose={() => setMyStoryMenu(false)}>
        <Pressable style={st.menuBackdrop} onPress={() => setMyStoryMenu(false)}>
          <View style={st.menuCardFloat}>
            <TouchableOpacity style={st.menuItem} onPress={() => { pickFromGallery(); setMyStoryMenu(false); }}>
              <Ionicons name="image-outline" size={16} color="#a855f7" />
              <Text style={st.menuItemText}>Subir foto/video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.menuItem} onPress={() => { addStory(); setMyStoryMenu(false); }}>
              <Ionicons name="add" size={16} color={UI.brand} />
              <Text style={st.menuItemText}>Añadir estado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.menuItem} onPress={() => { if (myStories.length) setViewingGroup(0); setMyStoryMenu(false); }}>
              <Ionicons name="eye-outline" size={16} color="#555" />
              <Text style={st.menuItemText}>Ver mi estado</Text>
            </TouchableOpacity>
            {myGroup?.storyId && myStories.length > 0 && (
              <TouchableOpacity style={[st.menuItem, { borderBottomWidth: 0 }]} onPress={() => { deleteStory(myGroup.storyId); setMyStoryMenu(false); }}>
                <Ionicons name="trash-outline" size={16} color="#e53935" />
                <Text style={[st.menuItemText, { color: '#e53935' }]}>Eliminar todo</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {viewingGroup !== null && allGroupsForViewer.length > 0 && (
        <StoryViewer
          groups={allGroupsForViewer}
          startGroupIndex={viewingGroup}
          onClose={() => { setViewingGroup(null); loadStories(); }}
          onStoryView={markViewed}
        />
      )}

      <Modal visible={!!activeEspacio} animationType="slide" onRequestClose={() => setActiveEspacio(null)}>
        <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
          <View style={[st.espModalHeader, { backgroundColor: activeEspacio?.coverColor || Colors.brand }]}>
            <TouchableOpacity onPress={() => setActiveEspacio(null)} style={st.backBtn}>
              <Text style={st.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={st.espModalTitle}>{activeEspacio?.emoji} {activeEspacio?.name}</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[st.espModalDesc, { color: C.textSecondary }]}>{activeEspacio?.description}</Text>
            {activeEspacio?.posts.map(p => (
              <View key={p.id} style={[st.postCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={st.postHead}>
                  <View style={[st.postAvatar, { backgroundColor: p.color }]}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{p.avatar.slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.storyName, { color: C.textPrimary }]}>{p.author}</Text>
                    <Text style={[st.storySub, { color: C.textSecondary }]}>{p.time}{p.isOfficial ? ' · Oficial' : ''}</Text>
                  </View>
                </View>
                <Text style={[st.postText, { color: C.textPrimary }]}>{p.text}</Text>
                <Text style={[st.storySub, { color: C.textTertiary, marginTop: 8 }]}>❤️ {p.likes} · 💬 {p.comments}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerWhite: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1,
  },
  headerTitleDark: { flex: 1, fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4, marginLeft: -4 },
  backIcon: { fontSize: 28, lineHeight: 32 },

  section: {
    backgroundColor: Colors.bgSecondary,
    marginBottom: 8,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textTertiary,
    letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 8,
  },

  myStatusWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, backgroundColor: '#fff' },
  myStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  myAvatarWrap: { position: 'relative' },
  myAvatarCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  myAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  myStoryAddBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#00c8a0',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  myStoryName: { fontSize: 15, fontWeight: '600' },
  myStorySub: { fontSize: 12, marginTop: 1 },
  actionIcons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionIconBtn: { padding: 6, borderRadius: 20 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  menuCardFloat: {
    position: 'absolute', right: 16, top: 130,
    backgroundColor: '#fff', borderRadius: 12, minWidth: 180,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  menuItemText: { fontSize: 14, color: '#111' },

  ringGray: { backgroundColor: '#e5e7eb' },
  avatarInner: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
  avatarInitials: { color: '#fff', fontSize: 15, fontWeight: '700' },
  storyRowFlat: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, backgroundColor: '#fff',
  },
  storyInfo: { flex: 1, minWidth: 0 },
  storyName: { fontSize: 15 },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  storyMetaText: { fontSize: 12, color: '#aaa' },
  storyMetaDot: { color: '#ccc', fontSize: 12 },
  storySub: { fontSize: 12, marginTop: 2 },
  emptyFlat: { paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    backgroundColor: Colors.brand, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', marginBottom: -2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00c8a0' },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
  dulceLive: { fontSize: 12, fontWeight: '700', marginBottom: 12, padding: 10, backgroundColor: 'rgba(0,200,160,0.1)', borderRadius: 10 },
  espGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  espCard: { width: '47%', borderRadius: 14, borderWidth: 1, overflow: 'hidden', paddingBottom: 10 },
  espBanner: { height: 64, alignItems: 'center', justifyContent: 'center' },
  espName: { fontSize: 13, fontWeight: '700', paddingHorizontal: 10, marginTop: 8 },
  espFollowers: { fontSize: 11, paddingHorizontal: 10, marginTop: 2 },
  espFollowBtn: { marginHorizontal: 10, marginTop: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.brand, alignItems: 'center' },
  espFollowing: { backgroundColor: Colors.bgTertiary },
  espFollowText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  espModalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  espModalTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  espModalDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  postCard: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  postHead: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  postText: { fontSize: 14, lineHeight: 20 },
});
