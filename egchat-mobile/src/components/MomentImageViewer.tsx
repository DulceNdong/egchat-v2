// ══════════════════════════════════════════════════════════════════
// MomentImageViewer — Visor inmersivo de imágenes de Momentos
// Fondo translúcido blur, galería con swipe, info del post
// Diseño moderno con gradientes, animaciones suaves y acciones
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Dimensions, Image, Animated, PanResponder, StatusBar,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EGAvatar } from './ui';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const IOS = Platform.OS === 'ios';

// ── Iconos inline (no dependencia extra) ────────────────────────
const IcClose = ({ color = '#fff', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2.2} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IcChevLeft = ({ color = '#fff', size = 26 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);
const IcChevRight = ({ color = '#fff', size = 26 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
const IcHeart = ({ filled = false, color = '#fff', size = 22 }: { filled?: boolean; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? '#ef4444' : 'none'}
    stroke={filled ? '#ef4444' : color}
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
const IcComment = ({ color = '#fff', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

// ── Tipos ────────────────────────────────────────────────────────
export interface MomentViewerPost {
  id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  likes: number;
  liked_by_me: boolean;
  comments: { id: string; user_name: string; text: string }[];
  created_at: string;
}

interface Props {
  visible: boolean;
  post: MomentViewerPost | null;
  initialImageIndex?: number;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
}

// ── Tiempo relativo ──────────────────────────────────────────────
const timeAgo = (d: string) => {
  const ms = Date.now() - new Date(d).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h >= 1) return `${h}h`;
  if (m >= 1) return `${m}m`;
  return 'ahora';
};

// ══════════════════════════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════════════════════════
export function MomentImageViewer({
  visible, post, initialImageIndex = 0, onClose, onLike, onCommentPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [imgIdx, setImgIdx] = useState(initialImageIndex);
  const [showUI, setShowUI] = useState(true);

  // Animaciones de entrada
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const images = post?.images ?? [];
  const total  = images.length;

  // Reset index cuando cambia el post o se abre
  useEffect(() => {
    if (visible) {
      setImgIdx(initialImageIndex);
      setShowUI(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, speed: 18, bounciness: 4, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 18, bounciness: 4, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      scaleAnim.setValue(0.92);
    }
  }, [visible, initialImageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipe horizontal para navegar entre imágenes
  const swipeX    = useRef(new Animated.Value(0)).current;
  const swipeLock = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.4,
      onPanResponderGrant: () => { swipeLock.current = false; },
      onPanResponderMove: (_e, gs) => {
        if (!swipeLock.current) swipeX.setValue(gs.dx);
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < -60 && imgIdx < total - 1) {
          swipeLock.current = true;
          setImgIdx(i => i + 1);
        } else if (gs.dx > 60 && imgIdx > 0) {
          swipeLock.current = true;
          setImgIdx(i => i - 1);
        }
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
      },
    })
  ).current;

  // Swipe vertical para cerrar (umbral 120px)
  const swipeY    = useRef(new Animated.Value(0)).current;
  const closePan  = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dy) > 15 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) swipeY.setValue(gs.dy);
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > 120) {
          onClose();
        } else {
          Animated.spring(swipeY, { toValue: 0, useNativeDriver: true, speed: 25 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeY, { toValue: 0, useNativeDriver: true, speed: 25 }).start();
      },
    })
  ).current;

  const toggleUI = useCallback(() => setShowUI(v => !v), []);

  const goNext = useCallback(() => {
    if (imgIdx < total - 1) setImgIdx(i => i + 1);
  }, [imgIdx, total]);

  const goPrev = useCallback(() => {
    if (imgIdx > 0) setImgIdx(i => i - 1);
  }, [imgIdx]);

  if (!post) return null;

  const currentUri = images[imgIdx];
  // Opacidad de imagen al arrastrar hacia abajo
  const closingOpacity = swipeY.interpolate({
    inputRange: [0, 200], outputRange: [1, 0.3], extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden={IOS} barStyle="light-content" />

      {/* ── Fondo translúcido blur ─────────────────────────── */}
      <Animated.View style={[sv.backdrop, { opacity: fadeAnim }]}>
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
      </Animated.View>

      {/* ── Contenedor principal ──────────────────────────── */}
      <Animated.View
        style={[
          sv.container,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: Animated.add(slideAnim, swipeY) },
              { scale: scaleAnim },
            ],
          },
        ]}
        {...closePan.panHandlers}
      >

        {/* ── Header con info del post ─────────────────────── */}
        {showUI && (
          <Animated.View style={[sv.header, { paddingTop: insets.top + (IOS ? 8 : 16) }]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.72)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={sv.headerInner}>
              <EGAvatar src={post.user_avatar} name={post.user_name} size={40} />
              <View style={sv.headerInfo}>
                <Text style={sv.headerName}>{post.user_name}</Text>
                <Text style={sv.headerMeta}>
                  {timeAgo(post.created_at)} · {total > 1 ? `${imgIdx + 1}/${total} fotos` : '1 foto'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.8}>
                <IcClose size={20} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Imagen central con swipe ─────────────────────── */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleUI}
          style={sv.imageArea}
        >
          <Animated.View
            style={[sv.imageWrap, {
              opacity: closingOpacity,
              transform: [{ translateX: swipeX }],
            }]}
            {...pan.panHandlers}
          >
            {currentUri ? (
              <Image
                source={{ uri: currentUri }}
                style={sv.image}
                resizeMode="contain"
              />
            ) : (
              <LinearGradient colors={['#00c8a0', '#00B4E6']} style={sv.image} />
            )}
          </Animated.View>

          {/* Flechas navegación si hay varias imágenes */}
          {total > 1 && showUI && (
            <>
              {imgIdx > 0 && (
                <TouchableOpacity
                  style={[sv.navBtn, sv.navLeft]}
                  onPress={goPrev}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint="dark" style={sv.navBlur}>
                    <IcChevLeft size={24} />
                  </BlurView>
                </TouchableOpacity>
              )}
              {imgIdx < total - 1 && (
                <TouchableOpacity
                  style={[sv.navBtn, sv.navRight]}
                  onPress={goNext}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint="dark" style={sv.navBlur}>
                    <IcChevRight size={24} />
                  </BlurView>
                </TouchableOpacity>
              )}
            </>
          )}
        </TouchableOpacity>

        {/* ── Indicadores de página (dots) ─────────────────── */}
        {total > 1 && showUI && (
          <View style={sv.dotsRow}>
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setImgIdx(i)} activeOpacity={0.8}>
                <View style={[sv.dot, i === imgIdx && sv.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Footer: texto + acciones ─────────────────────── */}
        {showUI && (
          <Animated.View style={[sv.footer, { paddingBottom: insets.bottom + 16 }]}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.78)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={sv.footerInner}>
              {/* Texto del post */}
              {!!post.text && (
                <View style={sv.captionWrap}>
                  <Text style={sv.caption} numberOfLines={3}>{post.text}</Text>
                </View>
              )}
              {/* Acciones like + comentarios */}
              <View style={sv.actionsRow}>
                <TouchableOpacity
                  style={sv.actionBtn}
                  onPress={() => onLike?.(post.id)}
                  activeOpacity={0.8}
                >
                  <IcHeart filled={post.liked_by_me} size={24} />
                  {post.likes > 0 && (
                    <Text style={sv.actionCount}>{post.likes}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={sv.actionBtn}
                  onPress={() => onCommentPress?.(post.id)}
                  activeOpacity={0.8}
                >
                  <IcComment size={24} />
                  {post.comments.length > 0 && (
                    <Text style={sv.actionCount}>{post.comments.length}</Text>
                  )}
                </TouchableOpacity>
                {/* Indicador "desliza para cerrar" */}
                <View style={sv.swipeHint}>
                  <View style={sv.swipeBar} />
                  <Text style={sv.swipeHintText}>Desliza para cerrar</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Thumbnail strip si hay 2+ imágenes */}
        {total > 1 && showUI && (
          <View style={[sv.thumbStrip, { bottom: insets.bottom + 80 }]}>
            {images.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => setImgIdx(i)} activeOpacity={0.85}>
                <View style={[sv.thumb, i === imgIdx && sv.thumbActive]}>
                  <Image source={{ uri }} style={sv.thumbImg} resizeMode="cover" />
                  {i !== imgIdx && <View style={sv.thumbDim} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// Estilos
// ══════════════════════════════════════════════════════════════════
const sv = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  container: {
    flex: 1,
    zIndex: 1,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingBottom: 32,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 15, fontWeight: '700', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerMeta: {
    fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  // ── Imagen central ────────────────────────────────────────────
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: W,
    height: H * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: W,
    height: H * 0.72,
  },

  // ── Flechas navegación ────────────────────────────────────────
  navBtn: {
    position: 'absolute',
    top: '50%',
    zIndex: 5,
    overflow: 'hidden',
    borderRadius: 24,
  },
  navLeft:  { left: 14 },
  navRight: { right: 14 },
  navBlur: {
    width: 46, height: 46,
    borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },

  // ── Dots ──────────────────────────────────────────────────────
  dotsRow: {
    position: 'absolute',
    bottom: IOS ? 190 : 170,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 18, backgroundColor: '#fff',
  },

  // ── Thumbnail strip ───────────────────────────────────────────
  thumbStrip: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
    paddingHorizontal: 16,
  },
  thumb: {
    width: 46, height: 46, borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  thumbImg: { width: 46, height: 46 },
  thumbDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 10,
    paddingTop: 48,
  },
  footerInner: {
    paddingHorizontal: 16,
    gap: 12,
  },
  captionWrap: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  caption: {
    fontSize: 14, color: '#fff', lineHeight: 20, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  actionCount: {
    fontSize: 14, color: '#fff', fontWeight: '700',
  },
  swipeHint: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  swipeBar: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignSelf: 'flex-end',
  },
  swipeHintText: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)',
  },
});
