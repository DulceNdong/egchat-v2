import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SettingsLayout, SettingsSection } from '../../src/components/settings/SettingsUI';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme';
import { DarkColors } from '../../src/theme/darkMode';

interface ActivityLogItem {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  type: 'login' | 'transaction' | 'security' | 'profile';
}

const DEFAULT_ACTIVITY: ActivityLogItem[] = [
  { id: '1', action: 'Login', description: 'Inicio de sesión exitoso', timestamp: new Date(Date.now() - 3600000), type: 'login' },
  { id: '2', action: 'Transferencia', description: 'Transferencia de 25,000 XAF a María', timestamp: new Date(Date.now() - 7200000), type: 'transaction' },
  { id: '3', action: 'PIN Verificado', description: 'PIN verificado para retiro a tarjeta', timestamp: new Date(Date.now() - 10800000), type: 'security' },
  { id: '4', action: 'Perfil Actualizado', description: 'Teléfono actualizado', timestamp: new Date(Date.now() - 86400000), type: 'profile' },
];

export default function ActividadScreen() {
  const [activityFilter, setActivityFilter] = useState<'all' | 'login' | 'transaction' | 'security' | 'profile'>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityRange, setActivityRange] = useState<'7d' | '30d' | 'all'>('7d');
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  const filtered = DEFAULT_ACTIVITY.filter(log => {
    const term = activitySearch.trim().toLowerCase();
    const cutoff = new Date();
    if (activityRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    if (activityRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    if (activityFilter !== 'all' && log.type !== activityFilter) return false;
    if (term && !(`${log.action} ${log.description}`.toLowerCase().includes(term))) return false;
    if (activityRange !== 'all' && log.timestamp < cutoff) return false;
    return true;
  });

  const Chip = ({ id, label, active, onPress }: { id: string; label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && { color: Colors.accent }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SettingsLayout title="Registro de actividad">
      <SettingsSection label="Filtros" />
      <View style={[styles.filterBox, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={styles.chipRow}>
          {[
            { id: 'all' as const, label: 'Todo' },
            { id: 'login' as const, label: 'Login' },
            { id: 'transaction' as const, label: 'Transacciones' },
            { id: 'security' as const, label: 'Seguridad' },
            { id: 'profile' as const, label: 'Perfil' },
          ].map(t => (
            <Chip key={t.id} id={t.id} label={t.label} active={activityFilter === t.id} onPress={() => setActivityFilter(t.id)} />
          ))}
        </View>
        <View style={[styles.chipRow, { marginTop: 8 }]}>
          {[
            { id: '7d' as const, label: '7 días' },
            { id: '30d' as const, label: '30 días' },
            { id: 'all' as const, label: 'Todo' },
          ].map(r => (
            <Chip key={r.id} id={r.id} label={r.label} active={activityRange === r.id} onPress={() => setActivityRange(r.id)} />
          ))}
        </View>
        <TextInput
          style={[styles.search, { color: C.textPrimary, borderColor: C.borderLight }]}
          value={activitySearch}
          onChangeText={setActivitySearch}
          placeholder="Buscar actividad"
          placeholderTextColor={C.textTertiary}
        />
      </View>

      {filtered.length === 0 ? (
        <Text style={{ padding: 20, color: C.textSecondary }}>No hay eventos que coincidan.</Text>
      ) : (
        filtered.map(log => (
          <View key={log.id} style={[styles.card, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
            <View style={[styles.icon, {
              backgroundColor: log.type === 'login' ? 'rgba(16,185,129,0.2)' : log.type === 'transaction' ? 'rgba(59,130,246,0.2)' : log.type === 'security' ? 'rgba(239,68,68,0.2)' : 'rgba(168,85,247,0.2)',
            }]}>
              <Text>{log.type === 'login' ? '↪' : log.type === 'transaction' ? '💰' : log.type === 'security' ? '🔒' : '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: C.textPrimary }}>{log.action}</Text>
              <Text style={{ color: C.textSecondary, marginTop: 2 }}>{log.description}</Text>
              <Text style={{ color: C.textTertiary, fontSize: 12, marginTop: 4 }}>{log.timestamp.toLocaleString('es-ES')}</Text>
            </View>
          </View>
        ))
      )}
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  filterBox: { marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)' },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(7,193,96,0.1)' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  search: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  card: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
