// ══════════════════════════════════════════════════════════════════
// CloudBackupScreen — Backup en la nube estilo WhatsApp
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Switch, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import {
  createCloudBackup, shareBackupFile, getBackupSettings,
  saveBackupSettings, getLastBackupTime, formatSize, type BackupSettings,
} from '../../src/services/cloudBackup';
import { toast } from '../../src/components/Toast';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme/colors';
import { DarkColors } from '../../src/theme/darkMode';

export default function CloudBackupScreen() {
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: false, frequency: 'weekly', includeMedia: false, destination: 'server',
  });
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backing, setBacking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [lastResult, setLastResult] = useState<{ size: number; chatCount: number } | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    getBackupSettings().then(setSettings);
    getLastBackupTime().then(setLastBackup);
  }, []);

  const handleBackup = useCallback(async () => {
    setBacking(true);
    setProgress(0);
    setProgressMsg('Iniciando...');
    try {
      const result = await createCloudBackup((pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });
      if (result) {
        setLastBackup(new Date());
        setLastResult(result);
        toast.success('Backup completado', `${result.chatCount} chats · ${formatSize(result.size)}`);
      } else {
        toast.error('Backup fallido', 'Inténtalo de nuevo');
      }
    } finally {
      setBacking(false);
    }
  }, []);

  const handleChangeSetting = useCallback(async (patch: Partial<BackupSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveBackupSettings(next);
  }, [settings]);

  const formatDate = (d: Date | null) => {
    if (!d) return 'Nunca';
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: '#07a472' }]} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Backup en la nube</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Estado actual */}
        <View style={[s.statusCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          <View style={s.statusIcon}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={1.8} strokeLinecap="round">
              <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusTitle, { color: C.textPrimary }]}>Último backup</Text>
            <Text style={[s.statusDate, { color: C.textTertiary }]}>{formatDate(lastBackup)}</Text>
            {lastResult && (
              <Text style={[s.statusInfo, { color: C.textTertiary }]}>
                {lastResult.chatCount} chats · {formatSize(lastResult.size)}
              </Text>
            )}
          </View>
        </View>

        {/* Botón hacer backup */}
        <TouchableOpacity
          onPress={backing ? undefined : handleBackup}
          style={[s.backupBtn, backing && { opacity: 0.7 }]}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.backupBtnGrad}>
            {backing ? (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.backupBtnText}>{progressMsg}</Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                  <Polyline points="21 15 21 19 3 19 3 15"/><Path d="M12 3v12"/><Polyline points="8 9 12 3 16 9"/>
                </Svg>
                <Text style={s.backupBtnText}>Hacer backup ahora</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Configuración */}
        <Text style={[s.sectionLabel, { color: C.textTertiary }]}>CONFIGURACIÓN</Text>

        <View style={[s.settingsCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          {/* Auto backup */}
          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: C.textPrimary }]}>Backup automático</Text>
              <Text style={[s.settingSub, { color: C.textTertiary }]}>Respalda automáticamente</Text>
            </View>
            <Switch
              value={settings.autoBackup}
              onValueChange={v => handleChangeSetting({ autoBackup: v })}
              trackColor={{ false: '#d1d5db', true: '#07a472' }}
              thumbColor="#fff"
            />
          </View>

          {settings.autoBackup && (
            <>
              <View style={[s.divider, { backgroundColor: C.borderLight }]} />
              {/* Frecuencia */}
              <Text style={[s.settingLabel, { color: C.textPrimary, paddingHorizontal: 14, paddingTop: 12 }]}>Frecuencia</Text>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8 }}>
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[s.freqChip, settings.frequency === f && s.freqChipActive]}
                    onPress={() => handleChangeSetting({ frequency: f })}
                  >
                    <Text style={[s.freqText, settings.frequency === f && s.freqTextActive]}>
                      {f === 'daily' ? 'Diario' : f === 'weekly' ? 'Semanal' : 'Mensual'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={[s.divider, { backgroundColor: C.borderLight }]} />

          {/* Incluir media */}
          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: C.textPrimary }]}>Incluir fotos y videos</Text>
              <Text style={[s.settingSub, { color: C.textTertiary }]}>Aumenta el tamaño del backup</Text>
            </View>
            <Switch
              value={settings.includeMedia}
              onValueChange={v => handleChangeSetting({ includeMedia: v })}
              trackColor={{ false: '#d1d5db', true: '#07a472' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[s.divider, { backgroundColor: C.borderLight }]} />

          {/* Destino */}
          <Text style={[s.settingLabel, { color: C.textPrimary, paddingHorizontal: 14, paddingTop: 12 }]}>Destino</Text>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8 }}>
            {(['server', 'local'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[s.freqChip, settings.destination === d && s.freqChipActive]}
                onPress={() => handleChangeSetting({ destination: d })}
              >
                <Text style={[s.freqText, settings.destination === d && s.freqTextActive]}>
                  {d === 'server' ? '☁️ Servidor' : '📱 Local'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={[s.infoBox, { backgroundColor: '#07a47210', borderColor: '#07a47230' }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2} strokeLinecap="round">
            <Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/>
          </Svg>
          <Text style={s.infoText}>
            El backup incluye todos tus mensajes de texto. Las fotos y videos solo se incluyen si activas la opción correspondiente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  statusIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#07a47215', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusDate: { fontSize: 13, marginTop: 2 },
  statusInfo: { fontSize: 12, marginTop: 2 },
  backupBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  backupBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressBar: { width: 200, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  settingsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  freqChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  freqChipActive: { backgroundColor: '#07a472' },
  freqText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  freqTextActive: { color: '#fff' },
  infoBox: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#07a472', lineHeight: 18 },
});
