/**
 * EditHistoryModal — muestra el historial de ediciones de un mensaje
 * Se abre desde el context menu de un mensaje editado.
 */
import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, FlatList,
} from 'react-native';

interface EditEntry {
  text: string;
  edited_at: string;
}

interface Props {
  visible: boolean;
  history: EditEntry[];
  currentText?: string;
  onClose: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}

export function EditHistoryModal({ visible, history, currentText, onClose }: Props) {
  // Versiones: [actual, ...históricas desc]
  const versions: EditEntry[] = [
    ...(currentText ? [{ text: currentText, edited_at: new Date().toISOString() }] : []),
    ...history.slice().reverse(),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>✏️ Historial de ediciones</Text>
          <FlatList
            data={versions}
            keyExtractor={(_, i) => String(i)}
            style={s.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={[s.entry, index === 0 && s.entryLatest]}>
                <View style={s.entryHeader}>
                  <Text style={[s.badge, index === 0 && s.badgeCurrent]}>
                    {index === 0 ? 'Actual' : `v${versions.length - index}`}
                  </Text>
                  {index !== 0 && (
                    <Text style={s.time}>{relativeTime(item.edited_at)}</Text>
                  )}
                </View>
                <Text style={s.entryText}>{item.text}</Text>
              </View>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 14 },
  list: { flex: 1 },
  entry: {
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  entryLatest: { borderColor: '#00b4e6', backgroundColor: 'rgba(0,180,230,0.05)' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { fontSize: 11, fontWeight: '700', color: '#6b7280', backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeCurrent: { backgroundColor: '#00b4e6', color: '#fff' },
  time: { fontSize: 11, color: '#9ca3af' },
  entryText: { fontSize: 14, color: '#374151', lineHeight: 20 },
});
