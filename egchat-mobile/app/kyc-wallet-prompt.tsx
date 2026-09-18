// ══════════════════════════════════════════════════════════════════
// EGCHAT — KYC Wallet Prompt
// Pantalla CTA post-registro: invita al usuario a activar su monedero
// El usuario puede ignorarla y entrar a la app normalmente.
// Si ya tiene KYC en curso, muestra el estado actual.
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { getKycStatus, KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '../src/services/kyc';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const { width: W } = Dimensions.get('window');

// ── Iconos ────────────────────────────────────────────────────────
const IconShield = ({ color = '#00C8A0', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <Path d="M9 12l2 2 4-4" strokeWidth={1.8}/>
  </Svg>
);
const IconWallet = ({ color = '#00C8A0', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <Path d="M16 3l-4-1-4 1v4h8V3z"/>
    <Circle cx="17" cy="13" r="1" fill={color} stroke="none"/>
  </Svg>
);
const IconTransfer = ({ color = '#00C8A0', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14"/>
    <Path d="M13 6l6 6-6 6"/>
    <Path d="M19 12H5"/>
    <Path d="M11 18l-6-6 6-6"/>
  </Svg>
);
const IconBill = ({ color = '#00C8A0', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="2" width="14" height="20" rx="2"/>
    <Line x1="9" y1="8" x2="15" y2="8"/>
    <Line x1="9" y1="12" x2="15" y2="12"/>
    <Line x1="9" y1="16" x2="12" y2="16"/>
  </Svg>
);
const IconClose = ({ color = 'rgba(255,255,255,0.5)', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/>
    <Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

// ── Beneficios que se muestran en la pantalla ─────────────────────
const BENEFITS = [
  {
    icon: <IconWallet color="#00B4E6" size={22}/>,
    bg:   '#e0f7ff',
    title: 'Monedero digital XAF',
    sub:   'Guarda y gestiona tu saldo de forma segura',
  },
  {
    icon: <IconTransfer color="#8B5CF6" size={22}/>,
    bg:   '#ede9fe',
    title: 'Transferencias instantáneas',
    sub:   'Envía dinero a cualquier usuario EGChat al instante',
  },
  {
    icon: <IconBill color="#F59E0B" size={22}/>,
    bg:   '#fef9e7',
    title: 'Paga servicios',
    sub:   'Electricidad, agua, teléfono y mucho más desde la app',
  },
  {
    icon: <IconShield color="#10B981" size={22}/>,
    bg:   '#d1fae5',
    title: 'Seguridad COBAC',
    sub:   'Verificación obligatoria bajo normativa bancaria BEAC',
  },
];

// ── Pasos del proceso ─────────────────────────────────────────────
const STEPS = [
  { num: '1', label: 'Datos personales',       time: '2 min' },
  { num: '2', label: 'Documento de identidad', time: '1 min' },
  { num: '3', label: 'Selfie de verificación', time: '30 seg' },
];

// ════════════════════════════════════════════════════════════════
export default function KycWalletPrompt() {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.9)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('none');

  // Pulso en el botón principal
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Animación de entrada + carga de estado
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    getKycStatus().then(res => {
      setKycStatus(res.kyc_status);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const goToKyc  = () => router.push('/kyc-step-1' as any);
  const skipNow  = () => router.replace('/(tabs)' as any);

  // Si el KYC ya fue completado/enviado, saltar directo a la app
  useEffect(() => {
    if (!loading && (kycStatus === 'approved' || kycStatus === 'pending')) {
      router.replace('/(tabs)' as any);
    }
  }, [loading, kycStatus]);

  // ── Estado rechazado — mostrar aviso especial ─────────────────
  const isRejected = kycStatus === 'rejected';

  return (
    <LinearGradient
      colors={['#06283d', '#0a3d5e', '#0d2d4a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={st.safe}>
        {/* Botón saltar */}
        <TouchableOpacity style={st.skipBtn} onPress={skipNow} activeOpacity={0.7}>
          <Text style={st.skipText}>Ahora no</Text>
          <IconClose size={16}/>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={st.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <Animated.View style={[st.hero, {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }]}>
            {/* Anillo con icono */}
            <View style={st.iconRingOuter}>
              <LinearGradient
                colors={['#00C8A0', '#00B4E6']}
                style={st.iconRingGradient}
              >
                <Text style={st.heroEmoji}>🏦</Text>
              </LinearGradient>
            </View>

            {isRejected ? (
              <>
                <Text style={st.badge}>⚠️ Verificación rechazada</Text>
                <Text style={st.heroTitle}>Corrige tu solicitud</Text>
                <Text style={st.heroSub}>
                  Tu solicitud anterior no fue aprobada. Puedes{'\n'}
                  volver a intentarlo con documentos correctos.
                </Text>
              </>
            ) : (
              <>
                <View style={st.newBadge}>
                  <Text style={st.newBadgeText}>✨ NUEVO</Text>
                </View>
                <Text style={st.heroTitle}>Activa tu Monedero{'\n'}Digital</Text>
                <Text style={st.heroSub}>
                  Completa tu verificación de identidad y{'\n'}
                  desbloquea <Text style={st.heroSubBold}>todas las funciones financieras</Text>{'\n'}
                  de EGChat en menos de 5 minutos.
                </Text>
              </>
            )}
          </Animated.View>

          {/* ── Beneficios ── */}
          <Animated.View style={[st.benefitsBox, { opacity: fadeAnim }]}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={st.benefitRow}>
                <View style={[st.benefitIconBox, { backgroundColor: b.bg }]}>
                  {b.icon}
                </View>
                <View style={st.benefitText}>
                  <Text style={st.benefitTitle}>{b.title}</Text>
                  <Text style={st.benefitSub}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ── Pasos del proceso ── */}
          <Animated.View style={[st.stepsBox, { opacity: fadeAnim }]}>
            <Text style={st.stepsTitle}>¿Qué necesitas hacer?</Text>
            <View style={st.stepsRow}>
              {STEPS.map((s, i) => (
                <View key={i} style={st.stepItem}>
                  <View style={st.stepNum}>
                    <Text style={st.stepNumText}>{s.num}</Text>
                  </View>
                  <Text style={st.stepLabel}>{s.label}</Text>
                  <Text style={st.stepTime}>{s.time}</Text>
                  {i < STEPS.length - 1 && <View style={st.stepConnector}/>}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Garantía legal ── */}
          <Animated.View style={[st.legalBox, { opacity: fadeAnim }]}>
            <Text style={st.legalText}>
              🔒 Tus datos están protegidos bajo el{' '}
              <Text style={st.legalBold}>Reglamento COBAC R-2023/01</Text>{' '}
              y la <Text style={st.legalBold}>Ley N°2/2008</Text> de Guinea Ecuatorial.
              Solo usados para verificar tu identidad.
            </Text>
          </Animated.View>

          {/* ── CTA principal ── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={goToKyc}
              disabled={loading}
              style={st.ctaWrapper}
            >
              <LinearGradient
                colors={['#00C8A0', '#00B4E6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.ctaBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff"/>
                ) : (
                  <>
                    <Text style={st.ctaText}>
                      {isRejected ? '🔄 Reintentar verificación' : '🚀 Activar mi monedero ahora'}
                    </Text>
                    <Text style={st.ctaSub}>Solo toma ~5 minutos · Completamente gratuito</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Saltar ── */}
          <TouchableOpacity style={st.laterBtn} onPress={skipNow} activeOpacity={0.7}>
            <Text style={st.laterText}>Quizás más tarde</Text>
            <Text style={st.laterHint}>
              Sin verificación, las funciones del monedero estarán bloqueadas
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },

  // Skip top-right
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 44,
    gap: 10,
  },
  iconRingOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(0,200,160,0.4)',
    padding: 4,
    shadowColor: '#00C8A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconRingGradient: {
    flex: 1,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 40 },
  newBadge: {
    backgroundColor: 'rgba(0,200,160,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  newBadgeText: {
    color: '#00C8A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  badge: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  heroSubBold: {
    color: '#00C8A0',
    fontWeight: '700',
  },

  // Beneficios
  benefitsBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: { flex: 1 },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  benefitSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 15,
  },

  // Pasos
  stepsBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,200,160,0.25)',
    borderWidth: 1.5,
    borderColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#00C8A0',
    fontSize: 14,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 13,
  },
  stepTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  stepConnector: {
    position: 'absolute',
    top: 15,
    right: -W / 6 + 16,
    width: W / 3 - 32,
    height: 1,
    backgroundColor: 'rgba(0,200,160,0.3)',
  },

  // Legal
  legalBox: {
    backgroundColor: 'rgba(0,200,160,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.2)',
  },
  legalText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
    textAlign: 'center',
  },
  legalBold: {
    color: '#00C8A0',
    fontWeight: '700',
  },

  // CTA
  ctaWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#00C8A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  ctaBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },

  // Botón "luego"
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  laterText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '600',
  },
  laterHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
