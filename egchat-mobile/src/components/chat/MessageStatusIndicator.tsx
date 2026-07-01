// Indicador de estado EGCHAT — 3 puntos (naranja / verde / azul), no estilo WhatsApp
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatMessageStatus } from '../../types/chat';

const DOT_SIZE = 7;

const C = {
  send: '#f59e0b',
  delivered: '#22c55e',
  deliveredDim: 'rgba(34,197,94,0.25)',
  read: '#00b4e6',
  readDim: 'rgba(0,180,230,0.25)',
};

export function MessageStatusIndicator({ status }: { status: ChatMessageStatus }) {
  if (status === 'failed') {
    return <Text style={styles.failed}>❌</Text>;
  }

  const delivered = status === 'delivered' || status === 'read';
  const read = status === 'read';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: C.send }]} />
      <View style={[styles.dot, { backgroundColor: delivered ? C.delivered : C.deliveredDim }]} />
      <View style={[styles.dot, { backgroundColor: read ? C.read : C.readDim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  failed: {
    fontSize: 11,
    color: '#ef4444',
  },
});
