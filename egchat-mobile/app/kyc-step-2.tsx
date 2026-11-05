// ══════════════════════════════════════════════════════════════════
// EGCHAT — KYC Paso 2: Documento de Identidad
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  TextInput, Modal, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';
import {
  KycFormData,
  loadKycDraftLocal, saveKycDraftLocal, validateStep2,
  DOC_TYPE_LABELS,
} from '../src/services/kyc';

// ── Barra de progreso ─────────────────────────────────────────────
const KycProgressBar = ({ step }: { step: number }) => (
  <View style={st.progressContainer}>
    {[0, 1, 2].map(i => (
      <View key={i} style={[st.progressSegment, { backgroundColor: i < step ? '#00C8A0' : 'rgba(255,255,255,0.2)' }]}/>
    ))}
  </View>
);

// ── Zona de foto (frontal o dorsal) ──────────────────────────────
const PhotoZone = ({
  label, sublabel, uri, onPick, loading,
}: {
  label: string; sublabel: string;
  uri: string; onPick: () => void; loading?: boolean;
}) => (
  <TouchableOpacity style={[st.photoZone, uri && st.photoZoneFilled]} onPress={onPick} activeOpacity={0.8}>
    {loading ? (
      <ActivityIndicator color="#00C8A0" size="large"/>
    ) : uri ? (
      <>
        <Image source={{ uri }} style={st.photoPreview} resizeMode="cover"/>
        <View style={st.photoCheck}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>✓</Text>
        </View>
        <View style={st.photoRetake}>
          <Text style={st.photoRetakeText}>📷 Cambiar</Text>
        </View>
      </>
    ) : (
      <View style={st.photoPlaceholder}>
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round">
          <Rect x="3" y="5" width="18" height="14" rx="2"/>
          <Circle cx="12" cy="12" r="3.5"/>
          <Path d="M8 5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/>
        </Svg>
        <Text style={st.photoLabel}>{label}</Text>
        <Text style={st.photoSub}>{sublabel}</Text>
        <View style={st.photoPickBtn}>
          <Text style={st.photoPickBtnText}>📷 Abrir cámara / galería</Text>
        </View>
      </View>
    )}
  </TouchableOpacity>
);

