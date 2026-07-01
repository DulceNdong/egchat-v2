import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';

export default function AcercaScreen() {
  const info = [
    { label: 'Versión', value: '2.5.5' },
    { label: 'Desarrollador', value: 'EGCHAT Team' },
    { label: 'País', value: 'Guinea Ecuatorial' },
    { label: 'Licencia', value: 'Propietaria' },
    { label: 'Backend', value: 'Neon + Render' },
  ];

  return (
    <SettingsLayout title="Acerca de EGCHAT">
      <View style={styles.hero}>
        <LinearGradient colors={['#07c160', '#00b4e6']} style={styles.logo}>
          <Text style={{ fontSize: 32 }}>💬</Text>
        </LinearGradient>
        <Text style={styles.appName}>EGCHAT</Text>
        <Text style={styles.version}>Versión 2.5.5</Text>
      </View>

      <SettingsCard>
        {info.map((r, i) => (
          <React.Fragment key={r.label}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={styles.infoValue}>{r.value}</Text>
            </View>
            {i < info.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

      <SettingsSection label="Legal" />
      <SettingsCard>
        <SettingsRow label="Términos de servicio" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsRow label="Política de privacidad" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsRow label="Licencias de código abierto" onPress={() => Alert.alert('Próximamente')} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  logo: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName: { fontSize: 22, fontWeight: '700' },
  version: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 14, color: '#8e8e93' },
});
