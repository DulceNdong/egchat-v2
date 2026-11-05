import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView,
} from 'react-native';
import type { ChatMessage } from '../../types/chat';

export function ChatStarredModal({
  visible,
  messages,
  onClose,
  onRemove,
}: {
  visible: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <Text style={s.title}>⭐ Mensajes destacados</Text>
          <ScrollView style={s.list}>
            {messages.length === 0 ? (
              <Text style={s.empty}>No hay mensajes destacados</Text>
            ) : messages.map(m => (
              <View key={m.id} style={s.card}>
                <Text style={s.body} numberOfLines={3}>{m.text || `[${m.type}]`}</Text>
                <TouchableOpacity onPress={() => onRemove(m.id)}>
                  <Text style={s.remove}>Quitar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    padding: 16,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
  list: { maxHeight: 400 },
  empty: { textAlign: 'center', color: '#9ca3af', paddingVertical: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  body: { flex: 1, fontSize: 14, color: '#374151' },
  remove: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
});
