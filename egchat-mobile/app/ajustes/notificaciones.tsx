import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
  SettingsToggleRow, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { getSoundSettings, saveSoundSettings } from '../../src/hooks/useSounds';
import { registerForPushNotifications } from '../../src/notifications';
import { runPushDiagnostic } from '../../src/pushDiagnostic';
import { Colors } from '../../src/theme';
import { DNDSettingsModal } from '../../src/components/settings/DNDSettingsModal';
import { getDNDSettings, isDNDActive, formatTime } from '../../src/services/doNotDisturb';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

export default function NotificacionesScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // ── Permisos y token ─────────────────────────────────────────
  const [pushGranted, setPushGranted] = useState(false);
  const [activating, setActivating]   = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);

  // ── Tipos de notificación ────────────────────────────────────
  const [msgs,       setMsgs]       = useState(true);
  const [groups,     setGroups]     = useState(true);
  const [calls,      setCalls]      = useState(true);
  const [stories,    setStories]    = useState(false);
  const [preview,    setPreview]    = useState(true);
  const [transfers,  setTransfers]  = useState(true);
  const [djangue,    setDjangue]    = useState(true);
  const [reactions,  setReactions]  = useState(true);
  const [moments,    setMoments]    = useState(false);

  // ── Sonido / vibración ──────────────────────────────────────
  const [volume,    setVolume]    = useState(0.7);
  const [vibration, setVibration] = useState(true);

  // ── No molestar ─────────────────────────────────────────────
  const [showDND,  setShowDND]  = useState(false);
  const [dndActive, setDndActive] = useState(false);
  const [dndLabel,  setDndLabel]  = useState('');

  // ── Canales Android ─────────────────────────────────────────
  const [channels, setChannels] = useState<string[]>([]);

  useEffect(() => {
    getCfgBool(CFG.notifMessages,  true).then(setMsgs);
    getCfgBool(CFG.notifGroups,    true).then(setGroups);
    getCfgBool(CFG.notifCalls,     true).then(setCalls);
    getCfgBool(CFG.notifStories,   false).then(setStories);
    getCfgBool(CFG.notifPreview,   true).then(setPreview);
    getCfgBool('notif_transfers',  true).then(setTransfers);
    getCfgBool('notif_djangue',    true).then(setDjangue);
    getCfgBool('notif_reactions',  true).then(setReactions);
    getCfgBool('notif_moments',    false).then(setMoments);

    Notifications.getPermissionsAsync().then(({ status }) => setPushGranted(status === 'granted'));
    getSoundSettings().then(s => { setVolume(s.volume); setVibration(s.vibrationEnabled); });

    getDNDSettings().then(s => {
      setDndActive(isDNDActive(s));
      setDndLabel(s.enabled
        ? `${formatTime(s.startHour, s.startMin)} – ${formatTime(s.endHour, s.endMin)}`
        : 'Desactivado');
    });

    // Canales Android activos
    Notifications.getNotificationChannelsAsync().then(ch => {
      setChannels(ch.map(c => c.id));
    });
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
    setActivating(true);
    const token = await registerForPushNotifications();
    const next = await Notifications.getPermissionsAsync();
    setPushGranted(next.status === 'granted');
    setActivating(false);
    if (token) Alert.alert('✅', 'Notificaciones push activadas correctamente');
  }, []);

  const runDiag = useCallback(async () => {
    setDiagRunning(true);
    try { await runPushDiagnostic(); } catch {}
    setDiagRunning(false);
  }, []);

  const pushStatus = pushGranted ? '✅ Activadas' : '⚠️ Sin configurar';

  return (
    <SettingsLayout title="Notificaciones">

      {/* ── Permiso del sistema ─────────────────── */}
      <SettingsSection label="Permiso del sistema" />
      <SettingsCard>
        <View style={st.pushRow}>
          <View style={{ flex: 1 }}>
            <Text style={[st.pushLabel, { color: C.textPrimary }]}>Notificaciones push</Text>
            <Text style={[st.pushStatus, { color: pushGranted ? Colors.accent : '#f59e0b' }]}>
              {pushStatus}
            </Text>
          </View>
          {!pushGranted && (
            <TouchableOpacity
              onPress={activatePush}
              disabled={activating}
              style={st.activateBtn}
            >
              {activating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={st.activateTxt}>Activar</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </SettingsCard>

      {/* ── Diagnóstico ─────────────────────────── */}
      <SettingsSection label="Diagnóstico" />
      <SettingsCard>
        <TouchableOpacity style={st.diagRow} onPress={runDiag} disabled={diagRunning}>
          {diagRunning
            ? <ActivityIndicator color="#8b5cf6" size="small" style={{ marginRight: 10 }} />
            : <Text style={st.diagIcon}>🔔</Text>
          }
          <View style={{ flex: 1 }}>
            <Text style={[st.diagLabel, { color: C.textPrimary }]}>Diagnóstico push</Text>
            <Text style={[st.diagSub, { color: C.textSecondary }]}>
              Token, permisos, canales y registro en servidor
            </Text>
          </View>
        </TouchableOpacity>
      </SettingsCard>

      {/* ── Mensajes y grupos ───────────────────── */}
      <SettingsSection label="Mensajes y grupos" />
      <SettingsCard>
        <SettingsToggleRow label="Mensajes privados"    value={msgs}      onValueChange={v => { setMsgs(v);      setCfgBool(CFG.notifMessages, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Grupos"               value={groups}    onValueChange={v => { setGroups(v);    setCfgBool(CFG.notifGroups,   v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Reacciones a mensajes" value={reactions} onValueChange={v => { setReactions(v); setCfgBool('notif_reactions', v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Vista previa del mensaje" value={preview} onValueChange={v => { setPreview(v); setCfgBool(CFG.notifPreview, v); }} />
      </SettingsCard>

      {/* ── Llamadas y estados ──────────────────── */}
      <SettingsSection label="Llamadas y estados" />
      <SettingsCard>
        <SettingsToggleRow label="Llamadas entrantes" value={calls}   onValueChange={v => { setCalls(v);   setCfgBool(CFG.notifCalls,   v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Historias / Estados" value={stories} onValueChange={v => { setStories(v); setCfgBool(CFG.notifStories, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Moments nuevos"      value={moments} onValueChange={v => { setMoments(v); setCfgBool('notif_moments',  v); }} />
      </SettingsCard>

      {/* ── Pagos y Djangue ─────────────────────── */}
      <SettingsSection label="Pagos y Djangue" />
      <SettingsCard>
        <SettingsToggleRow
          label="Transferencias recibidas"
          description="Notificación al recibir dinero"
          value={transfers}
          onValueChange={v => { setTransfers(v); setCfgBool('notif_transfers', v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Djangue — recordatorios"
          description="Cuotas pendientes y pagos del turno"
          value={djangue}
          onValueChange={v => { setDjangue(v); setCfgBool('notif_djangue', v); }}
        />
      </SettingsCard>

      {/* ── Sonido y vibración ──────────────────── */}
      <SettingsSection label="Sonido y vibración" />
      <SettingsCard>
        <SettingsRow
          label="Volumen y tonos"
          value={`${Math.round(volume * 100)}%`}
          onPress={() => router.push('/ajustes/sonidos' as any)}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Vibración"
          value={vibration}
          onValueChange={v => { setVibration(v); saveSoundSettings({ vibrationEnabled: v }); }}
        />
      </SettingsCard>

      {/* ── No molestar ─────────────────────────── */}
      <SettingsSection label="No molestar" />
      <SettingsCard>
        <SettingsRow
          label="Programar silencio"
          value={dndActive ? '🔇 Activo ahora' : dndLabel}
          onPress={() => setShowDND(true)}
        />
      </SettingsCard>

      {/* ── Canales Android ─────────────────────── */}
      {channels.length > 0 && (
        <>
          <SettingsSection label="Canales activos (Android)" />
          <SettingsCard>
            {channels.map((ch, i) => (
              <React.Fragment key={ch}>
                <View style={st.channelRow}>
                  <Text style={[st.channelDot, { color: Colors.accent }]}>●</Text>
                  <Text style={[st.channelName, { color: C.textPrimary }]}>{ch}</Text>
                </View>
                {i < channels.length - 1 && <SettingsDivider />}
              </React.Fragment>
            ))}
          </SettingsCard>
        </>
      )}

      <DNDSettingsModal
        visible={showDND}
        onClose={() => {
          setShowDND(false);
          getDNDSettings().then(s => {
            setDndActive(isDNDActive(s));
            setDndLabel(s.enabled
              ? `${formatTime(s.startHour, s.startMin)} – ${formatTime(s.endHour, s.endMin)}`
              : 'Desactivado');
          });
        }}
      />
    </SettingsLayout>
  );
}

const st = StyleSheet.create({
  pushRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  pushLabel:    { fontSize: 15, fontWeight: '600' },
  pushStatus:   { fontSize: 12, marginTop: 2 },
  activateBtn:  { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  activateTxt:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  diagRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  diagIcon:     { fontSize: 22, width: 28, textAlign: 'center' },
  diagLabel:    { fontSize: 15, fontWeight: '600' },
  diagSub:      { fontSize: 12, marginTop: 2 },
  channelRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  channelDot:   { fontSize: 10 },
  channelName:  { fontSize: 14 },
});
