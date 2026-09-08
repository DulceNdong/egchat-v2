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
import { storiesAPI, authAPI, getToken, getApiBase } from '../src/api';
import { notifyNewStory, notifyLiveStarted } from '../src/notifications';
import { supabase } from '../src/supabase';
import {
  pickImageFromCamera, pickImageFromLibrary,
  pickVideo, pickVideoFromCamera,
} from '../src/utils/chatMedia';
import { uploadStoryMediaToSupabase } from '../src/utils/storyMediaStorage';
import { MIcon } from '../src/components/ui/MIcon';
import { parseStoriesResponse, initialsFor, type StoryGroup } from '../src/utils/storyParser';
import { EGAvatar } from '../src/components/ui';
import { StoryMusicPicker, StoryMusicBadge, type StoryMusic } from '../src/components/StoryMusicPicker';
import { Colors } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import Svg, { Path, Circle, Rect, G, Line, Polyline } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
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
      // Notificar a contactos via push
      try {
        const me = await authAPI.me();
        const stories = await storiesAPI.getAll();
        const myLatest = Array.isArray(stories)
          ? stories.find((s: any) => s.userId === me?.id || s.user_id === me?.id)
          : null;
        if (myLatest?.id && me?.full_name) {
          notifyNewStory({ storyId: myLatest.id, authorName: me.full_name }).catch(() => {});
        }
      } catch {}
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
  // ── Canales Dulce — EGChat Edition ─────────────────────────
  const [chList,       setChList]       = React.useState<any[]>([]);
  const [chLoading,    setChLoading]    = React.useState(false);
  const [chRefreshing, setChRefreshing] = React.useState(false);
  const [chSearch,     setChSearch]     = React.useState('');
  const [chCategory,   setChCategory]   = React.useState('Todos');
  const [chTab,        setChTab]        = React.useState<'discover'|'following'>('discover');
  const [chDetail,     setChDetail]     = React.useState<any | null>(null);

  const CH_CATEGORIES = [
    { id: 'Todos',          emoji: '🌐' },
    { id: 'Gobierno',       emoji: '🏛️' },
    { id: 'Noticias',       emoji: '📰' },
    { id: 'Musica',         emoji: '🎵' },
    { id: 'Deportes',       emoji: '⚽' },
    { id: 'Negocios',       emoji: '💼' },
    { id: 'Tecnologia',     emoji: '💻' },
    { id: 'Salud',          emoji: '🏥' },
    { id: 'Entretenimiento',emoji: '🎬' },
  ];

  const loadChannels = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setChRefreshing(true); else setChLoading(true);
    try {
      const api = await import('../src/api');
      const token = await api.getToken();
      const res = await fetch(`${api.getApiBase()}/api/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const data = await res.json(); setChList(data); }
    } catch {}
    finally { setChLoading(false); setChRefreshing(false); }
  }, []);

  const handleChFollow = React.useCallback(async (ch: any) => {
    // Optimistic update
    setChList(prev => prev.map((c: any) =>
      c.id === ch.id
        ? { ...c, followed: !c.followed, followers_count: !c.followed ? (c.followers_count||0)+1 : Math.max((c.followers_count||0)-1,0) }
        : c
    ));
    try {
      const api = await import('../src/api');
      const token = await api.getToken();
      await fetch(`${api.getApiBase()}/api/channels/${ch.id}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }, []);

  const chFiltered = React.useMemo(() => chList.filter((ch: any) => {
    if (chTab === 'following' && !ch.followed) return false;
    if (chCategory !== 'Todos' && ch.category !== chCategory) return false;
    if (chSearch && !ch.name.toLowerCase().includes(chSearch.toLowerCase())) return false;
    return true;
  }), [chList, chTab, chCategory, chSearch]);

  const formatChCount = (n: number) => {
    if ((n||0) >= 1000000) return `${((n||0)/1000000).toFixed(1)}M`;
    if ((n||0) >= 1000) return `${((n||0)/1000).toFixed(1)}K`;
    return String(n||0);
  };

  // Card visual tipo "canal" — banner + info
  const ChannelCard = React.useCallback(({ ch, onFollow, onOpen }: { ch: any; onFollow: () => void; onOpen: () => void }) => {
    const catColor = ch.category === 'Gobierno' ? '#1d4ed8' : ch.category === 'Musica' ? '#7c3aed' : ch.category === 'Deportes' ? '#16a34a' : ch.category === 'Noticias' ? '#dc2626' : ch.category === 'Negocios' ? '#b45309' : ch.category === 'Tecnologia' ? '#0891b2' : BRAND;
    const catEmoji = CH_CATEGORIES.find(c => c.id === ch.category)?.emoji || '📡';
    return (
      <TouchableOpacity style={[chst.channelCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={onOpen} activeOpacity={0.88}>
        {/* Banner superior con gradiente de color de categoría */}
        <LinearGradient colors={[catColor, catColor + '88']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={chst.channelBanner}>
          {ch.banner_url
            ? <Image source={{ uri: ch.banner_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <Text style={{ fontSize: 38 }}>{catEmoji}</Text>
          }
          {ch.verified && (
            <View style={chst.verifiedPill}>
              <MIcon name="verified" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 3 }}>Oficial</Text>
            </View>
          )}
        </LinearGradient>

        {/* Avatar superpuesto */}
        <View style={chst.avatarRow}>
          <View style={[chst.avatarWrap, { borderColor: C.bgSecondary }]}>
            <EGAvatar src={ch.avatar_url} name={ch.name} size={44} />
          </View>
          <TouchableOpacity
            style={[chst.followPill, ch.followed && { backgroundColor: BRAND + '20', borderColor: BRAND }]}
            onPress={onFollow}
            activeOpacity={0.8}
          >
            <MIcon name={ch.followed ? 'notifications-active' : 'notifications-none'} size={14} color={ch.followed ? BRAND : C.textTertiary} />
            <Text style={[chst.followPillText, { color: ch.followed ? BRAND : C.textTertiary }]}>
              {ch.followed ? 'Suscrito' : 'Suscribirse'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <Text style={[chst.chName, { color: C.textPrimary }]} numberOfLines={1}>{ch.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={[chst.catTag, { backgroundColor: catColor + '20' }]}>
              <Text style={[chst.catTagText, { color: catColor }]}>{catEmoji} {ch.category}</Text>
            </View>
            <Text style={[chst.chFollowers, { color: C.textTertiary }]}>
              {formatChCount(ch.followers_count||0)} suscritos
            </Text>
          </View>
          {!!ch.description && (
            <Text style={[chst.chDesc, { color: C.textTertiary }]} numberOfLines={2}>{ch.description}</Text>
          )}
          {ch.last_post?.text && (
            <View style={[chst.lastPostWrap, { backgroundColor: C.bgTertiary }]}>
              <MIcon name="campaign" size={13} color={C.textTertiary} />
              <Text style={[chst.lastPostText, { color: C.textSecondary }]} numberOfLines={1}>{ch.last_post.text}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [C, CH_CATEGORIES]);

  const CanalesDulceTab = React.useCallback(() => {
    React.useEffect(() => { if (chList.length === 0) loadChannels(); }, []);
    const featured = chFiltered[0] || null;
    const rest = chFiltered.slice(1);
    return (
      <View style={{ flex: 1 }}>
        {/* Barra superior: sub-tabs + busqueda */}
        <View style={[chst.topBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <View style={chst.subTabs}>
            {(['discover','following'] as const).map(t => (
              <TouchableOpacity key={t} style={[chst.subTab, chTab === t && { borderBottomColor: BRAND, borderBottomWidth: 2.5 }]} onPress={() => setChTab(t)}>
                <Text style={[chst.subTabText, { color: chTab === t ? BRAND : C.textTertiary }]}>
                  {t === 'discover' ? 'Explorar' : 'Mis canales'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[chst.searchRow, { backgroundColor: C.bgTertiary }]}>
            <MIcon name="search" size={16} color={C.textTertiary} />
            <TextInput
              style={[chst.searchInput, { color: C.textPrimary }]}
              placeholder="Buscar..."
              placeholderTextColor={C.textTertiary}
              value={chSearch}
              onChangeText={setChSearch}
            />
            {!!chSearch && (
              <TouchableOpacity onPress={() => setChSearch('')}>
                <MIcon name="close" size={16} color={C.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtro de categorias */}
        {chTab === 'discover' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6, paddingVertical: 10 }}>
            {CH_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[chst.catChip, chCategory === cat.id && { backgroundColor: BRAND, borderColor: BRAND }]}
                onPress={() => setChCategory(cat.id)}
              >
                <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                <Text style={[chst.catChipText, chCategory === cat.id && { color: '#fff' }]}>{cat.id}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {chLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={BRAND} size="large" />
          </View>
        ) : (
          <FlatList
            data={chTab === 'discover' && !chSearch && chCategory === 'Todos' ? rest : chFiltered}
            keyExtractor={(c: any) => c.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 60, paddingTop: 4 }}
            refreshControl={<RefreshControl refreshing={chRefreshing} onRefresh={() => loadChannels(true)} colors={[BRAND]} tintColor={BRAND} />}
            ListHeaderComponent={
              // Canal destacado solo en Explorar sin filtros
              chTab === 'discover' && !chSearch && chCategory === 'Todos' && featured ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={[chst.sectionLabel, { color: C.textTertiary }]}>DESTACADO</Text>
                  <ChannelCard
                    ch={featured}
                    onFollow={() => handleChFollow(featured)}
                    onOpen={() => setChDetail(featured)}
                  />
                </View>
              ) : null
            }
            renderItem={({ item: ch }: { item: any }) => (
              <ChannelCard
                ch={ch}
                onFollow={() => handleChFollow(ch)}
                onOpen={() => setChDetail(ch)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={[st.empty, { marginTop: 40 }]}>
                <MIcon name="cell-tower" size={56} color={C.border} />
                <Text style={[st.emptyTitle, { color: C.textSecondary }]}>
                  {chTab === 'following' ? 'Sin canales suscritos' : 'Sin resultados'}
                </Text>
                <Text style={[st.emptySub, { color: C.textTertiary }]}>
                  {chTab === 'following' ? 'Explora y suscribete a canales' : 'Prueba otra busqueda o categoria'}
                </Text>
              </View>
            }
          />
        )}

        {/* Panel detalle canal */}
        <Modal visible={!!chDetail} animationType="slide" onRequestClose={() => setChDetail(null)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPrimary }} edges={['top']}>
            {chDetail && (
              <>
                {/* Header con banner */}
                <View style={{ position: 'relative' }}>
                  <LinearGradient
                    colors={[chDetail.category === 'Gobierno' ? '#1d4ed8' : chDetail.category === 'Musica' ? '#7c3aed' : chDetail.category === 'Deportes' ? '#16a34a' : BRAND, BRAND2]}
                    style={{ height: 160 }}
                  >
                    {chDetail.banner_url && <Image source={{ uri: chDetail.banner_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
                  </LinearGradient>
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setChDetail(null)}
                  >
                    <MIcon name="arrow-back" size={20} color="#fff" />
                  </TouchableOpacity>
                  {/* Avatar superpuesto en el banner */}
                  <View style={{ position: 'absolute', bottom: -28, left: 20, borderRadius: 32, borderWidth: 3, borderColor: C.bgPrimary, overflow: 'hidden' }}>
                    <EGAvatar src={chDetail.avatar_url} name={chDetail.name} size={56} />
                  </View>
                </View>
                {/* Info canal */}
                <View style={{ paddingHorizontal: 16, paddingTop: 36, paddingBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: C.textPrimary }}>{chDetail.name}</Text>
                      <Text style={{ fontSize: 12, color: BRAND, fontWeight: '700', marginTop: 2 }}>{chDetail.category}</Text>
                    </View>
                    <TouchableOpacity
                      style={[chst.followPill, chDetail.followed && { backgroundColor: BRAND + '20', borderColor: BRAND }, { paddingHorizontal: 16, paddingVertical: 9 }]}
                      onPress={() => { handleChFollow(chDetail); setChDetail((p: any) => p ? { ...p, followed: !p.followed } : p); }}
                      activeOpacity={0.8}
                    >
                      <MIcon name={chDetail.followed ? 'notifications-active' : 'notifications-none'} size={15} color={chDetail.followed ? BRAND : C.textTertiary} />
                      <Text style={[chst.followPillText, { color: chDetail.followed ? BRAND : C.textTertiary, fontSize: 13 }]}>
                        {chDetail.followed ? 'Suscrito' : 'Suscribirse'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: C.textTertiary, marginTop: 6, lineHeight: 20 }}>{chDetail.description}</Text>
                  <Text style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>
                    {formatChCount(chDetail.followers_count||0)} suscritos
                  </Text>
                </View>
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.borderLight }} />
                {/* Posts del canal */}
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                  {chDetail.posts?.length > 0 ? chDetail.posts.map((p: any) => (
                    <View key={p.id} style={[chst.postCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                        <View style={[chst.postAvatar, { backgroundColor: BRAND }]}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{(p.avatar||chDetail.name||'?').slice(0,2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '700' }}>{p.author||chDetail.name}</Text>
                          <Text style={{ color: C.textTertiary, fontSize: 11 }}>{p.time||''}{p.isOfficial ? ' · Oficial' : ''}</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textPrimary, fontSize: 14, lineHeight: 20 }}>{p.text}</Text>
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MIcon name="favorite-border" size={14} color={C.textTertiary} />
                          <Text style={{ fontSize: 12, color: C.textTertiary }}>{p.likes||0}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MIcon name="chat-bubble-outline" size={14} color={C.textTertiary} />
                          <Text style={{ fontSize: 12, color: C.textTertiary }}>{p.comments||0}</Text>
                        </View>
                      </View>
                    </View>
                  )) : (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <MIcon name="campaign" size={48} color={C.border} />
                      <Text style={{ color: C.textSecondary, marginTop: 12, fontSize: 15, fontWeight: '600' }}>Sin publicaciones aun</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    );
  }, [chList, chLoading, chRefreshing, chSearch, chCategory, chTab, chFiltered, chDetail, C, ChannelCard]);


  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[st.root, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#00C8A0" translucent />

      {/* HEADER */}
      <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Volver">
          <MIcon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, { color: '#fff' }]}>Estados</Text>
          {activeTab === 'estados' && recentGroups.length > 0 && (
            <View style={[st.headerBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={st.headerBadgeText}>{recentGroups.length}</Text>
            </View>
          )}
        </View>
        <View style={st.headerActions}>
          {activeTab === 'estados' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={pickFromGallery} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Galeria">
                <MIcon name="image" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={addStory} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo estado">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'momentos' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={() => setShowMomentCamera(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Camara momentos">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo momento">
                <MIcon name="add" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

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
              <Text style={[st.liveBannerSub, { color: C.textSecondary }]}>Inicia o únete a un directo</Text>
            </View>
            <MIcon name="live-tv" size={32} color={BRAND} />
          </LinearGradient>
          <View style={st.liveEmpty}>
            <MIcon name="videocam" size={64} color={C.border} />
            <Text style={[st.emptyTitle, { color: C.textSecondary, marginTop: 16 }]}>Sin streams activos</Text>
            <Text style={[st.emptySub, { color: C.textTertiary, textAlign: 'center' }]}>
              Cuando alguien inicie un directo aparecerá aquí en tiempo real
            </Text>
            <TouchableOpacity
              style={[st.emptyBtn, { marginTop: 24 }]}
              onPress={() => setShowLive(true)}
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
          <CanalesDulceTab />
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

      {/* ── Live Stream Modal ──────────────────────────────────── */}
      <LiveStreamModal
        visible={showLive}
        hostId={meId}
        hostName={myGroup?.userName || ''}
        hostAvatar={myAvatarUrl}
        onClose={() => setShowLive(false)}
      />
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
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14,
  },
  backBtn:         { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerBadge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  headerActions:   { flexDirection: 'row', gap: 4 },
  headerBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },

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

// ══════════════════════════════════════════════════════════════════
// LIVE STREAM MODAL
// Broadcast en vivo con cámara, efectos y reacciones en tiempo real
// ══════════════════════════════════════════════════════════════════

interface LiveReaction { id: string; emoji: string; userName: string; }
interface LiveComment  { id: string; text: string; userName: string; createdAt: number; }
interface LiveViewer   { userId: string; userName: string; avatarUrl?: string; }

interface LiveStreamModalProps {
  visible: boolean;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  onClose: () => void;
}

const LIVE_EFFECTS = [
  { id: 'none',    label: 'Normal',   emoji: '🎥' },
  { id: 'beauty',  label: 'Beauty',   emoji: '✨' },
  { id: 'vivid',   label: 'Vívido',   emoji: '🌈' },
  { id: 'dramatic',label: 'Drama',    emoji: '🎭' },
  { id: 'neon',    label: 'Neón',     emoji: '💜' },
  { id: 'retro',   label: 'Retro',    emoji: '📷' },
];

function LiveStreamModal({ visible, hostId, hostName, hostAvatar, onClose }: LiveStreamModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [isLive,          setIsLive]          = useState(false);
  const [liveId,          setLiveId]          = useState<string | null>(null);
  const [viewers,         setViewers]         = useState<LiveViewer[]>([]);
  const [reactions,       setReactions]       = useState<LiveReaction[]>([]);
  const [comments,        setComments]        = useState<LiveComment[]>([]);
  const [commentDraft,    setCommentDraft]    = useState('');
  const [facing,          setFacing]          = useState<CameraType>('front');
  const [flash,           setFlash]           = useState<'off' | 'on'>('off');
  const [duration,        setDuration]        = useState(0);
  const [showEffects,     setShowEffects]     = useState(false);
  const [selectedEffect,  setSelectedEffect]  = useState('none');

  const cameraRef   = useRef<CameraView>(null);
  const timerRef2   = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef2 = useRef<any>(null);
  const scrollRef   = useRef<any>(null);

  useEffect(() => {
    if (!visible) { stopLive(); }
  }, [visible]);

  const startLive = useCallback(async () => {
    if (!camPerm?.granted)  await requestCamPerm();
    if (!micPerm?.granted)  await requestMicPerm();
    if (!camPerm?.granted || !micPerm?.granted) {
      Alert.alert('Permisos', 'Necesitas cámara y micrófono para el live');
      return;
    }
    try {
      const BASE  = getApiBase();
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/live/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'En vivo' }),
      });
      let id = `live-${Date.now()}`;
      if (res.ok) { const d = await res.json(); id = d.liveId || id; }

      setLiveId(id);
      setIsLive(true);
      setDuration(0);
      timerRef2.current = setInterval(() => setDuration(d => d + 1), 1000);

      // Notificar a contactos
      notifyLiveStarted({ liveId: id, hostName: hostName || 'Tu contacto' }).catch(() => {});

      // Supabase Realtime — escuchar reacciones y comentarios del público
      const ch = supabase.channel(`live:${id}`)
        .on('broadcast', { event: 'reaction' }, ({ payload }: any) => {
          const r: LiveReaction = { id: `r-${Date.now()}-${Math.random()}`, emoji: payload.emoji, userName: payload.userName };
          setReactions(prev => [...prev.slice(-20), r]);
          setTimeout(() => setReactions(prev => prev.filter(x => x.id !== r.id)), 3000);
        })
        .on('broadcast', { event: 'comment' }, ({ payload }: any) => {
          setComments(prev => [...prev.slice(-50), {
            id: `c-${Date.now()}`, text: payload.text, userName: payload.userName, createdAt: Date.now(),
          }]);
        })
        .on('broadcast', { event: 'viewer_join' }, ({ payload }: any) => {
          setViewers(prev => prev.find(v => v.userId === payload.userId) ? prev : [...prev, payload]);
        })
        .on('broadcast', { event: 'viewer_leave' }, ({ payload }: any) => {
          setViewers(prev => prev.filter(v => v.userId !== payload.userId));
        })
        .subscribe();
      channelRef2.current = ch;
    } catch {
      Alert.alert('Error', 'No se pudo iniciar el live');
    }
  }, [camPerm, micPerm, requestCamPerm, requestMicPerm, hostName]);

  const stopLive = useCallback(async () => {
    if (timerRef2.current) { clearInterval(timerRef2.current); timerRef2.current = null; }
    if (channelRef2.current) { await supabase.removeChannel(channelRef2.current).catch(() => {}); channelRef2.current = null; }
    if (liveId) {
      try {
        const token = await getToken();
        await fetch(`${getApiBase()}/api/live/${liveId}/end`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
    setIsLive(false); setLiveId(null); setViewers([]); setReactions([]); setComments([]); setDuration(0);
  }, [liveId]);

  const sendComment = useCallback(async () => {
    const text = commentDraft.trim();
    if (!text || !liveId) return;
    setCommentDraft('');
    setComments(prev => [...prev.slice(-50), { id: `c-${Date.now()}`, text, userName: hostName || 'Yo', createdAt: Date.now() }]);
    channelRef2.current?.send({ type: 'broadcast', event: 'comment', payload: { text, userName: hostName || 'Yo' } }).catch(() => {});
  }, [commentDraft, liveId, hostName]);

  const fmt = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2,'0')}:${Math.floor((s % 3600) / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent
      onRequestClose={() => { stopLive(); onClose(); }}>
      <View style={lv.root}>
        {isLive
          ? <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />
          : <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#16213e']} style={StyleSheet.absoluteFill} />
        }
        <View style={lv.overlay} pointerEvents="none" />

        {/* Header */}
        <SafeAreaView style={lv.header}>
          <TouchableOpacity style={lv.closeBtn}
            onPress={() => Alert.alert('Terminar', '¿Terminar la transmisión?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Terminar', style: 'destructive', onPress: () => { stopLive(); onClose(); } },
            ])}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {isLive
              ? <View style={lv.liveBadge}><View style={lv.liveDot}/><Text style={lv.liveBadgeText}>EN VIVO  {fmt(duration)}</Text></View>
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Transmisión en vivo</Text>
            }
          </View>
          <View style={lv.viewersBadge}>
            <Text style={{ fontSize: 13 }}>👁️</Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{viewers.length}</Text>
          </View>
        </SafeAreaView>

        {/* Reacciones flotantes */}
        <View style={lv.floatingReactions} pointerEvents="none">
          {reactions.map(r => <Text key={r.id} style={lv.floatingEmoji}>{r.emoji}</Text>)}
        </View>

        {/* Sidebar de controles */}
        {isLive && (
          <View style={[lv.sidebar, { bottom: insets.bottom + 210 }]}>
            <TouchableOpacity style={lv.sideBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <Path d="M1 4v6h6"/><Path d="M23 20v-6h-6"/>
                <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={lv.sideBtn} onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}>
              <Text style={{ fontSize: 22 }}>{flash === 'off' ? '⚡' : '🔦'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[lv.sideBtn, showEffects && lv.sideBtnActive]} onPress={() => setShowEffects(s => !s)}>
              <Text style={{ fontSize: 22 }}>🎭</Text>
              <Text style={lv.sideBtnLabel}>Efectos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Panel de efectos */}
        {showEffects && isLive && (
          <View style={[lv.effectsPanel, { bottom: insets.bottom + 210 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 12 }}>
              {LIVE_EFFECTS.map(ef => (
                <TouchableOpacity key={ef.id}
                  style={[lv.effectBtn, selectedEffect === ef.id && lv.effectBtnActive]}
                  onPress={() => { setSelectedEffect(ef.id); setShowEffects(false); }}>
                  <Text style={{ fontSize: 26 }}>{ef.emoji}</Text>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{ef.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Feed de comentarios */}
        {isLive && (
          <View style={[lv.commentsPanel, { bottom: insets.bottom + 80 }]}>
            <ScrollView
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={scrollRef as any}
              style={{ maxHeight: 180 }}
              onContentSizeChange={() => (scrollRef.current as any)?.scrollToEnd?.({ animated: true })}
              showsVerticalScrollIndicator={false}>
              {comments.map(c => (
                <View key={c.id} style={lv.commentRow}>
                  <Text style={lv.commentUser}>{c.userName} </Text>
                  <Text style={lv.commentText}>{c.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input de comentario */}
        {isLive && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[lv.inputWrap, { paddingBottom: insets.bottom + 12 }]}>
            <View style={lv.inputRow}>
              <TextInput
                style={lv.input}
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Añade un comentario..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="send"
                onSubmitEditing={sendComment}
              />
              <TouchableOpacity onPress={sendComment} disabled={!commentDraft.trim()} style={lv.sendBtn}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                  stroke={commentDraft.trim() ? '#00C8A0' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={2} strokeLinecap="round">
                  <Line x1="22" y1="2" x2="11" y2="13"/><Polyline points="22 2 15 22 11 13 2 9 22 2"/>
                </Svg>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* CTA iniciar / detener */}
        {!isLive ? (
          <View style={[lv.startWrap, { paddingBottom: insets.bottom + 36 }]}>
            <Text style={lv.startHint}>Tus contactos recibirán una notificación 🔔</Text>
            <TouchableOpacity style={lv.startBtn} onPress={startLive} activeOpacity={0.85}>
              <LinearGradient colors={['#ff3b30', '#ff6b35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={lv.startBtnGrad}>
                <View style={lv.startDot}/>
                <Text style={lv.startBtnText}>Iniciar transmisión en vivo</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[lv.stopWrap, { paddingBottom: insets.bottom + 36 }]}>
            <TouchableOpacity style={lv.stopBtn}
              onPress={() => Alert.alert('Terminar live', '¿Seguro?', [
                { text: 'No', style: 'cancel' },
                { text: 'Sí, terminar', style: 'destructive', onPress: () => { stopLive(); onClose(); } },
              ])}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>⏹  Terminar live</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ── Estilos LiveStreamModal ───────────────────────────────────────
const lv = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#000' },
  overlay:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  closeBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  liveBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff3b30', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },
  liveDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText:    { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  viewersBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  floatingReactions:{ position: 'absolute', right: 16, bottom: '35%', gap: 10, alignItems: 'center' },
  floatingEmoji:    { fontSize: 38, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  sidebar:          { position: 'absolute', right: 14, gap: 12 },
  sideBtn:          { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: 2 },
  sideBtnActive:    { backgroundColor: 'rgba(0,200,160,0.3)', borderWidth: 2, borderColor: '#00C8A0' },
  sideBtnLabel:     { color: '#fff', fontSize: 9, fontWeight: '600' },
  effectsPanel:     { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.78)', paddingVertical: 14 },
  effectBtn:        { alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', minWidth: 64 },
  effectBtnActive:  { borderColor: '#00C8A0', backgroundColor: 'rgba(0,200,160,0.15)' },
  commentsPanel:    { position: 'absolute', left: 12, right: 70 },
  commentRow:       { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  commentUser:      { color: '#00C8A0', fontWeight: '700', fontSize: 13 },
  commentText:      { color: '#fff', fontSize: 13 },
  inputWrap:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14 },
  inputRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 26, paddingHorizontal: 14, paddingVertical: 8 },
  input:            { flex: 1, color: '#fff', fontSize: 14 },
  sendBtn:          { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  startWrap:        { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 28 },
  startHint:        { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 18, textAlign: 'center' },
  startBtn:         { width: '100%', borderRadius: 32, overflow: 'hidden' },
  startBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  startDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  startBtnText:     { color: '#fff', fontWeight: '800', fontSize: 17 },
  stopWrap:         { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 28 },
  stopBtn:          { backgroundColor: 'rgba(255,59,48,0.9)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 26 },
});

// ── Estilos Canales Dulce — EGChat Edition ──────────────────
const chst = StyleSheet.create({
  // Layout
  topBar:       { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingBottom: 8, paddingTop: 6, gap: 8 },
  subTabs:      { flexDirection: 'row', gap: 0 },
  subTab:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  subTabText:   { fontSize: 14, fontWeight: '700' },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  searchInput:  { flex: 1, fontSize: 14 },

  // Categorias
  catChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)' },
  catChipText:  { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  // Label sección
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8, marginLeft: 2 },

  // Card de canal
  channelCard:   { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 2 },
  channelBanner: { height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  verifiedPill:  { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  avatarRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: -22, marginBottom: 8 },
  avatarWrap:    { borderRadius: 28, borderWidth: 3, overflow: 'hidden' },
  followPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.15)' },
  followPillText:{ fontSize: 12, fontWeight: '700' },
  chName:        { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  catTag:        { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  catTagText:    { fontSize: 11, fontWeight: '700' },
  chFollowers:   { fontSize: 11 },
  chDesc:        { fontSize: 13, lineHeight: 18, marginTop: 6 },
  lastPostWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 8, marginTop: 8 },
  lastPostText:  { fontSize: 12, flex: 1 },

  // Posts dentro del canal
  postCard:   { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // (legacy — pueden quedar referencias)
  tabs:          { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab:           { flex: 1, alignItems: 'center', paddingVertical: 11, position: 'relative' },
  tabActive:     {},
  tabText:       { fontSize: 14, fontWeight: '600' },
  tabIndicator:  { position: 'absolute', bottom: 0, width: 32, height: 2.5, borderRadius: 2 },
  card:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cardLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  channelName:   { fontSize: 15, fontWeight: '700' },
  channelCat:    { fontSize: 11, fontWeight: '700', marginTop: 1 },
  channelDesc:   { fontSize: 12, marginTop: 2 },
  followers:     { fontSize: 11, marginTop: 3 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  followBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: '#00C8A0' },
  followBtnText: { fontSize: 13, fontWeight: '700' },
});

