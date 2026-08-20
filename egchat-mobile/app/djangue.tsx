/**
 * Mi Djangue — Pantalla principal (lista de djangues)
 * Tanda / Caja de ahorro grupal — EGChat
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import { apiFetch } from '../src/api';

// ── Tipos ─────────────────────────────────────────────────────────
interface DjangueGroup {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
  quota_amount: number;
  currency: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_turn: number;
  total_turns: number;
  next_payout_at: string | null;
  wallet_balance: number;
  member_count: number;
  my_role: 'owner' | 'secretary' | 'member';
  my_turn_order: number | null;
  my_paid_this_turn: boolean;
  is_my_turn: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────
const FREQ_LABELS: Record<string, string> = {
  daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual',
};
const FREQ_COLORS: Record<string, [string, string]> = {
  daily:   ['#f59e0b', '#d97706'],
  weekly:  ['#10b981', '#059669'],
  monthly: ['#6366f1', '#4f46e5'],
  annual:  ['#ec4899', '#db2777'],
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
};
const fmtAmount = (n: number, currency = 'XAF') =>
  `${n.toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// ── Icono Djangue ─────────────────────────────────────────────────
function DjangueIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <Path d="M17 11l2 2 4-4" />
    </Svg>
  );
}

// ── Tarjeta de grupo ──────────────────────────────────────────────
function DjangueCard({ group, onPress }: { group: DjangueGroup; onPress: () => void }) {
  const colors = FREQ_COLORS[group.frequency] ?? ['#6366f1', '#4f46e5'];
  const progress = group.total_turns > 0 ? (group.current_turn - 1) / group.total_turns : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={c.card}>
      <View style={c.cardHeader}>
        <LinearGradient colors={colors} style={c.cardBadge}>
          <Text style={c.cardBadgeTxt}>{FREQ_LABELS[group.frequency]}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={c.cardName} numberOfLines={1}>{group.name}</Text>
          <Text style={c.cardSub}>
            {group.member_count} miembro{group.member_count !== 1 ? 's' : ''} ·{' '}
            {fmtAmount(group.quota_amount, group.currency)}/turno
          </Text>
        </View>
        <View style={[c.statusDot, { backgroundColor: group.status === 'active' ? '#10b981' : '#6b7280' }]} />
      </View>

      {/* Barra de progreso de turnos */}
      <View style={c.progressRow}>
        <Text style={c.progressTxt}>Turno {group.current_turn} / {group.total_turns || '?'}</Text>
        <Text style={c.progressTxt}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={c.progressBg}>
        <LinearGradient colors={colors} style={[c.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Info inferior */}
      <View style={c.cardFooter}>
        <View style={c.footerItem}>
          <Text style={c.footerLabel}>Monedero</Text>
          <Text style={c.footerValue}>{fmtAmount(group.wallet_balance, group.currency)}</Text>
        </View>
        <View style={c.footerItem}>
          <Text style={c.footerLabel}>Próximo cobro</Text>
          <Text style={c.footerValue}>{fmtDate(group.next_payout_at)}</Text>
        </View>
        <View style={c.footerItem}>
          <Text style={c.footerLabel}>Mi rol</Text>
          <Text style={[c.footerValue, { color: group.my_role === 'owner' ? '#f59e0b' : group.my_role === 'secretary' ? '#6366f1' : '#10b981' }]}>
            {group.my_role === 'owner' ? 'Responsable' : group.my_role === 'secretary' ? 'Secretario' : 'Miembro'}
          </Text>
        </View>
      </View>

      {/* Badge si es mi turno */}
      {group.is_my_turn && group.status === 'active' && (
        <LinearGradient colors={['#10b981', '#059669']} style={c.myTurnBadge}>
          <Text style={c.myTurnTxt}>🎉 ¡Este turno te toca a ti!</Text>
        </LinearGradient>
      )}

      {/* Badge si no he pagado */}
      {!group.my_paid_this_turn && !group.is_my_turn && group.status === 'active' && (
        <View style={c.unpaidBadge}>
          <Text style={c.unpaidTxt}>⚠️ Cuota pendiente — {fmtAmount(group.quota_amount, group.currency)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function DjangueScreen() {
  const [groups, setGroups]     = useState<DjangueGroup[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/djangue');
      setGroups(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar los djangues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activeGroups    = groups.filter(g => g.status === 'active');
  const inactiveGroups  = groups.filter(g => g.status !== 'active');

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Mi Djangue</Text>
            <Text style={s.headerSub}>Caja de ahorro grupal</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/djangue-create' as any)}
            style={s.iconBtn} hitSlop={12}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="12" y1="5" x2="12" y2="19" />
              <Line x1="5" y1="12" x2="19" y2="12" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Stats rápidas */}
        {!loading && groups.length > 0 && (
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{activeGroups.length}</Text>
              <Text style={s.statLbl}>Activos</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statVal}>
                {groups.filter(g => g.is_my_turn).length}
              </Text>
              <Text style={s.statLbl}>Me toca</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statVal}>
                {groups.filter(g => !g.my_paid_this_turn && !g.is_my_turn && g.status === 'active').length}
              </Text>
              <Text style={s.statLbl}>Pendientes</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadingTxt}>Cargando djangues...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorEmoji}>😞</Text>
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : groups.length === 0 ? (
        <View style={s.center}>
          <DjangueIcon color="#6366f1" size={56} />
          <Text style={s.emptyTitle}>Sin djangues todavía</Text>
          <Text style={s.emptyDesc}>Crea tu primer grupo de ahorro o espera una invitación del responsable.</Text>
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => router.push('/djangue-create' as any)}
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.createBtnGrad}>
              <Text style={s.createBtnTxt}>+ Crear Djangue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...activeGroups, ...inactiveGroups]}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor="#6366f1"
            />
          }
          ListHeaderComponent={
            <TouchableOpacity
              style={s.newBtn}
              onPress={() => router.push('/djangue-create' as any)}
            >
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.newBtnGrad}>
                <Text style={s.newBtnTxt}>+ Crear nuevo Djangue</Text>
              </LinearGradient>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <DjangueCard
              group={item}
              onPress={() => router.push({ pathname: '/djangue-detail', params: { id: item.id } } as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingTxt: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  errorEmoji: { fontSize: 40 },
  errorTxt: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: '#fff', fontWeight: '700' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },
  createBtn: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  createBtnGrad: { paddingHorizontal: 28, paddingVertical: 13 },
  createBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  list: { padding: 16, gap: 12 },
  newBtn: { marginBottom: 4, borderRadius: 12, overflow: 'hidden' },
  newBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  newBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const c = StyleSheet.create({
  card: { backgroundColor: '#1e1b4b', borderRadius: 16, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cardBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cardName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTxt: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, minWidth: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 },
  footerItem: { alignItems: 'center', flex: 1 },
  footerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 },
  footerValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  myTurnBadge: { borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  myTurnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  unpaidBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  unpaidTxt: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
});
