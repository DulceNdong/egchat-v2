// ══════════════════════════════════════════════════════════════════
// QuickReplyPanel — sugerencias de respuestas rápidas al escribir "/"
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { QuickReply } from '../../services/quickReplies';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Props {
  visible: boolean;
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
}

export function QuickReplyPanel({ visible, replies, onSelect }: Props) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  if (!visible || replies.length === 0) return null;

  return (
    <View style={[s.container, { backgroundColor: C.bgPrimary, borderTopColor: C.borderLight }]}>
      <FlatList
        data={replies}
        keyExtractor={r => r.id}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.row, { borderBottomColor: C.borderLight }]} onPress={() => onSelect(item)} activeOpacity={0.7}>
            <View style={s.shortcutBadge}>
              <Text style={s.shortcutText}>{item.shortcut}</Text>
            </View>
            <Text style={[s.replyText, { color: C.textPrimary }]} numberOfLines={1}>{item.text}</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
              <Path d="M9 18l6-6-6-6"/>
            </Svg>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    maxHeight: 180, borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  shortcutBadge: { backgroundColor: '#07a47218', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  shortcutText: { fontSize: 12, fontWeight: '700', color: '#07a472' },
  replyText: { flex: 1, fontSize: 13 },
});
