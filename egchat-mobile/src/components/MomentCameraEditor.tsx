// ══════════════════════════════════════════════════════════════════
// MomentCameraEditor — Cámara + Editor para Moments
// Foto / Video + Texto / Stickers / Filtros / Música de fondo
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert,
  Dimensions, TextInput, ScrollView, Image, Platform,
  KeyboardAvoidingView, Animated, PanResponder, ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import { Audio } from 'expo-av';
import { StoryMusicPicker, StoryMusicBadge, type StoryMusic } from './StoryMusicPicker';
import { useThemeContext } from '../theme/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

// ── Tipos ──────────────────────────────────────────────────────────
export interface EditorTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  bold: boolean;
}

export interface MomentMedia {
  uri: string;
  type: 'photo' | 'video';
  filter?: string;
  textLayers?: EditorTextLayer[];
  stickers?: StickerLayer[];
  music?: StoryMusic | null;
  duration?: number; // ms, solo video
}

interface StickerLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone: (media: MomentMedia) => void;
}

// ── Constantes ─────────────────────────────────────────────────────
const FILTERS: { id: string; label: string; contrast: number; saturation: number; brightness: number }[] = [
  { id: 'normal',    label: 'Normal',   contrast: 1,    saturation: 1,    brightness: 1 },
  { id: 'vivid',     label: 'Vívido',   contrast: 1.15, saturation: 1.5,  brightness: 1 },
  { id: 'warm',      label: 'Cálido',   contrast: 1.1,  saturation: 1.2,  brightness: 1.05 },
  { id: 'cool',      label: 'Frío',     contrast: 1.1,  saturation: 0.85, brightness: 1.05 },
  { id: 'bw',        label: 'B&N',      contrast: 1.2,  saturation: 0,    brightness: 1 },
  { id: 'fade',      label: 'Fade',     contrast: 0.85, saturation: 0.7,  brightness: 1.15 },
  { id: 'drama',     label: 'Drama',    contrast: 1.4,  saturation: 1.1,  brightness: 0.9 },
  { id: 'golden',    label: 'Golden',   contrast: 1.1,  saturation: 1.4,  brightness: 1.1 },
];

