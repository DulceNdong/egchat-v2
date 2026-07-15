/**
 * MessageStatusIndicator — doble check estilo WhatsApp
 *
 * pending   → reloj gris
 * sent      → ✓  gris  (un check)
 * delivered → ✓✓ gris  (dos checks)
 * read      → ✓✓ azul  (dos checks azules)
 * failed    → ✕  rojo
 */
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import type { ChatMessageStatus } from '../../types/chat';

interface Props {
  status: ChatMessageStatus;
  size?: number;
}

// ── Ícono de reloj (pending) ────────────────────────────────────
const ClockIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

// ── Un check ────────────────────────────────────────────────────
const SingleCheck = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="5 13 9 17 19 7" />
  </Svg>
);

// ── Doble check ─────────────────────────────────────────────────
const DoubleCheck = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size + 6} height={size} viewBox="0 0 30 24" fill="none"
    stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    {/* Primer check (ligeramente desplazado a la izquierda) */}
    <Polyline points="2 13 6 17 16 7" />
    {/* Segundo check (desplazado a la derecha) */}
    <Polyline points="9 13 13 17 23 7" />
  </Svg>
);

export function MessageStatusIndicator({ status, size = 14 }: Props) {
  if (status === 'failed') {
    return <Text style={s.failed}>!</Text>;
  }

  if (status === 'pending') {
    return (
      <View style={s.row}>
        <ClockIcon size={size} color="#9ca3af" />
      </View>
    );
  }

  if (status === 'sent') {
    return (
      <View style={s.row}>
        <SingleCheck size={size} color="#9ca3af" />
      </View>
    );
  }

  if (status === 'delivered') {
    return (
      <View style={s.row}>
        <DoubleCheck size={size} color="#9ca3af" />
      </View>
    );
  }

  if (status === 'read') {
    return (
      <View style={s.row}>
        <DoubleCheck size={size} color="#00b4e6" />
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  failed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
    lineHeight: 14,
  },
});
