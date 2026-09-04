// ══════════════════════════════════════════════════════════════════
// ImageViewer — Visor de medios EGCHAT
// Características:
//   • Fondo negro inmersivo, header transparente con degradado
//   • Header: nombre del remitente + fecha/hora
//   • Zoom pinch-to-zoom (1×–5×) + pan cuando está ampliado
//   • Swipe vertical para cerrar (con animación de desvanecimiento)
//   • Tira de miniaturas horizontal sincronizada
//   • Barra de acciones: reaccionar · responder · compartir · reenviar · favorito · eliminar
//   • Mini picker de reacciones (6 emojis)
//   • Soporte imagen / video / documento / audio
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Image, TouchableOpacity, Pressable, Text, Modal, StyleSheet,
  Dimensions, FlatList, Animated, ActivityIndicator,
  StatusBar, Platform, Share, Alert, Clipboard,
} from 'react-native';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import type {
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path, Line, Polyline, Circle, Polygon, Rect } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ─── Props ────────────────────────────────────────────────────────
export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | 'document' | 'audio';
  name?: string;         // nombre de archivo
  size?: string;         // "2.4 MB"
  duration?: string;     // para audio/video "0:34"
  senderName?: string;
  timestamp?: string;    // "04/09/2026, 14:59"
  starred?: boolean;
}

interface ImageViewerProps {
  visible: boolean;
  items: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
  onReply?: (item: MediaItem) => void;
  onForward?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  onToggleStar?: (item: MediaItem) => void;
  onReact?: (item: MediaItem, emoji: string) => void;
  /** @deprecated usa items en su lugar */
  images?: string[];
}

// ─── Iconos SVG ───────────────────────────────────────────────────
const IcoClose = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);
const IcoShare = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
    <Polyline points="16 6 12 2 8 6"/>
    <Line x1="12" y1="2" x2="12" y2="15"/>
  </Svg>
);
const IcoForward = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 17 20 12 15 7"/>
    <Path d="M4 18v-2a4 4 0 014-4h12"/>
  </Svg>
);
const IcoStar = ({ filled }: { filled: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'none'} stroke={filled ? '#FBBF24' : '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </Svg>
);
const IcoTrash = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6"/>
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <Path d="M10 11v6M14 11v6"/>
    <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </Svg>
);
const IcoReply = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 17 4 12 9 7"/>
    <Path d="M20 18v-2a4 4 0 00-4-4H4"/>
  </Svg>
);
const IcoSmile = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10"/>
    <Path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <Line x1="9" y1="9" x2="9.01" y2="9"/>
    <Line x1="15" y1="9" x2="15.01" y2="9"/>
  </Svg>
);
const IcoBack = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12"/>
    <Polyline points="12 19 5 12 12 5"/>
  </Svg>
);
const IcoEdit = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </Svg>
);
const IcoDoc = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <Polyline points="14 2 14 8 20 8"/>
    <Line x1="16" y1="13" x2="8" y2="13"/>
    <Line x1="16" y1="17" x2="8" y2="17"/>
    <Polyline points="10 9 9 9 8 9"/>
  </Svg>
);
const IcoAudio = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18V5l12-2v13"/>
    <Circle cx="6" cy="18" r="3"/>
    <Circle cx="18" cy="16" r="3"/>
  </Svg>
);
const IcoVideo = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="23 7 16 12 23 17 23 7"/>
    <Rect x="1" y="5" width="15" height="14" rx="2"/>
  </Svg>
);

