// KYC — Paso 5: Declaración y Consentimiento
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { useKycStore } from '../../src/store/kycStore';
import { screenKycApplication, submitKycApplication } from '../../src/services/kycService';
import { clearKycDraft } from '../../src/services/kycStorage';
import { getNetworkStatus } from '../../src/store/offlineStore';
import { enqueueKycAction } from '../../src/hooks/useKycOfflineSync';

// ── Sección colapsable de resumen ─────────────────────────────────
function SummarySection({ title, items }: { title: string; items: [string, string][] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={st.summarySection}>
      <TouchableOpacity style={st.summaryHeader} onPress={() => setOpen(o => !o)}>
        <View style={st.summaryHeaderRow}>
          <Text style={st.summaryTitle}>{title}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
        </View>
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
      {/* Icono moderno sin fondo de color cuando está inactivo */}
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={checked ? '#00C8A0' : '#d1d5db'}
        style={st.consentIcon}
      />
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

      // Sin applicationId no hay sesión KYC en el servidor — no se puede enviar
      if (!appId) {
        setError('No se encontró la solicitud KYC. Vuelve al paso 1 e inicia de nuevo.');
        return;
      }

      // applicationId local (creado offline) — no existe en el servidor todavía
      if (appId.startsWith('local_')) {
        setError('Tu solicitud fue creada sin conexión y aún no se ha sincronizado. Conéctate a internet y vuelve al Paso 1 para sincronizarla antes de enviar.');
        return;
      }

      if (!getNetworkStatus().isOnline) {
        await enqueueKycAction({ type: 'screening', applicationId: appId, fullName: p.fullName, nationality: p.nationality });
        await enqueueKycAction({ type: 'submit', applicationId: appId });
        store.setStatus('submitted');
        await clearKycDraft();
        router.replace('/kyc/result?type=manual_review');
        return;
      }

      // Screening AML/PEP — si falla no bloqueamos el envío, solo lo logueamos
      try {
        await screenKycApplication(appId, {
          fullName: p.fullName,
          nationality: p.nationality,
        });
      } catch (screenErr) {
        console.warn('[Step5] screenKycApplication falló, continuando con submit:', screenErr);
      }

      const result = await submitKycApplication(appId);
      store.setStatus(result.status as any);
      await clearKycDraft();

      if (result.decision === 'AUTO_APPROVED') {
        router.replace('/kyc/result?type=approved');
        return;
      }

      if (result.decision === 'REJECTED') {
        store.setRejectReason((result.reasons || []).join(', ') || 'Riesgo KYC elevado', true);
        router.replace('/kyc/result?type=rejected_final');
        return;
      }

      router.replace('/kyc/processing');
    } catch (e: any) {
      console.error('[Step5] handleSubmit error:', e?.message ?? e);
      const isNetwork = e?.message?.includes('Network') || e?.message?.includes('fetch') || e?.message?.includes('network');
      setError(
        isNetwork
          ? 'Sin conexión. Verifica tu internet e inténtalo de nuevo.'
          : `Error al enviar: ${e?.message ?? 'inténtalo de nuevo.'}`,
      );
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
          <Ionicons name="alert-circle-outline" size={16} color="#ef4444" style={{ marginTop: 1 }} />
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
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle:     { fontSize: 13, fontWeight: '700', color: '#374151' },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  summaryKey:       { fontSize: 12, color: '#6b7280' },
  summaryVal:       { fontSize: 12, color: '#111827', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider:          { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  consentRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  consentIcon:      { marginTop: 1, flexShrink: 0 },
  consentText:      { fontSize: 13, color: '#374151', lineHeight: 19 },
  consentLink:      { fontSize: 12, color: BRAND, marginTop: 2, fontWeight: '600' },
  errorBox:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  errorText:        { color: '#ef4444', fontSize: 13, flex: 1, lineHeight: 18 },
});
