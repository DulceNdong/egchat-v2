// ══════════════════════════════════════════════════════════════════
// EGCHAT — Estados / Stories  (Redesign Premium v2)
// Carrusel horizontal tipo Instagram + feed de cards + visor inmersivo
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, ActivityIndicator, Image, Dimensions,
  Animated, Alert, TextInput, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { storiesAPI, authAPI } from '../src/api';
import {
  pickImageFromCamera, pickImageFromLibrary,
  pickVideo, pickVideoFromCamera,
} from '../src/utils/chatMedia';
import { Ionicons } from '@expo/vector-icons';
import { parseStoriesResponse, initialsFor, type StoryGroup } from '../src/utils/storyParser';
import { ESPACIOS, formatFollowers, type Espacio } from '../src/data/espacioDulce';
import { EGAvatar } from '../src/components/ui';
import { StoryMusicPicker, StoryMusicBadge, type StoryMusic } from '../src/components/StoryMusicPicker';
import { Colors } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000;
const BUBBLE_SIZE = 72;

type StoryTab = 'recientes' | 'vistos' | 'dulce';

// ── Paleta de marca (se usa en el visor inmersivo y gradientes) ───
const BRAND   = '#00c8a0';
const BRAND2  = '#00b4e6';
// El visor inmersivo permanece oscuro (estándar UX stories)
const VIEWER_BG = '#000';
// MUTED se usa solo dentro del visor oscuro
const MUTED   = 'rgba(255,255,255,0.45)';

// ── Plataforma ────────────────────────────────────────────────────
const IOS = Platform.OS === 'ios';

// ── Tiempo relativo ───────────────────────────────────────────────
const timeAgo = (d: string) => {
  const ms = Date.now() - new Date(d).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000);
  if (h >= 1) return `${h}h`;
  if (m >= 1) return `${m}m`;
  return 'ahora';
};

// ══════════════════════════════════════════════════════════════════
// BARRA DE PROGRESO
// ══════════════════════════════════════════════════════════════════
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
  container: { flexDirection: 'row', gap: 3, paddingHorizontal: 10, paddingTop: 6 },
  track: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
});

