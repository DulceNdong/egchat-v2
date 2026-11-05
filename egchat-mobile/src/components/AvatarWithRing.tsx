// ══════════════════════════════════════════════════════════════════
// AvatarWithRing
// Envuelve EGAvatar con un anillo animado de colores según el tipo
// de contenido nuevo del contacto:
//   🟢 Verde   → story nuevo
//   🟣 Morado  → moment nuevo
//   🔴 Rojo    → live activo (parpadeante)
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { EGAvatar } from './ui';
import type { ContentType } from '../hooks/useNewContentIndicators';

interface Props {
  src?: string | null;
  name: string;
  size: number;
  contentTypes?: ContentType[];   // qué tipo de contenido nuevo tiene
  onPress?: () => void;
}

// Color del anillo según prioridad: live > story > moment
function getRingColor(types: ContentType[]): string | null {
  if (!types || types.length === 0) return null;
  if (types.includes('live'))   return '#ff3b30'; // rojo — en vivo
  if (types.includes('story'))  return '#00C8A0'; // verde — estado
  if (types.includes('moment')) return '#af52de'; // morado — moment
  return null;
}

function getRingLabel(types: ContentType[]): string | null {
  if (!types || types.length === 0) return null;
  if (types.includes('live'))   return '🔴';
  if (types.includes('story'))  return null;
  if (types.includes('moment')) return null;
  return null;
}

export function AvatarWithRing({ src, name, size, contentTypes = [] }: Props) {
  const ringColor = getRingColor(contentTypes);
  const isLive    = contentTypes.includes('live');

  // Animación de parpadeo para el anillo de live
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulseAnim]);

  const gap    = 2;   // espacio entre avatar y anillo
  const border = 2.5; // grosor del anillo
  const total  = size + (gap + border) * 2;

  if (!ringColor) {
    return <EGAvatar src={src} name={name} size={size} />;
  }

  return (
    <View style={{ width: total, height: total, alignItems: 'center', justifyContent: 'center' }}>
      {/* Anillo exterior */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: total / 2,
            borderWidth: border,
            borderColor: ringColor,
            opacity: isLive ? pulseAnim : 1,
          },
        ]}
      />
      {/* Avatar en el centro */}
      <EGAvatar src={src} name={name} size={size} />

      {/* Indicador "EN VIVO" pequeño en la esquina inferior derecha */}
      {isLive && (
        <View style={[styles.livePill, { backgroundColor: '#ff3b30' }]}>
          <View style={styles.liveDot} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  livePill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
