// ══════════════════════════════════════════════════════════════════
// CreatePollModal — Crear encuesta / poll en el chat
// WhatsApp / WeChat style: pregunta + hasta 12 opciones + multiple choice
// ══════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle } from 'react-native-svg';
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
          <TouchableOpacity onPress={handleClose} style={s.headerBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>📊 Nueva encuesta</Text>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || sending}
            style={[s.headerBtn, (!canSend || sending) && { opacity: 0.4 }]}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
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
                <TouchableOpacity onPress={() => removeOption(i)} style={s.removeBtn}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                    <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
                  </Svg>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {options.length < 12 && (
            <TouchableOpacity style={[s.addOptionBtn, { borderColor: C.borderLight }]} onPress={addOption}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="12" y1="5" x2="12" y2="19"/><Line x1="5" y1="12" x2="19" y2="12"/>
              </Svg>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, gap: 6 },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  inputBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  questionInput: { fontSize: 16, lineHeight: 22, minHeight: 60, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  optionNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionNumText: { fontSize: 12, fontWeight: '700', color: '#07a472' },
  optionInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  removeBtn: { padding: 4 },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 12, marginBottom: 8,
  },
  addOptionText: { fontSize: 14, fontWeight: '600', color: '#07a472' },
  advancedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, marginTop: 8,
  },
  advancedLabel: { fontSize: 15, fontWeight: '600' },
  advancedSub: { fontSize: 12, marginTop: 2 },
});
