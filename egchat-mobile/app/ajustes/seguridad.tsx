import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { Colors } from '../../src/theme';

const RECENT_ACTIVITY = [
  { id: '1', type: 'login', action: 'Login', time: 'Hace 1 h' },
  { id: '2', type: 'security', action: 'PIN Verificado', time: 'Hace 3 h' },
  { id: '3', type: 'transaction', action: 'Transferencia', time: 'Ayer' },
];

export default function SeguridadCuentaScreen() {
  return (
    <SettingsLayout title="Seguridad de la cuenta">
      <SettingsSection label="Contraseña y acceso" />
      <SettingsCard>
        <SettingsRow label="Cambiar contraseña" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsRow label="Autenticación 2 factores" value="Desactivado" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsRow label="PIN de pagos" onPress={() => router.push('/ajustes/security' as any)} />
        <SettingsDivider />
        <SettingsRow label="Límites diarios" onPress={() => router.push('/ajustes/security' as any)} />
      </SettingsCard>

      <SettingsSection label="Sesiones" />
      <SettingsCard>
        <SettingsRow label="Sesiones activas" value="Este dispositivo" onPress={() => Alert.alert('Sesiones', 'Solo 1 sesión activa en este dispositivo.')} />
      </SettingsCard>

      <SettingsSection label="Actividad reciente" />
      <SettingsCard>
        {RECENT_ACTIVITY.map((log, i) => (
          <React.Fragment key={log.id}>
            <View style={styles.actRow}>
              <View style={[styles.actIcon, {
                backgroundColor: log.type === 'login' ? '#d1fae5' : log.type === 'security' ? '#fee2e2' : '#eff6ff',
              }]}>
                <Text>{log.type === 'login' ? '🔑' : log.type === 'security' ? '🔐' : '💸'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle}>{log.action}</Text>
                <Text style={styles.actTime}>{log.time}</Text>
              </View>
            </View>
            {i < RECENT_ACTIVITY.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
        <SettingsDivider />
        <SettingsRow label="Ver historial completo" onPress={() => router.push('/ajustes/actividad' as any)} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  actIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 14, fontWeight: '500' },
  actTime: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
});
