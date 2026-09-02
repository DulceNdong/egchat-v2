// Logo EGCHAT giratorio — paridad con web: spin 6s linear infinite.
// El Animated.Value y la animación son SINGLETONS de módulo para que
// NO se reinicien cuando el componente se desmonta/remonta al cambiar
// de pestaña (lazy tabs en Expo Router).
import React, { useEffect } from 'react';
import {
  Animated, Easing, Image, StyleSheet, ViewStyle, AppState, AppStateStatus, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO = require('../../assets/logo-transparent.png');

// ── Singleton: valor y animación fuera del componente ─────────────
const SPIN_DURATION = 6000;
const _spinValue = new Animated.Value(0);
let _animation: Animated.CompositeAnimation | null = null;

const startGlobalSpin = () => {
  if (_animation) return; // ya está corriendo
  _animation = Animated.loop(
    Animated.timing(_spinValue, {
      toValue: 1,
      duration: SPIN_DURATION,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }),
  );
  _animation.start();
};

const restartGlobalSpin = () => {
  _animation?.stop();
  _animation = null;
  _spinValue.setValue(0);
  startGlobalSpin();
};

// Arrancar inmediatamente al importar el módulo
startGlobalSpin();

// Escuchar AppState a nivel de módulo (una sola vez)
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active') restartGlobalSpin();
});

// ── Componente ────────────────────────────────────────────────────
export interface SpinningLogoProps {
  size?: number;
  style?: ViewStyle;
  glow?: boolean;
}

const rotate = _spinValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});

export function SpinningLogo({
  size = 44,
  style,
  glow = true,
}: SpinningLogoProps) {
  // Asegurar que la animación sigue corriendo si el módulo se recargó en hot-reload
  useEffect(() => {
    startGlobalSpin();
  }, []);

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
