// PhotoEditorModal.tsx — Editor de fotos moderno para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Modal, SafeAreaView, Image, FlatList,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';

interface PhotoEditorModalProps {
  visible: boolean;
  photoUri: string;
  chatId: string;
  onClose: () => void;
  onSend: (chatId: string, caption: string, editedUri: string) => void;
}

type Tool = 'filters' | 'adjust' | 'rotate' | 'text';

interface Filter {
  id: string;
  label: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

const FILTERS: Filter[] = [
  { id: 'none',  label: 'Original' },
  { id: 'bw',   label: 'B&N',   saturation: 0 },
  { id: 'warm', label: 'Cálido', brightness: 1.1, saturation: 1.3 },
  { id: 'cool', label: 'Frío',   brightness: 0.95, saturation: 0.8 },
  { id: 'vivid',label: 'Vívido', contrast: 1.2, saturation: 1.8 },
  { id: 'fade', label: 'Fade',   brightness: 1.05, contrast: 0.85, saturation: 0.7 },
  { id: 'drama',label: 'Drama',  contrast: 1.4, brightness: 0.9 },
];

// ── Iconos SVG limpios (monocromáticos, sin fondos de color) ─────────────
const IcFilters = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8}/>
    <Path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
      stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const IcAdjust = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6"  x2="20" y2="6"  stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx="8"  cy="6"  r="2.5" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'}/>
    <Line x1="4" y1="12" x2="20" y2="12" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx="15" cy="12" r="2.5" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'}/>
    <Line x1="4" y1="18" x2="20" y2="18" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx="10" cy="18" r="2.5" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'}/>
  </Svg>
);

