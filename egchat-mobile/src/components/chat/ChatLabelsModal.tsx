// ══════════════════════════════════════════════════════════════════
// ChatLabelsModal — selector de etiquetas para un chat
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { DEFAULT_LABELS, getChatLabels, toggleChatLabel } from '../../services/chatLabels';
import { toast } from '../Toast';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Props {
  visible: boolean;
  chatId: string;
  onClose: () => void;
  onChanged?: (labels: string[]) => void;
}

export function ChatLabelsModal({ visible, chatId, onClose, onChanged }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    if (visible) getChatLabels(chatId).then(setSelected);
  }, [visible, chatId]);

  const handleToggle = async (labelId: string) => {
    const next = await toggleChatLabel(chatId, labelId);
    setSelected(next);
    onChanged?.(next);
    const label = DEFAULT_LABELS.find(l => l.id === labelId);
    const added = next.includes(labelId);
    toast.info(added ? `Etiqueta "${label?.name}" añadida` : `Etiqueta eliminada`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.panel, { backgroundColor: C.bgPrimary }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: C.textPrimary }]}>🏷️ Etiquetas del chat</Text>
            <TouchableOpacity onPress={onClose}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
              </Svg>
            </TouchableOpacity>
          </View>
          <Text style={[s.subtitle, { color: C.textTertiary }]}>
            Organiza tus chats con etiquetas personalizadas
          </Text>
          {DEFAULT_LABELS.map(label => {
            const active = selected.includes(label.id);
            return (
              <TouchableOpacity
                key={label.id}
                style={[s.row, { borderBottomColor: C.borderLight }]}
                onPress={() => handleToggle(label.id)}
              >
                <View style={[s.colorDot, { backgroundColor: label.color }]} />
                <Text style={s.emoji}>{label.emoji}</Text>
                <Text style={[s.label, { color: C.textPrimary }]}>{label.name}</Text>
                {active && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={label.color} strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M20 6L9 17l-5-5"/>
                  </Svg>
                )}
              </TouchableOpacity>
            );
          })}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, paddingHorizontal: 20, marginBottom: 10, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  emoji: { fontSize: 18, width: 26 },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
});
