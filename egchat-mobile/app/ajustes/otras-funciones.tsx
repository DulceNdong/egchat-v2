import React from 'react';
import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { registerForPushNotifications } from '../../src/notifications';

export default function OtrasFuncionesScreen() {
  const activatePush = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'denied') {
      Linking.openSettings();
      return;
    }
    const token = await registerForPushNotifications();
    if (token) Alert.alert('✅', 'Notificaciones push activadas');
    else Alert.alert('Permiso denegado', 'Actívalas en ajustes del sistema.');
  };

  return (
    <SettingsLayout title="Otras funciones">
      <SettingsSection label="Herramientas" />
      <SettingsCard>
        <SettingsRow label="Escáner QR" onPress={() => router.push('/_qr-scanner' as any)} />
        <SettingsDivider />
        <SettingsRow label="Compartir ubicación" onPress={() => router.push('/map' as any)} />
        <SettingsDivider />
        <SettingsRow label="Activar notificaciones push" onPress={activatePush} />
        <SettingsDivider />
        <SettingsRow label="Idioma de la app" value="Español" onPress={() => Alert.alert('Próximamente', 'Más idiomas próximamente.')} />
      </SettingsCard>

      <SettingsSection label="IA y experimental" />
      <SettingsCard>
        <SettingsRow label="LIA-25 — Asistente IA" onPress={() => router.push('/(tabs)/lia' as any)} />
        <SettingsDivider />
        <SettingsRow label="Modo offline" value="Próximamente" />
      </SettingsCard>
    </SettingsLayout>
  );
}
