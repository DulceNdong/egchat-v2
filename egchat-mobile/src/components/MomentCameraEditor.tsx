// ══════════════════════════════════════════════════════════════════
// MomentCameraEditor — Cámara profesional + Editor de medios
// Estilo Instagram/TikTok: fondo negro puro, iconos limpios
// Foto · Video · Texto · Stickers · Filtros · Música
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert,
  Dimensions, TextInput, ScrollView, Image, Platform,
  KeyboardAvoidingView, Animated, PanResponder, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, Rect, G } from 'react-native-svg';
import { StoryMusicPicker, StoryMusicBadge, type StoryMusic } from './StoryMusicPicker';

const { width: W, height: H } = Dimensions.get('window');

// ── Tipos ──────────────────────────────────────────────────────────
export interface EditorTextLayer {
  id: string; text: string; x: number; y: number;
  color: string; fontSize: number; bold: boolean;
}
export interface MomentMedia {
  uri: string; type: 'photo' | 'video';
  filter?: string; textLayers?: EditorTextLayer[];
  stickers?: StickerLayer[]; music?: StoryMusic | null;
}
interface StickerLayer { id: string; emoji: string; x: number; y: number; scale: number; }

// ── Paleta del editor — todo sobre negro ───────────────────────────
const BLACK  = '#000000';
const WHITE  = '#ffffff';
const ACCENT = '#00C8A0';
const DIM    = 'rgba(255,255,255,0.18)';
const DIM2   = 'rgba(255,255,255,0.08)';

// ── Filtros ────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'normal',  label: 'Original' },
  { id: 'vivid',   label: 'Vívido'   },
  { id: 'warm',    label: 'Cálido'   },
  { id: 'cool',    label: 'Frío'     },
  { id: 'bw',      label: 'B&N'      },
  { id: 'fade',    label: 'Fade'     },
  { id: 'drama',   label: 'Drama'    },
  { id: 'golden',  label: 'Golden'   },
];

const TEXT_COLORS = [
  '#ffffff','#000000','#ff3b30','#ff9500',
  '#ffcc00','#34c759','#00c8a0','#007aff','#af52de','#ff2d55',
];

const STICKER_ROWS = [
  ['😂','❤️','🔥','👏','😍','🎉','✨','💯'],
  ['🌟','💫','🎵','🎶','🌈','💥','⚡','🌊'],
  ['🦁','🐯','🦊','🐸','🦋','🌸','🍀','🌺'],
  ['🏆','🎯','🚀','💎','👑','🔮','🎭','🎪'],
];

// ══════════════════════════════════════════════════════════════════
// ICONOS SVG PROPIOS — trazo blanco limpio
// ══════════════════════════════════════════════════════════════════
const IC = ({ size = 24, children, ...rest }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </Svg>
);

const IcClose      = (p: any) => <IC {...p}><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></IC>;
const IcFlip       = (p: any) => <IC {...p}><Path d="M1 4v6h6"/><Path d="M23 20v-6h-6"/><Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></IC>;
const IcFlash      = (p: any) => <IC {...p}><Polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IC>;
const IcFlashOff   = (p: any) => <IC {...p}><Path d="M12 2L9 10H4L13 22V14H18L12 2z" opacity={0.4}/><Line x1="2" y1="2" x2="22" y2="22" strokeWidth={2}/></IC>;
const IcText       = (p: any) => <IC {...p}><Path d="M4 6h16M4 12h10M4 18h13"/></IC>;
const IcSticker    = (p: any) => <IC {...p}><Circle cx="12" cy="12" r="10"/><Path d="M8 14s1.5 2 4 2 4-2 4-2"/><Line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={3}/><Line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={3}/></IC>;
const IcFilter     = (p: any) => <IC {...p}><Circle cx="12" cy="12" r="3"/><Path d="M3 12h3m12 0h3M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/></IC>;
const IcMusic      = (p: any) => <IC {...p}><Path d="M9 18V5l12-2v13"/><Circle cx="6" cy="18" r="3"/><Circle cx="18" cy="16" r="3"/></IC>;
const IcGallery    = (p: any) => <IC {...p}><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></IC>;
const IcCheck      = (p: any) => <IC {...p}><Polyline points="20 6 9 17 4 12"/></IC>;
const IcSend       = (p: any) => <IC {...p}><Line x1="22" y1="2" x2="11" y2="13"/><Polyline points="22 2 15 22 11 13 2 9 22 2"/></IC>;
const IcTrash      = (p: any) => <IC {...p}><Polyline points="3 6 5 6 21 6"/><Path d="M19 6l-1 14H6L5 6"/><Path d="M10 11v6M14 11v6"/><Path d="M9 6V4h6v2"/></IC>;

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
interface Props {
  visible: boolean;
  onClose: () => void;
  onDone: (media: MomentMedia) => void;
}

