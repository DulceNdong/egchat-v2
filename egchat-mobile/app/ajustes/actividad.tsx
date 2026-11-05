import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SettingsLayout, SettingsSection } from '../../src/components/settings/SettingsUI';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme';
import { DarkColors } from '../../src/theme/darkMode';
import { getToken, getApiBase } from '../../src/api';

interface ActivityLogItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'login' | 'transaction' | 'security' | 'profile' | 'chat';
}

const TYPE_ICON: Record<string, string> = {
  login: '🔑', transaction: '💰', security: '🔒', profile: '👤', chat: '💬',
};
const TYPE_COLOR: Record<string, string> = {
  login: '#d1fae5', transaction: '#dbeafe', security: '#fee2e2', profile: '#f3e8ff', chat: '#e0f2fe',
};

export default function ActividadScreen() {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ActivityLogItem['type']>('all');
  const [search, setSearch] = useState('');
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const base  = getApiBase();
        const res   = await fetch(`${base}/api/auth/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const filtered = items.filter(log => {
    if (filter !== 'all' && log.type !== filter) return false;
    const q = search.trim().toLowerCase();
    if (q && !(`${log.action} ${log.description}`.toLowerCase().includes(q))) return false;
    return true;
  });

  const Chip = ({ id, label }: { id: string; label: string }) => {
    const active = filter === id;
    return (
      <TouchableOpacity style={[st.chip, active && st.chipActive]} onPress={() => setFilter(id as any)}>
        <Text style={[st.chipTxt, active && { color: Colors.accent }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SettingsLayout title="Registro de actividad">
      <View style={[st.filters, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={st.chipRow}>
          {['all','login','transaction','security','profile','chat'].map(t => (
            <Chip key={t} id={t} label={
              t === 'all' ? 'Todo' : t === 'login' ? 'Login' :
              t === 'transaction' ? 'Transacciones' : t === 'security' ? 'Seguridad' :
              t === 'profile' ? 'Perfil' : 'Chats'
            }/>
          ))}
        </View>
        <TextInput
          style={[st.search, { color: C.textPrimary, borderColor: C.borderLight }]}
          value={search} onChangeText={setSearch}
          placeholder="Buscar actividad..." placeholderTextColor={C.textTertiary}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }}/>
      ) : filtered.length === 0 ? (
        <Text style={{ padding: 24, color: C.textSecondary, textAlign: 'center' }}>Sin actividad registrada</Text>
      ) : (
        filtered.map(log => (
          <View key={log.id} style={[st.card, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
            <View style={[st.icon, { backgroundColor: TYPE_COLOR[log.type] || '#f3f4f6' }]}>
              <Text style={{ fontSize: 16 }}>{TYPE_ICON[log.type] || '•'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.title, { color: C.textPrimary }]}>{log.action}</Text>
              <Text style={[st.desc, { color: C.textSecondary }]}>{log.description}</Text>
              <Text style={[st.time, { color: C.textTertiary }]}>
                {new Date(log.timestamp).toLocaleString('es-ES')}
              </Text>
            </View>
          </View>
        ))
      )}
    </SettingsLayout>
  );
}

const st = StyleSheet.create({
  filters: { marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)' },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(7,193,96,0.1)' },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  search: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  card: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 11, marginTop: 4 },
});
