/**
 * Mi Djangue — Panel de Estadísticas del Administrador
 * Dashboard completo con métricas, gráficos y reportes
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { apiFetch } from '../src/api';

const { width } = Dimensions.get('window');

interface AdminStats {
  group_id: string;
  group_name: string;
  group_logo: string | null;
  currency: string;
  total_collected: number;
  total_delivered: number;
  total_penalties: number;
  active_members: number;
  completed_turns: number;
  total_turns: number;
  current_turn: number;
  overall_compliance_rate: number;
  on_time_payments: number;
  late_payments: number;
  upcoming_turns: Array<{
    turn_number: number;
    beneficiary_name: string;
    beneficiary_avatar: string | null;
    estimated_date: string;
    expected_amount: number;
  }>;
  recent_payouts: Array<{
    turn_number: number;
    beneficiary_name: string;
    amount: number;
    delivered_at: string;
  }>;
  top_contributors: Array<{
    user_name: string;
    total_contributed: number;
    on_time_rate: number;
  }>;
  members_with_penalties: Array<{
    user_name: string;
    pending_amount: number;
  }>;
}

const fmt = (n: number, c = 'XAF') => `${Number(n).toLocaleString('fr-FR')} ${c}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

function Avatar({ uri, name, size = 40 }: { uri?: string | null; name: string; size?: number }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: '#fff' }}>{initials}</Text>
    </View>
  );
}

export default function DjangueAdminStatsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const response = await apiFetch(`/api/djangue/${id}/admin-stats`);
      setData(response);
    } catch (e: any) {
      setError(e.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={s.loadingTxt}>Cargando estadísticas...</Text>
    </View>
  );

  if (error || !data) return (
    <View style={s.center}>
      <Text style={s.errorTxt}>{error || 'No encontrado'}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={s.linkTxt}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const complianceColor = data.overall_compliance_rate >= 90 ? '#10b981' : data.overall_compliance_rate >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {data.group_logo && <Image source={{ uri: data.group_logo }} style={{ width: 40, height: 40, borderRadius: 20, marginBottom: 4 }} contentFit="cover" />}
            <Text style={s.headerTitle} numberOfLines={1}>Estadísticas</Text>
            <Text style={s.headerSub}>{data.group_name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}>
        
        {/* Métricas principales */}
        <View style={s.metricsGrid}>
          <LinearGradient colors={['#10b981', '#059669']} style={s.metricCard}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </Svg>
            <Text style={s.metricValue}>{fmt(data.total_collected, data.currency)}</Text>
            <Text style={s.metricLabel}>Total recaudado</Text>
          </LinearGradient>

          <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.metricCard}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M12 6v6l4 2" />
            </Svg>
            <Text style={s.metricValue}>{fmt(data.total_delivered, data.currency)}</Text>
            <Text style={s.metricLabel}>Total entregado</Text>
          </LinearGradient>

          <LinearGradient colors={['#f59e0b', '#d97706']} style={s.metricCard}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <Line x1="12" y1="9" x2="12" y2="13" />
              <Line x1="12" y1="17" x2="12.01" y2="17" />
            </Svg>
            <Text style={s.metricValue}>{fmt(data.total_penalties, data.currency)}</Text>
            <Text style={s.metricLabel}>Moras aplicadas</Text>
          </LinearGradient>

          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={s.metricCard}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx="9" cy="7" r="4" />
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </Svg>
            <Text style={s.metricValue}>{data.active_members}</Text>
            <Text style={s.metricLabel}>Miembros activos</Text>
          </LinearGradient>
        </View>

        {/* Progreso general */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PROGRESO DEL DJANGUE</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={s.progressTxt}>Turno {data.current_turn} de {data.total_turns}</Text>
            <Text style={s.progressTxt}>{Math.round((data.completed_turns / data.total_turns) * 100)}%</Text>
          </View>
          <View style={s.progressBg}>
            <LinearGradient colors={['#10b981', '#059669']} 
              style={[s.progressFill, { width: `${(data.completed_turns / data.total_turns) * 100}%` }]} />
          </View>
        </View>

        {/* Cumplimiento */}
        <View style={s.card}>
          <Text style={s.cardLabel}>TASA DE CUMPLIMIENTO</Text>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View style={[s.complianceCircle, { borderColor: complianceColor }]}>
              <Text style={[s.complianceValue, { color: complianceColor }]}>{data.overall_compliance_rate}%</Text>
            </View>
          </View>
          <View style={s.complianceStats}>
            <View style={s.complianceStat}>
              <View style={[s.dot, { backgroundColor: '#10b981' }]} />
              <Text style={s.complianceStatTxt}>A tiempo: {data.on_time_payments}</Text>
            </View>
            <View style={s.complianceStat}>
              <View style={[s.dot, { backgroundColor: '#f59e0b' }]} />
              <Text style={s.complianceStatTxt}>Tarde: {data.late_payments}</Text>
            </View>
          </View>
        </View>

        {/* Próximos turnos */}
        {data.upcoming_turns && data.upcoming_turns.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>📅 PRÓXIMOS TURNOS</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {data.upcoming_turns.slice(0, 5).map((turn, idx) => (
                <View key={idx} style={r.row}>
                  <View style={r.turnBadge}>
                    <Text style={r.turnNum}>{turn.turn_number}</Text>
                  </View>
                  <Avatar uri={turn.beneficiary_avatar} name={turn.beneficiary_name} size={36} />
                  <View style={r.info}>
                    <Text style={r.name}>{turn.beneficiary_name}</Text>
                    <Text style={r.date}>{fmtDate(turn.estimated_date)}</Text>
                  </View>
                  <Text style={r.amount}>{fmt(turn.expected_amount, data.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Entregas recientes */}
        {data.recent_payouts && data.recent_payouts.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>💰 ENTREGAS RECIENTES</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {data.recent_payouts.slice(0, 5).map((payout, idx) => (
                <View key={idx} style={r.row}>
                  <View style={[r.iconBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                  </View>
                  <View style={r.info}>
                    <Text style={r.name}>{payout.beneficiary_name}</Text>
                    <Text style={r.date}>Turno {payout.turn_number} · {fmtDate(payout.delivered_at)}</Text>
                  </View>
                  <Text style={r.amount}>{fmt(payout.amount, data.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top contribuyentes */}
        {data.top_contributors && data.top_contributors.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>🏆 MEJORES CONTRIBUYENTES</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {data.top_contributors.slice(0, 5).map((contrib, idx) => (
                <View key={idx} style={r.row}>
                  <View style={r.rankBadge}>
                    <Text style={r.rankTxt}>{idx + 1}</Text>
                  </View>
                  <View style={r.info}>
                    <Text style={r.name}>{contrib.user_name}</Text>
                    <Text style={r.date}>{contrib.on_time_rate}% a tiempo</Text>
                  </View>
                  <Text style={r.amount}>{fmt(contrib.total_contributed, data.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Miembros con moras */}
        {data.members_with_penalties && data.members_with_penalties.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>⚠️ MORAS PENDIENTES</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {data.members_with_penalties.map((member, idx) => (
                <View key={idx} style={r.row}>
                  <View style={[r.iconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
                      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <Line x1="12" y1="9" x2="12" y2="13" />
                      <Line x1="12" y1="17" x2="12.01" y2="17" />
                    </Svg>
                  </View>
                  <View style={r.info}>
                    <Text style={r.name}>{member.user_name}</Text>
                    <Text style={r.date}>Mora pendiente</Text>
                  </View>
                  <Text style={[r.amount, { color: '#ef4444' }]}>{fmt(member.pending_amount, data.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00C8A0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1f3a' },
  loadingTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 16 },
  errorTxt: { color: '#ef4444', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  linkTxt: { color: '#6366f1', fontWeight: '700', fontSize: 15 },
  header: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 10 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { flex: 1, minWidth: (width - 32 - 10) / 2, borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  metricValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  card: { backgroundColor: '#2d3561', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  progressTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 4, minWidth: 8 },
  complianceCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  complianceValue: { fontSize: 28, fontWeight: '900' },
  complianceStats: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  complianceStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  complianceStatTxt: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
});

const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  turnBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  turnNum: { fontSize: 13, fontWeight: '700', color: '#a5b4fc' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  rankTxt: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  date: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  amount: { fontSize: 13, fontWeight: '800', color: '#10b981' },
});
