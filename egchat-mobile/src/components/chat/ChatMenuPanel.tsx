// Menú ⋮ del chat — dropdown top-right (paridad App.tsx showChatMenu web)
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PANEL_W = 220;
const SCREEN_W = Dimensions.get('window').width;

export interface ChatMenuItem {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
  section?: 'main' | 'config' | 'actions' | 'danger';
}

export function ChatMenuPanel({
  visible,
  onClose,
  chatName,
  chatAvatar,
  chatInitials,
  isGroup,
  isOnline,
  items,
  headerHeight = 56,
}: {
  visible: boolean;
  onClose: () => void;
  chatName: string;
  chatAvatar?: string;
  chatInitials?: string;
  isGroup?: boolean;
  isOnline?: boolean;
  items: ChatMenuItem[];
  headerHeight?: number;
}) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const sections: Array<ChatMenuItem['section']> = ['main', 'config', 'actions', 'danger'];
  const grouped = sections.map(s => items.filter(i => i.section === s)).filter(g => g.length > 0);
  const top = insets.top + headerHeight;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        <Pressable style={s.overlay} onPress={onClose} />
        <Animated.View
          style={[
            s.panel,
            {
              top,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              maxWidth: SCREEN_W * 0.72,
            },
          ]}
        >
          <LinearGradient
            colors={['#00b4e6', '#0088cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.header}
          >
            <View style={s.avatar}>
              {chatAvatar ? (
                <Image source={{ uri: chatAvatar }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarText}>
                  {chatInitials || chatName?.slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.headerName} numberOfLines={1}>{chatName}</Text>
              <Text style={s.headerSub}>
                {isGroup ? '👥 Grupo' : isOnline ? '● En línea' : '○ Desconectado'}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>
            {grouped.map((group, gi) => (
              <View key={gi} style={s.section}>
                {group.map((item, i) => (
                  <TouchableOpacity
                    key={`${gi}-${i}`}
                    style={[s.item, i < group.length - 1 && s.itemBorder]}
                    onPress={() => { onClose(); setTimeout(item.onPress, 120); }}
                    activeOpacity={0.65}
                  >
                    <View style={s.iconWrap}>{item.icon}</View>
                    <Text style={[s.label, item.color ? { color: item.color } : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  panel: {
    position: 'absolute',
    right: 8,
    width: PANEL_W,
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 1 },
  scroll: { flexGrow: 0 },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconWrap: { flexShrink: 0 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 },
});