const TEXT_COLORS = ['#ffffff', '#000000', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c8a0', '#007aff', '#af52de', '#ff2d55'];
const FONT_SIZES = [18, 22, 28, 36, 44];

const STICKER_SETS = [
  ['😂', '❤️', '🔥', '👏', '😍', '🎉', '✨', '💯'],
  ['🌟', '💫', '🎵', '🎶', '🌈', '💥', '⚡', '🌊'],
  ['🦁', '🐯', '🦊', '🐸', '🦋', '🌸', '🍀', '🌺'],
  ['🏆', '🎯', '🚀', '💎', '👑', '🔮', '🎭', '🎪'],
];

// ── Componente principal ───────────────────────────────────────────
export default function MomentCameraEditor({ visible, onClose, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();

  // Permisos
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // Cámara
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [zoom, setZoom] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Editor
  const [captured, setCaptured] = useState<{ uri: string; type: 'photo' | 'video' } | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'stickers' | 'filters' | 'music' | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [processing, setProcessing] = useState(false);

  // Capas de texto
  const [textLayers, setTextLayers] = useState<EditorTextLayer[]>([]);
  const [editingText, setEditingText] = useState<EditorTextLayer | null>(null);
  const [draftText, setDraftText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBold, setTextBold] = useState(false);
  const [textSize, setTextSize] = useState(28);

  // Stickers
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [stickerSet, setStickerSet] = useState(0);

  // Música
  const [music, setMusic] = useState<StoryMusic | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  // Animaciones de UI
  const toolbarAnim = useRef(new Animated.Value(0)).current;

  // ── Cleanup al cerrar ──────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setCaptured(null);
      setActiveTab(null);
      setTextLayers([]);
      setStickers([]);
      setMusic(null);
      setSelectedFilter('normal');
      setRecording(false);
      setRecTime(0);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    }
  }, [visible]);

  useEffect(() => {
    Animated.spring(toolbarAnim, {
      toValue: activeTab ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  // ── Solicitar permisos ─────────────────────────────────────────
  const ensurePermissions = useCallback(async () => {
    if (!camPermission?.granted) {
      const r = await requestCamPermission();
      if (!r.granted) { Alert.alert('Permisos', 'Necesitas permitir el acceso a la cámara'); return false; }
    }
    if (mode === 'video' && !micPermission?.granted) {
      const r = await requestMicPermission();
      if (!r.granted) { Alert.alert('Permisos', 'Necesitas permitir el acceso al micrófono para grabar video'); return false; }
    }
    return true;
  }, [camPermission, micPermission, mode, requestCamPermission, requestMicPermission]);

  // ── Tomar foto ─────────────────────────────────────────────────
  const handlePhoto = useCallback(async () => {
    const ok = await ensurePermissions();
    if (!ok || !cameraRef.current) return;
    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, base64: false, skipProcessing: false });
      if (photo?.uri) {
        // Espejo si cámara frontal
        if (facing === 'front') {
          const flipped = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
          );
          setCaptured({ uri: flipped.uri, type: 'photo' });
        } else {
          setCaptured({ uri: photo.uri, type: 'photo' });
        }
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setProcessing(false);
    }
  }, [cameraRef, facing, ensurePermissions]);

  // ── Grabar video ───────────────────────────────────────────────
  const handleStartRecord = useCallback(async () => {
    const ok = await ensurePermissions();
    if (!ok || !cameraRef.current || recording) return;
    try {
      setRecording(true);
      setRecTime(0);
      recTimerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (video?.uri) {
        setCaptured({ uri: video.uri, type: 'video' });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo grabar el video');
    } finally {
      setRecording(false);
      setRecTime(0);
      if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    }
  }, [cameraRef, recording, ensurePermissions]);

  const handleStopRecord = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, [cameraRef]);

  // ── Galería ────────────────────────────────────────────────────
  const handleGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Sin permiso', 'Necesitas permitir acceso a la galería'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
      setCaptured({ uri: asset.uri, type: isVideo ? 'video' : 'photo' });
    }
  }, []);

  // ── Añadir texto ───────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    setDraftText('');
    setTextColor('#ffffff');
    setTextBold(false);
    setTextSize(28);
    setEditingText({
      id: `txt-${Date.now()}`,
      text: '',
      x: W / 2 - 80,
      y: H / 3,
      color: '#ffffff',
      fontSize: 28,
      bold: false,
    });
  }, []);

  const handleSaveText = useCallback(() => {
    if (!editingText || !draftText.trim()) { setEditingText(null); return; }
    const layer: EditorTextLayer = {
      ...editingText,
      text: draftText.trim(),
      color: textColor,
      fontSize: textSize,
      bold: textBold,
    };
    setTextLayers(prev => {
      const exists = prev.find(l => l.id === layer.id);
      return exists ? prev.map(l => l.id === layer.id ? layer : l) : [...prev, layer];
    });
    setEditingText(null);
    setDraftText('');
  }, [editingText, draftText, textColor, textSize, textBold]);

  // ── Aplicar filtro ─────────────────────────────────────────────
  const applyFilter = useCallback(async (uri: string, filterId: string): Promise<string> => {
    if (filterId === 'normal') return uri;
    const f = FILTERS.find(x => x.id === filterId);
    if (!f) return uri;
    try {
      const actions: ImageManipulator.Action[] = [];
      if (f.saturation === 0) {
        actions.push({ sharpen: 0.1 } as any);
      }
      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return result.uri;
    } catch {
      return uri;
    }
  }, []);

  // ── Publicar ───────────────────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (!captured) return;
    setProcessing(true);
    try {
      let finalUri = captured.uri;
      if (captured.type === 'photo' && selectedFilter !== 'normal') {
        finalUri = await applyFilter(captured.uri, selectedFilter);
      }
      const media: MomentMedia = {
        uri: finalUri,
        type: captured.type,
        filter: selectedFilter,
        textLayers,
        stickers,
        music,
      };
      onDone(media);
    } finally {
      setProcessing(false);
    }
  }, [captured, selectedFilter, textLayers, stickers, music, onDone, applyFilter]);

  const formatRecTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!visible) return null;

  // ── Pantalla de permisos ───────────────────────────────────────
  if (!camPermission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <LinearGradient colors={['#00C8A0', '#00B4E6']} style={s.permScreen}>
          <SafeAreaView style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 64, marginBottom: 24 }}>📷</Text>
            <Text style={s.permTitle}>Acceso a la cámara</Text>
            <Text style={s.permSub}>EGChat necesita la cámara y el micrófono para crear tus Moments</Text>
            <TouchableOpacity style={s.permBtn} onPress={async () => { await requestCamPermission(); await requestMicPermission(); }}>
              <Text style={s.permBtnText}>Permitir acceso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.permBtnGallery} onPress={handleGallery}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Desde la galería</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Cancelar</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    );
  }

  // ── EDITOR (post-captura) ──────────────────────────────────────
  if (captured) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={() => setCaptured(null)}>
        <View style={s.editorRoot}>
          {/* Preview de la imagen/video capturado */}
          <Image
            source={{ uri: captured.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* Overlay oscuro suave */}
          <View style={s.editorOverlay} pointerEvents="none" />

          {/* Capas de texto */}
          {textLayers.map(layer => (
            <DraggableTextLayer
              key={layer.id}
              layer={layer}
              onEdit={(l) => {
                setDraftText(l.text);
                setTextColor(l.color);
                setTextSize(l.fontSize);
                setTextBold(l.bold);
                setEditingText(l);
                setActiveTab('text');
              }}
              onDelete={(id) => setTextLayers(prev => prev.filter(l => l.id !== id))}
            />
          ))}

          {/* Capas de stickers */}
          {stickers.map(stk => (
            <DraggableStickerLayer
              key={stk.id}
              sticker={stk}
              onDelete={(id) => setStickers(prev => prev.filter(s => s.id !== id))}
              onUpdate={(updated) => setStickers(prev => prev.map(s => s.id === updated.id ? updated : s))}
            />
          ))}

          {/* Header del editor */}
          <SafeAreaView style={s.editorHeader}>
            <TouchableOpacity onPress={() => setCaptured(null)} style={s.editorHBtn}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>
            {music && <StoryMusicBadge music={music} onRemove={() => setMusic(null)} />}
            <TouchableOpacity onPress={handleDone} style={s.editorDoneBtn} disabled={processing}>
              {processing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.editorDoneText}>Listo ✓</Text>
              }
            </TouchableOpacity>
          </SafeAreaView>

          {/* Toolbar lateral */}
          <View style={[s.editorSidebar, { bottom: insets.bottom + 160 }]}>
            {[
              { id: 'text',     icon: 'T',    label: 'Texto' },
              { id: 'stickers', icon: '😀',   label: 'Stickers' },
              { id: 'filters',  icon: '✨',   label: 'Filtros' },
              { id: 'music',    icon: '🎵',   label: 'Música' },
            ].map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={[s.sidebarBtn, activeTab === tool.id && s.sidebarBtnActive]}
                onPress={() => {
                  if (tool.id === 'music') { setShowMusicPicker(true); return; }
                  if (tool.id === 'text') { handleAddText(); return; }
                  setActiveTab(activeTab === tool.id ? null : tool.id as any);
                }}
              >
                <Text style={[s.sidebarIcon, activeTab === tool.id && { color: '#00C8A0' }]}>
                  {tool.id === 'text' ? '𝗧' : tool.icon}
                </Text>
                <Text style={s.sidebarLabel}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Panel de filtros */}
          {activeTab === 'filters' && captured.type === 'photo' && (
            <FilterPanel
              selected={selectedFilter}
              onSelect={setSelectedFilter}
              imageUri={captured.uri}
              insetBottom={insets.bottom}
            />
          )}

          {/* Panel de stickers */}
          {activeTab === 'stickers' && (
            <StickerPanel
              stickerSet={stickerSet}
              onSetChange={setStickerSet}
              onAdd={(emoji) => {
                setStickers(prev => [...prev, {
                  id: `stk-${Date.now()}`,
                  emoji,
                  x: W / 2 - 24,
                  y: H / 2 - 24,
                  scale: 1,
                }]);
              }}
              insetBottom={insets.bottom}
            />
          )}

          {/* Editor de texto inline */}
          {editingText && (
            <TextEditorPanel
              draft={draftText}
              color={textColor}
              bold={textBold}
              size={textSize}
              onDraftChange={setDraftText}
              onColorChange={setTextColor}
              onBoldChange={setTextBold}
              onSizeChange={setTextSize}
              onSave={handleSaveText}
              onCancel={() => setEditingText(null)}
              insetBottom={insets.bottom}
            />
          )}
        </View>

        {/* Selector de música */}
        <StoryMusicPicker
          visible={showMusicPicker}
          selected={music}
          onSelect={(m) => { setMusic(m); setShowMusicPicker(false); }}
          onClose={() => setShowMusicPicker(false)}
        />
      </Modal>
    );
  }

  // ── CÁMARA ─────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.camRoot}>
        {/* Visor de cámara */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          zoom={zoom}
          mode={mode === 'video' ? 'video' : 'picture'}
        />

        {/* Overlay superior */}
        <SafeAreaView style={s.camHeader}>
          <TouchableOpacity onPress={onClose} style={s.camHBtn}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
            </Svg>
          </TouchableOpacity>

          {/* Indicador de grabación */}
          {recording && (
            <View style={s.recBadge}>
              <View style={s.recDot} />
              <Text style={s.recTime}>{formatRecTime(recTime)}</Text>
            </View>
          )}

          {/* Flash */}
          {!recording && (
            <TouchableOpacity style={s.camHBtn} onPress={() => setFlash(f => f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off')}>
              <Text style={{ fontSize: 22 }}>{flash === 'off' ? '⚡' : flash === 'on' ? '🔦' : '🌟'}</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>

        {/* Guías de encuadre */}
        <View style={s.gridOverlay} pointerEvents="none">
          {[0.33, 0.66].map(v => (
            <React.Fragment key={v}>
              <View style={[s.gridLine, s.gridLineH, { top: `${v * 100}%` as any }]} />
              <View style={[s.gridLine, s.gridLineV, { left: `${v * 100}%` as any }]} />
            </React.Fragment>
          ))}
        </View>

        {/* Controles inferiores */}
        <View style={[s.camControls, { paddingBottom: insets.bottom + 24 }]}>
          {/* Selector foto / video */}
          {!recording && (
            <View style={s.modeRow}>
              {(['photo', 'video'] as const).map(m => (
                <TouchableOpacity key={m} onPress={() => setMode(m)} style={s.modeBtn}>
                  <Text style={[s.modeBtnText, mode === m && s.modeBtnActive]}>
                    {m === 'photo' ? '📷 Foto' : '🎬 Video'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={s.camBtnsRow}>
            {/* Galería */}
            {!recording && (
              <TouchableOpacity style={s.camSideBtn} onPress={handleGallery}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                  <Rect x="3" y="3" width="18" height="18" rx="2" />
                  <Polyline points="3 9 9 3 21 3" />
                  <Path d="M21 15l-5-5L5 21" />
                </Svg>
                <Text style={s.camSideBtnLabel}>Galería</Text>
              </TouchableOpacity>
            )}

            {/* Botón principal captura */}
            <TouchableOpacity
              style={[s.shutterBtn, recording && s.shutterBtnRec, processing && { opacity: 0.6 }]}
              onPress={mode === 'photo' ? handlePhoto : (recording ? handleStopRecord : handleStartRecord)}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing
                ? <ActivityIndicator color="#fff" />
                : mode === 'video'
                  ? recording
                    ? <View style={s.stopIcon} />
                    : <View style={s.recIcon} />
                  : <View style={s.shutterInner} />
              }
            </TouchableOpacity>

            {/* Voltear cámara */}
            {!recording && (
              <TouchableOpacity style={s.camSideBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                  <Path d="M1 4v6h6" /><Path d="M23 20v-6h-6" />
                  <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </Svg>
                <Text style={s.camSideBtnLabel}>Voltear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════════

// ── Capa de texto arrastrable ─────────────────────────────────────
function DraggableTextLayer({
  layer, onEdit, onDelete,
}: { layer: EditorTextLayer; onEdit: (l: EditorTextLayer) => void; onDelete: (id: string) => void }) {
  const pan = useRef(new Animated.ValueXY({ x: layer.x, y: layer.y })).current;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.extractOffset(),
    onPanResponderGrant: () => pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }),
  })).current;

  return (
    <Animated.View
      style={[s.textLayer, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onPress={() => onEdit(layer)} onLongPress={() => onDelete(layer.id)}>
        <Text style={{
          color: layer.color,
          fontSize: layer.fontSize,
          fontWeight: layer.bold ? '800' : '600',
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 3,
        }}>
          {layer.text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Capa de sticker arrastrable ───────────────────────────────────
function DraggableStickerLayer({
  sticker, onDelete, onUpdate,
}: { sticker: StickerLayer; onDelete: (id: string) => void; onUpdate: (s: StickerLayer) => void }) {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.extractOffset(),
    onPanResponderGrant: () => pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }),
  })).current;

  return (
    <Animated.View
      style={[s.stickerLayer, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onLongPress={() => onDelete(sticker.id)}>
        <Text style={{ fontSize: 48 * sticker.scale }}>{sticker.emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Panel de filtros ──────────────────────────────────────────────
function FilterPanel({ selected, onSelect, imageUri, insetBottom }: {
  selected: string; onSelect: (id: string) => void; imageUri: string; insetBottom: number;
}) {
  return (
    <View style={[s.filterPanel, { paddingBottom: insetBottom + 8 }]}>
      <Text style={s.panelTitle}>Filtros</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 12 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => onSelect(f.id)} style={[s.filterThumb, selected === f.id && s.filterThumbSel]}>
            <Image source={{ uri: imageUri }} style={s.filterImg} resizeMode="cover" />
            {f.id === 'bw' && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.0)' }]} />}
            {selected === f.id && (
              <View style={s.filterCheck}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
              </View>
            )}
            <Text style={s.filterLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Panel de stickers ─────────────────────────────────────────────
function StickerPanel({ stickerSet, onSetChange, onAdd, insetBottom }: {
  stickerSet: number; onSetChange: (i: number) => void; onAdd: (emoji: string) => void; insetBottom: number;
}) {
  return (
    <View style={[s.filterPanel, { paddingBottom: insetBottom + 8 }]}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 }}>
        {STICKER_SETS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => onSetChange(i)}
            style={[s.stickerSetBtn, stickerSet === i && s.stickerSetBtnActive]}>
            <Text style={{ fontSize: 18 }}>{STICKER_SETS[i][0]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.stickerGrid}>
        {STICKER_SETS[stickerSet].map(emoji => (
          <TouchableOpacity key={emoji} style={s.stickerCell} onPress={() => onAdd(emoji)}>
            <Text style={{ fontSize: 36 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Panel de edición de texto ─────────────────────────────────────
function TextEditorPanel({ draft, color, bold, size, onDraftChange, onColorChange, onBoldChange, onSizeChange, onSave, onCancel, insetBottom }: {
  draft: string; color: string; bold: boolean; size: number;
  onDraftChange: (t: string) => void; onColorChange: (c: string) => void;
  onBoldChange: (b: boolean) => void; onSizeChange: (s: number) => void;
  onSave: () => void; onCancel: () => void; insetBottom: number;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.textEditPanel, { paddingBottom: insetBottom + 8 }]}
    >
      {/* Preview de texto */}
      <Text style={{
        color, fontSize: size, fontWeight: bold ? '800' : '400',
        textAlign: 'center', marginBottom: 12, minHeight: 40,
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
      }}>
        {draft || 'Escribe algo...'}
      </Text>
      <TextInput
        style={s.textEditInput}
        value={draft}
        onChangeText={onDraftChange}
        placeholder="Tu texto aquí..."
        placeholderTextColor="rgba(255,255,255,0.5)"
        multiline
        autoFocus
        maxLength={120}
        selectionColor="#00C8A0"
      />
      {/* Colores */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {TEXT_COLORS.map(c => (
          <TouchableOpacity key={c} onPress={() => onColorChange(c)}
            style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotSel]} />
        ))}
      </ScrollView>
      {/* Tamaño + negrita */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 10 }}>
        {FONT_SIZES.map(sz => (
          <TouchableOpacity key={sz} onPress={() => onSizeChange(sz)}
            style={[s.sizeDot, size === sz && s.sizeDotSel]}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{sz}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => onBoldChange(!bold)}
          style={[s.sizeDot, bold && s.sizeDotSel, { paddingHorizontal: 12 }]}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>B</Text>
        </TouchableOpacity>
      </View>
      {/* Botones */}
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 12 }}>
        <TouchableOpacity style={s.textCancelBtn} onPress={onCancel}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.textSaveBtn} onPress={onSave} disabled={!draft.trim()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Añadir texto</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // Permisos
  permScreen:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permTitle:        { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  permSub:          { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn:          { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, width: '100%', alignItems: 'center', marginBottom: 12 },
  permBtnText:      { color: '#00C8A0', fontSize: 16, fontWeight: '800' },
  permBtnGallery:   { borderWidth: 2, borderColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, width: '100%', alignItems: 'center' },

  // Cámara
  camRoot:          { flex: 1, backgroundColor: '#000' },
  camHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  camHBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  recBadge:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  recDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' },
  recTime:          { color: '#fff', fontWeight: '700', fontSize: 14 },
  gridOverlay:      { ...StyleSheet.absoluteFillObject },
  gridLine:         { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.15)' },
  gridLineH:        { left: 0, right: 0, height: 1 },
  gridLineV:        { top: 0, bottom: 0, width: 1 },
  camControls:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 16 },
  modeRow:          { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  modeBtn:          { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  modeBtnText:      { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  modeBtnActive:    { color: '#fff', textDecorationLine: 'underline' },
  camBtnsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 24 },
  camSideBtn:       { alignItems: 'center', gap: 4, width: 56 },
  camSideBtnLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  shutterBtn:       { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterBtnRec:    { borderColor: '#ff3b30', backgroundColor: 'rgba(255,59,48,0.2)' },
  shutterInner:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  recIcon:          { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3b30' },
  stopIcon:         { width: 24, height: 24, borderRadius: 4, backgroundColor: '#ff3b30' },

  // Editor
  editorRoot:       { flex: 1, backgroundColor: '#000' },
  editorOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  editorHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  editorHBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  editorDoneBtn:    { backgroundColor: '#00C8A0', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  editorDoneText:   { color: '#fff', fontWeight: '800', fontSize: 15 },
  editorSidebar:    { position: 'absolute', right: 14, gap: 10 },
  sidebarBtn:       { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 28, padding: 10, width: 54, gap: 2 },
  sidebarBtnActive: { backgroundColor: 'rgba(0,200,160,0.3)', borderWidth: 1.5, borderColor: '#00C8A0' },
  sidebarIcon:      { fontSize: 18, color: '#fff' },
  sidebarLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Capas
  textLayer:        { position: 'absolute', zIndex: 10 },
  stickerLayer:     { position: 'absolute', zIndex: 10 },

  // Filtros
  filterPanel:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', paddingTop: 12 },
  panelTitle:       { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  filterThumb:      { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  filterThumbSel:   { borderColor: '#00C8A0' },
  filterImg:        { width: '100%', height: 56 },
  filterLabel:      { color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 },
  filterCheck:      { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center' },

  // Stickers
  stickerSetBtn:    { padding: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  stickerSetBtnActive: { backgroundColor: 'rgba(0,200,160,0.3)', borderWidth: 1, borderColor: '#00C8A0' },
  stickerGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 6 },
  stickerCell:      { width: (W - 24 - 42) / 8, height: 52, alignItems: 'center', justifyContent: 'center' },

  // Editor de texto
  textEditPanel:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.88)', paddingTop: 16 },
  textEditInput:    { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginHorizontal: 12, marginBottom: 8 },
  colorDot:         { width: 32, height: 32, borderRadius: 16 },
  colorDotSel:      { borderWidth: 3, borderColor: '#00C8A0', transform: [{ scale: 1.15 }] },
  sizeDot:          { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  sizeDotSel:       { backgroundColor: '#00C8A0' },
  textCancelBtn:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  textSaveBtn:      { flex: 2, backgroundColor: '#00C8A0', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
});
