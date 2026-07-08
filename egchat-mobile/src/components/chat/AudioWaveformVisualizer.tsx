/**
 * AudioWaveformVisualizer — Visualizador de forma de onda en tiempo real
 * Se usa durante la grabación de mensajes de voz.
 * Muestra barras animadas que responden a la amplitud del micrófono.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  amplitude: number;   // 0–32768 del NativeAudioRecorder / expo-av
  barCount?: number;   // número de barras visibles
  color?: string;
  height?: number;
}

const BAR_COUNT = 28;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 36;

export function AudioWaveformVisualizer({
  amplitude,
  barCount = BAR_COUNT,
  color = '#ef4444',
  height = 44,
}: Props) {
  // Un Animated.Value por barra
  const bars = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(MIN_HEIGHT))
  ).current;

  useEffect(() => {
    // Normalizar amplitud 0-32768 → 0-1
    const norm = Math.min(1, amplitude / 12000);

    // Animar cada barra con un valor aleatorio alrededor de la amplitud actual
    const animations = bars.map((bar, i) => {
      // Las barras del centro reaccionan más que las de los extremos
      const center = barCount / 2;
      const dist = Math.abs(i - center) / center; // 0 en centro, 1 en extremos
      const envelope = 1 - dist * 0.6;

      const randomFactor = 0.6 + Math.random() * 0.8;
      const targetHeight = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * norm * envelope * randomFactor;

      return Animated.spring(bar, {
        toValue: Math.max(MIN_HEIGHT, targetHeight),
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      });
    });

    Animated.parallel(animations).start();
  }, [amplitude]);

  return (
    <View style={[styles.container, { height }]}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: bar,
              opacity: amplitude === 0 ? 0.35 : 0.85 + (i % 3) * 0.05,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
    paddingHorizontal: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