// ─── Iconos del ShareSheet (colores pastel individuales) ──────────
const IcoSave = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
    <Polyline points="16 6 12 2 8 6"/>
    <Line x1="12" y1="2" x2="12" y2="15"/>
  </Svg>
);
const IcoShareSheet = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </Svg>
);
const IcoForwardSheet = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 17 20 12 15 7"/>
    <Path d="M4 18v-2a4 4 0 014-4h12"/>
  </Svg>
);
const IcoInstagram = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="2" width="20" height="20" rx="5"/>
    <Path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </Svg>
);
const IcoCopy = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="9" width="13" height="13" rx="2"/>
    <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </Svg>
);
const IcoSticker = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a10 10 0 0110 10c0 5.52-4.48 10-10 10A10 10 0 012 12 10 10 0 0112 2z"/>
    <Path d="M12 12c0 3.31-2.69 6-6 6"/>
    <Path d="M12 12V2"/>
  </Svg>
);
const IcoProfile = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="4"/>
    <Circle cx="12" cy="12" r="10"/>
  </Svg>
);
const IcoSearch = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8"/>
    <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <Path d="M8 11h6M11 8v6"/>
  </Svg>
);
const IcoWallpaper = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2"/>
    <Circle cx="8.5" cy="8.5" r="1.5"/>
    <Polyline points="21 15 16 10 5 21"/>
  </Svg>
);
const IcoCloseSheet = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

