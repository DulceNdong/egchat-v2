// KYC — Pantalla de entrada
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useKycSession } from '../../src/hooks/useKycSession';
import { useKycStore } from '../../src/store/kycStore';
import { clearKycDraft } from '../../src/services/kycStorage';
import { authAPI } from '../../src/api';

const FEATURES: { icon: keyof typeof MaterialCommunityIcons.glyphMap; lib: 'mci' | 'ion'; text: string }[] = [
  { lib: 'mci', icon: 'shield-lock',      text: 'Cifrado AES-256 — tus datos están protegidos' },
  { lib: 'mci', icon: 'clipboard-list',   text: '5 pasos sencillos · aproximadamente 10 minutos' },
  { lib: 'mci', icon: 'content-save',     text: 'Guardado automático — retoma donde lo dejaste' },
  { lib: 'mci', icon: 'bank',             text: 'Verificación cumple normativa COBAC y CEMAC' },
];

export default function KycEntryScreen() {
  const { checking, hasDraft, resumeStep } = useKycSession();
  const store = useKycStore();
  const insets = useSafeAreaInsets();

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
    <View style={st.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header gradient que cubre hasta el top del teléfono */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={st.logoWrapper}>
          <SpinningLogo size={64} glow={false} />
        </View>
        <Text style={st.headerTitle}>Activa tu monedero</Text>
        <Text style={st.headerSub}>Verifica tu identidad en pocos minutos</Text>
      </LinearGradient>

      {/* Body */}
      <View style={[st.body, { paddingBottom: insets.bottom + 16 }]}>
        {/* Tarjeta de beneficios */}
        <View style={st.infoBox}>
          {FEATURES.map(({ icon, lib, text }) => (
            <View key={text} style={st.infoRow}>
              <View style={st.iconCircle}>
                <MaterialCommunityIcons name={icon} size={20} color="#00B4A0" />
              </View>
              <Text style={st.infoText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          style={st.btnPrimary}
          onPress={handleStart}
          activeOpacity={0.85}
          accessibilityLabel="Comenzar verificación de identidad"
        >
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.btnGrad}
          >
            <Ionicons
              name={hasDraft ? 'play-circle' : 'rocket'}
              size={20}
              color="#fff"
              style={st.btnIcon}
            />
            <Text style={st.btnPrimaryText}>
              {hasDraft ? 'Continuar verificación' : 'Comenzar verificación'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {hasDraft && (
          <TouchableOpacity onPress={startNew} style={st.btnSecondary} activeOpacity={0.7}>
            <Ionicons name="refresh" size={17} color="#374151" style={st.btnIcon} />
            <Text style={st.btnSecondaryText}>Empezar de nuevo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} style={st.btnCancel} activeOpacity={0.6}>
          <Text style={st.btnCancelText}>Ahora no</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#fff' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    alignItems: 'center',
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  logoWrapper: {
    marginBottom: 4,
    shadowColor: '#00B4E6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle:  { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  headerSub:    { fontSize: 14, color: 'rgba(255,255,255,0.88)', textAlign: 'center' },

  body:         { flex: 1, padding: 24, gap: 14 },

  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e6faf7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText:   { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  btnPrimary:       { borderRadius: 16, overflow: 'hidden', shadowColor: '#00C8A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  btnGrad:          { paddingVertical: 16, alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnPrimaryText:   { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  btnIcon:          { marginTop: 1 },

  btnSecondary:     {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  btnCancel:        { alignItems: 'center', paddingVertical: 8 },
  btnCancelText:    { fontSize: 13, color: '#9ca3af' },
});
