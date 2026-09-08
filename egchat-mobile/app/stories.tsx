// ══════════════════════════════════════════════════════════════════
// EGCHAT — Estados / Stories  (Redesign Premium v2)
// Carrusel horizontal tipo Instagram + feed de cards + visor inmersivo
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
  Modal, Pressable, ActivityIndicator, Image, Dimensions,
  Animated, Alert, TextInput, Platform, StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import { storiesAPI, authAPI } from '../src/api';
import {
  pickImageFromCamera, pickImageFromLibrary,
  pickVideo, pickVideoFromCamera,
} from '../src/utils/chatMedia';
import { uploadStoryMediaToSupabase } from '../src/utils/storyMediaStorage';
import { MIcon } from '../src/components/ui/MIcon';
import { parseStoriesResponse, initialsFor, type StoryGroup } from '../src/utils/storyParser';
import { ESPACIOS, formatFollowers, type Espacio } from '../src/data/espacioDulce';
import { EGAvatar } from '../src/components/ui';
import { StoryMusicPicker, StoryMusicBadge, type StoryMusic } from '../src/components/StoryMusicPicker';
import { Colors } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MomentCameraEditor, { type MomentMedia } from '../src/components/MomentCameraEditor';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000;
const BUBBLE_SIZE = 72;

type StoryTab = 'estados' | 'streaming' | 'canales' | 'momentos';

