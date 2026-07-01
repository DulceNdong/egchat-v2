// Logo EGCHAT giratorio — paridad con web: spin 6s linear infinite (sin pausas)
import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated, Easing, Image, StyleSheet, ViewStyle, AppState, AppStateStatus,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO = require('../../assets/logo-transparent.png');

/** Vueltas totales en una sola animación — evita el “salto” del Animated.loop al reiniciar */
const TOTAL_ROTATIONS = 100_000;

export interface SpinningLogoProps {
  size?: number;
  style?: ViewStyle;
  glow?: boolean;
  durationMs?: number;
}

export function SpinningLogo({
  size = 44,
  style,
  glow = true,
  durationMs = 6000,
}: SpinningLogoProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);

  const startSpin = useCallback(() => {
    animRef.current?.stop();
    spinAnim.setValue(0);
    animRef.current = Animated.timing(spinAnim, {
      toValue: TOTAL_ROTATIONS,
      duration: durationMs * TOTAL_ROTATIONS,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    animRef.current.start();
  }, [spinAnim, durationMs]);

  useEffect(() => {
    mountedRef.current = true;
    startSpin();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && mountedRef.current) startSpin();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      mountedRef.current = false;
      sub.remove();
      animRef.current?.stop();
      spinAnim.stopAnimation();
    };
  }, [startSpin, spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const radius = size / 2;
  const img = (
    <Animated.View
      style={{ width: size, height: size, transform: [{ rotate }] }}
      pointerEvents="none"
    >
      <Image
        source={LOGO}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    </Animated.View>
  );

  if (!glow) {
    return (
      <Animated.View
        style={[{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }, style]}
        pointerEvents="none"
      >
        {img}
      </Animated.View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(16,185,129,0.35)', 'rgba(59,130,246,0.35)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        s.glow,
        { width: size, height: size, borderRadius: radius, overflow: 'hidden' },
        style,
      ]}
      pointerEvents="none"
    >
      {img}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  glow: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SpinningLogo;
