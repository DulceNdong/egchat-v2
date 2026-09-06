/**
 * DraggableHomeButton — Botón HOME flotante arrastrable.
 * Se puede mover libremente por la pantalla y hace snap al borde más cercano al soltar.
 * Toca para ir a la homepage /(tabs).
 */
import React, { useRef } from 'react';
import {
  Animated, PanResponder, Dimensions, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Polyline } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const BTN = 48;

interface Props {
  initialX?: number;
  initialY?: number;
}

export function DraggableHomeButton({
  initialX = SW - BTN - 16,
  initialY = SH * 0.60,
}: Props) {
  const pos = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const dragging = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragging.current = false;
        pos.setOffset({ x: (pos.x as any)._value, y: (pos.y as any)._value });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) dragging.current = true;
        Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false })(_, g);
      },
      onPanResponderRelease: () => {
        pos.flattenOffset();
        if (!dragging.current) {
          router.push('/(tabs)' as any);
          return;
        }
        const curX = (pos.x as any)._value;
        const snapX = curX < SW / 2 ? 16 : SW - BTN - 16;
        const rawY = (pos.y as any)._value;
        const snapY = Math.max(80, Math.min(rawY, SH - BTN - 90));
        Animated.spring(pos, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          damping: 18,
          stiffness: 200,
        }).start();
        dragging.current = false;
      },
    })
  ).current;

  return (
    <Animated.View
      style={[s.btn, { left: pos.x, top: pos.y }]}
      {...pan.panHandlers}
    >
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.grad}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <Polyline points="9 22 9 12 15 12 15 22"/>
        </Svg>
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    position: 'absolute',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  grad: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
});
