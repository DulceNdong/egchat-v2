import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { Colors } from '../../src/theme';

export default function AlmacenamientoScreen() {
  const [used] = useState(() => Math.round(Math.random() * 200 + 50));
  const [autoWifi, setAutoWifi] = useState(true);
  const [autoData, setAutoData] = useState(false);

  useEffect(() => {
    getCfgBool(CFG.autoDlWifi, true).then(setAutoWifi);
    getCfgBool(CFG.autoDlData, false).then(setAutoData);
  }, []);

  const breakdown = useMemo(() => [
    { icon: '🖼️', label: 'Fotos', size: Math.round(used * 0.45) },
    { icon: '🎥', label: 'Videos', size: Math.round(used * 0.30) },
    { icon: '🎵', label: 'Audio', size: Math.round(used * 0.12) },
    { icon: '📄', label: 'Documentos', size: Math.round(used * 0.13) },
  ], [used]);

  const clearCache = () => {
    Alert.alert('Liberar espacio', '¿Limpiar caché de contactos y chats?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['egchat_contacts_cache', 'egchat_chats_cache']);
          Alert.alert('✓', 'Caché limpiada');
        },
      },
    ]);
  };

  return (
    <SettingsLayout title="Almacenamiento">
      <View style={styles.usagePanel}>
        <Text style={styles.usageTitle}>Uso de almacenamiento</Text>
        <Text style={styles.usageValue}>{used} MB</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(used / 5, 100)}%` }]} />
        </View>
      </View>

      <SettingsSection label="Por tipo" />
      <SettingsCard>
        {breakdown.map((r, i) => (
          <React.Fragment key={r.label}>
            <View style={styles.typeRow}>
              <Text style={{ fontSize: 22 }}>{r.icon}</Text>
              <Text style={{ flex: 1, fontSize: 15 }}>{r.label}</Text>
              <Text style={{ color: '#8e8e93' }}>{r.size} MB</Text>
            </View>
            {i < breakdown.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

      <SettingsSection label="Descarga automática" />
      <SettingsCard>
        <SettingsToggleRow label="Solo con Wi-Fi" value={autoWifi} onValueChange={v => { setAutoWifi(v); setCfgBool(CFG.autoDlWifi, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Con datos móviles" value={autoData} onValueChange={v => { setAutoData(v); setCfgBool(CFG.autoDlData, v); }} />
      </SettingsCard>

      <SettingsSection label="Gestión" />
      <SettingsCard>
        <SettingsRow label="Liberar espacio" danger onPress={clearCache} />
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  usagePanel: { backgroundColor: '#fff', padding: 20, marginTop: 12 },
  usageTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  usageValue: { fontSize: 28, fontWeight: '700', color: Colors.accent },
  barBg: { marginTop: 12, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
});
