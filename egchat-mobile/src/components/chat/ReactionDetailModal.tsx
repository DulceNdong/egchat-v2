/**
 * ReactionDetailModal — muestra quién reaccionó con qué emoji
 * Tabs por emoji + lista de usuarios.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, useColorScheme,
} from 'react-native';
import { EGAvatar } from '../ui';
import { getMessageReactions, type ReactionsMap } from '../../services/messageReactions';

interface ReactionDetailModalProps {
  visible: boolean;
  messageId: string | null;
  localCounts?: Record<string, number>;
  currentUserId: string;
  onClose: () => void;
  resolveUser?: (userId: string) => { full_name?: string; avatar_url?: string } | undefined;
}

export function ReactionDetailModal({
  visible, messageId, localCounts, currentUserId, onClose, resolveUser,
}: ReactionDetailModalProps) {
  const [reactionsMap, setReactionsMap] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);
  const isDark = useColorScheme() === 'dark';
  const sheetBg = isDark ? '#1c1c1e' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const subColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const chipBg = isDark ? '#374151' : '#f3f4f6';

  useEffect(() => {
    if (!visible || !messageId) return;
    setLoading(true);
    getMessageReactions(messageId, currentUserId)
      .then(map => {
        setReactionsMap(map);
        const emojis = Object.keys(map);
        if (emojis.length > 0) setActiveEmoji(emojis[0]);
      })
      .catch(() => {
        if (localCounts) {
          const fallback: ReactionsMap = {};
          Object.entries(localCounts).forEach(([emoji, count]) => {
            fallback[emoji] = { emoji, count, users: [], reactedByMe: false };
          });
          setReactionsMap(fallback);
          const emojis = Object.keys(fallback);
          if (emojis.length > 0) setActiveEmoji(emojis[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [visible, messageId, currentUserId]);

  const emojis = Object.keys(reactionsMap);
  const activeReaction = activeEmoji ? reactionsMap[activeEmoji] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: sheetBg }]} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={[s.title, { color: textColor }]}>Reacciones</Text>

          {loading ? (
            <ActivityIndicator color="#00b4e6" style={{ marginVertical: 24 }} />
          ) : emojis.length === 0 ? (
            <Text style={[s.empty, { color: subColor }]}>Sin reacciones todavía</Text>
          ) : (
            <>
              <View style={s.tabs}>
                <TouchableOpacity
                  onPress={() => setActiveEmoji(null)}
                  style={[s.tab, { backgroundColor: activeEmoji === null ? 'rgba(0,180,230,0.12)' : chipBg }]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.tabLabel, { color: activeEmoji === null ? '#00b4e6' : subColor }]}>
                    Todos {emojis.reduce((acc, e) => acc + (reactionsMap[e]?.count || 0), 0)}
                  </Text>
                </TouchableOpacity>
                {emojis.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => setActiveEmoji(emoji)}
                    style={[s.tab, { backgroundColor: activeEmoji === emoji ? 'rgba(0,180,230,0.12)' : chipBg }]}
                    activeOpacity={0.7}
                  >
                    <Text style={s.tabEmoji}>{emoji}</Text>
                    <Text style={[s.tabCount, { color: activeEmoji === emoji ? '#00b4e6' : subColor }]}>
                      {reactionsMap[emoji]?.count || 0}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                data={
                  activeEmoji === null
                    ? emojis.flatMap(e => (reactionsMap[e]?.users || []).map(uid => ({ uid, emoji: e })))
                    : (activeReaction?.users || []).map(uid => ({ uid, emoji: activeEmoji }))
                }
                keyExtractor={(item, i) => `${item.uid}_${item.emoji}_${i}`}
                style={s.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={[s.empty, { color: subColor }]}>No hay datos de usuarios disponibles</Text>}
                renderItem={({ item }) => {
                  const user = resolveUser?.(item.uid);
                  const name = item.uid === currentUserId ? 'Tú' : user?.full_name || item.uid.slice(0, 8) + '...';
                  return (
                    <View style={[s.row, { borderBottomColor: borderColor }]}>
                      <EGAvatar src={user?.avatar_url} name={name} size={40} />
                      <Text style={[s.userName, { color: textColor }]} numberOfLines={1}>{name}</Text>
                      <Text style={s.rowEmoji}>{item.emoji}</Text>
                    </View>
                  );
                }}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '60%' },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabCount: { fontSize: 12, fontWeight: '600' },
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  userName: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowEmoji: { fontSize: 22 },
  empty: { textAlign: 'center', fontSize: 14, marginVertical: 20 },
});
