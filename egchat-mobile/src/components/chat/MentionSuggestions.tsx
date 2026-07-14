// ══════════════════════════════════════════════════════════════════
// MentionSuggestions — lista de sugerencias @usuario para grupos
// Aparece al escribir "@" en el chat
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { EGAvatar } from '../ui';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

export interface MentionUser {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
}

interface Props {
  visible: boolean;
  users: MentionUser[];
  query: string;
  onSelect: (user: MentionUser) => void;
}

export function MentionSuggestions({ visible, users, query, onSelect }: Props) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  if (!visible || users.length === 0) return null;

  const filtered = query
    ? users.filter(u => (u.full_name || '').toLowerCase().includes(query.toLowerCase()))
    : users;

  if (filtered.length === 0) return null;

  return (
    <View style={[s.container, { backgroundColor: C.bgPrimary, borderTopColor: C.borderLight, shadowColor: '#000' }]}>
      <FlatList
        data={filtered.slice(0, 6)}
        keyExtractor={u => u.user_id}
        keyboardShouldPersistTaps="always"
        horizontal={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.row, { borderBottomColor: C.borderLight }]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <EGAvatar src={item.avatar_url} name={item.full_name || 'U'} size={32} />
            <View style={s.info}>
              <Text style={[s.name, { color: C.textPrimary }]}>{item.full_name || 'Usuario'}</Text>
            </View>
            <Text style={s.atSign}>@</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/** Detecta si el usuario está escribiendo una mención y extrae el query */
export function detectMentionQuery(text: string): { query: string; startIndex: number } | null {
  // Busca el último @ sin espacio después
  const match = text.match(/@(\w*)$/);
  if (!match) return null;
  return {
    query: match[1],
    startIndex: text.lastIndexOf('@'),
  };
}

/** Reemplaza la mención en curso con el nombre del usuario seleccionado */
export function applyMention(text: string, user: MentionUser): string {
  const detection = detectMentionQuery(text);
  if (!detection) return text;
  const before = text.slice(0, detection.startIndex);
  const name = user.full_name?.replace(/\s+/g, '') || 'usuario';
  return `${before}@${name} `;
}

const s = StyleSheet.create({
  container: {
    maxHeight: 200,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600' },
  atSign: { fontSize: 16, color: '#07a472', fontWeight: '700' },
});
