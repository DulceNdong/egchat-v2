/**
 * Mi Djangue — Detalle / Dashboard del grupo
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle, Check } from 'react-native-svg';
import { apiFetch } from '../src/api';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual',
};
const fmtAmount = (n: number, currency = 'XAF') =>
  `${Number(n).toLocaleString('fr-FR')} ${currency}`;
const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};
const initials = (name: string) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

interface Member {
  id: string; turn_order: number; user_id: string;
  user: { id: string; full_name: string; phone: string; avatar_url: string | null };
  paid_current_turn: boolean;
  is_current_beneficiary: boolean;
}

interface DjangueDetail {
  id: string; name: string; description: string;
  frequency: string; quota_amount: number; currency: string;
  status: string; current_turn: number; total_turns: number;
  next_payout_at: string | null; owner_id: string; secretary_id: string | null;
  members: Member[];
  wallet: { balance: number; currency: string };
  my_role: 'owner' | 'secretary' | 'member';
  my_turn_order: number | null;
  is_my_turn: boolean;
  total_paid_this_turn: number;
  expected_total_this_turn: number;
  paid_count: number;
  pending_count: number;
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ uri, name, size = 40 }: { uri?: string | null; name: string; size?: number }) {
  if (uri) return (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: '#fff' }}>{initials(name)}</Text>
    </View>
  );
}

// ── Fila de miembro ───────────────────────────────────────────────
function MemberRow({ member, isMe, quotaAmount, currency }: {
  member: Member; isMe: boolean; quotaAmount: number; currency: string;
}) {
  return (
    <View style={[m.row, member.is_current_beneficiary && m.rowBeneficiary]}>
      <View style={m.turnBadge}>
        <Text style={m.turnNum}>{member.turn_order}</Text>
      </View>
      <Avatar uri={member.user.avatar_url} name={member.user.full_name} size={38} />
      <View style={m.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={m.name}>{member.user.full_name}{isMe ? ' (yo)' : ''}</Text>
          {member.is_current_beneficiary && (
            <View style={m.benBadge}><Text style={m.benTxt}>Le toca</Text></View>
          )}
        </View>
        <Text style={m.phone}>{member.user.phone}</Text>
      </View>
      <View style={m.status}>
        {member.is_current_beneficiary ? (
          <Text style={m.receivingTxt}>Recibe</Text>
        ) : member.paid_current_turn ? (
          <View style={m.paidBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
            <Text style={m.paidTxt}>Pagó</Text>
          </View>
        ) : (
          <View style={m.pendingBadge}>
            <Text style={m.pendingTxt}>{fmtAmount(quotaAmount, currency)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Pantalla de detalle ───────────────────────────────────────────
export default function DjangueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData]       = useState<DjangueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState('');
  const [myUserId, setMyUserId] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const [detail, me] = await Promise.all([
        apiFetch(`/api/djangue/${id}`),
        apiFetch('/api/auth/me'),
      ]);
      setData(detail);
      setMyUserId(me?.id || '');
    } catch (e: any) {
      setError(e.message || 'Error al cargar el djangue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAddMember = () => {
    router.push({ pathname: '/djangue-add-member', params: { id } } as any);
  };

  const handlePay = () => {
    router.push({ pathname: '/djangue-pay', params: { id } } as any);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Djangue',
      '¿Estás seguro de que quieres cancelar este djangue? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar djangue', style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/djangue/${id}`, { method: 'DELETE' });
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  if (error || !data) return (
    <View style={s.center}>
      <Text style={{ color: '#ef4444', fontSize: 15 }}>{error || 'No encontrado'}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#6366f1', fontWeight: '700' }}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const collectionProgress = data.expected_total_this_turn > 0
    ? data.total_paid_this_turn / data.expected_total_this_turn
    : 0;

  const canPay = !data.is_my_turn && data.status === 'active';
  const isAdmin = data.my_role === 'owner' || data.my_role === 'secretary';

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
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>{data.name}</Text>
            <Text style={s.headerSub}>
              {FREQ_LABELS[data.frequency]} · {data.members.length} miembros
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity onPress={handleAddMember} style={s.iconBtn} hitSlop={12}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Circle cx="9" cy="8" r="4" />
                <Path d="M15 11c1.1 0 2 .9 2 2v1" />
                <Line x1="18" y1="11" x2="18" y2="17" />
                <Line x1="15" y1="14" x2="21" y2="14" />
                <Path d="M1 20c0-3.3 3.6-6 8-6" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
        }
      >
        {/* Monedero del djangue */}
        <LinearGradient colors={['#312e81', '#4c1d95']} style={s.walletCard}>
          <Text style={s.walletLabel}>Monedero del Djangue</Text>
          <Text style={s.walletBalance}>{fmtAmount(data.wallet.balance, data.wallet.currency)}</Text>
          <Text style={s.walletSub}>
            Turno {data.current_turn} de {data.total_turns} · Próximo cobro: {fmtDate(data.next_payout_at)}
          </Text>
        </LinearGradient>

        {/* Progreso del turno actual */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cotización — Turno {data.current_turn}</Text>
          <View style={s.progressRow}>
            <Text style={s.progressTxt}>
              {data.paid_count} de {data.members.length - 1} pagaron
            </Text>
            <Text style={s.progressTxt}>{fmtAmount(data.total_paid_this_turn, data.currency)}</Text>
          </View>
          <View style={s.progressBg}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={[s.progressFill, { width: `${Math.min(collectionProgress * 100, 100)}%` }]}
            />
          </View>
          <Text style={s.progressGoal}>
            Meta: {fmtAmount(data.expected_total_this_turn, data.currency)}
          </Text>
        </View>

        {/* Botón pagar cuota */}
        {canPay && (
          <TouchableOpacity onPress={handlePay} activeOpacity={0.85}>
            <LinearGradient colors={['#10b981', '#059669']} style={s.payBtn}>
              <Text style={s.payBtnTxt}>
                💳 Pagar cuota — {fmtAmount(data.quota_amount, data.currency)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Es mi turno */}
        {data.is_my_turn && data.status === 'active' && (
          <LinearGradient colors={['#f59e0b', '#d97706']} style={s.myTurnCard}>
            <Text style={s.myTurnEmoji}>🎉</Text>
            <View>
              <Text style={s.myTurnTitle}>¡Este turno te toca a ti!</Text>
              <Text style={s.myTurnSub}>
                Recibirás {fmtAmount(data.expected_total_this_turn, data.currency)} en tu monedero cuando todos paguen.
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Lista de miembros */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Integrantes y estado</Text>
          <View style={s.membersList}>
            {data.members.map(member => (
              <MemberRow
                key={member.id}
                member={member}
                isMe={member.user_id === myUserId}
                quotaAmount={data.quota_amount}
                currency={data.currency}
              />
            ))}
          </View>
        </View>

        {/* Descripción */}
        {data.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Descripción</Text>
            <Text style={s.descTxt}>{data.description}</Text>
          </View>
        ) : null}

        {/* Acciones admin */}
        {data.my_role === 'owner' && data.status === 'active' && (
          <TouchableOpacity onPress={handleCancel} style={s.cancelBtn}>
            <Text style={s.cancelTxt}>Cancelar Djangue</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 10 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  walletCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 4 },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  walletBalance: { fontSize: 32, fontWeight: '900', color: '#fff' },
  walletSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  section: { backgroundColor: '#1e1b4b', borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTxt: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, minWidth: 8 },
  progressGoal: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right' },
  payBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  myTurnCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  myTurnEmoji: { fontSize: 32 },
  myTurnTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  myTurnSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 17 },
  membersList: { gap: 2 },
  descTxt: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});

const m = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowBeneficiary: { backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 10, paddingHorizontal: 6 },
  turnBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  turnNum: { fontSize: 12, fontWeight: '700', color: '#a5b4fc' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  phone: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  benBadge: { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  benTxt: { fontSize: 10, fontWeight: '700', color: '#f59e0b' },
  status: { alignItems: 'flex-end' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  paidTxt: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  pendingTxt: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
  receivingTxt: { fontSize: 12, fontWeight: '700', color: '#a78bfa' },
});
