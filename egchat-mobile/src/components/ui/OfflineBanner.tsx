/**
 * OfflineBanner — Toast flotante global de conectividad
 *
 * - position: absolute → NO empuja el layout ni distorsiona nada
 * - Aparece en la parte superior, sobre todo el contenido
 * - Se anima hacia abajo al aparecer y hacia arriba al desaparecer
 * - Muestra "Sin conexión" offline y "Conectado" brevemente al reconectar
 * - Se coloca en _layout.tsx una sola vez para toda la app
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../store/offlineStore';
import { useThemeContext } from '../../theme/ThemeContext';

type BannerState = 'hidden' | 'offline' | 'reconnected';

export function OfflineBanner() {
  const { isOnline, isChecking } = useNetworkStatus();
  const { isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const prevOnlineRef = useRef<boolean | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animaciones
  const translateY = useRef(new Animated.Value(-60)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spinner loop
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);

  const slideIn = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const slideOut = (onDone?: () => void) => {
    Animated.timing(translateY, {
      toValue: -60,
      duration: 250,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onDone?.());
  };

  // Lógica de estados
  useEffect(() => {
    if (isChecking) return;

    const prev = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!isOnline) {
      // Sin conexión → mostrar banner offline
      setBannerState('offline');
      slideIn();
    } else if (prev === false && isOnline) {
      // Reconectado → mostrar "Conectado" 2.5s y esconder
      setBannerState('reconnected');
      slideIn();
      hideTimerRef.current = setTimeout(() => {
        slideOut(() => setBannerState('hidden'));
      }, 2500);
    } else if (prev === null) {
      // Primera carga con conexión → no mostrar nada
      setBannerState('hidden');
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOnline, isChecking]);

  if (bannerState === 'hidden') return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isOffline = bannerState === 'offline';
  // Debajo del header (safe area + altura del header ~56px)
  // así no tapa el clima ni la geolocalización
  const HEADER_HEIGHT = 56;
  const topOffset = insets.top + HEADER_HEIGHT + 6;

  return (
    <Animated.View
      style={[
        s.container,
        { top: topOffset, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={[s.pill, isOffline ? s.pillOffline : s.pillOnline, isDark && s.pillDark]}>
        {isOffline ? (
          <>
            <Animated.View style={[s.spinner, { transform: [{ rotate: spin }] }]} />
            <Text style={s.textOffline}>Sin conexión</Text>
          </>
        ) : (
          <>
            <View style={s.dot} />
            <Text style={s.textOnline}>Conectado</Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  pillOffline: {
    backgroundColor: '#1c1c1e',
  },
  pillOnline: {
    backgroundColor: '#00C8A0',
  },
  pillDark: {
    shadowOpacity: 0.4,
  },
  // Spinner arco para offline
  spinner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
  },
  // Punto verde para "conectado"
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  textOffline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.1,
  },
  textOnline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.1,
  },
});
