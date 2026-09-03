import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow } from '../../src/components/settings/SettingsUI';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { getToken, getApiBase } from '../../src/api';
import { toast } from '../../src/components/Toast';

const CATEGORIES = ['Sugerencia', 'Error / Bug', 'Problema de pagos', 'Problema de llamadas', 'Otro'];

export default function ComentariosScreen() {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Sugerencia');
  const [sending, setSending] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  const send = async () => {
    if (!text.trim()) { Alert.alert('Error', 'Escribe tu comentario antes de enviar'); return; }
    setSending(true);
    try {
      const token = await getToken();
      const base  = getApiBase();
      await fetch(`${base}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, message: text.trim() }),
      });
      setText('');
      // Comentario enviado
    } catch {
      toast.error('No se pudo enviar', 'Verifica tu conexión');
    }
    setSending(false);
  };

  return (
    <SettingsLayout title="Comentarios">
      <SettingsSection label="Categoría" />
      <View style={[st.catBox, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={st.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[st.catChip, category === cat && st.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[st.catTxt, category === cat && { color: Colors.accent }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SettingsSection label="Tu opinión" />
      <View style={[st.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <TextInput
          style={[st.input, { color: C.textPrimary, borderColor: C.borderLight }]}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={5}
          placeholder="Escribe tu comentario, sugerencia o reporte de error..."
          placeholderTextColor={C.textTertiary}
        />
        <TouchableOpacity style={st.sendBtn} onPress={send} disabled={sending}>
          {sending
            ? <ActivityIndicator color="#fff"/>
            : <Text style={st.sendTxt}>Enviar comentario</Text>}
        </TouchableOpacity>
      </View>

      <SettingsSection label="Contacto directo" />
      <SettingsCard>
        <SettingsRow label="support@egchat.gq" onPress={() => Linking.openURL('mailto:support@egchat.gq').catch(() => {})} />
        <SettingsDivider />
        <SettingsRow label="WhatsApp soporte" onPress={() => Linking.openURL('https://wa.me/240222123456').catch(() => {})} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const st = StyleSheet.create({
  catBox: { marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 4 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb' },
  catChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(7,193,96,0.08)' },
  catTxt: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  panel: { padding: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
  sendBtn: { marginTop: 12, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sendTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
