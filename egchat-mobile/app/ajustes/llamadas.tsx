import React, { useEffect, useState, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
  SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { getSoundSettings, saveSoundSettings, RINGTONES, previewRingtone } from '../../src/hooks/useSounds';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { chatAPI } from '../../src/api';

interface CallStats {
  total: number;
  missed: number;
  audio: number;
  video: number;
  totalMinutes: number;
}

async function loadCallStats(): Promise<CallStats> {
  const stats: CallStats = { total: 0, missed: 0, audio: 0, video: 0, totalMinutes: 0 };
  try {
    const chats = await chatAPI.getChats();
    for (const chat of chats.slice(0, 15)) {
      const msgs = await chatAPI.getMessages(chat.id, 1, 50).catch(() => []);
      const callMsgs = (msgs || []).filter((m: any) =>
        m.type === 'call' || m.text?.includes('Llamada') || m.text?.includes('llamada'),
      );
      for (const msg of callMsgs) {
        stats.total++;
        const txt = msg.text || '';
        if (txt.includes('perdida') || txt.includes('Perdida')) stats.missed++;
        if (txt.includes('📹') || txt.toLowerCase().includes('video')) stats.video++;
        else stats.audio++;
        // Intentar parsear duración
        const durMatch = txt.match(/(\d+)m/);
        if (durMatch) stats.totalMinutes += parseInt(durMatch[1], 10);
      }
    }
  } catch {}
  return stats;
}

export default function LlamadasScreen() {
  const [hdCall, setHdCall] = useState(true);
  const [saveData, setSaveData] = useState(false);
  const [muteUnknown, setMuteUnknown] = useState(false);
  const [ringtone, setRingtone] = useState('classic');
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    getCfgBool(CFG.hdCall, true).then(setHdCall);
    getCfgBool(CFG.saveDataCall, false).then(setSaveData);
    getCfgBool(CFG.muteCallUnknown, false).then(setMuteUnknown);
    getSoundSettings().then(s => setRingtone(s.ringtone));

    loadCallStats().then(s => { setStats(s); setLoadingStats(false); });
  }, []);

  return (
    <SettingsLayout title="Llamadas de voz y video">

      {/* ── Estadísticas de llamadas ───────────────── */}
      <SettingsSection label="Estadísticas" />
      {loadingStats ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />
      ) : stats ? (
        <View style={[st.statsGrid, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
          <StatCard icon="📞" label="Total" value={String(stats.total)} color="#00c8a0" isDark={isDark} />
          <StatCard icon="❌" label="Perdidas" value={String(stats.missed)} color="#ef4444" isDark={isDark} />
          <StatCard icon="🎙️" label="Voz" value={String(stats.audio)} color="#6366f1" isDark={isDark} />
          <StatCard icon="📹" label="Video" value={String(stats.video)} color="#f59e0b" isDark={isDark} />
          {stats.totalMinutes > 0 && (
            <View style={[st.minutesRow, { borderTopColor: isDark ? '#21262d' : '#f3f4f6' }]}>
              <Text style={[st.minutesLabel, { color: C.textSecondary }]}>Tiempo total en llamadas</Text>
              <Text style={[st.minutesValue, { color: C.textPrimary }]}>
                {stats.totalMinutes >= 60
                  ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
                  : `${stats.totalMinutes}m`}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      <SettingsCard style={{ marginTop: 4 }}>
        <SettingsRow
          label="Ver historial completo"
          value="Todas las llamadas"
          onPress={() => router.push('/call-history' as any)}
        />
      </SettingsCard>

      {/* ── Calidad ───────────────────────────────── */}
      <SettingsSection label="Calidad" />
      <SettingsCard>
        <SettingsToggleRow
          label="Llamadas HD"
          description="Mayor calidad de audio y video"
          value={hdCall}
          onValueChange={v => { setHdCall(v); setCfgBool(CFG.hdCall, v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Reducir uso de datos"
          description="Menor calidad para ahorrar datos móviles"
          value={saveData}
          onValueChange={v => { setSaveData(v); setCfgBool(CFG.saveDataCall, v); }}
        />
      </SettingsCard>

      {/* ── Privacidad ────────────────────────────── */}
      <SettingsSection label="Privacidad" />
      <SettingsCard>
        <SettingsToggleRow
          label="Silenciar llamadas de desconocidos"
          description="Solo suenan llamadas de contactos"
          value={muteUnknown}
          onValueChange={v => { setMuteUnknown(v); setCfgBool(CFG.muteCallUnknown, v); }}
        />
      </SettingsCard>

      {/* ── Tono de llamada ───────────────────────── */}
      <SettingsSection label="Tono de llamada" />
      <SettingsCard>
        {RINGTONES.map((t, i) => (
          <React.Fragment key={t.id}>
            <TouchableOpacity
              style={st.ringtoneRow}
              onPress={async () => {
                setRingtone(t.id);
                await saveSoundSettings({ ringtone: t.id });
                if (t.id !== 'none') await previewRingtone();
              }}
            >
              <Text style={[st.ringtoneName, { color: C.textPrimary }]}>{t.name}</Text>
              {ringtone === t.id && (
                <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>
              )}
            </TouchableOpacity>
            {i < RINGTONES.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

    </SettingsLayout>
  );
}

function StatCard({ icon, label, value, color, isDark }: {
  icon: string; label: string; value: string; color: string; isDark: boolean;
}) {
  return (
    <View style={[st.statCard, { backgroundColor: isDark ? '#21262d' : '#f9fafb' }]}>
      <Text style={st.statIcon}>{icon}</Text>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={[st.statLabel, { color: isDark ? '#8b949e' : '#6b7280' }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  statsGrid: {
    marginHorizontal: 16, borderRadius: 14, padding: 12,
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statCard: {
    flex: 1, minWidth: '40%', alignItems: 'center', gap: 4,
    paddingVertical: 14, borderRadius: 10,
  },
  statIcon:  { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  minutesRow: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 10, marginTop: 2,
    borderTopWidth: 1, paddingHorizontal: 4,
  },
  minutesLabel: { fontSize: 13 },
  minutesValue: { fontSize: 14, fontWeight: '700' },
  ringtoneRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  ringtoneName: { fontSize: 15 },
});