// ── Paleta de marca (se usa en el visor inmersivo y gradientes) ───
const BRAND   = '#00c8a0';
const BRAND2  = '#00B4E6';
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
    const currentStory = groups[groupIdx]?.stories[storyIdx];
    const duration = currentStory?.type === 'video' ? STORY_DURATION * 3 : STORY_DURATION;
    progress.setValue(0);
    timerRef.current = Animated.timing(progress, {
      toValue: 1, duration, useNativeDriver: false,
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

  const sendReaction = async (emoji: string) => {
    setSentReaction(emoji);
    setShowReactions(false);
    paused.current = false;
    // D3 — persistir reacción en la BD
    try {
      await storiesAPI.react(group.storyId, emoji);
    } catch { /* no bloquear */ }
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
      // D3 — después de responder, abrir chat privado con el dueño de la story
      if (group.userId) {
        try {
          const chat = await (await import('../src/api')).chatAPI.createPrivate(group.userId);
          if (chat?.id) {
            onClose();
            router.push(`/chat/${chat.id}` as any);
          }
        } catch { /* si falla no bloqueamos */ }
      }
    } catch {
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    }
  };

  if (!group || !story) return null;

  const isVideoStory = story.type === 'video' || /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(story.media_url || '');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={sv.container}>
        <Animated.View style={[sv.mediaWrap, { transform: [{ translateY: slideAnim }] }]}>
          {story.media_url && isVideoStory ? (
            <Video
              source={{ uri: story.media_url }}
              style={sv.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping={false}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status: any) => {
                if (status?.didJustFinish) goNext();
              }}
            />
          ) : story.media_url ? (
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
            <Text style={sv.headerMeta}>{timeAgo(story.created_at)} · {timeRemaining(story.created_at) === 'Expirado' ? 'Expirado' : `${timeRemaining(story.created_at)} restante`}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.7}>
            <MIcon name="close" size={20} color="#fff" />
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
                <MIcon name="send" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowReply(false); paused.current = false; startProgress(); }} style={sv.replyCloseBtn}>
                <MIcon name="close" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={sv.replyRow}>
              <TouchableOpacity style={sv.replyPlaceholder} onPress={() => { setShowReply(true); setShowReactions(false); }} activeOpacity={0.8}>
                <Text style={sv.replyPlaceholderText}>Responder...</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowReactions(v => !v)} style={sv.reactBtn} activeOpacity={0.8}>
                <MIcon name="sentiment-satisfied" size={24} color="#fff" />
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
          <MIcon name={group.seen ? 'done-all' : 'schedule'} size={12} color={group.seen ? BRAND : C.textTertiary} />
          <Text style={scStyles.metaText}>{timeAgo(group.stories[0].created_at)}</Text>
          {group.views > 0 && (
            <>
              <Text style={scStyles.dot}>·</Text>
              <MIcon name="visibility" size={12} color={C.textTertiary} />
              <Text style={scStyles.metaText}>{group.views}</Text>
            </>
          )}
        </View>
      </View>
      <MIcon name="chevron-right" size={16} color={C.border} />
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
// TIPOS Y HELPERS — MOMENTOS
// ══════════════════════════════════════════════════════════════════
interface MomentPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  likes: number;
  liked_by_me: boolean;
  comments: MomentComment[];
  created_at: string;
}
interface MomentComment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}
const formatRelativeTime = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
};
const MOMENTS_CACHE = 'egchat_moments_v1';
async function fetchMomentsData(): Promise<MomentPost[]> {
  try {
    const BASE = (await import('../src/api')).getApiBase();
    const token = await (await import('../src/api')).getToken();
    const res = await fetch(`${BASE}/api/moments`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) { await AsyncStorage.setItem(MOMENTS_CACHE, JSON.stringify(data)); return data; }
    }
  } catch {}
  try { const c = await AsyncStorage.getItem(MOMENTS_CACHE); if (c) return JSON.parse(c); } catch {}
  return [];
}
async function createMomentPost(text: string, images: string[]): Promise<MomentPost | null> {
  try {
    const BASE = (await import('../src/api')).getApiBase();
    const token = await (await import('../src/api')).getToken();
    const res = await fetch(`${BASE}/api/moments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
    });
    if (res.ok) return res.json();
  } catch {}
  const me = await authAPI.me().catch(() => null);
  return { id: `local-${Date.now()}`, user_id: me?.id || 'local', user_name: me?.full_name || 'Yo', user_avatar: me?.avatar_url, text, images, likes: 0, liked_by_me: false, comments: [], created_at: new Date().toISOString() };
}
async function toggleMomentLike(postId: string): Promise<boolean> {
  try {
    const BASE = (await import('../src/api')).getApiBase();
    const token = await (await import('../src/api')).getToken();
    const res = await fetch(`${BASE}/api/moments/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return (await res.json()).liked;
  } catch {}
  return true;
}
async function addMomentComment(postId: string, text: string): Promise<MomentComment | null> {
  try {
    const BASE = (await import('../src/api')).getApiBase();
    const token = await (await import('../src/api')).getToken();
    const res = await fetch(`${BASE}/api/moments/${postId}/comments`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    });
    if (res.ok) return res.json();
  } catch {}
  const me = await authAPI.me().catch(() => null);
  return { id: `local-${Date.now()}`, user_id: me?.id || 'local', user_name: me?.full_name || 'Yo', text, created_at: new Date().toISOString() };
}

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const [groups,       setGroups]       = useState<StoryGroup[]>([]);
  const [myGroup,      setMyGroup]      = useState<StoryGroup | null>(null);
  const [meId,         setMeId]         = useState('');
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [storyMusic,   setStoryMusic]   = useState<StoryMusic | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [activeTab,    setActiveTab]    = useState<StoryTab>('estados');
  const [espacios,     setEspacios]     = useState(ESPACIOS);
  const [activeEspacio, setActiveEspacio] = useState<Espacio | null>(null);
  const [myAvatarUrl,  setMyAvatarUrl]  = useState<string | undefined>();
  const [myStoryMenu,  setMyStoryMenu]  = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLive,     setShowLive]     = useState(false);
  // ── Momentos state ────────────────────────────────────────────
  const [momentPosts,     setMomentPosts]     = useState<MomentPost[]>([]);
  const [momentLoading,   setMomentLoading]   = useState(false);
  const [momentRefreshing,setMomentRefreshing]= useState(false);
  const [momentCurrentUid,setMomentCurrentUid]= useState('');
  const [commentingPost,  setCommentingPost]  = useState<string | null>(null);
  const [commentText,     setCommentText]     = useState('');
  const [showMomentCreate,setShowMomentCreate]= useState(false);
  const [showMomentCamera,setShowMomentCamera]= useState(false);
  const pendingMediaRef = React.useRef<MomentMedia | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const buStyles  = makeBuStyles(C);
  const mbu       = makeMbuStyles(C);
  const car       = makeCarStyles(C);
  const ed        = makeEdStyles(C);

  const myStories      = myGroup?.stories || [];
  const recentGroups   = useMemo(() => groups.filter(g => !g.seen), [groups]);
  const seenGroups     = useMemo(() => groups.filter(g =>  g.seen), [groups]);
  const displayedGroups = activeTab === 'estados' ? recentGroups : seenGroups;

  const allGroupsForViewer = useMemo<StoryGroup[]>(() => [
    ...(myGroup ? [{ ...myGroup, userName: 'Mi estado' }] : []),
    ...groups,
  ], [myGroup, groups]);

  // ── API ────────────────────────────────────────────────────────
  const loadStories = useCallback(async () => {
    try {
      const [data, me] = await Promise.allSettled([storiesAPI.getAll(), authAPI.me()]);
      const resolvedMeId = me.status === 'fulfilled' ? me.value?.id || '' : '';
      if (me.status === 'fulfilled') {
        setMyAvatarUrl(me.value?.avatar_url || me.value?.avatarUrl);
        setMeId(resolvedMeId);
      }
      if (data.status === 'fulfilled' && Array.isArray(data.value)) {
        const parsed = parseStoriesResponse(data.value, resolvedMeId);
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

  // ── Moments helpers ──────────────────────────────────────────
  const loadMoments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setMomentRefreshing(true); else setMomentLoading(true);
    try { const data = await fetchMomentsData(); setMomentPosts(data); }
    finally { setMomentLoading(false); setMomentRefreshing(false); }
  }, []);

  useEffect(() => {
    authAPI.me().then(me => setMomentCurrentUid(me?.id || '')).catch(() => {});
  }, []);

  const handleMomentLike = useCallback(async (postId: string) => {
    setMomentPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked_by_me: !p.liked_by_me, likes: p.liked_by_me ? p.likes - 1 : p.likes + 1 } : p
    ));
    await toggleMomentLike(postId);
  }, []);

  const handleMomentComment = useCallback(async () => {
    if (!commentingPost || !commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    const comment = await addMomentComment(commentingPost, text);
    if (comment) setMomentPosts(prev => prev.map(p => p.id === commentingPost ? { ...p, comments: [...p.comments, comment] } : p));
  }, [commentingPost, commentText]);

  const handleMomentCameraDone = useCallback(async (media: MomentMedia) => {
    setShowMomentCamera(false);
    let publicUrl = media.uri;
    if (!media.uri.startsWith('http')) {
      const uploaded = await uploadStoryMediaToSupabase(meId || 'unknown', media.uri, media.type === 'video' ? 'video' : 'image');
      if (uploaded) publicUrl = uploaded;
    }
    pendingMediaRef.current = { ...media, uri: publicUrl };
    setShowMomentCreate(true);
  }, [meId]);

  const uploadStory = useCallback(async (uri: string, type: 'image' | 'video' = 'image') => {
    setUploading(true);
    try {
      // Subir el archivo a Supabase Storage para obtener una URL pública
      // permanente accesible desde cualquier dispositivo.
      // Sin este paso, se guardaría la URI local (file://...) que solo
      // existe en el dispositivo del emisor y aparecería en negro para los demás.
      let mediaUrl = uri;
      if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
        const uploaded = await uploadStoryMediaToSupabase(meId || 'unknown', uri, type);
        if (uploaded) {
          mediaUrl = uploaded;
        } else {
          Alert.alert('Error', 'No se pudo subir la imagen al servidor. Verifica tu conexión.');
          return;
        }
      }
      await storiesAPI.create({ media: [{ url: mediaUrl, type }], music: storyMusic ?? undefined } as any);
      setStoryMusic(null);
      await loadStories();
    } catch {
      Alert.alert('Error', 'No se pudo publicar el estado');
    } finally {
      setUploading(false);
    }
  }, [meId, storyMusic, loadStories]);

  const createTextStatus = useCallback(async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00c8a0"/><stop offset="100%" stop-color="#00B4E6"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/><circle cx="200" cy="300" r="220" fill="rgba(255,255,255,0.1)"/><circle cx="900" cy="1600" r="300" fill="rgba(255,255,255,0.08)"/><text x="540" y="900" text-anchor="middle" font-family="Arial,sans-serif" font-size="96" font-weight="800" fill="#fff">Nuevo estado</text><text x="540" y="1020" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" fill="rgba(255,255,255,0.85)">EGChat</text></svg>`;
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
    setShowAddModal(true);
  }, []);

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
                  : <MIcon name="person" size={28} color={C.textSecondary} />}
              </View>
            </LinearGradient>
          ) : (
            <View style={[mbu.ring, { backgroundColor: C.bgTertiary, borderRadius: (BUBBLE_SIZE + 6) / 2, borderWidth: 2, borderColor: C.border, borderStyle: 'dashed' }]}>
              <View style={[buStyles.avatar, { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }]}>
                {myAvatarUrl
                  ? <Image source={{ uri: myAvatarUrl }} style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2 }} />
                  : <MIcon name="person" size={28} color={C.textTertiary} />}
              </View>
            </View>
          )}
          <View style={mbu.addBadge}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.7 }] }} />
              : <MIcon name="add" size={12} color="#fff" />}
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
    <SafeAreaView style={[st.root, { backgroundColor: C.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bgPrimary} />

      {/* HEADER */}
      <View style={[st.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={[st.backBtn, { backgroundColor: C.bgTertiary }]} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Volver">
          <MIcon name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, { color: C.textPrimary }]}>Estados</Text>
          {activeTab === 'estados' && recentGroups.length > 0 && (
            <View style={[st.headerBadge, { backgroundColor: BRAND }]}>
              <Text style={st.headerBadgeText}>{recentGroups.length}</Text>
            </View>
          )}
        </View>
        <View style={st.headerActions}>
          {activeTab === 'estados' && (
            <>
              <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={pickFromGallery} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Galeria">
                <MIcon name="image" size={21} color={C.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={addStory} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo estado">
                <MIcon name="photo-camera" size={21} color={C.textSecondary} />
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'momentos' && (
            <>
              <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={() => setShowMomentCamera(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Camara momentos">
                <MIcon name="photo-camera" size={21} color={C.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[st.headerBtn, { backgroundColor: C.bgTertiary }]} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo momento">
                <MIcon name="add" size={21} color={C.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={[st.tabsWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {([
          { id: 'estados'   as StoryTab, label: 'Estados'  },
          { id: 'streaming' as StoryTab, label: 'Vivos'    },
          { id: 'canales'   as StoryTab, label: 'Canales Dulce' },
          { id: 'momentos'  as StoryTab, label: 'Momentos' },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[st.tab, activeTab === t.id && st.tabActive]}
            onPress={() => {
              setActiveTab(t.id);
              if (t.id === 'momentos' && momentPosts.length === 0) loadMoments();
            }}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === t.id }}
          >
            <Text style={[st.tabText, { color: C.textTertiary }, activeTab === t.id && { color: C.textPrimary, fontWeight: '700' }]}>
              {t.label}
            </Text>
            {activeTab === t.id && <View style={[st.tabIndicator, { backgroundColor: BRAND }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB: ESTADOS ─────────────────────────────────────── */}
      {activeTab === 'estados' && (
        loading ? (
          <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : (
          <ScrollView style={{ flex: 1, backgroundColor: C.bgPrimary }} showsVerticalScrollIndicator={false}>
            <StoriesCarousel />
            {recentGroups.length > 0 && (
              <View style={st.feedLabel}>
                <Text style={[st.feedLabelText, { color: C.textTertiary }]}>TODOS LOS ESTADOS</Text>
              </View>
            )}
            {recentGroups.length > 0 ? recentGroups.map(group => {
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
                <MIcon name="auto-awesome" size={52} color={C.border} />
                <Text style={[st.emptyTitle, { color: C.textSecondary }]}>Todo al dia</Text>
                <Text style={[st.emptySub, { color: C.textTertiary }]}>No hay estados nuevos de tus contactos</Text>
                <TouchableOpacity style={st.emptyBtn} onPress={addStory} activeOpacity={0.85}>
                  <LinearGradient colors={[BRAND, BRAND2]} style={st.emptyBtnGrad}>
                    <MIcon name="add" size={18} color="#fff" />
                    <Text style={st.emptyBtnText}>Publicar estado</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* ── TAB: STREAMINGS / VIVOS ───────────────────────────── */}
      {activeTab === 'streaming' && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bgPrimary }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[BRAND + '22', BRAND2 + '11']} style={st.liveBannerCard}>
            <View style={st.liveDotLarge} />
            <View style={{ flex: 1 }}>
              <Text style={[st.liveBannerTitle, { color: C.textPrimary }]}>Streamings en vivo</Text>
              <Text style={[st.liveBannerSub, { color: C.textSecondary }]}>Proximos streams en directo</Text>
            </View>
            <MIcon name="live-tv" size={32} color={BRAND} />
          </LinearGradient>
          <View style={st.liveEmpty}>
            <MIcon name="videocam" size={64} color={C.border} />
            <Text style={[st.emptyTitle, { color: C.textSecondary, marginTop: 16 }]}>Sin streams activos</Text>
            <Text style={[st.emptySub, { color: C.textTertiary, textAlign: 'center' }]}>
              Cuando alguien inicie un directo aparecera aqui en tiempo real
            </Text>
            <TouchableOpacity
              style={[st.emptyBtn, { marginTop: 24 }]}
              onPress={() => Alert.alert('Proximamente', 'La funcion de streaming llegara muy pronto')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#ef4444', '#f97316']} style={st.emptyBtnGrad}>
                <MIcon name="fiber-manual-record" size={14} color="#fff" />
                <Text style={st.emptyBtnText}>Iniciar directo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── TAB: CANALES DULCE ───────────────────────────────── */}
      {activeTab === 'canales' && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bgPrimary }} showsVerticalScrollIndicator={false}>
          <EspacioDulceTab />
        </ScrollView>
      )}

      {/* ── TAB: MOMENTOS ────────────────────────────────────── */}
      {activeTab === 'momentos' && (
        momentLoading ? (
          <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : (
          <FlatList
            data={momentPosts}
            keyExtractor={p => p.id}
            style={{ flex: 1, backgroundColor: C.bgPrimary }}
            refreshControl={<RefreshControl refreshing={momentRefreshing} onRefresh={() => loadMoments(true)} colors={[BRAND]} tintColor={BRAND} />}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={st.empty}>
                <MIcon name="photo-camera" size={52} color={C.border} />
                <Text style={[st.emptyTitle, { color: C.textSecondary }]}>Sin momentos aun</Text>
                <Text style={[st.emptySub, { color: C.textTertiary }]}>Comparte un momento con tus contactos</Text>
                <TouchableOpacity style={st.emptyBtn} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.85}>
                  <LinearGradient colors={[BRAND, BRAND2]} style={st.emptyBtnGrad}>
                    <MIcon name="add" size={18} color="#fff" />
                    <Text style={st.emptyBtnText}>Publicar momento</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[mps.card, { backgroundColor: C.bgPrimary, borderBottomColor: C.borderLight }]}>
                <View style={mps.header}>
                  <EGAvatar src={item.user_avatar} name={item.user_name} size={44} />
                  <View style={mps.headerInfo}>
                    <Text style={[mps.userName, { color: C.textPrimary }]}>{item.user_name}</Text>
                    <Text style={[mps.time, { color: C.textTertiary }]}>{formatRelativeTime(item.created_at)}</Text>
                  </View>
                  {item.user_id === momentCurrentUid && (
                    <TouchableOpacity onPress={() => Alert.alert('Post', 'Opciones', [
                      { text: 'Eliminar', style: 'destructive', onPress: () => setMomentPosts(p => p.filter(x => x.id !== item.id)) },
                      { text: 'Cancelar', style: 'cancel' },
                    ])}>
                      <MIcon name="more-vert" size={18} color={C.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
                {!!item.text && <Text style={[mps.text, { color: C.textPrimary }]}>{item.text}</Text>}
                {item.images && item.images.length > 0 && (
                  <View style={mps.imagesGrid}>
                    {item.images.slice(0, 4).map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={[mps.image, item.images!.length === 1 && mps.imageSingle, item.images!.length === 2 && mps.imageHalf]}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                <View style={mps.actions}>
                  <TouchableOpacity style={mps.actionBtn} onPress={() => handleMomentLike(item.id)}>
                    <MIcon name={item.liked_by_me ? 'favorite' : 'favorite-border'} size={18} color={item.liked_by_me ? '#ef4444' : C.textTertiary} />
                    <Text style={[mps.actionCount, { color: item.liked_by_me ? '#ef4444' : C.textTertiary }]}>{item.likes > 0 ? item.likes : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={mps.actionBtn} onPress={() => setCommentingPost(commentingPost === item.id ? null : item.id)}>
                    <MIcon name="chat-bubble-outline" size={18} color={C.textTertiary} />
                    <Text style={[mps.actionCount, { color: C.textTertiary }]}>{item.comments.length > 0 ? item.comments.length : ''}</Text>
                  </TouchableOpacity>
                </View>
                {item.comments.length > 0 && (
                  <View style={[mps.commentsSection, { backgroundColor: C.bgSecondary }]}>
                    {item.comments.map(c => (
                      <View key={c.id} style={mps.commentRow}>
                        <Text style={[mps.commentUser, { color: BRAND }]}>{c.user_name}: </Text>
                        <Text style={[mps.commentText, { color: C.textPrimary }]}>{c.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {commentingPost === item.id && (
                  <View style={[mps.commentInput, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
                    <TextInput
                      style={[mps.commentInputText, { color: C.textPrimary }]}
                      placeholder="Escribe un comentario..."
                      placeholderTextColor={C.textTertiary}
                      value={commentText}
                      onChangeText={setCommentText}
                      autoFocus
                      returnKeyType="send"
                      onSubmitEditing={handleMomentComment}
                    />
                    <TouchableOpacity onPress={handleMomentComment} disabled={!commentText.trim()}>
                      <MIcon name="send" size={20} color={commentText.trim() ? BRAND : C.textTertiary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )
      )}

      {/* MODAL MENU MI ESTADO */}
      <Modal visible={myStoryMenu} transparent animationType="fade" onRequestClose={() => setMyStoryMenu(false)}>
        <Pressable style={st.menuBackdrop} onPress={() => setMyStoryMenu(false)}>
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={[st.menuCard, { borderColor: C.borderLight }]}>
            {([
              { icon: 'image'      as const, color: '#a855f7', label: 'Subir foto/video', onPress: () => { addStory(); setMyStoryMenu(false); } },
              { icon: 'add-circle' as const, color: BRAND,     label: 'Anadir estado',   onPress: () => { addStory(); setMyStoryMenu(false); } },
              { icon: 'visibility' as const, color: BRAND2,    label: 'Ver mi estado',   onPress: () => { if (myStories.length) setViewingGroup(0); setMyStoryMenu(false); } },
            ] as const).map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[st.menuItem, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight }]}
                onPress={item.onPress}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[st.menuIconWrap, { backgroundColor: item.color + '22' }]}>
                  <MIcon name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[st.menuItemText, { color: C.textPrimary }]}>{item.label}</Text>
                <MIcon name="chevron-right" size={14} color={C.border} />
              </TouchableOpacity>
            ))}
            {myGroup?.storyId && myStories.length > 0 && (
              <TouchableOpacity
                style={st.menuItem}
                onPress={() => { deleteStory(myGroup.storyId); setMyStoryMenu(false); }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Eliminar mi estado"
              >
                <View style={[st.menuIconWrap, { backgroundColor: '#ef444422' }]}>
                  <MIcon name="delete" size={18} color="#ef4444" />
                </View>
                <Text style={[st.menuItemText, { color: '#ef4444' }]}>Eliminar todo</Text>
                <MIcon name="chevron-right" size={14} color={C.border} />
              </TouchableOpacity>
            )}
          </BlurView>
        </Pressable>
      </Modal>

      {/* VISOR DE STORIES */}
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
              <MIcon name="arrow-back" size={22} color="#fff" />
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
                    <Text style={{ color: C.textTertiary, fontSize: 11, marginTop: 1 }}>{p.time}{p.isOfficial ? ' · Oficial' : ''}</Text>
                  </View>
                </View>
                <Text style={{ color: C.textPrimary, fontSize: 14, lineHeight: 20 }}>{p.text}</Text>
                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 10 }}>likes: {p.likes} · comentarios: {p.comments}</Text>
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
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Publicar con musica</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.musicCancelBtn, { backgroundColor: C.bgTertiary }]} onPress={() => setStoryMusic(null)}>
              <MIcon name="close" size={16} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL CREAR MOMENTO */}
      <MomentCreateModal
        visible={showMomentCreate}
        onClose={() => setShowMomentCreate(false)}
        onCreated={(post) => { setMomentPosts(prev => [post, ...prev]); setShowMomentCreate(false); }}
        C={C}
        isDark={isDark}
      />

      {/* MODAL ANADIR ESTADO */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={stAdd.backdrop} onPress={() => setShowAddModal(false)}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={stAdd.sheet} pointerEvents="box-none">
          <View style={[stAdd.card, { backgroundColor: isDark ? 'rgba(18,24,32,0.94)' : 'rgba(255,255,255,0.97)' }]}>
            <Text style={[stAdd.title, { color: C.textPrimary }]}>Anadir estado</Text>
            <View style={stAdd.row}>
              <TouchableOpacity style={stAdd.item} onPress={() => { setShowAddModal(false); createTextStatus().catch(() => {}); }} activeOpacity={0.6}>
                <MIcon name="edit" size={22} color={C.textSecondary} />
                <Text style={[stAdd.label, { color: C.textTertiary }]}>Texto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stAdd.item} onPress={async () => { setShowAddModal(false); const a = await pickImageFromCamera().catch(() => null); if (a) await uploadStory(a.uri, 'image'); }} activeOpacity={0.6}>
                <MIcon name="photo-camera" size={22} color={C.textSecondary} />
                <Text style={[stAdd.label, { color: C.textTertiary }]}>Camara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stAdd.item} onPress={() => { setShowAddModal(false); pickFromGallery(); }} activeOpacity={0.6}>
                <MIcon name="image" size={22} color={C.textSecondary} />
                <Text style={[stAdd.label, { color: C.textTertiary }]}>Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stAdd.item} onPress={async () => { setShowAddModal(false); const a = await pickVideo().catch(() => null); if (a) await uploadStory(a.uri, 'video'); }} activeOpacity={0.6}>
                <MIcon name="videocam" size={22} color={C.textSecondary} />
                <Text style={[stAdd.label, { color: C.textTertiary }]}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stAdd.item} onPress={async () => { setShowAddModal(false); const a = await pickVideoFromCamera().catch(() => null); if (a) await uploadStory(a.uri, 'video'); }} activeOpacity={0.6}>
                <MIcon name="fiber-manual-record" size={22} color={C.textSecondary} />
                <Text style={[stAdd.label, { color: C.textTertiary }]}>Grabar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={stAdd.cancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.7}>
              <Text style={[stAdd.cancelText, { color: C.textTertiary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL CREAR MOMENTO (extraido para limpieza)
// ══════════════════════════════════════════════════════════════════
function MomentCreateModal({
  visible, onClose, onCreated, C, isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
  isDark: boolean;
}) {
  const [text, setText] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const insets = useSafeAreaInsets();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Sin permiso para galeria'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 9));
    }
  };

  const handleCreate = async () => {
    if (!text.trim() && images.length === 0) { Alert.alert('Escribe algo o anade una foto'); return; }
    setCreating(true);
    try {
      const post = await createMomentPost(text.trim(), images);
      if (post) { onCreated(post); setText(''); setImages([]); }
    } finally { setCreating(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bgPrimary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, paddingTop: insets.top + 10, gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' }}>Nuevo momento</Text>
          <TouchableOpacity onPress={handleCreate} disabled={creating}
            style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }}>
            {creating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Publicar</Text>}
          </TouchableOpacity>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <TextInput
            style={{ fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, padding: 12, lineHeight: 22, color: C.textPrimary }}
            placeholder="Que esta pasando?"
            placeholderTextColor={C.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            autoFocus
          />
          <Text style={{ fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16, color: C.textTertiary }}>{text.length}/500</Text>
          {images.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {images.map((uri, i) => (
                <View key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity
                  style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' }}
                  onPress={handlePickImage}
                >
                  <MIcon name="add" size={24} color={C.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, borderRadius: 10, padding: 16, marginTop: 8 }}
              onPress={handlePickImage}
            >
              <MIcon name="image" size={24} color={C.textTertiary} />
              <Text style={{ fontSize: 15, color: C.textTertiary }}>Anadir fotos</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS MOMENTOS
// ══════════════════════════════════════════════════════════════════
const mps = StyleSheet.create({
  card:            { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 2 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  headerInfo:      { flex: 1 },
  userName:        { fontSize: 15, fontWeight: '700' },
  time:            { fontSize: 12, marginTop: 1 },
  text:            { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  imagesGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 10 },
  image:           { width: 120, height: 120, borderRadius: 6 },
  imageSingle:     { width: '100%', height: 220, borderRadius: 10 },
  imageHalf:       { width: '49%', height: 160, borderRadius: 8 },
  actions:         { flexDirection: 'row', gap: 20, paddingTop: 6, paddingBottom: 4 },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount:     { fontSize: 13, fontWeight: '600' },
  commentsSection: { borderRadius: 10, padding: 10, marginTop: 8, gap: 4 },
  commentRow:      { flexDirection: 'row', flexWrap: 'wrap' },
  commentUser:     { fontSize: 13, fontWeight: '700' },
  commentText:     { fontSize: 13, flex: 1 },
  commentInput:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  commentInputText:{ flex: 1, fontSize: 14, paddingVertical: 6 },
});

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
    paddingHorizontal: 8, paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabActive:    {},
  tabText:      { fontSize: 12, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2.5, borderRadius: 2 },

  feedLabel:     { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  feedLabelText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  empty:        { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn:     { borderRadius: 14, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Streaming tab
  liveBannerCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: BRAND + '33' },
  liveDotLarge:    { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' },
  liveBannerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  liveBannerSub:   { fontSize: 12 },
  liveEmpty:       { alignItems: 'center', paddingVertical: 40 },

  menuBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingBottom: 34 },
  menuCard:       { marginHorizontal: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  menuItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
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

const TILE_GAP = 10;
const TILE_SIZE = (W - 48 - TILE_GAP) / 2;

const stAdd = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { flex: 1, justifyContent: 'flex-end', paddingBottom: 32, paddingHorizontal: 16 },
  card:     { borderRadius: 24, padding: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(128,128,128,0.15)' },
  title:    { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  row:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12, marginBottom: 12 },
  item:     { alignItems: 'center', gap: 6, width: 60 },
  label:    { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  cancelBtn:  { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
