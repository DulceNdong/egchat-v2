import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsToggleRow, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { getSoundSettings, saveSoundSettings } from '../../src/hooks/useSounds';
import { registerForPushNotifications } from '../../src/notifications';
import { Colors } from '../../src/theme';

export default function NotificacionesScreen() {
  const [msgs, setMsgs] = useState(true);
  const [groups, setGroups] = useState(true);
  const [calls, setCalls] = useState(true);
  const [stories, setStories] = useState(false);
  const [preview, setPreview] = useState(true);
  const [pushGranted, setPushGranted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    getCfgBool(CFG.notifMessages, true).then(setMsgs);
    getCfgBool(CFG.notifGroups, true).then(setGroups);
    getCfgBool(CFG.notifCalls, true).then(setCalls);
    getCfgBool(CFG.notifStories, false).then(setStories);
    getCfgBool(CFG.notifPreview, true).then(setPreview);
    Notifications.getPermissionsAsync().then(({ status }) => setPushGranted(status === 'granted'));
    getSoundSettings().then(s => { setVolume(s.volume); setVibration(s.vibrationEnabled); });
  }, []);

  const activatePush = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'denied') {
      Alert.alert('Bloqueadas', 'Actívalas en Ajustes del sistema.', [
        { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    const token = await registerForPushNotifications();
    const next = await Notifications.getPermissionsAsync();
    setPushGranted(next.status === 'granted');
    if (token) Alert.alert('✅', 'Notificaciones push activadas');
  }, []);

  const pushStatus = pushGranted ? '✅ Activadas' : '⏳ Sin configurar';

  return (
    <SettingsLayout title="Notificaciones">
      <SettingsSection label="Permiso del sistema" />
      <SettingsCard>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600' }}>Notificaciones push</Text>
            <Text style={{ fontSize: 12, color: pushGranted ? Colors.accent : '#8e8e93', marginTop: 2 }}>{pushStatus}</Text>
          </View>
          {!pushGranted && (
            <TouchableOpacity onPress={activatePush} style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Activar</Text>
            </TouchableOpacity>
          )}
        </View>
      </SettingsCard>

      <SettingsSection label="Mensajes y grupos" />
      <SettingsCard>
        <SettingsToggleRow label="Mensajes privados" value={msgs} onValueChange={v => { setMsgs(v); setCfgBool(CFG.notifMessages, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Grupos" value={groups} onValueChange={v => { setGroups(v); setCfgBool(CFG.notifGroups, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Vista previa del mensaje" value={preview} onValueChange={v => { setPreview(v); setCfgBool(CFG.notifPreview, v); }} />
      </SettingsCard>

      <SettingsSection label="Llamadas y estados" />
      <SettingsCard>
        <SettingsToggleRow label="Llamadas entrantes" value={calls} onValueChange={v => { setCalls(v); setCfgBool(CFG.notifCalls, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Historias / Estados" value={stories} onValueChange={v => { setStories(v); setCfgBool(CFG.notifStories, v); }} />
      </SettingsCard>

      <SettingsSection label="Sonidos rápidos" />
      <SettingsCard>
        <SettingsRow label="Volumen" value={`${Math.round(volume * 100)}%`} onPress={() => router.push('/ajustes/sonidos' as any)} />
        <SettingsDivider />
        <SettingsToggleRow
          label="Vibración"
          value={vibration}
          onValueChange={v => { setVibration(v); saveSoundSettings({ vibrationEnabled: v }); }}
        />
      </SettingsCard>
    </SettingsLayout>
  );
}
