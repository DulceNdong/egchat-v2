import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Pressable,
} from 'react-native';
import { contactsAPI } from '../../api';
import { EGAvatar } from '../ui';

interface Contact {
  id: string;
  full_name?: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
}

export function ChatContactPickerModal({ visible, onClose, onSelect }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    contactsAPI.getAll()
      .then(list => setContacts(list || []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          <View style={s.header}>
            <Text style={s.title}>Compartir contacto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 40 }} color="#00c8a0" />
          ) : contacts.length === 0 ? (
            <Text style={s.empty}>No tienes contactos guardados</Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const name = item.full_name || item.name || 'Contacto';
                return (
                  <TouchableOpacity
                    style={s.row}
                    onPress={() => { onSelect(item); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <EGAvatar src={item.avatar_url} name={name} size={44} />
                    <View style={s.rowText}>
                      <Text style={s.name} numberOfLines={1}>{name}</Text>
                      {item.phone ? <Text style={s.phone}>{item.phone}</Text> : null}
                    </View>
                    <Text style={s.chevron}>›</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  close: { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f9fafb',
  },
  rowText: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  phone: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  chevron: { fontSize: 22, color: '#00c8a0', fontWeight: '300' },
});
