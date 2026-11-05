// KycResultCard — muestra el resultado de la verificación KYC
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';

type ResultType = 'approved' | 'manual_review' | 'rejected_fixable' | 'rejected_final';

interface Props {
  result: ResultType;
  rejectReason?: string;
  onRetry?: () => void;
}

const CONFIG: Record<ResultType, { icon: string; title: string; color: string; bg: string }> = {
  approved:         { icon: '✅', title: '¡Verificación completada!',   color: '#065f46', bg: '#f0fdf4' },
  manual_review:    { icon: '🕐', title: 'En revisión manual',           color: '#92400e', bg: '#fffbeb' },
  rejected_fixable: { icon: '⚠️',  title: 'Verificación no aprobada',    color: '#991b1b', bg: '#fef2f2' },
  rejected_final:   { icon: '❌', title: 'Verificación rechazada',       color: '#374151', bg: '#f9fafb' },
};

export function KycResultCard({ result, rejectReason, onRetry }: Props) {
  const cfg = CONFIG[result];

  return (
    <View style={[st.card, { backgroundColor: cfg.bg }]}>
      <Text style={st.icon}>{cfg.icon}</Text>
      <Text style={[st.title, { color: cfg.color }]}>{cfg.title}</Text>

      {result === 'approved' && (
        <>
          <Text style={st.body}>Ya puedes usar tu monedero EGPAY.</Text>
          <TouchableOpacity style={st.btnPrimary} onPress={() => router.replace('/(tabs)/monedero' as any)}>
            <Text style={st.btnPrimaryText}>Ir a mi monedero →</Text>
          </TouchableOpacity>
        </>
      )}

      {result === 'manual_review' && (
        <>
          <Text style={st.body}>Tu verificación está siendo revisada por BANGE.</Text>
          <Text style={st.sub}>Tiempo estimado: 24–48 horas</Text>
          <Text style={st.sub}>Te avisaremos por notificación push cuando haya una decisión.</Text>
          <TouchableOpacity style={st.btnSecondary} onPress={() => router.replace('/(tabs)/mensajeria' as any)}>
            <Text style={st.btnSecondaryText}>Volver al inicio</Text>
          </TouchableOpacity>
        </>
      )}

      {result === 'rejected_fixable' && (
        <>
          {!!rejectReason && (
            <View style={st.reasonBox}>
              <Text style={st.reasonLabel}>Motivo:</Text>
              <Text style={st.reasonText}>"{rejectReason}"</Text>
            </View>
          )}
          <TouchableOpacity style={st.btnPrimary} onPress={onRetry}>
            <Text style={st.btnPrimaryText}>Corregir y reenviar</Text>
          </TouchableOpacity>
        </>
      )}

      {result === 'rejected_final' && (
        <>
          <Text style={st.body}>No podemos completar tu verificación en este momento.</Text>
          <Text style={st.sub}>Contacta con soporte para más información.</Text>
          <TouchableOpacity
            style={st.btnSecondary}
            onPress={() => Linking.openURL('https://egchat-v2.vercel.app/support')}
          >
            <Text style={st.btnSecondaryText}>Contactar soporte</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card:           { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, marginHorizontal: 20 },
  icon:           { fontSize: 52, marginBottom: 4 },
  title:          { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body:           { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 20 },
  sub:            { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  reasonBox:      { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 12, width: '100%' },
  reasonLabel:    { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  reasonText:     { fontSize: 14, color: '#374151', marginTop: 4 },
  btnPrimary:     { backgroundColor: '#00C8A0', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 6 },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  btnSecondary:   { paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', marginTop: 6 },
  btnSecondaryText:{ fontSize: 14, fontWeight: '700', color: '#374151' },
});