// ══════════════════════════════════════════════════════════════════
// VISOR INMERSIVO
// ══════════════════════════════════════════════════════════════════
const REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '💯'];

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
  const [showReactions, setShowReactions] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progress  = useRef(new Animated.Value(0)).current;
  const timerRef  = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const paused    = useRef(false);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const timeRemaining = (d: string) => {
    const rem = 24 * 3600000 - (Date.now() - new Date(d).getTime());
    if (rem <= 0) return 'Expirado';
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const goNext = useCallback(() => {
    timerRef.current?.stop();
    const g = groups[groupIdx];
    if (storyIdx < g.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(gi => gi + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, groups, onClose]);

  const goPrev = useCallback(() => {
    timerRef.current?.stop();
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(gi => gi - 1);
      setStoryIdx(0);
    }
  }, [groupIdx, storyIdx]);

  const startProgress = useCallback(() => {
    if (paused.current) return;
    progress.setValue(0);
    timerRef.current = Animated.timing(progress, {
      toValue: 1, duration: STORY_DURATION, useNativeDriver: false,
    });
    timerRef.current.start(({ finished }) => {
      if (finished && !paused.current) goNext();
    });
  }, [groupIdx, storyIdx, goNext]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowReactions(false);
    setSentReaction(null);
    setShowReply(false);
    setReplyText('');
    paused.current = false;
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20 }).start();
    startProgress();
    if (group && onStoryView) onStoryView(group);
    return () => { timerRef.current?.stop(); };
  }, [groupIdx, storyIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showReactions || showReply) {
      paused.current = true;
      timerRef.current?.stop();
    } else if (!paused.current) {
      startProgress();
    }
  }, [showReactions, showReply]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendReaction = (emoji: string) => {
    setSentReaction(emoji);
    setShowReactions(false);
    paused.current = false;
    setTimeout(() => { setSentReaction(null); startProgress(); }, 1500);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    try {
      await storiesAPI.reply(group.storyId, text);
      setReplyText('');
      setShowReply(false);
      paused.current = false;
      startProgress();
    } catch {
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    }
  };

  if (!group || !story) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={sv.container}>
        <Animated.View style={[sv.mediaWrap, { transform: [{ translateY: slideAnim }] }]}>
          {story.media_url ? (
            <Image source={{ uri: story.media_url }} style={sv.media} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[BRAND, BRAND2]} style={sv.media} />
          )}
        </Animated.View>

        <LinearGradient colors={['rgba(0,0,0,0.75)', 'transparent']} style={sv.topGradient} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={sv.bottomGradient} />

        <View style={sv.progressWrap}>
          <ProgressBar total={group.stories.length} current={storyIdx} progress={progress} />
        </View>

        <View style={sv.header}>
          <EGAvatar src={group.userAvatar} name={group.userName} size={40} />
          <View style={sv.headerInfo}>
            <Text style={sv.headerName}>{group.userName}</Text>
            <Text style={sv.headerMeta}>{timeAgo(story.created_at)} · {timeRemaining(story.created_at)} restante</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {!!story.caption && (
          <View style={sv.captionWrap}>
            <BlurView intensity={30} tint="dark" style={sv.captionBlur}>
              <Text style={sv.caption}>{story.caption}</Text>
            </BlurView>
          </View>
        )}

        {sentReaction ? (
          <View style={sv.reactionSent}>
            <Text style={{ fontSize: 52 }}>{sentReaction}</Text>
          </View>
        ) : null}

        {showReactions && (
          <BlurView intensity={40} tint="dark" style={sv.reactionsPanel}>
            {REACTIONS.map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => sendReaction(emoji)} style={sv.reactionBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 30 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        )}

        <View style={sv.bottomBar}>
          {showReply ? (
            <View style={sv.replyRow}>
              <TextInput
                style={sv.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Responder a ${group.userName}...`}
                placeholderTextColor="rgba(255,255,255,0.45)"
                autoFocus
                onSubmitEditing={sendReply}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={sendReply} style={sv.replySendBtn} activeOpacity={0.8}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowReply(false); paused.current = false; startProgress(); }} style={sv.replyCloseBtn}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={sv.replyRow}>
              <TouchableOpacity style={sv.replyPlaceholder} onPress={() => { setShowReply(true); setShowReactions(false); }} activeOpacity={0.8}>
                <Text style={sv.replyPlaceholderText}>Responder...</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowReactions(v => !v)} style={sv.reactBtn} activeOpacity={0.8}>
                <Ionicons name="happy-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!showReactions && !showReply && (
          <View style={sv.touchZones}>
            <TouchableOpacity style={sv.touchLeft} onPress={goPrev} activeOpacity={1} />
            <TouchableOpacity style={sv.touchRight} onPress={goNext} activeOpacity={1} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const sv = StyleSheet.create({
  container:      { flex: 1, backgroundColor: VIEWER_BG },
  mediaWrap:      { ...StyleSheet.absoluteFillObject },
  media:          { ...StyleSheet.absoluteFillObject },
  topGradient:    { position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, zIndex: 1 },
  progressWrap:   { position: 'absolute', top: IOS ? 52 : 36, left: 0, right: 0, zIndex: 3 },
  header: {
    position: 'absolute', top: IOS ? 64 : 48,
    left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 3,
  },
  headerInfo:  { flex: 1 },
  headerName:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerMeta:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  captionWrap: { position: 'absolute', bottom: 110, left: 14, right: 14, zIndex: 3 },
  captionBlur: { borderRadius: 14, overflow: 'hidden', padding: 12 },
  caption:     { fontSize: 15, color: '#fff', fontWeight: '500', lineHeight: 22 },
  reactionSent:   { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 10 },
  reactionsPanel: {
    position: 'absolute', bottom: 88, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-around',
    borderRadius: 40, paddingVertical: 12, paddingHorizontal: 8, overflow: 'hidden', zIndex: 10,
  },
  reactionBtn:  { padding: 4 },
  bottomBar:    { position: 'absolute', bottom: IOS ? 36 : 20, left: 14, right: 14, zIndex: 4 },
  replyRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyPlaceholder: {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 26, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: 'rgba(0,0,0,0.2)',
  },
  replyPlaceholderText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  replyInput: {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 26, paddingHorizontal: 18, paddingVertical: 11,
    color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  replySendBtn:  { width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  replyCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  reactBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 2 },
  touchLeft:  { flex: 1 },
  touchRight: { flex: 2 },
});

// ══════════════════════════════════════════════════════════════════
// BURBUJA DEL CARRUSEL — fuera del componente padre
// ══════════════════════════════════════════════════════════════════
const StoryBubble = React.memo(({
  group, size = BUBBLE_SIZE, onPress, C,
}: { group: StoryGroup; size?: number; onPress: () => void; C: typeof Colors }) => {
  const buStyles = makeBuStyles(C);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!group.seen) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [group.seen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={buStyles.wrap} accessibilityRole="button" accessibilityLabel={`Ver estado de ${group.userName}`}>
      <Animated.View style={[buStyles.ringWrap, { transform: [{ scale: group.seen ? 1 : pulseAnim }] }]}>
        {group.seen ? (
          <View style={[buStyles.ringGray, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
            <View style={[buStyles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
              {group.userAvatar
                ? <Image source={{ uri: group.userAvatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />
                : <Text style={buStyles.initials}>{initialsFor(group.userName)}</Text>}
            </View>
          </View>
        ) : (
          <LinearGradient colors={[BRAND, BRAND2, '#a855f7']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}
            style={[buStyles.ringGradient, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
            <View style={[buStyles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
              {group.userAvatar
                ? <Image source={{ uri: group.userAvatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />
                : <Text style={buStyles.initials}>{initialsFor(group.userName)}</Text>}
            </View>
          </LinearGradient>
        )}
      </Animated.View>
      <Text style={buStyles.name} numberOfLines={1}>{group.userName.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
});

const makeBuStyles = (C: typeof Colors) => StyleSheet.create({
  wrap:         { alignItems: 'center', width: BUBBLE_SIZE + 24, marginRight: 4 },
  ringWrap:     { alignItems: 'center', justifyContent: 'center' },
  ringGray:     { backgroundColor: C.bgTertiary, padding: 3, alignItems: 'center', justifyContent: 'center' },
  ringGradient: { padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatar:       { backgroundColor: C.bgSecondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2.5, borderColor: C.bgPrimary },
  initials:     { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
  name:         { fontSize: 11, color: C.textSecondary, marginTop: 6, fontWeight: '500', maxWidth: BUBBLE_SIZE + 16, textAlign: 'center' },
});
// Estilos estáticos por defecto (se sobreescriben en el componente con el tema)
const bu = makeBuStyles(Colors);

// ══════════════════════════════════════════════════════════════════
// CARD DEL FEED VERTICAL — fuera del componente padre
// ══════════════════════════════════════════════════════════════════
const makeScStyles = (C: typeof Colors) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight,
  },
  previewWrap:  { width: 54, height: 54, borderRadius: 14, overflow: 'hidden' },
  preview:      { width: 54, height: 54 },
  seenOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  countBadge:   { position: 'absolute', bottom: 4, right: 4, backgroundColor: BRAND, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  countText:    { fontSize: 10, color: '#fff', fontWeight: '700' },
  info:         { flex: 1, minWidth: 0 },
  name:         { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  nameSeen:     { color: C.textTertiary, fontWeight: '500' },
  meta:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 12, color: C.textSecondary },
  dot:          { fontSize: 12, color: C.border },
});

const StoryCard = React.memo(({ group, onPress, C }: { group: StoryGroup; onPress: () => void; C: typeof Colors }) => {
  const scStyles = makeScStyles(C);
  const previewUri = group.stories[0]?.media_url;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={scStyles.card} accessibilityRole="button" accessibilityLabel={`Estado de ${group.userName}`}>
      <View style={scStyles.previewWrap}>
        {previewUri
          ? <Image source={{ uri: previewUri }} style={scStyles.preview} resizeMode="cover" />
          : <LinearGradient colors={[BRAND, BRAND2]} style={scStyles.preview} />}
        {group.seen && <View style={scStyles.seenOverlay} />}
        {group.stories.length > 1 && (
          <View style={scStyles.countBadge}>
            <Text style={scStyles.countText}>{group.stories.length}</Text>
          </View>
        )}
      </View>
      <View style={scStyles.info}>
        <Text style={[scStyles.name, group.seen && scStyles.nameSeen]} numberOfLines={1}>{group.userName}</Text>
        <View style={scStyles.meta}>
          <Ionicons name={group.seen ? 'checkmark-done' : 'time-outline'} size={12} color={group.seen ? BRAND : C.textTertiary} />
          <Text style={scStyles.metaText}>{timeAgo(group.stories[0].created_at)}</Text>
          {group.views > 0 && (
            <>
              <Text style={scStyles.dot}>·</Text>
              <Ionicons name="eye-outline" size={12} color={C.textTertiary} />
              <Text style={scStyles.metaText}>{group.views}</Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.border} />
    </TouchableOpacity>
  );
});

// ── Estilos del carrusel (dinámicos según tema) ───────────────────
const makeCarStyles = (C: typeof Colors) => StyleSheet.create({
  wrap:   { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight, paddingBottom: 4 },
  scroll: { paddingHorizontal: 14, paddingVertical: 14, gap: 4 },
});

// ── Estilos de burbuja propia (dinámicos) ─────────────────────────
const makeMbuStyles = (C: typeof Colors) => StyleSheet.create({
  outer:    { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring:     { padding: 3, alignItems: 'center', justifyContent: 'center', width: BUBBLE_SIZE + 6, height: BUBBLE_SIZE + 6 },
  addBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bgPrimary },
});

// ── Estilos Espacio Dulce (dinámicos) ────────────────────────────
const makeEdStyles = (C: typeof Colors) => StyleSheet.create({
  liveBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: BRAND + '33', backgroundColor: C.bgSecondary },
  liveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND },
  liveText:     { fontSize: 13, fontWeight: '700', color: BRAND },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textTertiary, letterSpacing: 1.2, marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:         { width: '47%', backgroundColor: C.bgSecondary, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.borderLight },
  banner:       { height: 72, alignItems: 'center', justifyContent: 'center' },
  cardBody:     { padding: 10 },
  cardName:     { fontSize: 13, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  cardSub:      { fontSize: 11, color: C.textSecondary, marginBottom: 8 },
  followBtn:    { paddingVertical: 6, borderRadius: 8, backgroundColor: BRAND, alignItems: 'center' },
  followingBtn: { backgroundColor: C.bgTertiary, borderWidth: 1, borderColor: C.border },
  followText:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  followingText:{ color: C.textSecondary },
});

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function StoriesScreen() {
  const [groups,       setGroups]       = useState<StoryGroup[]>([]);
  const [myGroup,      setMyGroup]      = useState<StoryGroup | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [storyMusic,   setStoryMusic]   = useState<StoryMusic | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [activeTab,    setActiveTab]    = useState<StoryTab>('recientes');
  const [espacios,     setEspacios]     = useState(ESPACIOS);
  const [activeEspacio, setActiveEspacio] = useState<Espacio | null>(null);
  const [myAvatarUrl,  setMyAvatarUrl]  = useState<string | undefined>();
  const [myStoryMenu,  setMyStoryMenu]  = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const buStyles  = makeBuStyles(C);
  const mbu       = makeMbuStyles(C);
  const car       = makeCarStyles(C);
  const ed        = makeEdStyles(C);

  const myStories      = myGroup?.stories || [];
  const recentGroups   = useMemo(() => groups.filter(g => !g.seen), [groups]);
  const seenGroups     = useMemo(() => groups.filter(g =>  g.seen), [groups]);
  const displayedGroups = activeTab === 'recientes' ? recentGroups : seenGroups;

  const allGroupsForViewer = useMemo<StoryGroup[]>(() => [
    ...(myGroup ? [{ ...myGroup, userName: 'Mi estado' }] : []),
    ...groups,
  ], [myGroup, groups]);

  // ── API ────────────────────────────────────────────────────────
  const loadStories = useCallback(async () => {
    try {
      const [data, me] = await Promise.allSettled([storiesAPI.getAll(), authAPI.me()]);
      const meId = me.status === 'fulfilled' ? me.value?.id || '' : '';
      if (me.status === 'fulfilled') setMyAvatarUrl(me.value?.avatar_url || me.value?.avatarUrl);
      if (data.status === 'fulfilled' && Array.isArray(data.value)) {
        const parsed = parseStoriesResponse(data.value, meId);
        setMyGroup(parsed.myGroup);
        setGroups(parsed.groups);
      }
    } catch (err) {
      console.warn('[StoriesScreen] loadStories error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markViewed = useCallback((group: StoryGroup) => {
    if (group.storyId) storiesAPI.registerView(group.storyId).catch(() => {});
    setGroups(prev => prev.map(g => g.userId === group.userId ? { ...g, seen: true } : g));
  }, []);

  const toggleFollow = useCallback((id: string) => {
    setEspacios(prev => prev.map(e => e.id === id ? { ...e, following: !e.following } : e));
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const uploadStory = useCallback(async (uri: string, type: 'image' | 'video' = 'image') => {
    setUploading(true);
    try {
      await storiesAPI.create({ media: [{ url: uri, type }], music: storyMusic ?? undefined });
      setStoryMusic(null);
      await loadStories();
    } catch {
      Alert.alert('Error', 'No se pudo publicar el estado');
    } finally {
      setUploading(false);
    }
  }, [storyMusic, loadStories]);

  const createTextStatus = useCallback(async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00c8a0"/><stop offset="100%" stop-color="#00b4e6"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/><circle cx="200" cy="300" r="220" fill="rgba(255,255,255,0.1)"/><circle cx="900" cy="1600" r="300" fill="rgba(255,255,255,0.08)"/><text x="540" y="900" text-anchor="middle" font-family="Arial,sans-serif" font-size="96" font-weight="800" fill="#fff">Nuevo estado</text><text x="540" y="1020" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" fill="rgba(255,255,255,0.85)">EGChat</text></svg>`;
    await uploadStory(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, 'image');
  }, [uploadStory]);

  const pickFromGallery = useCallback(async () => {
    try {
      const asset = await pickImageFromLibrary();
      if (!asset) return;
      await uploadStory(asset.uri, asset.mimeType?.includes('video') ? 'video' : 'image');
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  }, [uploadStory]);

  const addStory = useCallback(async () => {
    Alert.alert('Añadir estado', '¿Cómo quieres publicar?', [
      { text: '✏️ Texto rápido',  onPress: () => createTextStatus().catch(() => Alert.alert('Error', 'No se pudo crear')) },
      { text: '📷 Cámara',        onPress: async () => { const a = await pickImageFromCamera().catch(() => null);   if (a) await uploadStory(a.uri, 'image'); } },
      { text: '🖼️ Galería',        onPress: pickFromGallery },
      { text: '🎥 Video galería',  onPress: async () => { const a = await pickVideo().catch(() => null);             if (a) await uploadStory(a.uri, 'video'); } },
      { text: '📹 Video cámara',   onPress: async () => { const a = await pickVideoFromCamera().catch(() => null);  if (a) await uploadStory(a.uri, 'video'); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [createTextStatus, pickFromGallery, uploadStory]);

  const deleteStory = useCallback((storyId: string) => {
    Alert.alert('Eliminar estado', '¿Eliminar este estado?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await storiesAPI.delete(storyId); await loadStories(); } catch {} } },
    ]);
  }, [loadStories]);

  // ── Burbuja "mi estado" ──────────────────────────────────────
  const MyBubble = useCallback(() => {
    const hasStory = myStories.length > 0;
    return (
      <TouchableOpacity onPress={() => hasStory ? setViewingGroup(0) : addStory()} activeOpacity={0.8} style={buStyles.wrap} accessibilityRole="button" accessibilityLabel="Mi estado">
        <View style={mbu.outer}>
          {hasStory ? (
            <LinearGradient colors={[BRAND, BRAND2]} style={[mbu.ring, { borderRadius: (BUBBLE_SIZE + 6) / 2 }]}>
              <View style={[buStyles.avatar, { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }]}>
                {myAvatarUrl
                  ? <Image source={{ uri: myAvatarUrl }} style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }} />
                  : <Ionicons name="person" size={28} color={C.textSecondary} />}
              </View>
            </LinearGradient>
          ) : (
            <View style={[mbu.ring, { backgroundColor: C.bgTertiary, borderRadius: (BUBBLE_SIZE + 6) / 2, borderWidth: 2, borderColor: C.border, borderStyle: 'dashed' }]}>
              <View style={[buStyles.avatar, { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }]}>
                {myAvatarUrl
                  ? <Image source={{ uri: myAvatarUrl }} style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }} />
                  : <Ionicons name="person" size={28} color={C.textTertiary} />}
              </View>
            </View>
          )}
          <View style={mbu.addBadge}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.7 }] }} />
              : <Ionicons name="add" size={12} color="#fff" />}
          </View>
        </View>
        <Text style={buStyles.name} numberOfLines={1}>Mi estado</Text>
      </TouchableOpacity>
    );
  }, [myStories.length, myAvatarUrl, uploading, addStory, buStyles, mbu, C]);

  // ── Carrusel ─────────────────────────────────────────────────
  const StoriesCarousel = useCallback(() => {
    if (recentGroups.length === 0 && !uploading && !myGroup) return null;
    return (
      <View style={car.wrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={car.scroll}>
          <MyBubble />
          {recentGroups.map(g => {
            const globalIdx = groups.findIndex(gr => gr.userId === g.userId);
            return (
              <StoryBubble
                key={g.userId}
                group={g}
                C={C}
                onPress={() => setViewingGroup(myGroup ? globalIdx + 1 : globalIdx)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }, [recentGroups, groups, myGroup, uploading, MyBubble, C, car]);

  // ── Espacio Dulce ─────────────────────────────────────────────
  const EspacioDulceTab = useCallback(() => (
    <View style={{ padding: 16 }}>
      <LinearGradient colors={[BRAND + '22', BRAND2 + '11']} style={ed.liveBanner}>
        <View style={ed.liveDot} />
        <Text style={ed.liveText}>En vivo — Espacio Dulce</Text>
      </LinearGradient>
      <Text style={ed.sectionLabel}>CANALES</Text>
      <View style={ed.grid}>
        {espacios.filter(e => e.type === 'publico').map(esp => (
          <TouchableOpacity key={esp.id} style={ed.card} onPress={() => setActiveEspacio(esp)} activeOpacity={0.85}>
            <LinearGradient colors={[esp.coverColor, esp.coverColor + 'aa']} style={ed.banner}>
              <Text style={{ fontSize: 30 }}>{esp.emoji}</Text>
            </LinearGradient>
            <View style={ed.cardBody}>
              <Text style={ed.cardName} numberOfLines={1}>{esp.name}</Text>
              <Text style={ed.cardSub}>{formatFollowers(esp.followers)} seguidores</Text>
              <TouchableOpacity style={[ed.followBtn, esp.following && ed.followingBtn]} onPress={() => toggleFollow(esp.id)}>
                <Text style={[ed.followText, esp.following && ed.followingText]}>{esp.following ? 'Siguiendo' : 'Seguir'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[ed.sectionLabel, { marginTop: 16 }]}>COMUNIDADES</Text>
      <View style={ed.grid}>
        {espacios.filter(e => e.type === 'comunidad').map(esp => (
          <TouchableOpacity key={esp.id} style={ed.card} onPress={() => setActiveEspacio(esp)} activeOpacity={0.85}>
            <LinearGradient colors={[esp.coverColor, esp.coverColor + 'aa']} style={ed.banner}>
              <Text style={{ fontSize: 30 }}>{esp.emoji}</Text>
            </LinearGradient>
            <View style={ed.cardBody}>
              <Text style={ed.cardName} numberOfLines={1}>{esp.name}</Text>
              <Text style={ed.cardSub}>{formatFollowers(esp.followers)} miembros</Text>
              <TouchableOpacity style={[ed.followBtn, esp.following && ed.followingBtn]} onPress={() => toggleFollow(esp.id)}>
                <Text style={[ed.followText, esp.following && ed.followingText]}>{esp.following ? 'Unido' : 'Unirse'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [espacios, toggleFollow]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[st.root, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bgPrimary} />

      {/* HEADER */}
      <View style={[st.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={[st.backBtn, { backgroundColor: C.bgTertiary }]} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, { color: C.textPrimary }]}>Estados</Text>
          {recentGroups.length > 0 && (
            <View style={[st.headerBadge, { backgroundColor: BRAND }]}>
              <Text style={st.headerBadgeText}>{recentGroups.length}</Text>
            </View>
          )}
        </View>
        <View style={st.headerActions}>
          <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={pickFromGallery} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Añadir desde galería">
            <Ionicons name="image-outline" size={21} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={addStory} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Añadir estado">
            <Ionicons name="camera-outline" size={21} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      ) : (
        <ScrollView style={{ backgroundColor: C.bgPrimary }} showsVerticalScrollIndicator={false}>
          {/* TABS */}
          <View style={[st.tabsWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
            {([
              { id: 'recientes' as StoryTab, label: 'Recientes', count: recentGroups.length },
              { id: 'vistos'    as StoryTab, label: 'Vistos',    count: seenGroups.length },
              { id: 'dulce'     as StoryTab, label: '✦ Dulce',   count: 0 },
            ]).map(t => (
              <TouchableOpacity key={t.id} style={[st.tab, activeTab === t.id && st.tabActive]}
                onPress={() => setActiveTab(t.id)} activeOpacity={0.8}
                accessibilityRole="tab" accessibilityState={{ selected: activeTab === t.id }}>
                <Text style={[st.tabText, { color: C.textTertiary }, activeTab === t.id && { color: C.textPrimary, fontWeight: '700' }]}>
                  {t.label}{t.count > 0 ? ` ${t.count}` : ''}
                </Text>
                {activeTab === t.id && <View style={[st.tabIndicator, { backgroundColor: BRAND }]} />}
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'dulce' ? <EspacioDulceTab /> : (
            <>
              {activeTab === 'recientes' && <StoriesCarousel />}
              {displayedGroups.length > 0 && (
                <View style={st.feedLabel}>
                  <Text style={[st.feedLabelText, { color: C.textTertiary }]}>{activeTab === 'recientes' ? 'TODOS LOS ESTADOS' : 'YA VISTOS'}</Text>
                </View>
              )}
              {displayedGroups.length > 0 ? displayedGroups.map(group => {
                const globalIdx = groups.findIndex(g => g.userId === group.userId);
                return (
                  <StoryCard
                    key={group.userId}
                    group={group}
                    C={C}
                    onPress={() => setViewingGroup(myGroup ? globalIdx + 1 : globalIdx)}
                  />
                );
              }) : (
                <View style={st.empty}>
                  <Ionicons name={activeTab === 'recientes' ? 'sparkles-outline' : 'checkmark-done-circle-outline'} size={52} color={C.border} />
                  <Text style={[st.emptyTitle, { color: C.textSecondary }]}>{activeTab === 'recientes' ? 'Todo al día' : 'Sin estados vistos'}</Text>
                  <Text style={[st.emptySub, { color: C.textTertiary }]}>{activeTab === 'recientes' ? 'No hay estados nuevos de tus contactos' : 'Los estados que veas aparecerán aquí'}</Text>
                  {activeTab === 'recientes' && (
                    <TouchableOpacity style={st.emptyBtn} onPress={addStory} activeOpacity={0.85}>
                      <LinearGradient colors={[BRAND, BRAND2]} style={st.emptyBtnGrad}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={st.emptyBtnText}>Publicar estado</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* MODAL MENÚ */}
      <Modal visible={myStoryMenu} transparent animationType="fade" onRequestClose={() => setMyStoryMenu(false)}>
        <Pressable style={st.menuBackdrop} onPress={() => setMyStoryMenu(false)}>
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={[st.menuCard, { borderColor: C.borderLight }]}>
            {([
              { icon: 'image-outline'      as const, color: '#a855f7', label: 'Subir foto/video',  onPress: () => { addStory();                              setMyStoryMenu(false); } },
              { icon: 'add-circle-outline' as const, color: BRAND,     label: 'Añadir estado',     onPress: () => { addStory();                              setMyStoryMenu(false); } },
              { icon: 'eye-outline'        as const, color: BRAND2,    label: 'Ver mi estado',     onPress: () => { if (myStories.length) setViewingGroup(0); setMyStoryMenu(false); } },
            ] as const).map((item, idx, arr) => (
              <TouchableOpacity key={item.label}
                style={[st.menuItem, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight }]}
                onPress={item.onPress} activeOpacity={0.75}
                accessibilityRole="button" accessibilityLabel={item.label}>
                <View style={[st.menuIconWrap, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[st.menuItemText, { color: C.textPrimary }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={14} color={C.border} />
              </TouchableOpacity>
            ))}
            {myGroup?.storyId && myStories.length > 0 && (
              <TouchableOpacity style={st.menuItem}
                onPress={() => { deleteStory(myGroup.storyId); setMyStoryMenu(false); }} activeOpacity={0.75}
                accessibilityRole="button" accessibilityLabel="Eliminar mi estado">
                <View style={[st.menuIconWrap, { backgroundColor: '#ef444422' }]}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </View>
                <Text style={[st.menuItemText, { color: '#ef4444' }]}>Eliminar todo</Text>
                <Ionicons name="chevron-forward" size={14} color={C.border} />
              </TouchableOpacity>
            )}
          </BlurView>
        </Pressable>
      </Modal>

      {/* VISOR */}
      {viewingGroup !== null && allGroupsForViewer.length > 0 && (
        <StoryViewer
          groups={allGroupsForViewer}
          startGroupIndex={viewingGroup}
          onClose={() => { setViewingGroup(null); loadStories(); }}
          onStoryView={markViewed}
        />
      )}

      {/* MODAL ESPACIO DULCE */}
      <Modal visible={!!activeEspacio} animationType="slide" onRequestClose={() => setActiveEspacio(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPrimary }} edges={['top']}>
          <LinearGradient colors={[activeEspacio?.coverColor || BRAND, 'transparent']} style={st.espModalHeader}>
            <TouchableOpacity onPress={() => setActiveEspacio(null)} style={[st.backBtn, { backgroundColor: 'rgba(0,0,0,0.25)' }]} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={st.espModalTitle}>{activeEspacio?.emoji} {activeEspacio?.name}</Text>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[st.espModalDesc, { color: C.textSecondary }]}>{activeEspacio?.description}</Text>
            {activeEspacio?.posts.map(p => (
              <View key={p.id} style={[st.postCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={st.postHead}>
                  <View style={[st.postAvatar, { backgroundColor: p.color }]}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{p.avatar.slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 14, fontWeight: '700' }}>{p.author}</Text>
                    <Text style={{ color: C.textTertiary, fontSize: 11, marginTop: 1 }}>{p.time}{p.isOfficial ? ' · Oficial ✓' : ''}</Text>
                  </View>
                </View>
                <Text style={{ color: C.textPrimary, fontSize: 14, lineHeight: 20 }}>{p.text}</Text>
                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 10 }}>❤️ {p.likes} · 💬 {p.comments}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MUSIC PICKER */}
      <StoryMusicPicker visible={showMusicPicker} selected={storyMusic} onSelect={setStoryMusic} onClose={() => setShowMusicPicker(false)} />
      {storyMusic && (
        <View style={[st.musicBar, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          <StoryMusicBadge music={storyMusic} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={st.musicPublishBtn} onPress={() => addStory()}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Publicar con música</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.musicCancelBtn, { backgroundColor: C.bgTertiary }]} onPress={() => setStoryMusic(null)}>
              <Ionicons name="close" size={16} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS PRINCIPALES
// ══════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:         { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerBadge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  headerActions:   { flexDirection: 'row', gap: 4 },
  headerBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  tabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabActive:    {},
  tabText:      { fontSize: 13, fontWeight: '600' },
  tabTextActive:{},
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2.5, borderRadius: 2 },

  feedLabel:     { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  feedLabelText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  empty:        { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn:     { borderRadius: 14, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  menuBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingBottom: 34 },
  menuCard:       { marginHorizontal: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  menuItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuIconWrap:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuItemText:   { flex: 1, fontSize: 15, fontWeight: '600' },

  espModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 60 },
  espModalTitle:  { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  espModalDesc:   { fontSize: 14, marginBottom: 20, lineHeight: 21 },
  postCard:       { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  postHead:       { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' },
  postAvatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  musicBar:        { position: 'absolute', bottom: 100, left: 16, right: 16, zIndex: 99, borderRadius: 16, padding: 12, borderWidth: 1 },
  musicPublishBtn: { flex: 1, backgroundColor: '#1db954', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' },
  musicCancelBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
