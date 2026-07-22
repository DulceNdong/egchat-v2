import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { Colors } from '../../src/theme';

// Estima el tamaño de los datos de AsyncStorage en MB
async function estimateAsyncStorageMB(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (!keys.length) return 0;
    const pairs = await AsyncStorage.multiGet(keys);
    const totalBytes = pairs.reduce((acc, [, v]) => acc + (v?.length || 0) * 2, 0);
    return parseFloat((totalBytes / (1024 * 1024)).toFixed(1));
  } catch { return 0; }
}

// Estima el tamaño del directorio de caché de la app
async function estimateCacheMB(): Promise<number> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return 0;
    const info = await FileSystem.getInfoAsync(cacheDir);
    const bytes = (info as any).size ?? 0;
    return parseFloat((bytes / (1024 * 1024)).toFixed(1));
  } catch { return 0; }
}

export default function AlmacenamientoScreen() {
  const [used, setUsed] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoWifi, setAutoWifi] = useState(true);
  const [autoData, setAutoData] = useState(false);

  useEffect(() => {
    getCfgBool(CFG.autoDlWifi, true).then(setAutoWifi);
    getCfgBool(CFG.autoDlData, false).then(setAutoData);

    // Calcular uso real de almacenamiento
    const calcStorage = async () => {
      const [asyncMB, cacheMB] = await Promise.all([
        estimateAsyncStorageMB(),
        estimateCacheMB(),
      ]);
      setCacheSize(cacheMB);
      setUsed(asyncMB + cacheMB);
      setLoading(false);
    };
    calcStorage();
  }, []);

  const breakdown = useMemo(() => {
    // Distribución estimada basada en el uso real
    const base = used > 0 ? used : 10;
    return [
      { icon: '🖼️', label: 'Fotos y media', size: parseFloat((base * 0.45).toFixed(1)) },
      { icon: '🎥', label: 'Videos', size: parseFloat((base * 0.30).toFixed(1)) },
      { icon: '🎵', label: 'Audio', size: parseFloat((base * 0.12).toFixed(1)) },
      { icon: '📄', label: 'Documentos', size: parseFloat((base * 0.13).toFixed(1)) },
    ];
  }, [used]);

  const clearCache = () => {
    Alert.alert('Liberar espacio', `¿Limpiar caché de la app (${cacheSize.toFixed(1)} MB)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          // Limpiar caché de mensajes y chats de AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          const toRemove = keys.filter(k =>
            k.startsWith('chat_messages_') ||
            k.startsWith('chat_list') ||
            k.startsWith('egchat_local_stories')
          );
          await AsyncStorage.multiRemove(toRemove);

          // Re-calcular
          const [asyncMB, cacheMB] = await Promise.all([
            estimateAsyncStorageMB(),
            estimateCacheMB(),
          ]);
          setCacheSize(cacheMB);
          setUsed(asyncMB + cacheMB);
          Alert.alert('✓', `Caché limpiada. ${toRemove.length} elementos eliminados.`);
        },
      },
    ]);
  };

  // Barra de progreso: max ~500 MB estimado para un móvil medio
  const MAX_MB = 500;
  const pct = Math.min((used / MAX_MB) * 100, 100);

  return (
    <SettingsLayout title="Almacenamiento">
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.usagePanel}>
            <Text style={styles.usageTitle}>Uso de almacenamiento</Text>
            <Text style={styles.usageValue}>{used.toFixed(1)} MB</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.barLabel}>{pct.toFixed(1)}% de {MAX_MB} MB estimados</Text>
          </View>

          <SettingsSection label="Por tipo (estimado)" />
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
            <SettingsRow label={`Liberar espacio (${cacheSize.toFixed(1)} MB caché)`} danger onPress={clearCache} />
          </SettingsCard>
        </>
      )}
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  usagePanel: { backgroundColor: '#fff', padding: 20, marginTop: 12 },
  usageTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  usageValue: { fontSize: 28, fontWeight: '700', color: Colors.accent },
  barBg: { marginTop: 12, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  barLabel: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
});
