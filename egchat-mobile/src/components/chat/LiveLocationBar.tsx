// ══════════════════════════════════════════════════════════════════
// LiveLocationBar — barra de estado "compartiendo ubicación"
// aparece en el header del chat cuando hay sesión activa
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  active: boolean;
  onStop: () => void;
}

export function LiveLocationBar({ active, onStop }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { loop.stop(); clearInterval(timer); };
  }, [active]);

  if (!active) return null;

  const fmt = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <View style={s.bar}>
      <Animated.View style={[s.dot, { transform: [{ scale: pulse }] }]} />
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" style={{ marginRight: 4 }}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <Circle cx="12" cy="10" r="3"/>
      </Svg>
      <Text style={s.text}>Compartiendo ubicación · {fmt(elapsed)}</Text>
      <TouchableOpacity onPress={onStop} style={s.stopBtn}>
        <Text style={s.stopText}>Detener</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#07a472', paddingHorizontal: 12, paddingVertical: 7, gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  text: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },
  stopBtn: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  stopText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
