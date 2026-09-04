import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useOffline } from '../../hooks/useOffline';
import { useThemeContext } from '../../theme/ThemeContext';
import { FontSize, FontWeight } from '../../theme';

export function OfflineBanner() {
  const { isOnline, isChecking } = useOffline();
  const { isDark } = useThemeContext();

  // Animación de rotación del spinner
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Animación de entrada/salida (altura)
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isVisible = !isChecking && !isOnline;

  useEffect(() => {
    // Spinner continuo
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [isVisible, slideAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bannerHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 28],
  });

  const bannerOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        s.banner,
        isDark ? s.bannerDark : s.bannerLight,
        { height: bannerHeight, opacity: bannerOpacity, overflow: 'hidden' },
      ]}
    >
      {/* Spinner circular tipo WhatsApp */}
      <Animated.View style={[s.spinner, { transform: [{ rotate: spin }] }]}>
        <View style={s.spinnerInner} />
      </Animated.View>

      <Text style={[s.text, isDark && s.textDark]}>
        Esperando conexión...
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  bannerLight: {
    backgroundColor: '#F0F2F5',
  },
  bannerDark: {
    backgroundColor: '#1A1A1A',
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#25D366',
    borderTopColor: 'transparent',
  },
  spinnerInner: {
    // solo para que el View tenga dimensiones correctas
    width: 10,
    height: 10,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#555',
  },
  textDark: {
    color: '#aaa',
  },
});
