// KYC — Pantalla de resultado
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KycResultCard } from '../../src/components/kyc/KycResultCard';
import { useKycStore } from '../../src/store/kycStore';

type ResultType = 'approved' | 'manual_review' | 'rejected_fixable' | 'rejected_final';

export default function ResultScreen() {
  const { type } = useLocalSearchParams<{ type: ResultType }>();
  const store    = useKycStore();
  const resultType: ResultType = (type as ResultType) ?? 'manual_review';

  const handleRetry = () => {
    // Retomar desde el paso con el error
    router.replace('/kyc/step-2');
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView contentContainerStyle={st.content}>
        <KycResultCard
          result={resultType}
          rejectReason={store.rejectReason ?? undefined}
          onRetry={handleRetry}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { flex: 1, justifyContent: 'center', paddingVertical: 40 },
});
