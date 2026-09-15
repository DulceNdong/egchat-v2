// KYC — Paso 2: Documento de Identidad
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { DocumentCapture } from '../../src/components/kyc/DocumentCapture';
import { OcrConfirmation } from '../../src/components/kyc/OcrConfirmation';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { uploadDocumentImage } from '../../src/services/kycService';
import type { DocumentType } from '../../src/store/kycStore';

const DOC_TYPES: { value: DocumentType; label: string; hasBack: boolean }[] = [
  { value: 'DNI',              label: 'DNI',                    hasBack: true  },
  { value: 'PASSPORT',         label: 'Pasaporte',              hasBack: false },
  { value: 'RESIDENCE_PERMIT', label: 'Permiso de residencia',  hasBack: true  },
];

export default function Step2() {
  const store = useKycStore();
  const d = store.documentData;

  const [uploading, setUploading]   = useState(false);
  const [frontDone, setFrontDone]   = useState(!!d.frontImageUri);
  const [backDone, setBackDone]     = useState(!!d.backImageUri);
  const [showOcr, setShowOcr]       = useState(false);
  const [error, setError]           = useState('');

  const selectedDoc = DOC_TYPES.find(t => t.value === d.documentType);
  const needsBack   = selectedDoc?.hasBack ?? false;
  const canContinue = frontDone && (!needsBack || backDone) && d.ocrConfirmed;

  const handleFrontCapture = async (enc: string, uri: string) => {
    setUploading(true);
    setError('');
    try {
      store.setDocumentData({ frontImageUri: uri, frontImageEncrypted: enc });
      const appId = store.applicationId;
      if (appId) {
        const res = await uploadDocumentImage(appId, 'front', enc, d.documentType);
        if (res.ocrData && Object.keys(res.ocrData).length > 0) {
          store.setDocumentData({ ocrData: res.ocrData });
          setShowOcr(true);
        }
      }
      setFrontDone(true);
    } catch {
      setError('Error al subir la foto frontal. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleBackCapture = async (enc: string, uri: string) => {
    setUploading(true);
    try {
      store.setDocumentData({ backImageUri: uri, backImageEncrypted: enc });
      const appId = store.applicationId;
      if (appId) await uploadDocumentImage(appId, 'back', enc, d.documentType);
      setBackDone(true);
    } catch {
      setError('Error al subir la foto trasera. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    store.markStepComplete(2);
    store.setCurrentStep(3);
    await saveKycDraft({ ...store, currentStep: 3 } as any);
    router.push('/kyc/step-3');
  };

  return (
    <KycStepLayout
      step={2} completed={store.completedSteps}
      title="Documento de Identidad"
      onBack={() => router.push('/kyc/step-1')}
      onNext={handleNext}
      nextDisabled={!canContinue || uploading}
      loading={uploading}
      onExit={() => router.back()}
    >
      {/* Tipo de documento */}
      <Text style={st.sectionTitle}>Tipo de documento</Text>
      <View style={st.radioGroup}>
        {DOC_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[st.radioBtn, d.documentType === t.value && st.radioBtnActive]}
            onPress={() => {
              store.setDocumentData({ documentType: t.value, ocrConfirmed: false, ocrData: {} });
              setFrontDone(false); setBackDone(false); setShowOcr(false);
            }}
            accessibilityRole="radio"
            accessibilityLabel={t.label}
          >
            <View style={[st.radioCircle, d.documentType === t.value && st.radioCircleActive]} />
            <Text style={st.radioText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {d.documentType && (
        <>
          {/* Foto frontal */}
          <Text style={st.sectionTitle}>Foto frontal</Text>
          <DocumentCapture
            side="front"
            onCapture={handleFrontCapture}
            onError={setError}
          />

          {/* OCR */}
          {showOcr && !d.ocrConfirmed && (
            <OcrConfirmation
              ocrData={d.ocrData}
              onConfirm={() => { store.setDocumentData({ ocrConfirmed: true }); setShowOcr(false); }}
              onRetry={() => { setFrontDone(false); setShowOcr(false); store.setDocumentData({ ocrData: {}, ocrConfirmed: false }); }}
            />
          )}
          {frontDone && !showOcr && !d.ocrConfirmed && (
            // Sin OCR del servidor — confirmar manualmente
            <TouchableOpacity
              style={st.confirmManualBtn}
              onPress={() => store.setDocumentData({ ocrConfirmed: true })}
            >
              <Text style={st.confirmManualText}>✓ Confirmar foto frontal</Text>
            </TouchableOpacity>
          )}

          {/* Foto trasera */}
          {needsBack && d.ocrConfirmed && (
            <>
              <Text style={st.sectionTitle}>Foto trasera</Text>
              <DocumentCapture
                side="back"
                onCapture={handleBackCapture}
                onError={setError}
              />
            </>
          )}
        </>
      )}

      {!!error && (
        <View style={st.errorBox}>
          <Text style={st.errorText}>{error}</Text>
        </View>
      )}
    </KycStepLayout>
  );
}

const BRAND = '#00C8A0';
const st = StyleSheet.create({
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  radioGroup:       { gap: 8 },
  radioBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, padding: 12 },
  radioBtnActive:   { borderColor: BRAND, backgroundColor: '#f0fdf9' },
  radioCircle:      { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db' },
  radioCircleActive:{ borderColor: BRAND, backgroundColor: BRAND },
  radioText:        { fontSize: 14, color: '#374151', fontWeight: '600' },
  confirmManualBtn: { marginTop: 10, backgroundColor: BRAND, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmManualText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  errorBox:         { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  errorText:        { color: '#ef4444', fontSize: 13 },
});
