import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme/colors';
import { DarkColors } from '../../src/theme/darkMode';
import { runPushDiagnostic } from '../../src/pushDiagnostic';
import { toast } from '../../src/components/Toast';

export default function AcercaScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const [checking, setChecking] = useState(false);
  const [runningDiag, setRunningDiag] = useState(false);

  // ── Datos de versión ──────────────────────────────────────────
  const appVersion   = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber  =
    (Constants.expoConfig?.ios as any)?.buildNumber ??
    (Constants.expoConfig?.android as any)?.versionCode ??
    '—';
  const runtimeVer   = Constants.expoConfig?.runtimeVersion ?? '—';
  const updateId     = Updates.updateId ? Updates.updateId.substring(0, 8) + '...' : 'Canal local';
  const updateChan   = Updates.channel ?? 'development';
  const isExpoGo     = !Constants.isDevice;

  const info = [
    { label: 'Versión',          value: appVersion },
    { label: 'Build',            value: String(buildNumber) },
    { label: 'Runtime',          value: String(runtimeVer) },
    { label: 'Canal OTA',        value: updateChan },
    { label: 'Update ID',        value: updateId },
    { label: 'Plataforma',       value: 'React Native + Expo ~54' },
    { label: 'Desarrollador',    value: 'EGCHAT Team' },
    { label: 'País',             value: 'Guinea Ecuatorial 🇬🇶' },
    { label: 'Backend',          value: 'Supabase + Render' },
    { label: 'EAS Project',      value: '6200ec00' },
  ];

  // ── Buscar actualización OTA ──────────────────────────────────
  const checkUpdate = useCallback(async () => {
    if (isExpoGo) {
      toast.info('OTA no disponible en Expo Go');
      return;
    }
    setChecking(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          '🆕 Actualización disponible',
          'Hay una nueva versión de EGCHAT. ¿Descargar e instalar ahora?',
          [
            { text: 'Ahora no', style: 'cancel' },
            {
              text: 'Actualizar',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    '✅ Actualización descargada',
                    'La app se reiniciará para aplicar los cambios.',
                    [{ text: 'Reiniciar', onPress: () => Updates.reloadAsync() }],
                  );
                } catch (e: any) {
                  toast.error('Error descargando actualización');
                }
              },
            },
          ],
        );
      } else {
        toast.success('✓ Tienes la versión más reciente');
      }
    } catch {
      toast.error('No se pudo verificar actualizaciones');
    }
    setChecking(false);
  }, [isExpoGo]);

  // ── Diagnóstico push ──────────────────────────────────────────
  const pushDiagnostic = useCallback(async () => {
    setRunningDiag(true);
    try {
      await runPushDiagnostic();
    } catch {
      toast.error('Error en diagnóstico');
    }
    setRunningDiag(false);
  }, []);

  return (
    <SettingsLayout title="Acerca de EGCHAT">

      {/* ── Hero ──────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: C.bgPrimary }]}>
        <SpinningLogo size={90} glow />
        <Text style={[styles.appName, { color: C.textPrimary }]}>EGCHAT</Text>
        <Text style={styles.version}>v{appVersion} (build {buildNumber})</Text>
        <Text style={styles.channel}>Canal: {updateChan}</Text>
      </View>

      {/* ── Info técnica ──────────────────────────── */}
      <SettingsCard>
        {info.map((r, i) => (
          <React.Fragment key={r.label}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: C.textPrimary }]}>{r.label}</Text>
              <Text style={[styles.infoValue, { color: C.textSecondary }]} numberOfLines={1}>{r.value}</Text>
            </View>
            {i < info.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

      {/* ── Actualización OTA ─────────────────────── */}
      <SettingsSection label="Actualizaciones" />
      <SettingsCard>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={checkUpdate}
          disabled={checking}
        >
          {checking
            ? <ActivityIndicator color={Colors.accent} size="small" />
            : <Text style={styles.updateIcon}>🔄</Text>
          }
          <View style={{ flex: 1 }}>
            <Text style={[styles.updateLabel, { color: C.textPrimary }]}>
              Buscar actualización
            </Text>
            <Text style={[styles.updateSub, { color: C.textSecondary }]}>
              Actualización en segundo plano (OTA)
            </Text>
          </View>
        </TouchableOpacity>
      </SettingsCard>

      {/* ── Diagnóstico push ──────────────────────── */}
      <SettingsSection label="Diagnóstico" />
      <SettingsCard>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={pushDiagnostic}
          disabled={runningDiag}
        >
          {runningDiag
            ? <ActivityIndicator color="#8b5cf6" size="small" />
            : <Text style={styles.updateIcon}>🔔</Text>
          }
          <View style={{ flex: 1 }}>
            <Text style={[styles.updateLabel, { color: C.textPrimary }]}>
              Diagnóstico de notificaciones push
            </Text>
            <Text style={[styles.updateSub, { color: C.textSecondary }]}>
              Verifica permisos, token FCM/APNs y registro en servidor
            </Text>
          </View>
        </TouchableOpacity>
      </SettingsCard>

      {/* ── Legal ─────────────────────────────────── */}
      <SettingsSection label="Legal" />
      <SettingsCard>
        <SettingsRow
          label="Términos de servicio"
          onPress={() => Linking.openURL('https://egchat-v2.vercel.app/terms').catch(() => {})}
        />
        <SettingsDivider />
        <SettingsRow
          label="Política de privacidad"
          onPress={() => Linking.openURL('https://egchat-v2.vercel.app/privacy').catch(() => {})}
        />
        <SettingsDivider />
        <SettingsRow
          label="Licencias de código abierto"
          onPress={() => Alert.alert(
            'Licencias',
            'React Native (MIT)\nExpo (MIT)\nSupabase (Apache 2.0)\nTweetNaCl (Public Domain)\nFirebase (Apache 2.0)',
          )}
        />
      </SettingsCard>

    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 4,
  },
  appName:  { fontSize: 22, fontWeight: '800', marginTop: 10 },
  version:  { fontSize: 14, color: '#8e8e93', marginTop: 2 },
  channel:  { fontSize: 12, color: '#8e8e93' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 13, textAlign: 'right', flexShrink: 1, marginLeft: 8 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  updateIcon:  { fontSize: 22, width: 28, textAlign: 'center' },
  updateLabel: { fontSize: 15, fontWeight: '600' },
  updateSub:   { fontSize: 12, marginTop: 2 },
});
