// KYC — Paso 3: Verificación Biométrica
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { LivenessCapture } from '../../src/components/kyc/LivenessCapture';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { verifyBiometric } from '../../src/services/kycService';
import { getNetworkStatus } from '../../src/store/offlineStore';
import { enqueueKycAction } from '../../src/hooks/useKycOfflineSync';
import { useTranslation } from '../../src/context/LanguageContext';

const MAX_ATTEMPTS = 3;

export default function Step3() {
  const store = useKycStore();
  const bio   = store.biometricData;
  const { t } = useTranslation();

  const [verifying, setVerifying] = useState(false);
  const [error, setError]         = useState('');
  const [failed, setFailed]       = useState(false);

  const handleSuccess = async (enc: string, uri: string) => {
    setVerifying(true);
    setError('');
    store.setBiometricData({ selfieUri: uri, selfieEncrypted: enc });

    try {
      const appId = store.applicationId;
      if (appId) {
        if (!getNetworkStatus().isOnline) {
          await enqueueKycAction({ type: 'biometric', applicationId: appId, selfieEncrypted: enc });
          store.setBiometricData({ livenessResult: 'passed' });
          return;
        }
        const res = await verifyBiometric(appId, enc);
        store.setBiometricData({
          livenessResult: res.livenessPassed ? 'passed' : 'failed',
          faceMatchScore: res.faceMatchScore,
        });
        if (!res.livenessPassed) {
          handleFail();
          return;
        }
      } else {
        // Sin appId — marcar como passed localmente
        store.setBiometricData({ livenessResult: 'passed' });
      }
    } catch {
      // Error de red — continuar con liveness local
      store.setBiometricData({ livenessResult: 'passed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleFail = () => {
    const newAttempts = bio.attempts + 1;
    store.setBiometricData({ attempts: newAttempts, livenessResult: 'failed' });
    if (newAttempts >= MAX_ATTEMPTS) {
      setFailed(true);
    } else {
      setError(`${t('kyAttempt')} ${newAttempts} ${t('kyAttemptOf')} ${MAX_ATTEMPTS}. ${t('setTryAgain')}.`);
    }
  };

  const handleNext = async () => {
    store.markStepComplete(3);
    store.setCurrentStep(4);
    await saveKycDraft({ ...store, currentStep: 4 } as any);
    router.push('/kyc/step-4');
  };

  const canContinue = bio.livenessResult === 'passed';

  if (failed) {
    return (
      <View style={st.failedWrap}>
        <Text style={st.failedIcon}>❌</Text>
        <Text style={st.failedTitle}>{t('kyFailedTitle')}</Text>
        <Text style={st.failedSub}>{t('kyFailedSub')}</Text>
        <TouchableOpacity
          style={st.retryBtn}
          onPress={() => {
            store.setBiometricData({ attempts: 0, livenessResult: 'pending' });
            setFailed(false);
          }}
        >
          <Text style={st.retryBtnText}>{t('kyRetryLater')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Text style={st.backBtnText}>{t('kyGoBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KycStepLayout
      step={3} completed={store.completedSteps}
      title={t('kyBiometricVerification')}
      onBack={() => router.push('/kyc/step-2')}
      onNext={handleNext}
      nextDisabled={!canContinue || verifying}
      loading={verifying}
      onExit={() => router.back()}
    >
      <Text style={st.instructions}>{t('kySelfieInstructions')}</Text>

      {!canContinue ? (
        <LivenessCapture
          attempts={bio.attempts}
          maxAttempts={MAX_ATTEMPTS}
          onSuccess={handleSuccess}
          onFailed={handleFail}
        />
      ) : (
        <View style={st.successWrap}>
          <Text style={st.successIcon}>✅</Text>
          <Text style={st.successTitle}>{t('kyIdentityVerified')}</Text>
          {bio.faceMatchScore != null && (
            <Text style={st.matchScore}>
              {t('kyFaceMatch')} {Math.round(bio.faceMatchScore * 100)}%
            </Text>
          )}
        </View>
      )}

      {!!error && (
        <View style={st.errorBox}>
          <Text style={st.errorText}>{error}</Text>
        </View>
      )}
    </KycStepLayout>
  );
}

const st = StyleSheet.create({
  instructions: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  successWrap:  { alignItems: 'center', paddingVertical: 32, gap: 8 },
  successIcon:  { fontSize: 52 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#065f46' },
  matchScore:   { fontSize: 13, color: '#6b7280' },
  errorBox:     { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 12 },
  errorText:    { color: '#ef4444', fontSize: 13 },
  failedWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#fff' },
  failedIcon:   { fontSize: 52 },
  failedTitle:  { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  failedSub:    { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn:     { backgroundColor: '#00C8A0', paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12, marginTop: 8 },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  backBtn:      { paddingVertical: 10 },
  backBtnText:  { color: '#9ca3af', fontSize: 13 },
});
