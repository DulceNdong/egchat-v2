import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

export default function ComentariosScreen() {
  const [text, setText] = useState('');
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  return (
    <SettingsLayout title="Comentarios">
      <SettingsSection label="Envíanos tu opinión" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <TextInput
          style={[styles.input, { color: C.textPrimary, borderColor: C.borderLight }]}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={5}
          placeholder="Escribe tu comentario, sugerencia o reporte de error..."
          placeholderTextColor={C.textTertiary}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => { setText(''); Alert.alert('✓', 'Comentario enviado — ¡gracias!'); }}
        >
          <Text style={styles.sendText}>Enviar comentario</Text>
        </TouchableOpacity>
      </View>

      <SettingsSection label="Contacto directo" />
      <SettingsCard>
        <SettingsRow label="✉️  support@egchat.com" onPress={() => Linking.openURL('mailto:support@egchat.com')} />
        <SettingsDivider />
        <SettingsRow label="📞  +240 222 123 456" onPress={() => Linking.openURL('tel:+240222123456')} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
