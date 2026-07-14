import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView,
} from 'react-native';
import type { ChatMessage } from '../../types/chat';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

export function ChatContextMenu({
  visible,
  message,
  isOwn,
  onClose,
  onCopy,
  onReply,
  onStar,
  onDelete,
  onDeleteForMe,
  onReaction,
  onTranslate,
  onPin,
  onEphemeral,
  onEdit,
  onForward,
}: {
  visible: boolean;
  message: ChatMessage | null;
  isOwn: boolean;
  onClose: () => void;
  onCopy: () => void;
  onReply: () => void;
  onStar: () => void;
  onDelete: () => void;
  onDeleteForMe: () => void;
  onEphemeral?: () => void;
  onPin?: () => void;
  onTranslate?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onReaction: (emoji: string) => void;
}) {
  if (!message) return null;

  const isTextMsg = message.type === 'text' || !message.type;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <View style={s.panel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.reactions}>
            {QUICK_REACTIONS.map(e => (
              <TouchableOpacity key={e} style={s.reactionBtn} onPress={() => { onReaction(e); onClose(); }}>
                <Text style={s.reactionEmoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.menu}>
            {[
              isTextMsg ? { label: '📋 Copiar', onPress: onCopy } : null,
              { label: '↩️ Responder', onPress: onReply },
              onForward ? { label: '➡️ Reenviar', onPress: () => { onForward(); onClose(); } } : null,
              isTextMsg ? { label: '🌐 Traducir', onPress: () => { onTranslate?.(); onClose(); } } : null,
              { label: '⭐ Destacar', onPress: onStar },
              { label: '📌 Fijar mensaje', onPress: () => { onPin?.(); onClose(); } },
              ...(isOwn ? [
                isTextMsg ? { label: '✏️ Editar', onPress: () => { onEdit?.(); onClose(); } } : null,
                { label: '🗑 Eliminar para todos', onPress: onDelete, danger: true },
                { label: '⏱ Mensajes temporales', onPress: () => { onEphemeral?.(); onClose(); } },
              ] : []),
              { label: 'Eliminar para mí', onPress: onDeleteForMe, danger: true },
            ].filter(Boolean).map((item: any, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[s.item, i < arr.length - 1 && s.itemBorder]}
                onPress={() => { item.onPress(); }}
              >
                <Text style={[s.itemText, item.danger && s.danger]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: { width: '100%', maxWidth: 320 },
  reactions: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 10,
    maxHeight: 56,
  },
  reactionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  reactionEmoji: { fontSize: 24 },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  item: { paddingVertical: 14, paddingHorizontal: 18 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  danger: { color: '#ef4444' },
});
