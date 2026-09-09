import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsToggleRow, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import {
  syncPhoneContacts, getLastSyncTime, formatLastSync, hasContactsPermission,
} from '../../src/services/contactSync';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

function OptionRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  return (
    <View style={styles.optBlock}>
      <Text style={[styles.optLabel, { color: C.textPrimary }]}>{label}</Text>
      <View style={styles.optRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.optChip, value === opt && styles.optChipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: value === opt ? Colors.accent : C.textSecondary }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PermisosAmigosScreen() {
  const [addMe, setAddMe] = useState('Todos');
  const [msgMe, setMsgMe] = useState('Todos');
  const [findMe, setFindMe] = useState('Todos');
  const [autoAccept, setAutoAccept] = useState(false);
  const [muteUnknown, setMuteUnknown] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  useEffect(() => {
    getCfgString(CFG.permAdd, 'Todos').then(setAddMe);
    getCfgString(CFG.permMsg, 'Todos').then(setMsgMe);
    getCfgString(CFG.permFind, 'Todos').then(setFindMe);
    getCfgBool(CFG.autoAccept, false).then(setAutoAccept);
    getCfgBool(CFG.muteUnknown, true).then(setMuteUnknown);
    getLastSyncTime().then(d => setLastSync(formatLastSync(d)));
  }, []);

  const handleSyncContacts = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncPhoneContacts(true); // force=true → no espera 24h

      if (result.permissionDenied) {
        Alert.alert(
          'Permiso requerido',
          'Para sincronizar, ve a Ajustes del sistema y activa el permiso de Contactos para EGChat.',
        );
        return;
      }

      const msg = result.newContacts > 0
        ? `✅ ${result.newContacts} contacto${result.newContacts > 1 ? 's' : ''} nuevo${result.newContacts > 1 ? 's' : ''} encontrado${result.newContacts > 1 ? 's' : ''} en EGChat.`
        : result.totalFound > 0
          ? `✅ Todos tus contactos ya estaban agregados (${result.totalFound} en EGChat).`
          : '✅ Ningún contacto tuyo usa EGChat aún.';

      Alert.alert('Sincronización completa', msg);
      getLastSyncTime().then(d => setLastSync(formatLastSync(d)));
    } catch {
      Alert.alert('Error', 'No se pudo sincronizar. Verifica tu conexión.');
    } finally {
      setSyncing(false);
    }
  }, []);

  return (
    <SettingsLayout title="Permisos de amigos">
      <SettingsSection label="¿Quién puede..." />
      <SettingsCard>
        <OptionRow label="Añadirme como contacto" value={addMe} options={['Todos', 'Solo mis contactos', 'Nadie']} onChange={v => { setAddMe(v); setCfg(CFG.permAdd, v); }} />
        <SettingsDivider />
        <OptionRow label="Enviarme mensajes" value={msgMe} options={['Todos', 'Solo contactos']} onChange={v => { setMsgMe(v); setCfg(CFG.permMsg, v); }} />
        <SettingsDivider />
        <OptionRow label="Encontrarme por búsqueda" value={findMe} options={['Todos', 'Nadie']} onChange={v => { setFindMe(v); setCfg(CFG.permFind, v); }} />
      </SettingsCard>

      <SettingsSection label="Solicitudes" />
      <SettingsCard>
        <SettingsToggleRow label="Aceptar automáticamente" value={autoAccept} onValueChange={v => { setAutoAccept(v); setCfgBool(CFG.autoAccept, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Silenciar desconocidos" value={muteUnknown} onValueChange={v => { setMuteUnknown(v); setCfgBool(CFG.muteUnknown, v); }} />
      </SettingsCard>

      <SettingsSection label="Contactos del teléfono" />
      <SettingsCard>
        <View style={styles.syncRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.syncTitle, { color: C.textPrimary }]}>Sincronizar agenda</Text>
            <Text style={[styles.syncSub, { color: C.textSecondary }]}>
              {lastSync ? `Última sincronización: ${lastSync}` : 'Nunca sincronizado'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            onPress={handleSyncContacts}
            disabled={syncing}
            activeOpacity={0.7}
          >
            {syncing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.syncBtnText}>Sincronizar</Text>
            }
          </TouchableOpacity>
        </View>
      </SettingsCard>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  optBlock: { paddingHorizontal: 16, paddingVertical: 12 },
  optLabel: { fontSize: 16, marginBottom: 8 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  optChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(7,193,96,0.1)' },
});
