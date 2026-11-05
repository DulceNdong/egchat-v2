/**
 * ChatSkeleton — Placeholder animado mientras cargan los chats
 * Efecto shimmer estilo WhatsApp/Telegram
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

function SkeletonBox({
  width, height, borderRadius = 6, style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#e5e7eb', opacity },
        style,
      ]}
    />
  );
}

function ChatSkeletonRow({ delay = 0 }: { delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[s.row, { opacity }]}>
      {/* Avatar */}
      <SkeletonBox width={50} height={50} borderRadius={25} />

      {/* Content */}
      <View style={s.content}>
        <View style={s.topRow}>
          <SkeletonBox width={120} height={14} borderRadius={7} />
          <SkeletonBox width={36} height={11} borderRadius={5} />
        </View>
        <View style={s.bottomRow}>
          <SkeletonBox width={200} height={12} borderRadius={6} />
          <SkeletonBox width={20} height={20} borderRadius={10} />
        </View>
      </View>
    </Animated.View>
  );
}

export function ChatListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={s.container}>
      {Array(count).fill(0).map((_, i) => (
        <ChatSkeletonRow key={i} delay={i * 60} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  content: { flex: 1, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
