import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface Props {
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkUnread?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  children: React.ReactNode;
}

export function SwipeChatItem({
  onOpen, onArchive, onDelete, onMarkUnread, onUnarchive, isArchived, children,
}: Props) {
  const ref = useRef<Swipeable>(null);
  const close = () => ref.current?.close();

  const renderLeft = () => (
    <View style={s.leftActions}>
      {!isArchived ? (
        <TouchableOpacity style={[s.action, s.unread]} onPress={() => { close(); onMarkUnread?.(); }}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionText}>No leído</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[s.action, s.restore]} onPress={() => { close(); onUnarchive?.(); }}>
          <Text style={s.actionIcon}>📤</Text>
          <Text style={s.actionText}>Desarchivar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRight = () => (
    <View style={s.rightActions}>
      <TouchableOpacity style={[s.action, s.archive]} onPress={() => { close(); onArchive(); }}>
        <Text style={s.actionIcon}>📦</Text>
        <Text style={s.actionText}>Archivar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.action, s.delete]} onPress={() => { close(); onDelete(); }}>
        <Text style={s.actionIcon}>🗑</Text>
        <Text style={s.actionText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={renderLeft}
      renderRightActions={renderRight}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity onPress={onOpen} activeOpacity={0.7} style={s.row}>
        {children}
      </TouchableOpacity>
    </Swipeable>
  );
}

const s = StyleSheet.create({
  row: { backgroundColor: '#fff' },
  leftActions: { flexDirection: 'row', width: 120 },
  rightActions: { flexDirection: 'row', width: 140 },
  action: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4,
  },
  unread: { backgroundColor: '#2563eb' },
  restore: { backgroundColor: '#059669' },
  archive: { backgroundColor: '#d97706' },
  delete: { backgroundColor: '#dc2626' },
  actionIcon: { fontSize: 18 },
  actionText: { fontSize: 10, fontWeight: '600', color: '#fff' },
});
