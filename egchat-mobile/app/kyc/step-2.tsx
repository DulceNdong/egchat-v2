// KYC — Paso 2: Documento de Identidad
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { DocumentCapture } from '../../src/components/kyc/DocumentCapture';
import { OcrConfirmation } from '../../src/components/kyc/OcrConfirmation';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { uploadDocumentImage, getActiveKycApplication, createKycApplication } from '../../src/services/kycService';
import { getNetworkStatus } from '../../src/store/offlineStore';
import { enqueueKycAction } from '../../src/hooks/useKycOfflineSync';
import type { DocumentType } from '../../src/store/kycStore';

const DOC_TYPES: { value: DocumentType; label: string; hasBack: boolean }[] = [
  { value: 'DNI',              label: 'DNI',                    hasBack: true  },
  { value: 'PASSPORT',         label: 'Pasaporte',              hasBack: false },
  { value: 'RESIDENCE_PERMIT', label: 'Permiso de residencia',  hasBack: true  },
];

export default function Step2() {
  const store = useKycStore();
  const d = store.documentData;

  const [uploading, setUploading]     = useState(false);
  const [frontDone, setFrontDone]     = useState(!!d.frontImageUri);
  const [backDone, setBackDone]       = useState(!!d.backImageUri);
  // frontEncFailed: la imagen se capturó pero el cifrado falló — se puede confirmar igual
  const [frontEncFailed, setFrontEncFailed] = useState(false);
  const [showOcr, setShowOcr]         = useState(false);
  const [error, setError]             = useState('');

  const selectedDoc = DOC_TYPES.find(t => t.value === d.documentType);
  const needsBack   = selectedDoc?.hasBack ?? false;
  // canContinue: foto frontal lista + (trasera si aplica) + ocrConfirmed
  // Si no hay applicationId no hay OCR del servidor, ocrConfirmed se gestiona manualmente
  const canContinue = frontDone && (!needsBack || backDone) && d.ocrConfirmed;

  const handleFrontCapture = async (enc: string, uri: string) => {
    // Limpiar errores previos cada vez que llega una nueva captura
    setError('');
    setFrontEncFailed(false);

    // Detectar si DocumentCapture nos pasó la URI en crudo (cifrado falló)
    const isRawFallback = enc.startsWith('raw:');

    if (isRawFallback) {
      // El cifrado falló pero la imagen fue seleccionada — guardar la URI para
      // mostrar el preview y permitir confirmación manual sin bloquear al usuario.
      store.setDocumentData({ frontImageUri: uri, frontImageEncrypted: null });
      setFrontDone(true);
      setFrontEncFailed(true);
      // No subir al servidor si el cifrado no funcionó
      return;
    }

    setUploading(true);
    try {
      store.setDocumentData({ frontImageUri: uri, frontImageEncrypted: enc });
      const appId = store.applicationId;
      if (appId) {
        if (getNetworkStatus().isOnline) {
          const res = await uploadDocumentImage(appId, 'front', enc, d.documentType);
          if (res.ocrData && Object.keys(res.ocrData).length > 0) {
            store.setDocumentData({ ocrData: res.ocrData });
            setShowOcr(true);
          }
        } else {
          await enqueueKycAction({ type: 'document', applicationId: appId, side: 'front', enc, docType: d.documentType });
        }
      }
      setFrontDone(true);
    } catch {
      setError('Error al subir la foto frontal. Inténtalo de nuevo.');
      // Aun si falla el upload, marcamos frontDone para no bloquear al usuario
      setFrontDone(true);
    } finally {
      setUploading(false);
    }
  };

  const handleBackCapture = async (enc: string, uri: string) => {
    setError('');
    const isRawFallback = enc.startsWith('raw:');

    if (isRawFallback) {
      store.setDocumentData({ backImageUri: uri, backImageEncrypted: null });
      setBackDone(true);
      return;
    }

    setUploading(true);
    try {
      store.setDocumentData({ backImageUri: uri, backImageEncrypted: enc });
      const appId = store.applicationId;
      if (appId) {
        if (getNetworkStatus().isOnline) {
          await uploadDocumentImage(appId, 'back', enc, d.documentType);
        } else {
          await enqueueKycAction({ type: 'document', applicationId: appId, side: 'back', enc, docType: d.documentType });
        }
      }
      setBackDone(true);
    } catch {
      setError('Error al subir la foto trasera. Inténtalo de nuevo.');
      setBackDone(true);
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
              setFrontEncFailed(false); setError('');
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
              onRetry={() => { setFrontDone(false); setShowOcr(false); setFrontEncFailed(false); store.setDocumentData({ ocrData: {}, ocrConfirmed: false }); }}
            />
          )}
          {frontDone && !showOcr && !d.ocrConfirmed && (
            // Sin OCR del servidor — confirmar manualmente para poder continuar
            <View>
              {frontEncFailed && (
                <View style={st.warnBox}>
                  <Text style={st.warnText}>
                    ⚠️ Hubo un problema al procesar la imagen. Puedes confirmarla de todos modos o volver a capturarla.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={st.confirmManualBtn}
                onPress={() => { store.setDocumentData({ ocrConfirmed: true }); setError(''); }}
              >
                <Text style={st.confirmManualText}>✓ Confirmar foto frontal</Text>
              </TouchableOpacity>
            </View>
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
  warnBox:          { backgroundColor: '#fffbeb', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#fde68a' },
  warnText:         { color: '#92400e', fontSize: 13, lineHeight: 18 },
  errorBox:         { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  errorText:        { color: '#ef4444', fontSize: 13 },
});
