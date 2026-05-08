import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHATS = [
  { id: '1', name: 'Juan García',   msg: 'Hola, ¿cómo estás?',    time: '10:30', unread: 2, color: '#00c8a0' },
  { id: '2', name: 'María López',   msg: 'Te envié el dinero',     time: '09:15', unread: 0, color: '#6B5BD6' },
  { id: '3', name: 'Familia',       msg: 'Nos vemos el domingo',   time: 'Ayer',  unread: 5, color: '#F59E0B' },
  { id: '4', name: 'Carlos Mba',    msg: '¿Puedes llamarme?',      time: 'Ayer',  unread: 0, color: '#EF4444' },
  { id: '5', name: 'Ana Nguema',    msg: 'Gracias por todo 🙏',    time: 'Lun',   unread: 1, color: '#8B5CF6' },
  { id: '6', name: 'Trabajo GQ',    msg: 'Reunión mañana a las 9', time: 'Lun',   unread: 0, color: '#0099cc' },
];

export default function MensajesScreen() {
  const insets = useSafeAreaInsets();

  const openChat = (item: typeof CHATS[0]) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: item.id, name: item.name, color: item.color },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00c8a0" />

      {/* HEADER con gradiente — siempre visible */}
      <LinearGradient
        colors={['#00c8a0', '#0099cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mensajes</Text>
          <Text style={styles.headerSub}>{CHATS.length} conversaciones</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn}>
            <Text style={styles.newBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* LISTA DE CHATS */}
      <FlatList
        data={CHATS}
        keyExtractor={i => i.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: item.color + '22' }]}>
              <Text style={[styles.avatarText, { color: item.color }]}>
                {item.name.slice(0, 2).toUpperCase()}
              </Text>
              {/* Indicador online */}
              <View style={[styles.onlineDot, { backgroundColor: item.unread > 0 ? '#22C55E' : 'transparent' }]} />
            </View>

            <View style={styles.chatInfo}>
              <View style={styles.chatRow}>
                <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.chatTime, item.unread > 0 && styles.chatTimeUnread]}>
                  {item.time}
                </Text>
              </View>
              <View style={styles.chatRow}>
                <Text style={[styles.chatMsg, item.unread > 0 && styles.chatMsgUnread]} numberOfLines={1}>
                  {item.msg}
                </Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  // ── HEADER ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 18,
  },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtnText: {
    fontSize: 18,
  },

  // ── LISTA ───────────────────────────────────────────────
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chatTimeUnread: {
    color: '#00c8a0',
    fontWeight: '600',
  },
  chatMsg: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  chatMsgUnread: {
    color: '#374151',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#00c8a0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  sep: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 80,
  },
});
