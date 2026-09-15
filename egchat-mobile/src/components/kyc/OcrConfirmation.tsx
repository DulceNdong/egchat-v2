// OcrConfirmation — muestra datos OCR extraídos para confirmación
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  ocrData: Record<string, string>;
  onConfirm: () => void;
  onRetry: () => void;
}

const LABELS: Record<string, string> = {
  full_name:      'Nombre',
  document_number:'Número',
  date_of_birth:  'Fecha nac.',
  expiry_date:    'Vence',
  nationality:    'Nacionalidad',
};

export function OcrConfirmation({ ocrData, onConfirm, onRetry }: Props) {
  const entries = Object.entries(ocrData).filter(([, v]) => !!v);
  if (!entries.length) return null;

  return (
    <View style={st.wrap}>
      <Text style={st.title}>✅ Datos detectados</Text>
      <Text style={st.sub}>Revisa que los datos sean correctos</Text>
      {entries.map(([k, v]) => (
        <View key={k} style={st.row}>
          <Text style={st.key}>{LABELS[k] ?? k}</Text>
          <Text style={st.val}>{v}</Text>
        </View>
      ))}
      <View style={st.btns}>
        <TouchableOpacity style={st.btnConfirm} onPress={onConfirm} accessibilityLabel="Confirmar datos OCR">
          <Text style={st.btnConfirmText}>✓ Sí, son correctos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.btnRetry} onPress={onRetry} accessibilityLabel="Repetir captura">
          <Text style={st.btnRetryText}>✗ Repetir captura</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:         { backgroundColor: '#f0fdf9', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#6ee7b7', marginTop: 16 },
  title:        { fontSize: 15, fontWeight: '800', color: '#065f46', marginBottom: 4 },
  sub:          { fontSize: 12, color: '#065f46', marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#d1fae5' },
  key:          { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  val:          { fontSize: 13, color: '#111827', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  btns:         { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnConfirm:   { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#00C8A0', alignItems: 'center' },
  btnConfirmText:{ fontSize: 13, fontWeight: '800', color: '#fff' },
  btnRetry:     { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center' },
  btnRetryText: { fontSize: 13, fontWeight: '700', color: '#374151' },
});
