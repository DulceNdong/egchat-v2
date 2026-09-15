// KYC — Pantalla de entrada
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useKycSession } from '../../src/hooks/useKycSession';
import { useKycStore } from '../../src/store/kycStore';
import { clearKycDraft } from '../../src/services/kycStorage';
import { authAPI } from '../../src/api';

export default function KycEntryScreen() {
  const { checking, hasDraft, resumeStep } = useKycSession();
  const store = useKycStore();

  // Pre-rellenar teléfono del usuario
  useEffect(() => {
    authAPI.me().then(user => {
      if (user?.phone && !store.personalData.phone) {
        store.setPersonalData({ phone: user.phone });
      }
    }).catch(() => {});
  }, []);

  const startNew = async () => {
    store.reset();
    await clearKycDraft();
    router.push('/kyc/step-1');
  };

  const continueExisting = () => {
    router.push(`/kyc/step-${resumeStep}` as any);
  };

  const handleStart = () => {
    if (hasDraft) {
      Alert.alert(
        'Verificación en progreso',
        'Tienes una verificación en progreso. ¿Qué deseas hacer?',
        [
          { text: 'Continuar', onPress: continueExisting },
          { text: 'Empezar de nuevo', style: 'destructive', onPress: startNew },
          { text: 'Cancelar', style: 'cancel' },
        ],
      );
    } else {
      startNew();
    }
  };

  if (checking) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color="#00C8A0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={st.header}>
        <SpinningLogo size={64} glow={false} />
        <Text style={st.headerTitle}>Activa tu monedero</Text>
        <Text style={st.headerSub}>Verifica tu identidad en pocos minutos</Text>
      </LinearGradient>

      <View style={st.body}>
        {/* Beneficios */}
        <View style={st.infoBox}>
          {[
            { icon: '🔒', text: 'Cifrado AES-256 — tus datos están protegidos' },
            { icon: '📋', text: '5 pasos sencillos · aproximadamente 10 minutos' },
            { icon: '💾', text: 'Guardado automático — retoma donde lo dejaste' },
            { icon: '🏦', text: 'Verificación cumple normativa COBAC y CEMAC' },
          ].map(({ icon, text }) => (
            <View key={text} style={st.infoRow}>
              <Text style={st.infoIcon}>{icon}</Text>
              <Text style={st.infoText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          style={st.btnPrimary}
          onPress={handleStart}
          accessibilityLabel="Comenzar verificación de identidad"
        >
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={st.btnGrad}
          >
            <Text style={st.btnPrimaryText}>
              {hasDraft ? '▶ Continuar verificación' : '🚀 Comenzar verificación'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {hasDraft && (
          <TouchableOpacity onPress={startNew} style={st.btnSecondary}>
            <Text style={st.btnSecondaryText}>Empezar de nuevo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} style={st.btnCancel}>
          <Text style={st.btnCancelText}>Ahora no</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  headerTitle:      { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub:        { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  body:             { flex: 1, padding: 24, gap: 16 },
  infoBox:          { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  infoRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon:         { fontSize: 18, width: 26 },
  infoText:         { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  btnPrimary:       { borderRadius: 14, overflow: 'hidden' },
  btnGrad:          { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  btnPrimaryText:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  btnSecondary:     { paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center' },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  btnCancel:        { alignItems: 'center', paddingVertical: 8 },
  btnCancelText:    { fontSize: 13, color: '#9ca3af' },
});
