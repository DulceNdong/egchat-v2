import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Line, Polyline } from 'react-native-svg';
import { walletAPI } from '../src/api';
import { LinearGradient } from 'expo-linear-gradient';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0 });
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const isCredit = (type: string) =>
  ['deposit', 'recharge', 'transfer_received', 'received', 'salary'].includes(type);

const normalizeType = (type: string): string => {
  if (type === 'transfer_sent' || type === 'withdraw') return 'sent';
  if (type === 'transfer_received' || type === 'deposit' || type === 'recharge') return 'received';
  return type;
};

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'sent', label: 'Enviadas' },
  { id: 'received', label: 'Recibidas' },
  { id: 'payment', label: 'Pagos' },
  { id: 'deposit', label: 'Depósitos' },
  { id: 'withdrawal', label: 'Retiros' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

export default function HistorialCompletoScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const res = await walletAPI.getTransactions(1);
      setTransactions(res.transactions || []);
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true;
    const t = normalizeType(tx.type || '');
    if (filter === 'withdrawal') return t === 'withdraw' || t === 'sent' && tx.type === 'withdraw';
    return t === filter || tx.type === filter;
  });

  return (
    <SafeAreaView style={s.container} edges={['left', 'right']}>
      <LinearGradient
        colors={['#e8f5f2', '#f0f7ff', '#eef4fb', '#e6f5f0']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.title}>Historial Completo</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Svg width={16} height={16} viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[s.chip, filter === f.id && s.chipActive]}
          >
            <Text style={[s.chipText, filter === f.id && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#00c8a0" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={s.emptyTitle}>Sin transacciones</Text>
              <Text style={s.emptySub}>No hay movimientos en esta categoría</Text>
            </View>
          ) : filtered.map((tx, i) => {
            const credit = isCredit(tx.type);
            return (
              <TouchableOpacity key={tx.id || i} style={s.txRow} activeOpacity={0.7}>
                <View style={[s.txIcon, { backgroundColor: credit ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }]}>
                  {credit ? (
                    <Svg width={16} height={16} viewBox="0 0 24 24" stroke="#00c8a0" strokeWidth={1.8} strokeLinecap="round">
                      <Line x1="12" y1="5" x2="12" y2="19" /><Polyline points="19 12 12 19 5 12" />
                    </Svg>
                  ) : (
                    <Svg width={16} height={16} viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round">
                      <Line x1="12" y1="19" x2="12" y2="5" /><Polyline points="5 12 12 5 19 12" />
                    </Svg>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>
                    {credit ? '↙️ Recibido' : '↗️ Enviado'}
                  </Text>
                  <Text style={s.txDesc} numberOfLines={1}>
                    {tx.description || tx.method || tx.type}
                  </Text>
                  <Text style={s.txDate}>{formatDate(tx.created_at || tx.date || new Date().toISOString())}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.txAmount, { color: credit ? '#00e5ff' : '#f87171' }]}>
                    {credit ? '+' : '-'}{fmt(tx.amount || 0)}
                  </Text>
                  <Text style={s.txCurrency}>XAF</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f4c3a' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(243,244,246,0.85)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  filters: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)',
  },
  chipActive: { backgroundColor: '#00c8a0', borderColor: 'rgba(0,180,140,0.6)' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1f4e3d' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 100 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  txTitle: { fontSize: 12, fontWeight: '700', color: '#0d0d0d' },
  txDesc: { fontSize: 11, color: '#374151', marginTop: 2 },
  txDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 12, fontWeight: '800' },
  txCurrency: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#1f4e3d' },
  emptySub: { fontSize: 13, color: '#6b9e8a' },
});
