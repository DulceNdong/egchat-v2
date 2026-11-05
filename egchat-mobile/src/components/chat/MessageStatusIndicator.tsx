/**
 * MessageStatusIndicator — tres puntos de colores estilo EGChat
 *
 * pending   → tres puntos grises
 * sent      → primer punto naranja, dos grises
 * delivered → dos puntos naranjas, uno gris
 * read      → tres puntos verdes (leído)
 * failed    → tres puntos rojos
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ChatMessageStatus } from '../../types/chat';

interface Props {
  status: ChatMessageStatus;
  size?: number;
}

const DOT_COLORS: Record<ChatMessageStatus, [string, string, string]> = {
  pending:   ['#d1d5db', '#d1d5db', '#d1d5db'], // gris gris gris
  sent:      ['#f97316', '#d1d5db', '#d1d5db'], // naranja gris gris
  delivered: ['#f97316', '#f97316', '#d1d5db'], // naranja naranja gris
  read:      ['#22c55e', '#22c55e', '#22c55e'], // verde verde verde
  failed:    ['#ef4444', '#ef4444', '#ef4444'], // rojo rojo rojo
};

export function MessageStatusIndicator({ status, size = 6 }: Props) {
  const colors = DOT_COLORS[status] ?? DOT_COLORS.pending;

  return (
    <View style={s.row}>
      {colors.map((color, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    // tamaño y color se aplican inline
  },
});
