import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

export function ChatSearchBar({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <View style={s.wrap}>
      <View style={s.field}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}>
          <Circle cx="11" cy="11" r="8"/>
          <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </Svg>
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChange}
          placeholder="Buscar en el chat..."
          placeholderTextColor="#9CA3AF"
          style={s.input}
        />
        {!!value && (
          <TouchableOpacity onPress={() => onChange('')}>
            <Text style={s.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={onClose}>
        <Text style={s.cancel}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },
  clear: { fontSize: 14, color: '#9CA3AF' },
  cancel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
});