// ─── ShareSheet ───────────────────────────────────────────────────
interface ShareSheetProps {
  visible: boolean;
  item: MediaItem;
  onClose: () => void;
  onForward: () => void;
  onSave: () => void;
  onSetProfilePhoto?: () => void;
  onSetWallpaper?: () => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  visible, item, onClose, onForward, onSave,
  onSetProfilePhoto, onSetWallpaper,
}) => {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  // ── 1. GUARDAR en galería del dispositivo ───────────────────────
  const handleSave = async () => {
    onClose();
    try {
      const Sharing = await import('expo-sharing').catch(() => null);
      let localUri = item.uri;
      if (item.uri.startsWith('http')) {
        const dest = `${FileSystem.cacheDirectory}egchat_save_${Date.now()}.jpg`;
        await FileSystem.downloadAsync(item.uri, dest);
        localUri = dest;
      }
      if (Sharing && (await (Sharing as any).isAvailableAsync?.())) {
        await (Sharing as any).shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: 'Guardar imagen' });
      } else {
        Alert.alert('✓ Descargado', 'Imagen lista para guardar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la imagen');
    }
  };

  // ── 2. COMPARTIR con apps del sistema ──────────────────────────
  const handleShare = async () => {
    onClose();
    try {
      const Sharing = await import('expo-sharing').catch(() => null);
      let localUri = item.uri;
      if (item.uri.startsWith('http')) {
        const dest = `${FileSystem.cacheDirectory}egchat_share_${Date.now()}.jpg`;
        await FileSystem.downloadAsync(item.uri, dest);
        localUri = dest;
      }
      if (Sharing && (await (Sharing as any).isAvailableAsync?.())) {
        await (Sharing as any).shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: 'Compartir imagen' });
      } else {
        await Share.share({ url: localUri, message: item.name || '' });
      }
    } catch {}
  };

  // ── 3. REENVIAR a contacto de EGChat ───────────────────────────
  const handleForward = () => { onForward(); onClose(); };

  // ── 4. COPIAR imagen al portapapeles ───────────────────────────
  const handleCopy = async () => {
    onClose();
    try {
      const Clipboard = await import('expo-clipboard');
      const cb = (Clipboard as any).default ?? Clipboard;
      await cb.setStringAsync(item.uri);
      Alert.alert('✓ Copiado', 'Enlace de imagen copiado');
    } catch {
      Alert.alert('Error', 'No se pudo copiar');
    }
  };

  // ── 5. CREAR STICKER — redimensionar 512×512 ─────────────────
  const handleSticker = async () => {
    onClose();
    try {
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      let localUri = item.uri;
      if (item.uri.startsWith('http')) {
        const dest = `${FileSystem.cacheDirectory}egchat_stk_${Date.now()}.jpg`;
        await FileSystem.downloadAsync(item.uri, dest);
        localUri = dest;
      }
      const result = await manipulateAsync(
        localUri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: SaveFormat.WEBP }
      );
      const Sharing = await import('expo-sharing').catch(() => null);
      if (Sharing && (await (Sharing as any).isAvailableAsync?.())) {
        await (Sharing as any).shareAsync(result.uri, { mimeType: 'image/webp', dialogTitle: 'Guardar sticker' });
      }
      Alert.alert('✓ Sticker listo', 'Sticker 512×512 generado');
    } catch {
      Alert.alert('Error', 'No se pudo crear el sticker');
    }
  };

  // ── 6. FOTO DE PERFIL ──────────────────────────────────────────
  const handleProfile = () => { onSetProfilePhoto?.(); onClose(); };

  // ── 7. BUSCAR EN LA WEB (Google Lens) ─────────────────────────
  const handleSearchWeb = async () => {
    onClose();
    try {
      const { openURL } = await import('expo-linking');
      await openURL(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(item.uri)}`);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el navegador');
    }
  };

  // ── 8. FONDO DE PANTALLA ───────────────────────────────────────
  const handleWallpaper = () => { onSetWallpaper?.(); onClose(); };

  // Grid 4 + 4
  const row1 = [
    { icon: <IcoSave />,         label: 'Guardar',    color: '#10b981', bg: 'rgba(16,185,129,0.2)',  onPress: handleSave },
    { icon: <IcoShareSheet />,   label: 'Compartir',  color: '#6366f1', bg: 'rgba(99,102,241,0.2)',  onPress: handleShare },
    { icon: <IcoForwardSheet />, label: 'Reenviar',   color: '#f59e0b', bg: 'rgba(245,158,11,0.2)',  onPress: handleForward },
    { icon: <IcoCopy />,         label: 'Copiar',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.2)',  onPress: handleCopy },
  ];
  const row2 = [
    { icon: <IcoSticker />,   label: 'Sticker',     color: '#a855f7', bg: 'rgba(168,85,247,0.2)',  onPress: handleSticker },
    { icon: <IcoProfile />,   label: 'Foto perfil', color: '#14b8a6', bg: 'rgba(20,184,166,0.2)',  onPress: handleProfile },
    { icon: <IcoSearch />,    label: 'Buscar web',  color: '#f97316', bg: 'rgba(249,115,22,0.2)',  onPress: handleSearchWeb },
    { icon: <IcoWallpaper />, label: 'Fondo',       color: '#ec4899', bg: 'rgba(236,72,153,0.2)',  onPress: handleWallpaper },
  ];

  const renderTile = (a: typeof row1[0]) => (
    <TouchableOpacity key={a.label} style={ss.tile} onPress={a.onPress} activeOpacity={0.6}>
      <View style={ss.tileIcon}>{a.icon}</View>
      <Text style={ss.tileLabel}>{a.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={ss.overlay} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View style={[ss.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Handle */}
        <View style={ss.handle} />

        {/* Cabecera */}
        <View style={ss.sheetHeader}>
          {item.type === 'image' || !item.type ? (
            <Image source={{ uri: item.uri }} style={ss.previewThumb} resizeMode="cover" />
          ) : (
            <View style={[ss.previewThumb, ss.previewThumbPlaceholder]}><IcoDoc /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={ss.sheetSender}>{item.senderName || 'Tú'}</Text>
            {item.timestamp ? <Text style={ss.sheetDate}>{item.timestamp}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={ss.closeBtn}><IcoCloseSheet /></TouchableOpacity>
        </View>

        {/* Fila 1 — 4 iconos */}
        <View style={ss.row}>{row1.map(renderTile)}</View>

        <View style={ss.sep} />

        {/* Fila 2 — 4 iconos */}
        <View style={ss.row}>{row2.map(renderTile)}</View>

        <View style={{ height: Platform.OS === 'ios' ? 24 : 12 }} />
      </Animated.View>
    </Modal>
  );
};

const TILE_GAP = 8;
const TILE_W = (W - 28 - TILE_GAP * 3) / 4;

const ss = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignSelf: 'center', marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingBottom: 10,
  },
  previewThumb: {
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  previewThumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSender: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sheetDate: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  closeBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Filas de 4
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    gap: TILE_GAP,
  },
  tile: { width: TILE_W, alignItems: 'center', gap: 6 },
  tileIcon: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  tileIconInner: {}, // unused — kept for compat
  tileLabel: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(255,255,255,0.9)', textAlign: 'center',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 14,
  },
});

// ─── Picker de reacciones ─────────────────────────────────────────
const REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

const ReactionPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => (
  <View style={rp.container}>
    <View style={rp.bubble}>
      {REACTIONS.map(e => (
        <TouchableOpacity key={e} onPress={() => { onSelect(e); onClose(); }} style={rp.item}>
          <Text style={rp.emoji}>{e}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
const rp = StyleSheet.create({
  container: { position: 'absolute', bottom: 160, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  bubble: {
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 36, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  item: { padding: 4 },
  emoji: { fontSize: 28 },
});

// ─── Imagen con zoom y pan ────────────────────────────────────────
const ZoomableImage = ({
  uri, onSwipeDown,
}: { uri: string; onSwipeDown: () => void }) => {
  const scale       = useRef(new Animated.Value(1)).current;
  const lastScale   = useRef(1);
  const translateX  = useRef(new Animated.Value(0)).current;
  const translateY  = useRef(new Animated.Value(0)).current;
  const lastTX      = useRef(0);
  const lastTY      = useRef(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Pinch
  const onPinchEvent = (e: PinchGestureHandlerGestureEvent) => {
    const ns = Math.max(1, Math.min(5, lastScale.current * e.nativeEvent.scale));
    scale.setValue(ns);
  };
  const onPinchState = (e: PinchGestureHandlerGestureEvent) => {
    if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      const ns = Math.max(1, Math.min(5, lastScale.current * e.nativeEvent.scale));
      lastScale.current = ns;
      if (ns <= 1.05) {
        lastScale.current = 1;
        lastTX.current = 0; lastTY.current = 0;
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }
    }
  };

  // Pan (solo cuando está ampliado)
  const onPanEvent = (e: PanGestureHandlerGestureEvent) => {
    if (lastScale.current > 1.05) {
      translateX.setValue(lastTX.current + e.nativeEvent.translationX);
      translateY.setValue(lastTY.current + e.nativeEvent.translationY);
    }
  };
  const onPanState = (e: PanGestureHandlerGestureEvent) => {
    if (e.nativeEvent.state === State.END) {
      if (lastScale.current <= 1.05 && e.nativeEvent.translationY > 80) {
        onSwipeDown();
        return;
      }
      lastTX.current += e.nativeEvent.translationX;
      lastTY.current += e.nativeEvent.translationY;
    }
  };

  if (hasError) {
    return (
      <View style={[iz.frame, { gap: 12 }]}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={{ color: '#fff', fontSize: 15 }}>No se pudo cargar</Text>
        <TouchableOpacity
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 }}
          onPress={() => { setHasError(false); setRetryKey(k => k + 1); setLoading(true); }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={iz.frame}>
      <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanState}>
        <Animated.View style={{ flex: 1 }}>
          <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchState}>
            <Animated.View style={[iz.frame, { transform: [{ scale }, { translateX }, { translateY }] }]}>
              {loading && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator size="large" color="#07a472" />
                </View>
              )}
              <Image
                key={retryKey}
                source={{ uri }}
                style={iz.image}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => { setHasError(true); setLoading(false); }}
              />
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
const iz = StyleSheet.create({
  frame: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  image: { width: W, height: H },
});

// ─── Placeholder para tipos no-imagen ────────────────────────────
const NonImagePlaceholder = ({ item }: { item: MediaItem }) => {
  const Icon = item.type === 'audio' ? IcoAudio
    : item.type === 'video' ? IcoVideo
    : IcoDoc;
  return (
    <View style={[iz.frame, { gap: 16 }]}>
      <View style={np.iconWrap}><Icon /></View>
      <Text style={np.name} numberOfLines={2}>{item.name || 'Archivo'}</Text>
      {item.size ? <Text style={np.meta}>{item.size}</Text> : null}
      {item.duration ? <Text style={np.meta}>{item.duration}</Text> : null}
    </View>
  );
};
const np = StyleSheet.create({
  iconWrap: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  meta: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
});

// ══════════════════════════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════════════════════════
export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  items: itemsProp,
  initialIndex = 0,
  onClose,
  onReply,
  onForward,
  onDelete,
  onToggleStar,
  onReact,
  images: legacyImages,
}) => {
  // Compatibilidad con prop legada `images`
  const items: MediaItem[] = itemsProp?.length
    ? itemsProp
    : (legacyImages || []).map(uri => ({ uri, type: 'image' as const }));

  const opacity        = useRef(new Animated.Value(1)).current;
  const [idx, setIdx]  = useState(initialIndex);
  const [showReact, setShowReact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [barsVisible, setBarsVisible] = useState(true);
  const listRef        = useRef<FlatList>(null);
  const thumbRef       = useRef<FlatList>(null);
  const barsAnim       = useRef(new Animated.Value(1)).current;

  // Sincroniza índice inicial
  useEffect(() => {
    if (visible) setIdx(initialIndex);
  }, [visible, initialIndex]);

  const current = items[idx] || items[0];

  const closeWithFade = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      opacity.setValue(1);
      onClose();
    });
  }, [opacity, onClose]);

  const toggleBars = () => {
    const toVal = barsVisible ? 0 : 1;
    setBarsVisible(!barsVisible);
    Animated.timing(barsAnim, { toValue: toVal, duration: 200, useNativeDriver: true }).start();
  };

  const goTo = (newIdx: number) => {
    setIdx(newIdx);
    listRef.current?.scrollToIndex({ index: newIdx, animated: true });
    thumbRef.current?.scrollToIndex({ index: newIdx, animated: true });
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleSave = async () => {
    try {
      const filename = current.name || `egchat_${Date.now()}.jpg`;
      const dest = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.copyAsync({ from: current.uri, to: dest });
      Alert.alert('', 'Guardado ✓');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el archivo');
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar', '¿Eliminar este archivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { onDelete?.(current); closeWithFade(); } },
    ]);
  };

  if (!visible || items.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeWithFade}
      statusBarTranslucent
    >
      <StatusBar hidden={Platform.OS !== 'web'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[s.overlay, { opacity }]}>

          {/* ── Imagen / media principal ── */}
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={toggleBars}
          >
            <FlatList
              ref={listRef}
              data={items}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
              onMomentumScrollEnd={e => {
                const newIdx = Math.round(e.nativeEvent.contentOffset.x / W);
                setIdx(newIdx);
                thumbRef.current?.scrollToIndex({ index: newIdx, animated: true });
              }}
              renderItem={({ item }) =>
                item.type === 'image' || !item.type
                  ? <ZoomableImage uri={item.uri} onSwipeDown={closeWithFade} />
                  : <NonImagePlaceholder item={item} />
              }
            />
          </TouchableOpacity>

          {/* ── HEADER ── */}
          <Animated.View style={[s.headerWrap, { opacity: barsAnim }]} pointerEvents={barsVisible ? 'box-none' : 'none'}>
            <LinearGradient
              colors={['rgba(0,0,0,0.75)', 'transparent']}
              style={s.headerGrad}
            >
              <TouchableOpacity onPress={closeWithFade} style={s.headerBtn}>
                <IcoBack />
              </TouchableOpacity>
              <View style={s.headerCenter}>
                <Text style={s.headerName} numberOfLines={1}>
                  {current.senderName || 'Imagen'}
                </Text>
                {current.timestamp ? (
                  <Text style={s.headerDate}>{current.timestamp}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={s.headerBtn} onPress={() => { /* más opciones */ }}>
                <IcoEdit />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Contador */}
          {items.length > 1 && (
            <Animated.View style={[s.counter, { opacity: barsAnim }]}>
              <Text style={s.counterText}>{idx + 1} / {items.length}</Text>
            </Animated.View>
          )}

          {/* ── PARTE INFERIOR ── */}
          <Animated.View style={[s.bottomWrap, { opacity: barsAnim }]} pointerEvents={barsVisible ? 'box-none' : 'none'}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={s.bottomGrad}
            >
              {/* Reaccionar + Responder */}
              <View style={s.replyRow}>
                <TouchableOpacity style={s.replyBtn} onPress={() => setShowReact(v => !v)}>
                  <IcoSmile />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.respondBtn}
                  onPress={() => { onReply?.(current); closeWithFade(); }}
                >
                  <IcoReply />
                  <Text style={s.respondText}>Responder</Text>
                </TouchableOpacity>
              </View>

              {/* Tira de miniaturas */}
              {items.length > 1 && (
                <FlatList
                  ref={thumbRef}
                  data={items}
                  keyExtractor={(_, i) => `t${i}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.thumbsContent}
                  style={s.thumbsBar}
                  initialScrollIndex={initialIndex}
                  getItemLayout={(_, i) => ({ length: 56, offset: 56 * i, index: i })}
                  renderItem={({ item, index: ti }) => (
                    <TouchableOpacity
                      onPress={() => goTo(ti)}
                      style={[s.thumb, ti === idx && s.thumbActive]}
                      activeOpacity={0.8}
                    >
                      {item.type === 'image' || !item.type ? (
                        <Image source={{ uri: item.uri }} style={s.thumbImg} resizeMode="cover" />
                      ) : (
                        <View style={s.thumbPlaceholder}>
                          {item.type === 'video' && <IcoVideo />}
                          {item.type === 'audio' && <IcoAudio />}
                          {item.type === 'document' && <IcoDoc />}
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Barra de acciones */}
              <View style={s.actionsBar}>
                <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
                  <IcoShare />
                  <Text style={s.actionLabel}>Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => { onForward?.(current); closeWithFade(); }}>
                  <IcoForward />
                  <Text style={s.actionLabel}>Reenviar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={() => onToggleStar?.(current)}
                >
                  <IcoStar filled={!!current.starred} />
                  <Text style={s.actionLabel}>Favorito</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={handleDelete}>
                  <IcoTrash />
                  <Text style={[s.actionLabel, { color: '#FF6B6B' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>

            </LinearGradient>
          </Animated.View>

          {/* ── Reaction picker ── */}
          {showReact && (
            <ReactionPicker
              onSelect={e => onReact?.(current, e)}
              onClose={() => setShowReact(false)}
            />
          )}

        </Animated.View>
      </GestureHandlerRootView>

      {/* ── Share Sheet ── */}
      <ShareSheet
        visible={showShare}
        item={current}
        onClose={() => setShowShare(false)}
        onForward={() => { onForward?.(current); closeWithFade(); }}
        onSave={handleSave}
        onSetProfilePhoto={() => {/* TODO */}}
        onSetWallpaper={() => {/* TODO */}}
      />
    </Modal>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },

  // Header
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 20, paddingHorizontal: 8, gap: 4,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  headerDate: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },

  // Contador
  counter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    alignSelf: 'center', zIndex: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Bottom
  bottomWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  bottomGrad: { paddingBottom: Platform.OS === 'ios' ? 36 : 20 },

  // Reaccionar + Responder
  replyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, marginBottom: 8,
  },
  replyBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  respondBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  respondText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Tira de miniaturas
  thumbsBar: { marginBottom: 10 },
  thumbsContent: { paddingHorizontal: 12, gap: 4 },
  thumb: {
    width: 52, height: 52, borderRadius: 6, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#07a472' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Barra de acciones
  actionsBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 8, paddingTop: 4,
  },
  actionBtn: { alignItems: 'center', gap: 5, flex: 1, paddingVertical: 8 },
  actionLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
});

export default ImageViewer;
