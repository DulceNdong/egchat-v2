// ══════════════════════════════════════════════════════════════════
// CreatePollModal — Crear encuesta / poll en el chat
// WhatsApp / WeChat style: pregunta + hasta 12 opciones + multiple choice
// ══════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Rect, G } from 'react-native-svg';
import { createPoll, serializePoll } from './PollMessage';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Props {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function CreatePollModal({ visible, currentUserId, onClose, onSend }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setMultipleChoice(false);
    setSending(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const addOption = () => {
    if (options.length >= 12) return;
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, val: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  };

  const handleSend = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    const filled = options.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) return;

    setSending(true);
    try {
      const poll = createPoll(q, filled, currentUserId, multipleChoice);
      onSend(serializePoll(poll));
      handleClose();
    } finally {
      setSending(false);
    }
  }, [question, options, multipleChoice, currentUserId, onSend]);

  const canSend = question.trim().length > 0 && options.filter(o => o.trim()).length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bgPrimary }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <LinearGradient
          colors={['#07a472', '#00b4e6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[s.header, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity onPress={handleClose} style={s.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>

          {/* Título con ícono SVG de gráfico de barras */}
          <View style={s.headerTitleRow}>
            <View style={s.headerIconWrap}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="3" y="12" width="4" height="9" rx="1"/>
                <Rect x="10" y="7" width="4" height="14" rx="1"/>
                <Rect x="17" y="3" width="4" height="18" rx="1"/>
              </Svg>
            </View>
            <Text style={s.headerTitle}>Nueva encuesta</Text>
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || sending}
            style={[s.headerBtn, s.headerSendBtn, (!canSend || sending) && { opacity: 0.4 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 6L9 17l-5-5"/>
                </Svg>
            }
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pregunta */}
          <Text style={[s.sectionLabel, { color: C.textTertiary }]}>PREGUNTA</Text>
          <View style={[s.inputBox, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
            <TextInput
              style={[s.questionInput, { color: C.textPrimary }]}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor={C.textTertiary}
              value={question}
              onChangeText={setQuestion}
              maxLength={255}
              multiline
              autoFocus
            />
            <Text style={[s.charCount, { color: C.textTertiary }]}>{question.length}/255</Text>
          </View>

          {/* Opciones */}
          <View style={s.optionsHeader}>
            <Text style={[s.sectionLabel, { color: C.textTertiary }]}>OPCIONES ({options.length}/12)</Text>
          </View>

          {options.map((opt, i) => (
            <View key={i} style={[s.optionRow, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <View style={[s.optionNum, { backgroundColor: '#07a47220' }]}>
                <Text style={s.optionNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[s.optionInput, { color: C.textPrimary }]}
                placeholder={`Opción ${i + 1}${i < 2 ? ' (requerida)' : ''}`}
                placeholderTextColor={C.textTertiary}
                value={opt}
                onChangeText={v => updateOption(i, v)}
                maxLength={100}
                returnKeyType="next"
              />
              {options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(i)} style={s.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={s.removeBtnInner}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2.5} strokeLinecap="round">
                      <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
                    </Svg>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {options.length < 12 && (
            <TouchableOpacity style={[s.addOptionBtn, { borderColor: '#07a47240', backgroundColor: isDark ? '#07a47210' : '#07a47208' }]} onPress={addOption}>
              <View style={s.addOptionIcon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2.5} strokeLinecap="round">
                  <Circle cx="12" cy="12" r="9"/>
                  <Line x1="12" y1="8" x2="12" y2="16"/><Line x1="8" y1="12" x2="16" y2="12"/>
                </Svg>
              </View>
              <Text style={s.addOptionText}>Añadir opción</Text>
            </TouchableOpacity>
          )}

          {/* Opciones avanzadas */}
          <View style={[s.advancedRow, { borderColor: C.borderLight }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.advancedLabel, { color: C.textPrimary }]}>Respuesta múltiple</Text>
              <Text style={[s.advancedSub, { color: C.textTertiary }]}>Permite votar más de una opción</Text>
            </View>
            <Switch
              value={multipleChoice}
              onValueChange={setMultipleChoice}
              trackColor={{ false: '#d1d5db', true: '#07a472' }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingBottom: 14, gap: 4,
  },
  headerBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 22,
  },
  headerSendBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
  },
  headerTitleRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4,
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  inputBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4 },
  questionInput: { fontSize: 16, lineHeight: 22, minHeight: 64, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  optionNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  optionNumText: { fontSize: 12, fontWeight: '700', color: '#07a472' },
  optionInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  removeBtn: { padding: 4 },
  removeBtnInner: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 14, marginBottom: 8,
  },
  addOptionIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addOptionText: { fontSize: 14, fontWeight: '600', color: '#07a472' },
  advancedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18, marginTop: 10,
  },
  advancedLabel: { fontSize: 15, fontWeight: '600' },
  advancedSub: { fontSize: 12, marginTop: 2 },
});
