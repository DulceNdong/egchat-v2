import React from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SpinningLogo } from '../../src/components/SpinningLogo';
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
        <View style={styles.logoWrap}>
          <SpinningLogo size={90} glow={true} />
        </View>
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
        <SettingsRow label="Términos de servicio" onPress={() => Linking.openURL('https://egchat-v2.vercel.app/terms').catch(() => {})} />
        <SettingsDivider />
        <SettingsRow label="Política de privacidad" onPress={() => Linking.openURL('https://egchat-v2.vercel.app/privacy').catch(() => {})} />
        <SettingsDivider />
        <SettingsRow label="Licencias de código abierto" onPress={() => Alert.alert('Licencias', 'React Native (MIT), Expo (MIT), Supabase (Apache 2.0), TweetNaCl (Public Domain)')} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  logoWrap: { marginBottom: 14 },
  appName: { fontSize: 22, fontWeight: '700' },
  version: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 14, color: '#8e8e93' },
});
