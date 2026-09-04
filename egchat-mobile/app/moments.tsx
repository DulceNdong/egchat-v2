// ══════════════════════════════════════════════════════════════════
// Moments / Canales — feed social estilo WeChat
// Posts con fotos, texto, likes, comentarios de tus contactos
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
  Image, Modal, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, RefreshControl, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { getToken, getApiBase, authAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { toast } from '../src/components/Toast';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Tipos ─────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
const formatRelativeTime = (dateStr: string) => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
};

// ── API local (con fallback a mock) ───────────────────────────────
const CACHE_KEY = 'egchat_moments_v1';

async function fetchMoments(): Promise<MomentPost[]> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/moments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {}
  // Fallback: caché local
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

async function createMoment(text: string, images: string[]): Promise<MomentPost | null> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/moments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
    });
    if (res.ok) return res.json();
  } catch {}
  // Fallback local
  const me = await authAPI.me().catch(() => null);
  const local: MomentPost = {
    id: `local-${Date.now()}`,
    user_id: me?.id || 'local',
    user_name: me?.full_name || 'Yo',
    user_avatar: me?.avatar_url,
    text,
    images,
    likes: 0,
    liked_by_me: false,
    comments: [],
    created_at: new Date().toISOString(),
  };
  return local;
}

async function toggleLike(postId: string): Promise<boolean> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/moments/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.liked;
    }
  } catch {}
  return true;
}

async function addComment(postId: string, text: string): Promise<MomentComment | null> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/moments/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) return res.json();
  } catch {}
  const me = await authAPI.me().catch(() => null);
  return {
    id: `local-${Date.now()}`,
    user_id: me?.id || 'local',
    user_name: me?.full_name || 'Yo',
    text,
    created_at: new Date().toISOString(),
  };
}

