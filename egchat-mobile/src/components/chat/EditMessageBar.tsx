// ══════════════════════════════════════════════════════════════════
// EditMessageBar — barra de edición que reemplaza el input cuando
// el usuario selecciona "Editar" desde el menú contextual
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';
import type { ChatMessage } from '../../types/chat';

interface Props {
  message: ChatMessage;
  editText: string;
  onChangeText: (t: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EditMessageBar({ message, editText, onChangeText, onConfirm, onCancel }: Props) {
  const inputRef = useRef<TextInput>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    // Auto-foco al abrir
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [message.id]);

  return (
    <View style={[s.wrap, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
      {/* Indicador edición */}
      <View style={s.indicator}>
        <View style={s.indicatorBar} />
        <View style={s.indicatorText}>
          <Text style={s.editLabel}>Editando mensaje</Text>
          <Text style={[s.originalText, { color: C.textTertiary }]} numberOfLines={1}>
            {message.text || 'Mensaje'}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
            <Line x1="18" y1="6" x2="6" y2="18"/>
            <Line x1="6" y1="6" x2="18" y2="18"/>
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Input + confirmar */}
      <View style={s.inputRow}>
        <TextInput
          ref={inputRef}
          style={[s.input, { color: C.textPrimary, backgroundColor: C.bgPrimary, borderColor: C.borderLight }]}
          value={editText}
          onChangeText={onChangeText}
          multiline
          maxLength={4096}
          placeholderTextColor={C.textTertiary}
          placeholder="Escribe el nuevo texto..."
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.confirmBtn, !editText.trim() && s.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!editText.trim()}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Path d="M20 6L9 17l-5-5"/>
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  indicatorBar: { width: 3, height: 36, borderRadius: 2, backgroundColor: '#07a472' },
  indicatorText: { flex: 1 },
  editLabel: { fontSize: 12, fontWeight: '700', color: '#07a472', marginBottom: 2 },
  originalText: { fontSize: 13 },
  cancelBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4 },
  input: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  confirmBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#07a472', alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
});
