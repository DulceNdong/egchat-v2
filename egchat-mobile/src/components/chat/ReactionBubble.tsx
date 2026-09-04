/**
 * ReactionBubble — Emoji animado que aparece sobre un mensaje al reaccionar
 * Animación: escala desde 0 → 1.3 → 1 + fade out después de 2s
 * Se puede tener múltiples reacciones por mensaje (como WeChat/Telegram)
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';

interface ReactionProps {
  emoji: string;
  count?: number;
  isOwn?: boolean;
}

export function ReactionBubble({ emoji, count = 1, isOwn = false }: ReactionProps) {
  return (
    <View style={[rs.bubble, isOwn ? rs.ownBubble : rs.theirBubble]}>
      <Text style={rs.emoji}>{emoji}</Text>
      {count > 1 && <Text style={rs.count}>{count}</Text>}
    </View>
  );
}

/** Animación de pop cuando se añade una reacción nueva */
export function ReactionPopAnimation({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Pop in: 0 → 1.4 → 1
      Animated.spring(scale, {
        toValue: 1.4,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      // Flotar hacia arriba y desaparecer
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        rs.pop,
        {
          transform: [{ scale }, { translateY }],
          opacity,
        },
      ]}
    >
      <Text style={rs.popEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

const rs = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  ownBubble: { borderColor: 'rgba(0,200,160,0.2)' },
  theirBubble: { borderColor: 'rgba(0,180,230,0.15)' },
  emoji: { fontSize: 14 },
  count: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  pop: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    top: -10,
  },
  popEmoji: { fontSize: 28 },
});