export default function MomentCameraEditor({ visible, onClose, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [camPerm,  requestCamPerm]  = useCameraPermissions();
  const [micPerm,  requestMicPerm]  = useMicrophonePermissions();

  // ── Cámara ────────────────────────────────────────────────────
  const [mode,      setMode]      = useState<'photo' | 'video'>('photo');
  const [facing,    setFacing]    = useState<CameraType>('back');
  const [flash,     setFlash]     = useState<'off' | 'on'>('off');
  const [recording, setRecording] = useState(false);
  const [recSecs,   setRecSecs]   = useState(0);
  const [processing,setProcessing]= useState(false);
  const cameraRef   = useRef<CameraView>(null);
  const recTimer    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Editor ────────────────────────────────────────────────────
  const [captured,  setCaptured]  = useState<{ uri: string; type: 'photo' | 'video' } | null>(null);
  const [editorTab, setEditorTab] = useState<'text' | 'stickers' | 'filters' | 'music' | null>(null);
  const [filter,    setFilter]    = useState('normal');

  // Texto
  const [textLayers,  setTextLayers]  = useState<EditorTextLayer[]>([]);
  const [editingText, setEditingText] = useState<EditorTextLayer | null>(null);
  const [draftText,   setDraftText]   = useState('');
  const [txtColor,    setTxtColor]    = useState('#ffffff');
  const [txtBold,     setTxtBold]     = useState(false);
  const [txtSize,     setTxtSize]     = useState(28);

  // Stickers
  const [stickers,    setStickers]    = useState<StickerLayer[]>([]);
  const [stickerRow,  setStickerRow]  = useState(0);

  // Música
  const [music,          setMusic]          = useState<StoryMusic | null>(null);
  const [showMusicPicker,setShowMusicPicker] = useState(false);

  // ── Limpieza ──────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setCaptured(null); setEditorTab(null); setTextLayers([]); setStickers([]);
      setMusic(null); setFilter('normal'); setRecording(false); setRecSecs(0);
      if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    }
  }, [visible]);

  // ── Permisos ──────────────────────────────────────────────────
  const ensurePerms = useCallback(async () => {
    if (!camPerm?.granted) { const r = await requestCamPerm(); if (!r.granted) return false; }
    if (mode === 'video' && !micPerm?.granted) { const r = await requestMicPerm(); if (!r.granted) return false; }
    return true;
  }, [camPerm, micPerm, mode, requestCamPerm, requestMicPerm]);

  // ── Foto ──────────────────────────────────────────────────────
  const takePhoto = useCallback(async () => {
    if (!(await ensurePerms()) || !cameraRef.current) return;
    setProcessing(true);
    try {
      const p = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (p?.uri) {
        const uri = facing === 'front'
          ? (await ImageManipulator.manipulateAsync(p.uri, [{ flip: ImageManipulator.FlipType.Horizontal }], { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG })).uri
          : p.uri;
        setCaptured({ uri, type: 'photo' });
      }
    } catch { Alert.alert('Error', 'No se pudo tomar la foto'); }
    finally { setProcessing(false); }
  }, [cameraRef, facing, ensurePerms]);

  // ── Video ─────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!(await ensurePerms()) || !cameraRef.current || recording) return;
    setRecording(true); setRecSecs(0);
    recTimer.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    try {
      const v = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (v?.uri) setCaptured({ uri: v.uri, type: 'video' });
    } catch { Alert.alert('Error', 'No se pudo grabar el video'); }
    finally {
      setRecording(false); setRecSecs(0);
      if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    }
  }, [cameraRef, recording, ensurePerms]);

  const stopRecording = useCallback(() => cameraRef.current?.stopRecording(), [cameraRef]);

  // ── Galería ───────────────────────────────────────────────────
  const openGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Sin permiso', 'Necesitas acceso a la galería'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.92, videoMaxDuration: 60,
    });
    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0];
      setCaptured({ uri: a.uri, type: a.type === 'video' ? 'video' : 'photo' });
    }
  }, []);

  // ── Texto ─────────────────────────────────────────────────────
  const addTextLayer = useCallback(() => {
    setDraftText(''); setTxtColor('#ffffff'); setTxtBold(false); setTxtSize(28);
    setEditingText({ id: `t${Date.now()}`, text: '', x: W / 2 - 80, y: H / 3, color: '#ffffff', fontSize: 28, bold: false });
  }, []);

  const saveText = useCallback(() => {
    if (!editingText || !draftText.trim()) { setEditingText(null); return; }
    const layer = { ...editingText, text: draftText.trim(), color: txtColor, fontSize: txtSize, bold: txtBold };
    setTextLayers(prev => prev.find(l => l.id === layer.id) ? prev.map(l => l.id === layer.id ? layer : l) : [...prev, layer]);
    setEditingText(null); setDraftText('');
  }, [editingText, draftText, txtColor, txtSize, txtBold]);

  // ── Publicar ──────────────────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (!captured) return;
    setProcessing(true);
    try {
      onDone({ uri: captured.uri, type: captured.type, filter, textLayers, stickers, music });
    } finally { setProcessing(false); }
  }, [captured, filter, textLayers, stickers, music, onDone]);

  const fmtSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!visible) return null;

  // ── Pantalla de permisos ──────────────────────────────────────
  if (!camPerm?.granted) {
    return (
      <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={s.permRoot}>
          <View style={s.permInner}>
            <View style={s.permIconWrap}>
              <IcFilter size={40} />
            </View>
            <Text style={s.permTitle}>Acceso a la cámara</Text>
            <Text style={s.permSub}>EGChat necesita la cámara para crear tus Moments</Text>
            <TouchableOpacity style={s.permBtn} onPress={async () => { await requestCamPerm(); await requestMicPerm(); }}>
              <Text style={s.permBtnTxt}>Permitir acceso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.permBtnSec} onPress={openGallery}>
              <IcGallery size={18} />
              <Text style={s.permBtnSecTxt}>Elegir de la galería</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── EDITOR (post-captura) ─────────────────────────────────────
  if (captured) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent onRequestClose={() => setCaptured(null)}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={s.edRoot}>
          {/* Fondo */}
          <Image source={{ uri: captured.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.06)' }]} pointerEvents="none" />

          {/* Capas de texto */}
          {textLayers.map(layer => (
            <DraggableText
              key={layer.id}
              layer={layer}
              onTap={l => { setDraftText(l.text); setTxtColor(l.color); setTxtSize(l.fontSize); setTxtBold(l.bold); setEditingText(l); setEditorTab('text'); }}
              onLongPress={id => setTextLayers(prev => prev.filter(l => l.id !== id))}
            />
          ))}

          {/* Capas de stickers */}
          {stickers.map(stk => (
            <DraggableSticker
              key={stk.id}
              sticker={stk}
              onLongPress={id => setStickers(prev => prev.filter(s => s.id !== id))}
            />
          ))}

          {/* Header del editor */}
          <SafeAreaView edges={['top']} style={s.edHeader}>
            <TouchableOpacity style={s.edIconBtn} onPress={() => setCaptured(null)}>
              <IcClose size={22} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {music && (
              <TouchableOpacity style={s.musicChip} onPress={() => setMusic(null)}>
                <IcMusic size={14} />
                <Text style={s.musicChipTxt} numberOfLines={1}>{music.title}</Text>
                <IcClose size={12} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.doneBtn, processing && { opacity: 0.5 }]}
              onPress={handleDone}
              disabled={processing}
            >
              {processing ? <ActivityIndicator color={BLACK} size="small" /> : <Text style={s.doneBtnTxt}>Usar</Text>}
            </TouchableOpacity>
          </SafeAreaView>

          {/* Barra de herramientas lateral derecha */}
          <View style={[s.edSidebar, { bottom: insets.bottom + 140 }]}>
            {[
              { id: 'text',     Icon: IcText,    label: 'Texto',    action: () => { addTextLayer(); } },
              { id: 'stickers', Icon: IcSticker, label: 'Stickers', action: () => setEditorTab(t => t === 'stickers' ? null : 'stickers') },
              { id: 'filters',  Icon: IcFilter,  label: 'Filtros',  action: () => setEditorTab(t => t === 'filters' ? null : 'filters') },
              { id: 'music',    Icon: IcMusic,   label: 'Música',   action: () => setShowMusicPicker(true) },
            ].map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={[s.sideToolBtn, editorTab === tool.id && s.sideToolBtnOn]}
                onPress={tool.action}
              >
                <tool.Icon size={22} stroke={editorTab === tool.id ? ACCENT : WHITE} />
                <Text style={[s.sideToolLbl, editorTab === tool.id && { color: ACCENT }]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Panel de filtros */}
          {editorTab === 'filters' && captured.type === 'photo' && (
            <FilterPanel
              selected={filter}
              onSelect={setFilter}
              imageUri={captured.uri}
              insetBottom={insets.bottom}
            />
          )}

          {/* Panel de stickers */}
          {editorTab === 'stickers' && (
            <StickerPanel
              row={stickerRow}
              onRowChange={setStickerRow}
              onPick={emoji => {
                setStickers(prev => [...prev, { id: `s${Date.now()}`, emoji, x: W / 2 - 24, y: H / 2 - 24, scale: 1 }]);
                setEditorTab(null);
              }}
              insetBottom={insets.bottom}
            />
          )}

          {/* Editor de texto */}
          {editingText && (
            <TextEditorPanel
              draft={draftText}
              color={txtColor}
              bold={txtBold}
              size={txtSize}
              onDraft={setDraftText}
              onColor={setTxtColor}
              onBold={setTxtBold}
              onSize={setTxtSize}
              onSave={saveText}
              onCancel={() => setEditingText(null)}
              insetBottom={insets.bottom}
            />
          )}
        </View>

        <StoryMusicPicker
          visible={showMusicPicker}
          selected={music}
          onSelect={m => { setMusic(m); setShowMusicPicker(false); }}
          onClose={() => setShowMusicPicker(false)}
        />
      </Modal>
    );
  }

  // ── VISOR DE CÁMARA ───────────────────────────────────────────
  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={s.camRoot}>
        {/* Visor */}
        <CameraView
          ref={cameraRef as any}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          mode={mode === 'video' ? 'video' : 'picture'}
        />

        {/* Overlay de encuadre */}
        <View style={s.frameOverlay} pointerEvents="none">
          {[{ t: 0, l: 0 }, { t: 0, r: 0 }, { b: 0, l: 0 }, { b: 0, r: 0 }].map((pos, i) => (
            <View key={i} style={[s.frameCorner, pos as any]} />
          ))}
        </View>

        {/* Header cámara */}
        <View style={[s.camHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.camIconBtn} onPress={onClose}>
            <IcClose size={22} />
          </TouchableOpacity>

          {/* Indicador grabación */}
          {recording && (
            <View style={s.recPill}>
              <View style={s.recDot} />
              <Text style={s.recTxt}>{fmtSecs(recSecs)}</Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* Flash */}
          {!recording && (
            <TouchableOpacity
              style={s.camIconBtn}
              onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
            >
              {flash === 'on' ? <IcFlash size={22} /> : <IcFlashOff size={22} />}
            </TouchableOpacity>
          )}
        </SafeAreaView>

        {/* Selector Foto / Video */}
        {!recording && (
          <View style={s.modeTabs}>
            {(['photo', 'video'] as const).map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={s.modeTab}>
                <Text style={[s.modeTabTxt, mode === m && s.modeTabTxtOn]}>
                  {m === 'photo' ? 'FOTO' : 'VIDEO'}
                </Text>
                {mode === m && <View style={s.modeTabDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Controles inferiores */}
        <View style={[s.camControls, { paddingBottom: insets.bottom + 28 }]}>
          {/* Galería */}
          {!recording ? (
            <TouchableOpacity style={s.camSideBtn} onPress={openGallery}>
              <IcGallery size={28} />
              <Text style={s.camSideLbl}>Galería</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 56 }} />}

          {/* Botón central */}
          <TouchableOpacity
            style={[
              s.shutterOuter,
              mode === 'video' && s.shutterOuterVideo,
              recording && s.shutterOuterRec,
            ]}
            onPress={mode === 'photo' ? takePhoto : (recording ? stopRecording : startRecording)}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color={WHITE} />
            ) : mode === 'photo' ? (
              <View style={s.shutterInner} />
            ) : recording ? (
              <View style={s.stopShape} />
            ) : (
              <View style={s.recShape} />
            )}
          </TouchableOpacity>

          {/* Voltear */}
          {!recording ? (
            <TouchableOpacity style={s.camSideBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <IcFlip size={28} />
              <Text style={s.camSideLbl}>Voltear</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 56 }} />}
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════════

function DraggableText({ layer, onTap, onLongPress }: {
  layer: EditorTextLayer;
  onTap: (l: EditorTextLayer) => void;
  onLongPress: (id: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: layer.x, y: layer.y })).current;
  const pr  = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.extractOffset(),
  })).current;

  return (
    <Animated.View style={[s.textLayer, { transform: pan.getTranslateTransform() }]} {...pr.panHandlers}>
      <TouchableOpacity onPress={() => onTap(layer)} onLongPress={() => onLongPress(layer.id)}>
        <Text style={{
          color: layer.color, fontSize: layer.fontSize,
          fontWeight: layer.bold ? '800' : '600',
          textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4,
        }}>{layer.text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function DraggableSticker({ sticker, onLongPress }: {
  sticker: StickerLayer;
  onLongPress: (id: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const pr  = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.extractOffset(),
  })).current;

  return (
    <Animated.View style={[s.stickerLayer, { transform: pan.getTranslateTransform() }]} {...pr.panHandlers}>
      <TouchableOpacity onLongPress={() => onLongPress(sticker.id)}>
        <Text style={{ fontSize: 48 * sticker.scale }}>{sticker.emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function FilterPanel({ selected, onSelect, imageUri, insetBottom }: {
  selected: string; onSelect: (id: string) => void; imageUri: string; insetBottom: number;
}) {
  return (
    <View style={[s.bottomPanel, { paddingBottom: insetBottom + 10 }]}>
      <Text style={s.panelTitle}>FILTROS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => onSelect(f.id)} style={[s.filterItem, selected === f.id && s.filterItemOn]}>
            <Image source={{ uri: imageUri }} style={s.filterThumb} resizeMode="cover" />
            {selected === f.id && (
              <View style={s.filterCheck}>
                <IcCheck size={10} stroke={BLACK} strokeWidth={3} />
              </View>
            )}
            <Text style={[s.filterLbl, selected === f.id && { color: WHITE }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StickerPanel({ row, onRowChange, onPick, insetBottom }: {
  row: number; onRowChange: (i: number) => void; onPick: (e: string) => void; insetBottom: number;
}) {
  return (
    <View style={[s.bottomPanel, { paddingBottom: insetBottom + 10 }]}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 }}>
        {STICKER_ROWS.map((r, i) => (
          <TouchableOpacity key={i} onPress={() => onRowChange(i)}
            style={[s.stickerTabBtn, row === i && s.stickerTabBtnOn]}>
            <Text style={{ fontSize: 18 }}>{r[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.stickerGrid}>
        {STICKER_ROWS[row].map(e => (
          <TouchableOpacity key={e} style={s.stickerCell} onPress={() => onPick(e)}>
            <Text style={{ fontSize: 36 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TextEditorPanel({ draft, color, bold, size, onDraft, onColor, onBold, onSize, onSave, onCancel, insetBottom }: {
  draft: string; color: string; bold: boolean; size: number;
  onDraft: (t: string) => void; onColor: (c: string) => void;
  onBold: (b: boolean) => void; onSize: (s: number) => void;
  onSave: () => void; onCancel: () => void; insetBottom: number;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.textPanel, { paddingBottom: insetBottom + 10 }]}
    >
      {/* Preview */}
      <Text style={{ color, fontSize: size, fontWeight: bold ? '800' : '400',
        textAlign: 'center', marginBottom: 10, minHeight: 44,
        textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4,
      }}>
        {draft || 'Tu texto aquí...'}
      </Text>

      <TextInput
        style={s.textInput}
        value={draft}
        onChangeText={onDraft}
        placeholder="Escribe algo..."
        placeholderTextColor="rgba(255,255,255,0.35)"
        multiline autoFocus maxLength={120}
        selectionColor={ACCENT}
      />

      {/* Colores */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 10 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {TEXT_COLORS.map(c => (
          <TouchableOpacity key={c} onPress={() => onColor(c)}
            style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotOn]} />
        ))}
      </ScrollView>

      {/* Tamaños + negrita */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
        {[18, 22, 28, 36, 44].map(sz => (
          <TouchableOpacity key={sz} onPress={() => onSize(sz)}
            style={[s.sizePill, size === sz && s.sizePillOn]}>
            <Text style={{ color: WHITE, fontSize: 11, fontWeight: '700' }}>{sz}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => onBold(!bold)}
          style={[s.sizePill, bold && s.sizePillOn, { paddingHorizontal: 14 }]}>
          <Text style={{ color: WHITE, fontWeight: '900', fontSize: 14 }}>B</Text>
        </TouchableOpacity>
      </View>

      {/* Acciones */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
        <TouchableOpacity style={s.txtCancelBtn} onPress={onCancel}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.txtSaveBtn, !draft.trim() && { opacity: 0.4 }]}
          onPress={onSave} disabled={!draft.trim()}>
          <IcCheck size={16} stroke={BLACK} strokeWidth={2.5} />
          <Text style={{ color: BLACK, fontWeight: '800' }}>Añadir texto</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS — fondo negro puro, sin colores de relleno
// ══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // ── Permisos
  permRoot:      { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permInner:     { alignItems: 'center', width: '100%' },
  permIconWrap:  { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: DIM, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permTitle:     { fontSize: 22, fontWeight: '700', color: WHITE, marginBottom: 10, textAlign: 'center' },
  permSub:       { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  permBtn:       { backgroundColor: WHITE, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, width: '100%', alignItems: 'center', marginBottom: 12 },
  permBtnTxt:    { color: BLACK, fontSize: 15, fontWeight: '800' },
  permBtnSec:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: DIM, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 30, width: '100%', justifyContent: 'center' },
  permBtnSecTxt: { color: WHITE, fontSize: 14, fontWeight: '600' },

  // ── Cámara
  camRoot:       { flex: 1, backgroundColor: BLACK },
  camHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  camIconBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  recPill:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' },
  recTxt:        { color: WHITE, fontWeight: '700', fontSize: 13 },

  frameOverlay:  { ...StyleSheet.absoluteFillObject },
  frameCorner:   { position: 'absolute', width: 24, height: 24, borderColor: WHITE, opacity: 0.6,
                   borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 2 },

  modeTabs:      { position: 'absolute', bottom: 160, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 32 },
  modeTab:       { alignItems: 'center', paddingVertical: 6 },
  modeTabTxt:    { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  modeTabTxtOn:  { color: WHITE },
  modeTabDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: WHITE, marginTop: 4 },

  camControls:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16 },
  camSideBtn:    { alignItems: 'center', gap: 4, width: 56 },
  camSideLbl:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },

  shutterOuter:  { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  shutterOuterVideo: { borderColor: '#ff3b30' },
  shutterOuterRec:   { borderColor: '#ff3b30', backgroundColor: 'rgba(255,59,48,0.15)' },
  shutterInner:  { width: 66, height: 66, borderRadius: 33, backgroundColor: WHITE },
  recShape:      { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ff3b30' },
  stopShape:     { width: 26, height: 26, borderRadius: 5, backgroundColor: '#ff3b30' },

  // ── Editor
  edRoot:        { flex: 1, backgroundColor: BLACK },
  edHeader:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  edIconBtn:     { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  musicChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, maxWidth: 160, borderWidth: 1, borderColor: DIM },
  musicChipTxt:  { color: WHITE, fontSize: 12, fontWeight: '600', flex: 1 },
  doneBtn:       { backgroundColor: WHITE, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22, marginLeft: 10 },
  doneBtnTxt:    { color: BLACK, fontWeight: '800', fontSize: 15 },

  edSidebar:     { position: 'absolute', right: 14, gap: 8 },
  sideToolBtn:   { alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 28, padding: 10, width: 56, borderWidth: 1, borderColor: 'transparent' },
  sideToolBtnOn: { borderColor: ACCENT, backgroundColor: 'rgba(0,200,160,0.12)' },
  sideToolLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  textLayer:     { position: 'absolute', zIndex: 10 },
  stickerLayer:  { position: 'absolute', zIndex: 10 },

  // ── Paneles inferiores
  bottomPanel:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', paddingTop: 14 },
  panelTitle:    { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginBottom: 12 },

  filterItem:    { width: 72, height: 80, borderRadius: 10, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  filterItemOn:  { borderColor: WHITE },
  filterThumb:   { width: '100%', height: 56 },
  filterCheck:   { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  filterLbl:     { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 0.5 },

  stickerTabBtn:    { padding: 8, borderRadius: 12, backgroundColor: DIM2 },
  stickerTabBtnOn:  { backgroundColor: DIM },
  stickerGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 4 },
  stickerCell:      { width: (W - 24 - 28) / 8, height: 52, alignItems: 'center', justifyContent: 'center' },

  textPanel:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.92)', paddingTop: 16 },
  textInput:     { backgroundColor: DIM2, color: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginHorizontal: 16, marginBottom: 4, borderWidth: 1, borderColor: DIM },
  colorDot:      { width: 30, height: 30, borderRadius: 15 },
  colorDotOn:    { borderWidth: 3, borderColor: WHITE, transform: [{ scale: 1.18 }] },
  sizePill:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: DIM2 },
  sizePillOn:    { backgroundColor: ACCENT },
  txtCancelBtn:  { flex: 1, borderWidth: 1, borderColor: DIM, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  txtSaveBtn:    { flex: 2, backgroundColor: WHITE, paddingVertical: 13, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
