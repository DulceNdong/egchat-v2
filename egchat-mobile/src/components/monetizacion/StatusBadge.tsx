import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { t as tr } from '../../translations';

export type BadgeStatus =
  | 'pagado'
  | 'pendiente'
  | 'vencido'
  | 'vigente'
  | 'proximo'
  | 'activo'
  | 'inactivo'
  | 'completado'
  | 'cancelado'
  | 'verificado';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot?: boolean }> = {
  pagado:     { color: '#00FF88', bg: '#00FF8822', get label() { return tr('mznPaidMark'); } },
  pendiente:  { color: '#FFD700', bg: '#FFD70022', get label() { return tr('xtPendiente'); } },
  vencido:    { color: '#FF4444', bg: '#FF444422', get label() { return tr('xtVencido'); } },
  vigente:    { color: '#00FF88', bg: '#00FF8822', get label() { return tr('xtVigente'); } },
  proximo:    { color: '#FFD700', bg: '#FFD70022', get label() { return tr('xtPorVencer'); } },
  activo:     { color: '#00D4FF', bg: '#00D4FF22', get label() { return tr('xtActivo'); } },
  inactivo:   { color: '#666688', bg: '#66668822', get label() { return tr('xtInactivo'); } },
  completado: { color: '#00FF88', bg: '#00FF8822', get label() { return tr('xtCompletado'); } },
  cancelado:  { color: '#FF4444', bg: '#FF444422', get label() { return tr('xtCancelado'); } },
  verificado: { color: '#00D4FF', bg: '#00D4FF22', get label() { return tr('mznVerifiedBadge'); } },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] || {
    color: '#8888AA',
    bg: '#8888AA22',
    label: status,
  };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg, borderColor: config.color + '44' },
      size === 'sm' && styles.badgeSm,
    ]}>
      <Text style={[
        styles.text,
        { color: config.color },
        size === 'sm' && styles.textSm,
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
  },
});
