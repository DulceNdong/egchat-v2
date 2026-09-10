/**
 * PrivacyBlurOverlay — Overlay de privacidad para iOS
 *
 * Aparece cuando la app pasa a background/app-switcher en chats
 * con modo incógnito activo. Impide que el contenido del chat sea
 * visible en el app switcher de iOS (misma técnica que Signal y Telegram).
 *
 * En Android esto se hace con FLAG_SECURE (expo-screen-capture).
 * En iOS no existe ese flag, así que cubrimos el contenido visualmente.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  visible: boolean;
}

const ACCENT = '#00c8a0';

export function PrivacyBlurOverlay({ visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 80 : 200, // aparecer rápido, desaparecer suave
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Solo relevante en iOS; en Android FLAG_SECURE lo maneja el SO
  if (Platform.OS !== 'ios') return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={visible ? 'box-only' : 'none'}
    >
      {/* Fondo oscuro sólido — impide ver el contenido del chat */}
      <View style={styles.bg} />

      {/* Icono y texto centrado */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Ojo tachado = incógnito */}
            <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <Path d="M1 1l22 22" />
          </Svg>
        </View>
        <Text style={styles.title}>Modo incógnito</Text>
        <Text style={styles.subtitle}>El contenido está oculto por seguridad</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1117', // oscuro EGChat
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,200,160,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,160,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
