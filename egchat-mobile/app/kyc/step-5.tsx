// KYC — Paso 5: Declaración y Consentimiento
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { useKycStore } from '../../src/store/kycStore';
import { submitKycApplication } from '../../src/services/kycService';
import { clearKycDraft } from '../../src/services/kycStorage';

// ── Sección colapsable de resumen ─────────────────────────────────
function SummarySection({ title, items }: { title: string; items: [string, string][] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={st.summarySection}>
      <TouchableOpacity style={st.summaryHeader} onPress={() => setOpen(o => !o)}>
        <Text style={st.summaryTitle}>{open ? '▾' : '▸'} {title}</Text>
      </TouchableOpacity>
      {open && items.map(([k, v]) => v ? (
        <View key={k} style={st.summaryRow}>
          <Text style={st.summaryKey}>{k}</Text>
          <Text style={st.summaryVal}>{v}</Text>
        </View>
      ) : null)}
    </View>
  );
}

function ConsentCheck({ label, checked, onToggle, link, linkLabel }: {
  label: string; checked: boolean; onToggle: () => void;
  link?: string; linkLabel?: string;
}) {
  return (
    <TouchableOpacity style={st.consentRow} onPress={onToggle} accessibilityRole="checkbox">
      <View style={[st.checkbox, checked && st.checkboxActive]}>
        {checked && <Text style={st.checkmark}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.consentText}>{label}</Text>
        {link && (
          <Text style={st.consentLink} onPress={() => Linking.openURL(link)}>{linkLabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Step5() {
  const store = useKycStore();
  const { personalData: p, documentData: doc, financialData: fin, consentData: c } = store;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const allConsented = c.declareTruth && c.authorizeBank && c.acceptTerms;

  const handleSubmit = async () => {
    if (!allConsented) return;
    setLoading(true);
    setError('');
    try {
      const appId = store.applicationId;
      if (appId) await submitKycApplication(appId);
      store.setStatus('submitted');
      await clearKycDraft();
      router.replace('/kyc/processing');
    } catch {
      setError('Error al enviar la verificación. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KycStepLayout
      step={5} completed={store.completedSteps}
      title="Declaración y Consentimiento"
      onBack={() => router.push('/kyc/step-4')}
      onNext={handleSubmit}
      nextLabel="🔒 Enviar para verificación"
      nextDisabled={!allConsented || loading}
      loading={loading}
      onExit={() => router.back()}
    >
      {/* Resumen colapsable */}
      <Text style={st.sectionTitle}>Resumen de datos</Text>
      <SummarySection title="Datos Personales" items={[
        ['Nombre',         p.fullName],
        ['Fecha nac.',     p.dateOfBirth],
        ['Lugar nac.',     p.placeOfBirth],
        ['Nacionalidad',   p.nationality],
        ['Sexo',           p.sex === 'M' ? 'Masculino' : p.sex === 'F' ? 'Femenino' : ''],
        ['Estado civil',   p.maritalStatus],
        ['Ciudad',         p.city],
        ['Provincia',      p.province],
        ['Teléfono',       p.phone],
        ['Email',          p.email],
      ]} />
      <SummarySection title="Documento" items={[
        ['Tipo',           doc.documentType ?? ''],
        ['OCR confirmado', doc.ocrConfirmed ? 'Sí' : 'No'],
      ]} />
      <SummarySection title="Información Financiera" items={[
        ['Profesión',      fin.profession],
        ['Empleador',      fin.employer],
        ['Ingresos',       fin.monthlyIncomeRange],
        ['Origen fondos',  fin.sourceOfFunds.join(', ')],
      ]} />

      <View style={st.divider} />

      {/* Consentimientos */}
      <Text style={st.sectionTitle}>Consentimientos</Text>
      <ConsentCheck
        label="Declaro que toda la información proporcionada es veraz y completa."
        checked={c.declareTruth}
        onToggle={() => store.setConsentData({ declareTruth: !c.declareTruth })}
      />
      <ConsentCheck
        label="Autorizo a EGCHAT y a BANGE a verificar mi información personal."
        checked={c.authorizeBank}
        onToggle={() => store.setConsentData({ authorizeBank: !c.authorizeBank })}
      />
      <ConsentCheck
        label="Acepto los Términos de servicio y la Política de privacidad."
        checked={c.acceptTerms}
        onToggle={() => store.setConsentData({ acceptTerms: !c.acceptTerms })}
        link="https://egchat-v2.vercel.app/terms"
        linkLabel="Ver términos →"
      />

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
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 8, marginBottom: 8 },
  summarySection:   { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 8, overflow: 'hidden' },
  summaryHeader:    { padding: 12, backgroundColor: '#f9fafb' },
  summaryTitle:     { fontSize: 13, fontWeight: '700', color: '#374151' },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  summaryKey:       { fontSize: 12, color: '#6b7280' },
  summaryVal:       { fontSize: 12, color: '#111827', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider:          { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  consentRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkboxActive:   { backgroundColor: BRAND, borderColor: BRAND },
  checkmark:        { color: '#fff', fontSize: 13, fontWeight: '900' },
  consentText:      { fontSize: 13, color: '#374151', lineHeight: 19 },
  consentLink:      { fontSize: 12, color: BRAND, marginTop: 2, fontWeight: '600' },
  errorBox:         { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  errorText:        { color: '#ef4444', fontSize: 13 },
});
