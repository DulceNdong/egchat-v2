// ══════════════════════════════════════════════════════════════════
// ChatToneModal — selector de tono de notificación por chat
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { TONE_OPTIONS, ToneOption } from '../../services/chatTones';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Props {
  visible: boolean;
  current: string;
  onSelect: (toneId: string) => void;
  onClose: () => void;
}

export function ChatToneModal({ visible, current, onSelect, onClose }: Props) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.panel, { backgroundColor: C.bgPrimary }]}>
          <View style={s.header}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2} strokeLinecap="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </Svg>
            <Text style={[s.title, { color: C.textPrimary }]}>Tono del chat</Text>
          </View>

          {TONE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[s.row, { borderBottomColor: C.borderLight }]}
              onPress={() => { onSelect(opt.id); onClose(); }}
            >
              <Text style={s.emoji}>{opt.emoji}</Text>
              <Text style={[s.label, { color: C.textPrimary }]}>{opt.label}</Text>
              {current === opt.id && (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M20 6L9 17l-5-5"/>
                </Svg>
              )}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  panel: {
    width: '100%', maxWidth: 320, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  emoji: { fontSize: 20, width: 28 },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
});