const IcRotate = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M1 4v6h6" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IcText = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7V4h16v3" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 20h6M12 4v16" stroke={active ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IcSend = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"
      stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IcBack = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 5l-7 7 7 7"
      stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IcRotLeft  = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M2.5 2v6h6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M2.5 8C4.5 4.5 8.5 2 13 2a10 10 0 1 1-10 10" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const IcRotRight = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21.5 2v6h-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M21.5 8C19.5 4.5 15.5 2 11 2a10 10 0 1 0 10 10" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const IcReset = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 3v5h5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TOOLS: { id: Tool; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'filters', label: 'Filtros',  Icon: IcFilters },
  { id: 'adjust',  label: 'Ajustar',  Icon: IcAdjust  },
  { id: 'rotate',  label: 'Rotar',    Icon: IcRotate  },
  { id: 'text',    label: 'Texto',    Icon: IcText    },
];

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  visible, photoUri, chatId, onClose, onSend,
}) => {
  const [tool,          setTool]          = useState<Tool>('filters');
  const [filter,        setFilter]        = useState('none');
  const [rotation,      setRotation]      = useState(0);
  const [caption,       setCaption]       = useState('');
  const [overlayText,   setOverlayText]   = useState('');
  const [textInput,     setTextInput]     = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [processing,    setProcessing]    = useState(false);

  // Controles de Ajuste
  const [brightness, setBrightness] = useState(100);  // 0–200, 100=neutro
  const [contrast,   setContrast]   = useState(100);
  const [saturation, setSaturation] = useState(100);

  const handleSend = async () => {
    try {
      setProcessing(true);
      const actions: ImageManipulator.Action[] = [];
      if (rotation !== 0) actions.push({ rotate: rotation });

      const result = await ImageManipulator.manipulateAsync(
        photoUri, actions,
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      onSend(chatId, caption, result.uri);
    } catch {
      onSend(chatId, caption, photoUri);
    } finally {
      setProcessing(false);
    }
  };

  // ── Slider minimalista ────────────────────────────────────────────────────
  const SimpleSlider = ({
    value, onChange, min = 0, max = 200, label,
  }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <View style={s.sliderRow}>
        <Text style={s.sliderLabel}>{label}</Text>
        <View style={s.sliderTrack}>
          <View style={[s.sliderFill, { width: `${pct}%` }]}/>
          <TouchableOpacity
            style={[s.sliderThumb, { left: `${pct}%` as any }]}
            activeOpacity={1}
          />
        </View>
        <Text style={s.sliderValue}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>

        {/* ── Header ── */}
        <SafeAreaView style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.iconBtn} hitSlop={8}>
            <IcBack/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar foto</Text>
          <TouchableOpacity
            style={[s.sendBtn, processing && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing
              ? <ActivityIndicator color="#fff" size="small"/>
              : <>
                  <IcSend/>
                  <Text style={s.sendBtnText}>Enviar</Text>
                </>
            }
          </TouchableOpacity>
        </SafeAreaView>

        {/* ── Preview ── */}
        <View style={s.preview}>
          <Image
            source={{ uri: photoUri }}
            style={[s.previewImage, rotation !== 0 && { transform: [{ rotate: `${rotation}deg` }] }]}
            resizeMode="contain"
          />
          {overlayText ? (
            <View style={s.overlayTextWrap}>
              <Text style={s.overlayText}>{overlayText}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Panel inferior ── */}
        <View style={s.panel}>

          {/* Filtros */}
          {tool === 'filters' && (
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterList}
              renderItem={({ item }) => {
                const isActive = filter === item.id;
                return (
                  <TouchableOpacity
                    style={[s.filterItem, isActive && s.filterItemActive]}
                    onPress={() => setFilter(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.filterThumbWrap, isActive && s.filterThumbActive]}>
                      <Image source={{ uri: photoUri }} style={s.filterThumb} resizeMode="cover"/>
                    </View>
                    <Text style={[s.filterLabel, isActive && s.filterLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Ajustar */}
          {tool === 'adjust' && (
            <View style={s.adjustPanel}>
              <SimpleSlider label="Brillo"    value={brightness} onChange={setBrightness}/>
              <SimpleSlider label="Contraste" value={contrast}   onChange={setContrast}/>
              <SimpleSlider label="Saturación" value={saturation} onChange={setSaturation}/>
            </View>
          )}

          {/* Rotar */}
          {tool === 'rotate' && (
            <View style={s.rotatePanel}>
              <TouchableOpacity style={s.rotateBtn}
                onPress={() => setRotation(r => (r - 90 + 360) % 360)}>
                <IcRotLeft/>
                <Text style={s.rotateBtnText}>-90°</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rotateBtn}
                onPress={() => setRotation(r => (r + 90) % 360)}>
                <IcRotRight/>
                <Text style={s.rotateBtnText}>+90°</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rotateBtn}
                onPress={() => setRotation(0)}>
                <IcReset/>
                <Text style={s.rotateBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Texto */}
          {tool === 'text' && (
            <View style={s.textPanel}>
              {showTextInput ? (
                <View style={s.textInputRow}>
                  <TextInput
                    style={s.textInput}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="Escribe el texto..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    autoFocus
                  />
                  <TouchableOpacity style={s.textOkBtn}
                    onPress={() => { setOverlayText(textInput); setShowTextInput(false); }}>
                    <Text style={s.textOkBtnText}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.textCancelBtn}
                    onPress={() => { setShowTextInput(false); setTextInput(''); }}>
                    <Text style={s.textCancelBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.textBtns}>
                  <TouchableOpacity style={s.addTextBtn}
                    onPress={() => { setTextInput(overlayText); setShowTextInput(true); }}>
                    <Text style={s.addTextBtnText}>
                      {overlayText ? 'Editar texto' : '+ Añadir texto'}
                    </Text>
                  </TouchableOpacity>
                  {overlayText ? (
                    <TouchableOpacity style={s.removeTextBtn} onPress={() => setOverlayText('')}>
                      <Text style={s.removeTextBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* ── Toolbar ── */}
          <View style={s.toolbar}>
            {TOOLS.map(({ id, label, Icon }) => {
              const isActive = tool === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={s.toolBtn}
                  onPress={() => setTool(id)}
                  activeOpacity={0.75}
                >
                  <Icon active={isActive}/>
                  <Text style={[s.toolLabel, isActive && s.toolLabelActive]}>
                    {label}
                  </Text>
                  {isActive && <View style={s.toolIndicator}/>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Caption ── */}
          <SafeAreaView style={s.captionRow}>
            <TextInput
              style={s.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Añade un pie de foto..."
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
            <TouchableOpacity style={s.sendFab} onPress={handleSend} disabled={processing} activeOpacity={0.8}>
              <IcSend/>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#000' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Preview
  preview: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  overlayTextWrap: {
    position: 'absolute', bottom: '12%', left: 0, right: 0, alignItems: 'center',
  },
  overlayText: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },

  // Panel
  panel: { backgroundColor: '#111' },

  // Filtros
  filterList: { paddingHorizontal: 12, paddingVertical: 14, gap: 12 },
  filterItem:       { alignItems: 'center', gap: 6 },
  filterItemActive: {},
  filterThumbWrap: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  filterThumbActive: { borderColor: '#fff' },
  filterThumb:  { width: 58, height: 58 },
  filterLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  filterLabelActive: { color: '#fff', fontWeight: '700' },

  // Ajustar
  adjustPanel: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', width: 72 },
  sliderTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, position: 'relative', justifyContent: 'center',
  },
  sliderFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },
  sliderThumb: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', marginLeft: -9, top: -7.5,
  },
  sliderValue: { fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 30, textAlign: 'right' },

  // Rotar
  rotatePanel: { flexDirection: 'row', justifyContent: 'center', gap: 14, padding: 16 },
  rotateBtn: {
    alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  rotateBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Texto
  textPanel: { padding: 14 },
  textInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  textInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  textOkBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  textOkBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  textCancelBtn: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  textCancelBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  textBtns: { flexDirection: 'row', gap: 10 },
  addTextBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  addTextBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  removeTextBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  removeTextBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
  },
  toolBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4, position: 'relative',
  },
  toolLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: 0.3 },
  toolLabelActive: { color: '#fff', fontWeight: '600' },
  toolIndicator: {
    position: 'absolute', bottom: 0, width: 20, height: 2,
    backgroundColor: '#fff', borderRadius: 1,
  },

  // Caption
  captionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  captionInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendFab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default PhotoEditorModal;
