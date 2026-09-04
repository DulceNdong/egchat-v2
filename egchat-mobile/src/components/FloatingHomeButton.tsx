/**
 * FloatingHomeButton — Botón flotante directo a home.
 * - Toque → navega a mensajería (home)
 * - Sin arrastre para evitar conflictos con el gesto del sistema
 */
import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router, usePathname } from 'expo-router';
import Svg, { Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const BTN = 44;
const HOME_ROUTE = '/(tabs)';

export const FloatingHomeButton = () => {
  const pathname = usePathname();

  // Ocultar SOLO en la pantalla home (mensajería es el tab principal)
  const isHome =
    pathname === '/(tabs)/mensajeria' ||
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/' ||
    pathname === '/(tabs)/index' ||
    pathname === '/' ||
    pathname === '' ||
    pathname === '/index';

  // Ocultar en auth, welcome, llamadas
  const isAuthOrSystem =
    pathname.includes('/(auth)') ||
    pathname.includes('/login') ||
    pathname.includes('/welcome') ||
    pathname.includes('/call/');

  if (isHome || isAuthOrSystem) return null;
  return <FloatingButton />;
};

const FloatingButton = () => {
  const navigateHome = () => {
    router.replace(HOME_ROUTE as any);
  };

  return (
    <View style={st.container} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(16,185,129,0.95)', 'rgba(59,130,246,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.gradient}
      >
        <Pressable
          onPress={navigateHome}
          style={st.pressable}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: BTN / 2 }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Polyline points="9 22 9 12 15 12 15 22" />
          </Svg>
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const st = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    bottom: 90,
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    zIndex: 9999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gradient: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
