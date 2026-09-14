// ══════════════════════════════════════════════════════════════════
// EGCHAT — KYC Paso 3: Selfie + Envío Final
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import {
  KycFormData,
  loadKycDraftLocal, saveKycDraftLocal,
  validateStep3, submitKyc,
} from '../src/services/kyc';

// ── Barra de progreso ─────────────────────────────────────────────
const KycProgressBar = ({ step }: { step: number }) => (
  <View style={st.progressContainer}>
    {[0, 1, 2].map(i => (
      <View key={i} style={[st.progressSegment, { backgroundColor: i < step ? '#00C8A0' : 'rgba(255,255,255,0.2)' }]}/>
    ))}
  </View>
);

// ── Resumen del borrador (para revisión antes de enviar) ──────────
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={st.summaryRow}>
    <Text style={st.summaryLabel}>{label}</Text>
    <Text style={st.summaryValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

// ══════════════════════════════════════════════════════════════════
export default function KycStep3() {
  const [form, setForm]       = useState<KycFormData>({} as KycFormData);
  const [error, setError]     = useState('');
  const [loadingPick, setLoadingPick] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [submitted, setSubmitted]     = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadKycDraftLocal().then(draft => {
      setForm(f => ({ ...f, ...draft }));
    });
  }, []);

  // Animación de éxito
  const playSuccess = () => {
    Animated.spring(successAnim, {
      toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
    }).start();
  };

  const pickSelfie = async () => {
    Alert.alert(
      'Foto selfie',
      'Mira directamente a la cámara con buena iluminación y sin gafas ni sombrero.',
      [
        {
          text: '📷 Cámara (recomendado)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara frontal para la selfie.');
              return;
            }
            setLoadingPick(true);
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              cameraType: ImagePicker.CameraType.front,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            });
            setLoadingPick(false);
            if (!result.canceled && result.assets[0]) {
              setForm(f => ({ ...f, selfie_uri: result.assets[0].uri }));
            }
          },
        },
        {
          text: '🖼️ Galería',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            setLoadingPick(true);
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            });
            setLoadingPick(false);
            if (!result.canceled && result.assets[0]) {
              setForm(f => ({ ...f, selfie_uri: result.assets[0].uri }));
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    setError('');
    const err = validateStep3(form);
    if (err) { setError(err); return; }

    Alert.alert(
      'Confirmar envío',
      '¿Estás seguro de que todos tus datos son correctos? Una vez enviada, la solicitud será revisada por nuestro equipo.',
      [
        { text: 'Revisar', style: 'cancel' },
        {
          text: 'Enviar solicitud',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            const result = await submitKyc(form, msg => setProgressMsg(msg));
            setSubmitting(false);
            setProgressMsg('');

            if (result.success) {
              setSubmitted(true);
              await saveKycDraftLocal({});
              playSuccess();
            } else {
              setError(result.message);
            }
          },
        },
      ]
    );
  };

  const goBack = () => router.back();
  const goHome = () => router.replace('/(tabs)' as any);

  // ── Pantalla de éxito ─────────────────────────────────────────
  if (submitted) {
    return (
      <LinearGradient colors={['#06283d', '#0a3d5e']} style={{ flex: 1 }}>
        <SafeAreaView style={st.successScreen}>
          <Animated.View style={[st.successBox, {
            opacity: successAnim,
            transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }]}>
            <LinearGradient
              colors={['#00C8A0', '#00B4E6']}
              style={st.successIcon}
            >
              <Text style={{ fontSize: 48 }}>✅</Text>
            </LinearGradient>
            <Text style={st.successTitle}>¡Solicitud enviada!</Text>
            <Text style={st.successSub}>
              Hemos recibido tu verificación de identidad.{'\n'}
              Nuestro equipo la revisará en{' '}
              <Text style={{ color: '#00C8A0', fontWeight: '700' }}>24-48 horas hábiles</Text>.
            </Text>
            <View style={st.successSteps}>
              {[
                { icon: '📧', text: 'Recibirás una notificación con el resultado' },
                { icon: '🏦', text: 'Revisión por equipo autorizado BANGE' },
                { icon: '🚀', text: 'Al aprobarse, tu monedero queda activo' },
              ].map((s, i) => (
                <View key={i} style={st.successStep}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                  <Text style={st.successStepText}>{s.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={st.goHomeBtn} onPress={goHome} activeOpacity={0.88}>
              <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.goHomeBtnGrad}>
                <Text style={st.goHomeBtnText}>Ir a EGChat →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#06283d', '#0a3d5e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={goBack} style={st.backBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12"/>
              <Path d="M12 5l-7 7 7 7"/>
            </Svg>
          </TouchableOpacity>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Selfie de Verificación</Text>
            <Text style={st.headerSub}>Paso 3 de 3 · Último paso</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        <KycProgressBar step={3}/>

        <ScrollView
          contentContainerStyle={st.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Instrucciones selfie */}
          <View style={st.selfieInstructions}>
            <Text style={st.sectionTitle}>Tu selfie de verificación</Text>
            <Text style={st.sectionSub}>
              Mira directamente a la cámara frontal. Asegúrate de que tu cara sea claramente visible.
            </Text>
            <View style={st.selfieRulesRow}>
              {[
                { emoji: '✅', text: 'Cara visible' },
                { emoji: '✅', text: 'Buena luz' },
                { emoji: '❌', text: 'Sin gafas' },
                { emoji: '❌', text: 'Sin sombrero' },
              ].map((r, i) => (
                <View key={i} style={st.selfieRule}>
                  <Text style={st.selfieRuleEmoji}>{r.emoji}</Text>
                  <Text style={st.selfieRuleText}>{r.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Zona selfie */}
          <TouchableOpacity
            style={[st.selfieZone, form.selfie_uri && st.selfieZoneFilled]}
            onPress={pickSelfie}
            activeOpacity={0.8}
            disabled={loadingPick}
          >
            {loadingPick ? (
              <ActivityIndicator color="#00C8A0" size="large"/>
            ) : form.selfie_uri ? (
              <>
                <Image source={{ uri: form.selfie_uri }} style={st.selfiePreview} resizeMode="cover"/>
                <View style={st.selfieCheck}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>✓</Text>
                </View>
                <View style={st.selfieRetake}>
                  <Text style={st.selfieRetakeText}>📷 Tomar otra selfie</Text>
                </View>
              </>
            ) : (
              <View style={st.selfiePlaceholder}>
                <Text style={{ fontSize: 56 }}>🤳</Text>
                <Text style={st.selfieLabel}>Toca para tomar selfie</Text>
                <Text style={st.selfieSub}>Usa la cámara frontal</Text>
                <View style={st.selfiePickBtn}>
                  <Text style={st.selfiePickBtnText}>📷 Abrir cámara frontal</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Resumen de datos para revisión */}
          <View style={st.summaryBox}>
            <Text style={st.summaryTitle}>📋 Resumen de tu solicitud</Text>
            <SummaryRow label="Nombre"      value={form.full_name || ''} />
            <SummaryRow label="Nacimiento"  value={form.birth_date || ''} />
            <SummaryRow label="Nacionalidad" value={form.nationality || ''} />
            <SummaryRow label="Documento"   value={`${form.doc_type?.toUpperCase() || ''} · ${form.doc_number || ''}`} />
            <SummaryRow label="Documento ✓" value={form.doc_front_uri ? 'Adjuntado' : '—'} />
            <SummaryRow label="Selfie ✓"    value={form.selfie_uri ? 'Lista' : 'Pendiente'} />
          </View>

          {/* Estado de subida */}
          {submitting && (
            <View style={st.progressBox}>
              <ActivityIndicator color="#00C8A0" size="small"/>
              <Text style={st.progressText}>{progressMsg || 'Procesando…'}</Text>
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={st.errorBox}>
              <Text style={st.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Aviso legal */}
          <View style={st.legalBox}>
            <Text style={st.legalText}>
              Al enviar confirmas que los datos son verdaderos y autorizas el tratamiento
              de tus datos personales conforme al{' '}
              <Text style={st.legalBold}>Reglamento COBAC R-2023/01</Text>{' '}
              y la <Text style={st.legalBold}>Ley N°2/2008</Text>.
            </Text>
          </View>

          {/* Botón enviar */}
          <TouchableOpacity
            style={[st.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#00C8A0', '#00B4E6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={st.submitBtnGrad}
            >
              {submitting ? (
                <ActivityIndicator color="#fff"/>
              ) : (
                <Text style={st.submitBtnText}>📤 Enviar solicitud KYC</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

  progressContainer: { flexDirection: 'row', gap: 4, marginHorizontal: 20, marginBottom: 4 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17 },

  selfieInstructions: { gap: 10 },
  selfieRulesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  selfieRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selfieRuleEmoji: { fontSize: 13 },
  selfieRuleText: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },

  selfieZone: {
    height: 260,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieZoneFilled: { borderStyle: 'solid', borderColor: '#00C8A0' },
  selfiePreview: { width: '100%', height: '100%' },
  selfieCheck: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center',
  },
  selfieRetake: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 10, alignItems: 'center',
  },
  selfieRetakeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  selfiePlaceholder: { alignItems: 'center', gap: 8 },
  selfieLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  selfieSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  selfiePickBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(0,200,160,0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.4)',
  },
  selfiePickBtnText: { color: '#00C8A0', fontSize: 13, fontWeight: '700' },

  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  summaryTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 12, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,200,160,0.1)',
    borderRadius: 10,
    padding: 12,
  },
  progressText: { color: '#00C8A0', fontSize: 13, fontWeight: '600' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  legalBox: {
    backgroundColor: 'rgba(0,200,160,0.07)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.15)',
  },
  legalText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  legalBold: { color: '#00C8A0', fontWeight: '700' },

  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Pantalla de éxito
  successScreen: { flex: 1, justifyContent: 'center', padding: 24 },
  successBox: { alignItems: 'center', gap: 16 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00C8A0', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  successTitle: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  successSub: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  successSteps: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  successStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successStepText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, flex: 1, lineHeight: 18 },
  goHomeBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  goHomeBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  goHomeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
