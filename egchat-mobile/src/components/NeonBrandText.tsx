// Texto EGCHAT con pulso neón — paridad con #neon-eg / #neon-chat en web
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function NeonBrandText() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const shadowRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [6, 14] });
  const textOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  const neon = {
    textShadowRadius: shadowRadius,
    textShadowColor: 'rgba(255,255,255,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    opacity: textOpacity,
  };

  return (
    <View style={s.row}>
      <Animated.Text style={[s.eg, neon]}>EG</Animated.Text>
      <Animated.Text style={[s.chat, neon]}>CHAT</Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 2,
  },
  eg: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  chat: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
});

export default NeonBrandText;
