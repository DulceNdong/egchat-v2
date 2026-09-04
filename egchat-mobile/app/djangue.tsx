/**
 * Mi Djangue — Pantalla principal (lista de djangues)
 * Tanda / Caja de ahorro grupal — EGChat
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ── Iconos de frecuencia ──────────────────────────────────────────
function FrequencyIcon({ type, size = 18 }: { type: string; size?: number }) {
  const color = '#fff';
  
  switch (type) {
    case 'daily':
      // Sol (diario)
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Circle cx="12" cy="12" r="4" />
          <Line x1="12" y1="1" x2="12" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="23" />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <Line x1="1" y1="12" x2="3" y2="12" />
          <Line x1="21" y1="12" x2="23" y2="12" />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </Svg>
      );
    
    case 'weekly':
      // Calendario con checkmark (semanal)
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Line x1="3" y1="10" x2="21" y2="10" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Path d="M9 16l2 2 4-4" />
        </Svg>
      );
    
    case 'monthly':
      // Calendario completo (mensual)
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Line x1="3" y1="10" x2="21" y2="10" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="8" y1="14" x2="8" y2="14.01" />
          <Line x1="12" y1="14" x2="12" y2="14.01" />
          <Line x1="16" y1="14" x2="16" y2="14.01" />
          <Line x1="8" y1="18" x2="8" y2="18.01" />
          <Line x1="12" y1="18" x2="12" y2="18.01" />
        </Svg>
      );
    
    case 'annual':
      // Trofeo (anual)
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <Path d="M4 22h16" />
          <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </Svg>
      );
    
    default:
      return null;
  }
}

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
function DjangueCard({ group, onPress, index }: { group: DjangueGroup; onPress: () => void; index: number }) {
  const colors = FREQ_COLORS[group.frequency] ?? ['#6366f1', '#4f46e5'];
  const progress = group.total_turns > 0 ? (group.current_turn - 1) / group.total_turns : 0;

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={c.card}>
      <View style={c.cardHeader}>
        <LinearGradient colors={colors} style={c.cardBadge}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FrequencyIcon type={group.frequency} size={14} />
            <Text style={c.cardBadgeTxt}>{FREQ_LABELS[group.frequency]}</Text>
          </View>
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
    </Animated.View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function DjangueScreen() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups]     = useState<DjangueGroup[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Debes iniciar sesión para acceder a Mi Djangue');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await apiFetch('/api/djangues');
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
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={[s.header, { paddingTop: insets.top + 16 }]}>
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
            <LinearGradient colors={['#00C8A0', '#00B4E6']} style={s.createBtnGrad}>
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
              <LinearGradient colors={['#00C8A0', '#00B4E6']} style={s.newBtnGrad}>
                <Text style={s.newBtnTxt}>+ Crear nuevo Djangue</Text>
              </LinearGradient>
            </TouchableOpacity>
          }
          renderItem={({ item, index }) => (
            <DjangueCard
              group={item}
              index={index}
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
  root: { flex: 1, backgroundColor: '#00C8A0' }, // Fondo azul oscuro profesional
  header: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 }, // Más padding bottom
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 26, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingTxt: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  errorEmoji: { fontSize: 40 },
  errorTxt: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: { backgroundColor: '#00C8A0', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: '#fff', fontWeight: '700' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  createBtn: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  createBtnGrad: { paddingHorizontal: 28, paddingVertical: 13 },
  createBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  list: { padding: 16, gap: 14 },
  newBtn: { marginBottom: 6, borderRadius: 12, overflow: 'hidden' },
  newBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  newBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const c = StyleSheet.create({
  card: { backgroundColor: '#2d3561', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  cardBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  cardName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  progressTxt: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  progressBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, minWidth: 7 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 2 },
  footerItem: { alignItems: 'center', flex: 1 },
  footerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3, textTransform: 'uppercase', fontWeight: '600' },
  footerValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
  myTurnBadge: { borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  myTurnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  unpaidBadge: { backgroundColor: 'rgba(245,158,11,0.18)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  unpaidTxt: { fontSize: 12, color: '#fbbf24', fontWeight: '700' },
});
