import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
import { useLanguage } from '../../src/context/LanguageContext';

export default function AcercaScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const { translate: t } = useLanguage();

  const [checking, setChecking] = useState(false);
  const [runningDiag, setRunningDiag] = useState(false);

  // ── Datos de versión ──────────────────────────────────────────
  const appVersion   = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber  =
    (Constants.expoConfig?.ios as any)?.buildNumber ??
    (Constants.expoConfig?.android as any)?.versionCode ??
    '—';
  const runtimeVer   = Constants.expoConfig?.runtimeVersion ?? '—';
  const updateId     = Updates.updateId ? Updates.updateId.substring(0, 8) + '...' : t('setLocalChannel');
  const updateChan   = Updates.channel ?? 'development';

  const info = [
    { label: t('version'),          value: appVersion },
    { label: 'Build',            value: String(buildNumber) },
    { label: 'Runtime',          value: String(runtimeVer) },
    { label: `${t('channel')} OTA`, value: updateChan },
    { label: 'Update ID',        value: updateId },
    { label: t('setPlatform'),      value: 'React Native + Expo ~54' },
    { label: t('setDeveloper'),     value: 'EGCHAT Team' },
    { label: t('country'),          value: `${t('hdrEquatorialGuinea')} 🇬🇶` },
    { label: 'Backend',          value: 'Supabase + Render' },
    { label: 'EAS Project',      value: String(Constants.expoConfig?.extra?.eas?.projectId ?? '—').substring(0, 8) },
  ];

  // ── Buscar actualización OTA ──────────────────────────────────
  const checkUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          `🆕 ${t('setUpdateAvailable')}`,
          t('setUpdateAvailableBody'),
          [
            { text: t('setNotNow'), style: 'cancel' },
            {
              text: t('setUpdate'),
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    `✅ ${t('setUpdateDownloaded')}`,
                    t('setUpdateDownloadedBody'),
                    [{ text: t('setRestart'), onPress: () => Updates.reloadAsync() }],
                  );
                } catch (e: any) {
                  toast.error(t('setUpdateDownloadError'));
                }
              },
            },
          ],
        );
      } else {
        toast.success(`✓ ${t('setLatestVersion')}`);
      }
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      toast.error(msg.includes('Expo Go') ? t('setOtaUnavailable') : t('setUpdateCheckError'));
    }
    setChecking(false);
  }, [t]);

  // ── Diagnóstico push ──────────────────────────────────────────
  const pushDiagnostic = useCallback(async () => {
    setRunningDiag(true);
    try {
      await runPushDiagnostic();
    } catch {
      toast.error(t('setDiagnosticError'));
    }
    setRunningDiag(false);
  }, [t]);

  return (
    <SettingsLayout title={t('aboutTitle')}>

      <View style={[styles.hero, { backgroundColor: C.bgPrimary }]}>
        <SpinningLogo size={90} glow />
        <Text style={[styles.appName, { color: C.textPrimary }]}>EGCHAT</Text>
        <Text style={styles.version}>v{appVersion} (build {buildNumber})</Text>
        <Text style={styles.channel}>{t('channel')}: {updateChan}</Text>
      </View>

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

      <SettingsSection label={t('updates')} />
      <SettingsCard>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={checkUpdate}
          disabled={checking}
        >
          {checking
            ? <ActivityIndicator color={Colors.accent} size="small" />
            : <MaterialIcons name="sync" size={22} color={Colors.accent} style={{ width: 28, textAlign: 'center' }} />
          }
          <View style={{ flex: 1 }}>
            <Text style={[styles.updateLabel, { color: C.textPrimary }]}>
              {t('checkForUpdates')}
            </Text>
            <Text style={[styles.updateSub, { color: C.textSecondary }]}>
              {t('otaUpdate')}
            </Text>
          </View>
        </TouchableOpacity>
      </SettingsCard>

      <SettingsSection label={t('diagnostic')} />
      <SettingsCard>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={pushDiagnostic}
          disabled={runningDiag}
        >
          {runningDiag
            ? <ActivityIndicator color="#8b5cf6" size="small" />
            : <MaterialIcons name="notifications" size={22} color="#8b5cf6" style={{ width: 28, textAlign: 'center' }} />
          }
          <View style={{ flex: 1 }}>
            <Text style={[styles.updateLabel, { color: C.textPrimary }]}>
              {t('pushDiagnosticTitle')}
            </Text>
            <Text style={[styles.updateSub, { color: C.textSecondary }]}>
              {t('pushDiagnosticSub')}
            </Text>
          </View>
        </TouchableOpacity>
      </SettingsCard>

      <SettingsSection label={t('legal')} />
      <SettingsCard>
        <SettingsRow
          label={t('termsOfService')}
          onPress={() => Linking.openURL('https://egchat-v2.vercel.app/terms').catch(() => {})}
        />
        <SettingsDivider />
        <SettingsRow
          label={t('privacyPolicy')}
          onPress={() => Linking.openURL('https://egchat-v2.vercel.app/privacy').catch(() => {})}
        />
        <SettingsDivider />
        <SettingsRow
          label={t('openSourceLicenses')}
          onPress={() => Alert.alert(
            t('licenses'),
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
  updateLabel: { fontSize: 15, fontWeight: '600' },
  updateSub:   { fontSize: 12, marginTop: 2 },
});
