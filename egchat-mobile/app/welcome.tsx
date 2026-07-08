// ══════════════════════════════════════════════════════════════════
// EGCHAT — Welcome Screen v3 (diseño premium)
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { SpinningLogo } from '../src/components/SpinningLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const { width: W } = Dimensions.get('window');

// ── Features con iconos SVG ───────────────────────────────────────
const FEATURES = [
  {
    color: '#07C160',
    bg: '#e8f8ee',
    title: 'Mensajes en tiempo real',
    sub: 'Chats seguros con cifrado E2E',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <Line x1="9" y1="10" x2="15" y2="10"/><Line x1="9" y1="14" x2="13" y2="14"/>
      </Svg>
    ),
  },
  {
    color: '#00B4E6',
    bg: '#e0f7ff',
    title: 'Pagos y cartera XAF',
    sub: 'Transferencias instantáneas seguras',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#00B4E6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="5" width="20" height="14" rx="2"/>
        <Line x1="2" y1="10" x2="22" y2="10"/>
        <Circle cx="12" cy="15" r="2"/>
      </Svg>
    ),
  },
  {
    color: '#8B5CF6',
    bg: '#ede9fe',
    title: 'Lia-25 — IA Asistente',
    sub: 'Tu asistente inteligente 24/7',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="6" width="18" height="13" rx="3"/>
        <Path d="M3 10h18"/>
        <Circle cx="8.5" cy="14" r="1.2" fill="#8B5CF6" stroke="none"/>
        <Circle cx="15.5" cy="14" r="1.2" fill="#8B5CF6" stroke="none"/>
      </Svg>
    ),
  },
  {
    color: '#F59E0B',
    bg: '#fef9e7',
    title: 'Servicios locales GQ',
    sub: 'Taxi, recarga, bancos y más',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <Rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <Rect x="14" y="14" width="7" height="7" rx="1.5"/>
        <Rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </Svg>
    ),
  },
];

const FLAGS = ['🇬🇶', '🇨🇲', '🇬🇦', '🇨🇬', '🇪🇸', '🇫🇷', '🇬🇧', '🇺🇸'];

// ── Feature card ──────────────────────────────────────────────────
const FeatureCard = ({
  item, delay,
}: { item: typeof FEATURES[0]; delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, useNativeDriver: true,
      tension: 60, friction: 10,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }}>
      <View style={[st.featureCard, { borderLeftColor: item.color }]}>
        <View style={[st.featureIconBox, { backgroundColor: item.bg }]}>
          {item.icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.featureTitle}>{item.title}</Text>
          <Text style={st.featureSub}>{item.sub}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ══════════════════════════════════════════════════════════════════
export default function WelcomeScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.spring(buttonsAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0d2d4a', '#0a3d5e', '#06283d']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={st.container}>

        {/* ── Top: Logo + nombre ── */}
        <Animated.View style={[st.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        }]}>
          {/* Anillo decorativo */}
          <View style={st.logoRingOuter}>
            <View style={st.logoRingInner}>
              <SpinningLogo size={90} glow />
            </View>
          </View>

          <Text style={st.appName}>
            <Text style={{ color: '#00C8A0' }}>EG</Text>
            <Text style={{ color: '#ffffff' }}>CHAT</Text>
          </Text>
          <Text style={st.tagline}>La app de Guinea Ecuatorial</Text>

          {/* Banderas */}
          <View style={st.flagsRow}>
            {FLAGS.map((f, i) => (
              <Text key={i} style={st.flag}>{f}</Text>
            ))}
          </View>
        </Animated.View>

        {/* ── Features (4 cards) ── */}
        <View style={st.features}>
          {FEATURES.map((item, i) => (
            <FeatureCard key={i} item={item} delay={300 + i * 100} />
          ))}
        </View>

        {/* ── Botones ── */}
        <Animated.View style={[st.buttons, {
          opacity: buttonsAnim,
          transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          {/* Crear cuenta */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <LinearGradient
              colors={['#00C8A0', '#00B4E6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.btnPrimary}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <Circle cx="12" cy="7" r="4"/>
              </Svg>
              <Text style={st.btnPrimaryText}>Crear cuenta gratis</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Ya tengo cuenta */}
          <TouchableOpacity
            style={st.btnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={st.btnSecondaryText}>Ya tengo cuenta  →</Text>
          </TouchableOpacity>

          <Text style={st.legal}>
            Al continuar aceptas los{' '}
            <Text style={{ color: '#00C8A0' }}>Términos de servicio</Text>
            {' '}y la{' '}
            <Text style={{ color: '#00C8A0' }}>Política de privacidad</Text>
          </Text>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // Header
  header: { alignItems: 'center', gap: 10, paddingTop: 8 },
  logoRingOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: 'rgba(0,200,160,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,200,160,0.06)',
    shadowColor: '#00C8A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  flag: { fontSize: 20 },

  // Features
  features: { gap: 8, paddingVertical: 4 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
  },

  // Buttons
  buttons: { gap: 12 },
  btnPrimary: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00C8A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  legal: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 16,
  },
});
