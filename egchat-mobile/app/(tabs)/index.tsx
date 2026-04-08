import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const CHATS = [
  { id: '1', name: 'Juan García', msg: 'Hola, ¿cómo estás?', time: '10:30', unread: 2, color: '#00c8a0' },
  { id: '2', name: 'María López', msg: 'Te envié el dinero', time: '09:15', unread: 0, color: '#6B5BD6' },
  { id: '3', name: 'Familia', msg: 'Nos vemos el domingo', time: 'Ayer', unread: 5, color: '#F59E0B' },
  { id: '4', name: 'Carlos Mba', msg: '¿Puedes llamarme?', time: 'Ayer', unread: 0, color: '#EF4444' },
];

export default function MensajesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <TouchableOpacity style={styles.newBtn}><Text style={styles.newBtnText}>+</Text></TouchableOpacity>
      </View>
      <FlatList
        data={CHATS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem}>
            <View style={[styles.avatar, { backgroundColor: item.color + '25' }]}>
              <Text style={[styles.avatarText, { color: item.color }]}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatRow}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatTime}>{item.time}</Text>
              </View>
              <View style={styles.chatRow}>
                <Text style={styles.chatMsg} numberOfLines={1}>{item.msg}</Text>
                {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  newBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center' },
  newBtnText: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 28 },
  chatItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  chatInfo: { flex: 1 },
  chatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  chatTime: { fontSize: 11, color: '#9CA3AF' },
  chatMsg: { fontSize: 12, color: '#6B7280', flex: 1 },
  badge: { backgroundColor: '#00c8a0', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  sep: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 74 },
});
