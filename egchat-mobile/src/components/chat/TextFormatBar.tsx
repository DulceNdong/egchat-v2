/**
 * TextFormatBar — barra de botones de formato inline para el input del chat
 * Inserta marcadores Markdown: *negrita*, _cursiva_, ~tachado~, `código`
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onFormat: (open: string, close: string) => void;
  visible: boolean;
}

const FORMATS = [
  { label: 'B',  open: '*',  close: '*',  bold: true,  title: 'Negrita' },
  { label: 'I',  open: '_',  close: '_',  italic: true, title: 'Cursiva' },
  { label: 'S',  open: '~',  close: '~',  strike: true, title: 'Tachado' },
  { label: '<>', open: '`',  close: '`',  mono: true,  title: 'Código' },
];

export function TextFormatBar({ onFormat, visible }: Props) {
  if (!visible) return null;
  return (
    <View style={s.bar}>
      {FORMATS.map(f => (
        <TouchableOpacity
          key={f.label}
          style={s.btn}
          onPress={() => onFormat(f.open, f.close)}
          activeOpacity={0.6}
          hitSlop={8}
        >
          <Text style={[
            s.label,
            f.bold && s.bold,
            f.italic && s.italic,
            f.strike && s.strike,
            f.mono && s.mono,
          ]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  btn: {
    width: 36, height: 32, borderRadius: 8,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  label: { fontSize: 14, color: '#374151' },
  bold:   { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  mono:   { fontFamily: 'monospace', fontSize: 12 },
});