// ══════════════════════════════════════════════════════════════════
export default function KycStep2() {
  const [form, setForm] = useState<KycFormData>({} as KycFormData);
  const [error, setError]       = useState('');
  const [showDocType, setShowDocType] = useState(false);
  const [loadingFront, setLoadingFront] = useState(false);
  const [loadingBack,  setLoadingBack]  = useState(false);

  const set = (key: keyof KycFormData) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    loadKycDraftLocal().then(draft => {
      const defaults: Partial<KycFormData> = {
        doc_type:      'dni',
        doc_number:    '',
        doc_expiry:    '',
        doc_front_uri: '',
        doc_back_uri:  '',
        doc_front_url: '',
        doc_back_url:  '',
      };
      setForm(f => ({ ...defaults, ...f, ...draft } as KycFormData));
    });
  }, []);

  const pickImage = async (
    side: 'front' | 'back',
    setLoading: (v: boolean) => void,
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir el documento.');
      return;
    }
    Alert.alert(
      'Subir documento',
      'Elige cómo quieres obtener la imagen',
      [
        {
          text: '📷 Cámara',
          onPress: async () => {
            const camStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (camStatus.status !== 'granted') return;
            setLoading(true);
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.85,
            });
            setLoading(false);
            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              if (side === 'front') set('doc_front_uri')(uri);
              else                   set('doc_back_uri')(uri);
            }
          },
        },
        {
          text: '🖼️ Galería',
          onPress: async () => {
            setLoading(true);
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.85,
            });
            setLoading(false);
            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              if (side === 'front') set('doc_front_uri')(uri);
              else                   set('doc_back_uri')(uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const goNext = async () => {
    setError('');
    const err = validateStep2(form);
    if (err) { setError(err); return; }
    await saveKycDraftLocal(form);
    router.push('/kyc-step-3' as any);
  };

  const goBack = () => router.back();

  const docLabel = form.doc_type ? DOC_TYPE_LABELS[form.doc_type] : 'Seleccionar…';

  return (
    <LinearGradient colors={['#06283d', '#0a3d5e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={goBack} style={st.backBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 5l-7 7 7 7"/>
              </Svg>
            </TouchableOpacity>
            <View style={st.headerCenter}>
              <Text style={st.headerTitle}>Documento de Identidad</Text>
              <Text style={st.headerSub}>Paso 2 de 3</Text>
            </View>
            <View style={{ width: 36 }}/>
          </View>

          <KycProgressBar step={2}/>

          <ScrollView
            contentContainerStyle={st.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.sectionTitle}>Tipo de documento</Text>
            <Text style={st.sectionSub}>
              Usa un documento oficial vigente. El nombre debe coincidir exactamente con el que indicaste en el paso anterior.
            </Text>

            {/* Tipo de documento */}
            <View style={st.fieldGroup}>
              <Text style={st.fieldLabel}>Tipo de documento <Text style={st.required}>*</Text></Text>
              <TouchableOpacity style={st.selector} onPress={() => setShowDocType(true)} activeOpacity={0.8}>
                <Text style={st.selectorText}>{docLabel}</Text>
                <Text style={st.selectorArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Número */}
            <View style={st.fieldGroup}>
              <Text style={st.fieldLabel}>Número de documento <Text style={st.required}>*</Text></Text>
              <TextInput
                style={st.input}
                value={form.doc_number || ''}
                onChangeText={set('doc_number')}
                placeholder="Ej. GQ-12345678"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="characters"
                maxLength={30}
              />
            </View>

            {/* Fecha de expiración */}
            <View style={st.fieldGroup}>
              <Text style={st.fieldLabel}>Fecha de expiración</Text>
              <TextInput
                style={st.input}
                value={form.doc_expiry || ''}
                onChangeText={set('doc_expiry')}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={st.hint}>Deja en blanco si no aplica (ej. pasaporte sin vencimiento)</Text>
            </View>

            {/* Tips */}
            <View style={st.tipsBox}>
              <Text style={st.tipsTitle}>📋 Consejos para una buena foto</Text>
              {[
                'Fondo liso, sin sombras ni reflejos',
                'Todos los datos deben ser legibles',
                'No cortes los bordes del documento',
                'Buena iluminación, sin flash directo',
              ].map((t, i) => (
                <Text key={i} style={st.tipItem}>· {t}</Text>
              ))}
            </View>

            {/* Foto frontal */}
            <Text style={st.photoSectionTitle}>
              Foto frontal <Text style={st.required}>*</Text>
            </Text>
            <PhotoZone
              label="Frente del documento"
              sublabel="Asegúrate de que sea legible"
              uri={form.doc_front_uri || ''}
              onPick={() => pickImage('front', setLoadingFront)}
              loading={loadingFront}
            />

            {/* Foto dorsal */}
            <Text style={[st.photoSectionTitle, { marginTop: 16 }]}>
              Foto dorsal{' '}
              <Text style={st.optional}>(si aplica)</Text>
            </Text>
            <PhotoZone
              label="Reverso del documento"
              sublabel="Opcional para pasaporte"
              uri={form.doc_back_uri || ''}
              onPick={() => pickImage('back', setLoadingBack)}
              loading={loadingBack}
            />

            {error ? (
              <View style={st.errorBox}>
                <Text style={st.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={st.nextBtn} onPress={goNext} activeOpacity={0.88}>
              <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.nextBtnGrad}>
                <Text style={st.nextBtnText}>Continuar — Selfie →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={st.legalNote}>
              🔒 Imágenes cifradas · Solo accesibles por revisores autorizados BANGE
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal tipo de documento */}
      <Modal visible={showDocType} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Tipo de documento</Text>
            {(Object.entries(DOC_TYPE_LABELS) as [keyof typeof DOC_TYPE_LABELS, string][]).map(([code, label]) => (
              <TouchableOpacity
                key={code}
                style={[st.modalOption, form.doc_type === code && st.modalOptionActive]}
                onPress={() => { set('doc_type')(code); setShowDocType(false); }}
              >
                <Text style={st.modalOptionText}>{label}</Text>
                {form.doc_type === code && <Text style={st.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.modalClose} onPress={() => setShowDocType(false)}>
              <Text style={st.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  sectionSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17, marginBottom: 16 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: '#F87171' },
  optional: { color: 'rgba(255,255,255,0.35)', fontWeight: '400', fontSize: 12 },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  selector: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  selectorArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 20 },

  tipsBox: {
    backgroundColor: 'rgba(0,200,160,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.2)',
    marginBottom: 20,
    gap: 4,
  },
  tipsTitle: { color: '#00C8A0', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  tipItem: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 18 },

  photoSectionTitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  photoZone: {
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoZoneFilled: {
    borderStyle: 'solid',
    borderColor: '#00C8A0',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRetake: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  photoRetakeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  photoPlaceholder: { alignItems: 'center', gap: 6, padding: 16 },
  photoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  photoSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  photoPickBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(0,200,160,0.2)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.4)',
  },
  photoPickBtnText: { color: '#00C8A0', fontSize: 13, fontWeight: '600' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  nextBtn: { marginTop: 24, marginBottom: 8, borderRadius: 16, overflow: 'hidden' },
  nextBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  legalNote: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0d2d4a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalOptionActive: { backgroundColor: 'rgba(0,200,160,0.1)', borderRadius: 8, paddingHorizontal: 8 },
  modalOptionText: { color: '#fff', fontSize: 15 },
  modalCheck: { color: '#00C8A0', fontSize: 16, fontWeight: '700' },
  modalClose: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
