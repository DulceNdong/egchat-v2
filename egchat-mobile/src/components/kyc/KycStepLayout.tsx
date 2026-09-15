import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KycProgressBar } from './KycProgressBar';

interface Props {
  step: number;
  completed: number[];
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onExit?: () => void;
}

export function KycStepLayout({
  step, completed, title, children,
  onBack, onNext, nextLabel = 'Continuar →',
  nextDisabled = false, loading = false, onExit,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <KycProgressBar current={step} completed={completed} onExit={onExit} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.title} accessibilityRole="header">{title}</Text>
        {children}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer con botones */}
      <View style={[st.footer, { paddingBottom: insets.bottom + 12 }]}>
        {onBack && (
          <TouchableOpacity
            style={st.btnBack}
            onPress={onBack}
            accessibilityLabel="Volver al paso anterior"
          >
            <Text style={st.btnBackText}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[st.btnNext, nextDisabled && st.btnDisabled, !onBack && { flex: 1 }]}
          onPress={onNext}
          disabled={nextDisabled || loading}
          accessibilityLabel={nextLabel}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={st.btnNextText}>{nextLabel}</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#00C8A0';
const st = StyleSheet.create({
  scroll:       { paddingHorizontal: 20, paddingTop: 24 },
  title:        { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20 },
  footer:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
  btnBack:      { flex: 0.4, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  btnBackText:  { fontSize: 14, fontWeight: '700', color: '#374151' },
  btnNext:      { flex: 0.6, paddingVertical: 14, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  btnNextText:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled:  { backgroundColor: '#d1d5db' },
});
