import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SpinningLogo } from '../src/components/SpinningLogo';
import { authAPI } from '../src/api';

export default function WelcomeScreen() {
  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Tras 6s — si tiene sesión va a tabs, si no va a login
    const timer = setTimeout(async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          const me = await authAPI.me().catch(() => null);
          if (me?.id) {
            router.replace('/(tabs)' as any);
            return;
          }
        }
      } catch {}
      router.replace('/(auth)/login' as any);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#00c8a0', '#0099c8', '#0060b8']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.circleA} />
      <View style={s.circleB} />

      <View style={s.center}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View style={s.logoRing}>
            <SpinningLogo size={100} glow={false} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 24 }}>
          <Text style={s.appName}>EGChat</Text>
          <Text style={s.tagline}>África Central conectada</Text>
        </Animated.View>

        <Animated.View style={[s.dotsRow, { opacity: dotsOpacity }]}>
          <DotsLoader />
        </Animated.View>
      </View>
    </View>
  );
}

function DotsLoader() {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = () => {
      Animated.sequence([
        Animated.timing(d1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(d1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(d2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(d3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => loop());
    };
    loop();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.85)', opacity: d }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#00c8a0' },
  circleA: { position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.07)' },
  circleB: { position: 'absolute', bottom: -100, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.05)' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoRing: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 16 },
  appName:  { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  tagline:  { fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginTop: 4 },
  dotsRow:  { marginTop: 48 },
});