// ── Componente principal ──────────────────────────────────────────
export default function MomentsScreen() {
  const [posts, setPosts] = useState<MomentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await fetchMoments();
      setPosts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    authAPI.me().then(me => setCurrentUserId(me?.id || '')).catch(() => {});
    load();
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked_by_me: !p.liked_by_me, likes: p.liked_by_me ? p.likes - 1 : p.likes + 1 }
        : p
    ));
    await toggleLike(postId);
  }, []);

  const handleComment = useCallback(async () => {
    if (!commentingPost || !commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    const comment = await addComment(commentingPost, text);
    if (comment) {
      setPosts(prev => prev.map(p =>
        p.id === commentingPost
          ? { ...p, comments: [...p.comments, comment] }
          : p
      ));
    }
  }, [commentingPost, commentText]);

  const renderPost = ({ item }: { item: MomentPost }) => (
    <View style={[ps.card, { backgroundColor: C.bgPrimary, borderBottomColor: C.borderLight }]}>
      {/* Cabecera */}
      <View style={ps.header}>
        <EGAvatar src={item.user_avatar} name={item.user_name} size={44} />
        <View style={ps.headerInfo}>
          <Text style={[ps.userName, { color: C.textPrimary }]}>{item.user_name}</Text>
          <Text style={[ps.time, { color: C.textTertiary }]}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        {item.user_id === currentUserId && (
          <TouchableOpacity
            onPress={() => Alert.alert('Post', 'Opciones', [
              { text: 'Eliminar', style: 'destructive', onPress: () => setPosts(p => p.filter(x => x.id !== item.id)) },
              { text: 'Cancelar', style: 'cancel' },
            ])}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
              <Circle cx="12" cy="5" r="1" fill={C.textTertiary}/>
              <Circle cx="12" cy="12" r="1" fill={C.textTertiary}/>
              <Circle cx="12" cy="19" r="1" fill={C.textTertiary}/>
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Texto */}
      {!!item.text && (
        <Text style={[ps.text, { color: C.textPrimary }]}>{item.text}</Text>
      )}

      {/* Imágenes */}
      {item.images && item.images.length > 0 && (
        <View style={ps.imagesGrid}>
          {item.images.slice(0, 4).map((uri, i) => (
            <Image key={i} source={{ uri }} style={[
              ps.image,
              item.images!.length === 1 && ps.imageSingle,
              item.images!.length === 2 && ps.imageHalf,
            ]} resizeMode="cover" />
          ))}
        </View>
      )}

      {/* Acciones */}
      <View style={ps.actions}>
        <TouchableOpacity style={ps.actionBtn} onPress={() => handleLike(item.id)}>
          <Svg width={18} height={18} viewBox="0 0 24 24"
            fill={item.liked_by_me ? '#ef4444' : 'none'}
            stroke={item.liked_by_me ? '#ef4444' : C.textTertiary}
            strokeWidth={2} strokeLinecap="round">
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </Svg>
          <Text style={[ps.actionCount, { color: item.liked_by_me ? '#ef4444' : C.textTertiary }]}>
            {item.likes > 0 ? item.likes : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={ps.actionBtn} onPress={() => setCommentingPost(commentingPost === item.id ? null : item.id)}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </Svg>
          <Text style={[ps.actionCount, { color: C.textTertiary }]}>
            {item.comments.length > 0 ? item.comments.length : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comentarios */}
      {item.comments.length > 0 && (
        <View style={[ps.commentsSection, { backgroundColor: C.bgSecondary }]}>
          {item.comments.map(c => (
            <View key={c.id} style={ps.commentRow}>
              <Text style={[ps.commentUser, { color: '#07a472' }]}>{c.user_name}: </Text>
              <Text style={[ps.commentText, { color: C.textPrimary }]}>{c.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Input comentario */}
      {commentingPost === item.id && (
        <View style={[ps.commentInput, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
          <TextInput
            style={[ps.commentInputText, { color: C.textPrimary }]}
            placeholder="Escribe un comentario..."
            placeholderTextColor={C.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={handleComment}
          />
          <TouchableOpacity onPress={handleComment} disabled={!commentText.trim()}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke={commentText.trim() ? '#07a472' : C.textTertiary}
              strokeWidth={2} strokeLinecap="round">
              <Line x1="22" y1="2" x2="11" y2="13"/>
              <Polyline points="22 2 15 22 11 13 2 9 22 2"/>
            </Svg>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: '#07a472' }]} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/>
            <Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Moments</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="12" y1="5" x2="12" y2="19"/>
            <Line x1="5" y1="12" x2="19" y2="12"/>
          </Svg>
        </TouchableOpacity>
      </LinearGradient>

      {loading
        ? <ActivityIndicator style={{ marginTop: 60 }} color={Colors.accent} size="large" />
        : (
          <FlatList
            data={posts}
            keyExtractor={p => p.id}
            renderItem={renderPost}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#07a472']} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <View style={[s.emptyIconWrap, { backgroundColor: isDark ? '#1a2530' : '#f0faf6' }]}>
                  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                    {/* Cuerpo cámara */}
                    <Path
                      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                      stroke="#07a472"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Lente */}
                    <Circle cx={12} cy={13} r={4} stroke="#07a472" strokeWidth={1.6} />
                    {/* Destello superior derecho */}
                    <Circle cx={18.5} cy={9.5} r={1} fill="#07a472" />
                  </Svg>
                </View>
                <Text style={[s.emptyTitle, { color: C.textPrimary }]}>Sin posts aún</Text>
                <Text style={[s.emptyText, { color: C.textTertiary }]}>
                  Comparte un momento con tus contactos
                </Text>
              </View>
            }
          />
        )
      }

      {/* Modal crear post */}
      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(post) => {
          setPosts(prev => [post, ...prev]);
          setShowCreate(false);
        }}
        C={C}
      />
    </SafeAreaView>
  );
}

// ── Modal crear post ──────────────────────────────────────────────
function CreatePostModal({
  visible, onClose, onCreated, C,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
}) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { toast.error('Sin permiso para galería'); return; }
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
    if (!text.trim() && images.length === 0) { toast.error('Escribe algo o añade una foto'); return; }
    setCreating(true);
    try {
      const post = await createMoment(text.trim(), images);
      if (post) {
        onCreated(post);
        setText('');
        setImages([]);
        toast.success('Post publicado');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bgPrimary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[cm.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} style={cm.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <Text style={cm.title}>Nuevo post</Text>
          <TouchableOpacity onPress={handleCreate} disabled={creating} style={cm.publishBtn}>
            {creating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={cm.publishText}>Publicar</Text>
            }
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <TextInput
            style={[cm.textInput, { color: C.textPrimary, borderColor: C.borderLight }]}
            placeholder="¿Qué está pasando?"
            placeholderTextColor={C.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            autoFocus
          />
          <Text style={[cm.charCount, { color: C.textTertiary }]}>{text.length}/500</Text>

          {/* Imágenes seleccionadas */}
          {images.length > 0 && (
            <View style={cm.imagesRow}>
              {images.map((uri, i) => (
                <View key={i} style={cm.imageThumb}>
                  <Image source={{ uri }} style={cm.thumbImg} />
                  <TouchableOpacity style={cm.removeImg} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity style={[cm.addImgBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
                  <Text style={{ fontSize: 24, color: C.textTertiary }}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {images.length === 0 && (
            <TouchableOpacity style={[cm.addPhotoBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
                <Polyline points="4 17 10 11 13 14 17 10 21 14"/><Polyline points="21 4 12 4 12 10"/><Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              </Svg>
              <Text style={[cm.addPhotoText, { color: C.textTertiary }]}>Añadir fotos</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 4 },
  createBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 90, paddingHorizontal: 32 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

const ps = StyleSheet.create({
  card: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  headerInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  time: { fontSize: 12, marginTop: 1 },
  text: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 10 },
  image: { width: 120, height: 120, borderRadius: 6 },
  imageSingle: { width: '100%', height: 220, borderRadius: 10 },
  imageHalf: { width: '49%', height: 160, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 20, paddingTop: 6, paddingBottom: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, fontWeight: '600' },
  commentsSection: { borderRadius: 10, padding: 10, marginTop: 8, gap: 4 },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap' },
  commentUser: { fontSize: 13, fontWeight: '700' },
  commentText: { fontSize: 13, flex: 1 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8,
  },
  commentInputText: { flex: 1, fontSize: 14, paddingVertical: 6 },
});

const cm = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  publishBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 },
  publishText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  textInput: { fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderRadius: 10, borderWidth: 1, padding: 12, lineHeight: 22 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumb: { position: 'relative', width: 80, height: 80 },
  thumbImg: { width: 80, height: 80, borderRadius: 8 },
  removeImg: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22,
    borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  addImgBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, padding: 16, marginTop: 8 },
  addPhotoText: { fontSize: 15 },
});
