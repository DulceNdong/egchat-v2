// KYC — Pantalla de carga durante verificación automática
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useKycStore } from '../../src/store/kycStore';
import { getKycStatus } from '../../src/services/kycService';

const STEPS = [
  { label: '📄 Documentos recibidos',         delay: 0    },
  { label: '🔍 Comparando biometría...',       delay: 2000 },
  { label: '🛡 Revisando historial...',        delay: 4000 },
  { label: '✅ Finalizando verificación...',   delay: 6000 },
];

export default function ProcessingScreen() {
  const store  = useKycStore();
  const appId  = store.applicationId;
  const [visibleSteps, setVisible] = useState<number[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Mostrar pasos progresivamente
    STEPS.forEach((s, i) => {
      setTimeout(() => setVisible(prev => [...prev, i]), s.delay);
    });

    // Polling de estado cada 4 segundos
    const interval = setInterval(async () => {
      if (!appId) return;
      try {
        const { status, rejectReason, isFinal } = await getKycStatus(appId);
        store.setStatus(status as any);
        if (status === 'approved' || status === 'APPROVED' || status === 'AUTO_APPROVED') {
          clearInterval(interval);
          router.replace('/kyc/result?type=approved');
        } else if (status === 'MANUAL_REVIEW' || status === 'under_review' || status === 'PENDING_REVIEW') {
          clearInterval(interval);
          router.replace('/kyc/result?type=manual_review');
        } else if (status === 'PENDING_INFO') {
          clearInterval(interval);
          store.setRejectReason(rejectReason ?? 'BANGE necesita información adicional.', false);
          router.replace('/kyc/result?type=rejected_fixable');
        } else if (status === 'rejected' || status === 'REJECTED' || status === 'BLOCKED') {
          clearInterval(interval);
          store.setRejectReason(rejectReason ?? '', isFinal);
          router.replace(`/kyc/result?type=${status === 'BLOCKED' || isFinal ? 'rejected_final' : 'rejected_fixable'}`);
        }
      } catch { /* red no disponible — seguir esperando */ }
    }, 4000);

    // Si no hay respuesta en 30s → asumir revisión manual
    const timeout = setTimeout(() => {
      clearInterval(interval);
      router.replace('/kyc/result?type=manual_review');
    }, 30000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [appId]);

  return (
    <SafeAreaView style={st.container}>
      <Animated.View style={[st.content, { opacity: fadeAnim }]}>
        <SpinningLogo size={80} glow />
        <Text style={st.title}>Verificando tu identidad...</Text>
        <Text style={st.sub}>Esto puede tardar unos segundos</Text>

        <View style={st.stepsWrap}>
          {STEPS.map((s, i) => (
            visibleSteps.includes(i) && (
              <Animated.View key={i} style={st.stepRow}>
                <Text style={st.stepText}>{s.label}</Text>
              </Animated.View>
            )
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title:     { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  sub:       { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  stepsWrap: { marginTop: 24, gap: 10, width: '100%' },
  stepRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12 },
  stepText:  { fontSize: 14, color: '#374151', fontWeight: '600' },
});
