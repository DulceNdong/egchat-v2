/**
 * Djangue — Vista de información del grupo antes del chat
 * Diseño moderno con iconos SVG, tarjetas limpias y acceso directo al chat
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Line, Circle, Polyline, Rect } from 'react-native-svg';
import { apiFetch } from '../src/api';

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n: number, c = 'XAF') => `${Number(n).toLocaleString('fr-FR')} ${c}`;
const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const FREQ: Record<string, { label: string; color: string }> = {
  daily:   { label: 'Diario',   color: '#f59e0b' },
  weekly:  { label: 'Semanal',  color: '#10b981' },
  monthly: { label: 'Mensual',  color: '#6366f1' },
  annual:  { label: 'Anual',    color: '#ec4899' },
};

// ── Iconos SVG ─────────────────────────────────────────────────────
const IconBack = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round">
    <Line x1="19" y1="12" x2="5" y2="12"/><Path d="M12 19l-7-7 7-7"/>
  </Svg>
);
const IconChat = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </Svg>
);
const IconUsers = ({ color = '#6366f1' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);
const IconWallet = ({ color = '#10b981' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <Circle cx="18" cy="15" r="1" fill={color}/>
  </Svg>
);
const IconClock = ({ color = '#f59e0b' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10"/>
    <Path d="M12 6v6l4 2"/>
  </Svg>
);
const IconTrophy = ({ color = '#f59e0b' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <Path d="M4 22h16"/><Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </Svg>
);
const IconCheck = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M20 6L9 17l-5-5"/>
  </Svg>
);
const IconPending = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10"/>
    <Path d="M12 6v6l4 2"/>
  </Svg>
);
const IconTarget = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10"/>
    <Circle cx="12" cy="12" r="6"/>
    <Circle cx="12" cy="12" r="2"/>
  </Svg>
);
const IconChevron = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round">
    <Path d="M9 18l6-6-6-6"/>
  </Svg>
);
const IconSettings = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3"/>
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </Svg>
);
const IconStats = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/>
    <Line x1="6" y1="20" x2="6" y2="14"/><Line x1="2" y1="20" x2="22" y2="20"/>
  </Svg>
);

interface GroupInfo {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  frequency: string;
  quota_amount: number;
  currency?: string;
  max_members: number;
  status: string;
  current_turn: number;
  total_turns: number;
  my_role: 'owner' | 'secretary' | 'member';
  chat_group_id?: string | null;
  members?: Array<{
    id: string; user_id: string; turn_number?: number; turn_order?: number;
    users?: { full_name: string; avatar_url?: string | null };
  }>;
  wallet?: { balance: number } | null;
  current_turn_contributions?: Array<{ status: string; djangue_members?: { user_id: string } }>;
}

// ── Componente ─────────────────────────────────────────────────────
export default function DjangueChatInfoScreen() {
  const insets = useSafeAreaInsets();
  const { id: djangueId } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await apiFetch(`/api/djangue/${djangueId}`);
      setGroup(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el grupo');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [djangueId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openChat = () => {
    if (group?.chat_group_id) {
      router.push(`/chat/${group.chat_group_id}` as any);
    } else {
      Alert.alert('Chat no configurado', 'Este djangue aún no tiene grupo de chat.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['left', 'right']}>
        <View style={[s.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadTxt}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) return null;

  const freq = FREQ[group.frequency] ?? { label: group.frequency, color: '#6366f1' };
  const members = group.members || [];
  const contributions = group.current_turn_contributions || [];
  const paidCount = contributions.filter(c => c.status === 'paid').length;
  const currency = group.currency || 'XAF';
  const progress = group.total_turns > 0 ? Math.min((group.current_turn - 1) / group.total_turns, 1) : 0;
  const isAdmin = group.my_role === 'owner' || group.my_role === 'secretary';

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} hitSlop={12}>
          <IconBack />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
          <View style={s.headerBadgeRow}>
            <View style={[s.freqDot, { backgroundColor: freq.color }]} />
            <Text style={[s.freqLabel, { color: freq.color }]}>{freq.label}</Text>
            <Text style={s.headerDot}>·</Text>
            <Text style={s.roleLabel}>
              {group.my_role === 'owner' ? 'Administrador' :
               group.my_role === 'secretary' ? 'Secretario' : 'Integrante'}
            </Text>
          </View>
        </View>
        {/* Botón abrir chat */}
        <TouchableOpacity
          onPress={openChat}
          style={[s.chatBtn, !group.chat_group_id && { opacity: 0.4 }]}
          hitSlop={8}
        >
          <IconChat />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor="#6366f1"
          />
        }
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          {group.logo_url ? (
            <Image source={{ uri: group.logo_url }} style={s.heroAvatar} contentFit="cover" />
          ) : (
            <View style={[s.heroAvatarPlaceholder, { backgroundColor: freq.color + '18' }]}>
              <Text style={[s.heroInitials, { color: freq.color }]}>
                {initials(group.name)}
              </Text>
            </View>
          )}
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{group.name}</Text>
            {group.description ? <Text style={s.heroDesc} numberOfLines={2}>{group.description}</Text> : null}
            <View style={[s.statusPill, { backgroundColor: group.status === 'active' ? '#dcfce7' : '#f1f5f9' }]}>
              <View style={[s.statusDot, { backgroundColor: group.status === 'active' ? '#10b981' : '#94a3b8' }]} />
              <Text style={[s.statusTxt, { color: group.status === 'active' ? '#059669' : '#64748b' }]}>
                {group.status === 'active' ? 'Activo' : group.status === 'completed' ? 'Completado' : 'Pausado'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stats del ciclo ── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Progreso del ciclo</Text>
            <Text style={s.cardSub}>Turno {group.current_turn} de {group.total_turns || '?'}</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: freq.color }]} />
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <View style={[s.statIcon, { backgroundColor: freq.color + '18' }]}>
                <IconClock color={freq.color} />
              </View>
              <Text style={[s.statNum, { color: freq.color }]}>{group.quota_amount.toLocaleString()}</Text>
              <Text style={s.statLbl}>Cuota {freq.label} ({currency})</Text>
            </View>
            <View style={[s.statItem, s.statBorder]}>
              <View style={[s.statIcon, { backgroundColor: '#f0f1fe' }]}>
                <IconUsers />
              </View>
              <Text style={s.statNum}>{members.length}/{group.max_members}</Text>
              <Text style={s.statLbl}>Integrantes</Text>
            </View>
            <View style={s.statItem}>
              <View style={[s.statIcon, { backgroundColor: '#f0fdf4' }]}>
                <IconWallet />
              </View>
              <Text style={[s.statNum, { color: '#10b981' }]}>{group.wallet?.balance?.toLocaleString() ?? '0'}</Text>
              <Text style={s.statLbl}>Balance ({currency})</Text>
            </View>
          </View>
        </View>

        {/* ── Turno actual — pagos ── */}
        {members.length > 0 && (
          <View style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardTitle}>Turno {group.current_turn}</Text>
              <View style={s.paidPill}>
                <Text style={s.paidPillTxt}>{paidCount}/{members.length} pagaron</Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, {
                width: members.length > 0 ? `${Math.round((paidCount / members.length) * 100)}%` as any : '0%',
                backgroundColor: '#10b981',
              }]} />
            </View>
            {members.map(m => {
              const contrib = contributions.find(c => c.djangue_members?.user_id === m.user_id);
              const paid = contrib?.status === 'paid';
              const isBeneficiary = (m.turn_number ?? m.turn_order) === group.current_turn;
              return (
                <View key={m.id} style={s.memberRow}>
                  {m.users?.avatar_url ? (
                    <Image source={{ uri: m.users.avatar_url }} style={s.memberAvatar} contentFit="cover" />
                  ) : (
                    <View style={[s.memberAvatarPh, { backgroundColor: freq.color + '20' }]}>
                      <Text style={[s.memberInitials, { color: freq.color }]}>
                        {initials(m.users?.full_name || '?')}
                      </Text>
                    </View>
                  )}
                  <View style={s.memberInfo}>
                    <Text style={s.memberName} numberOfLines={1}>{m.users?.full_name || 'Integrante'}</Text>
                    <Text style={s.memberTurn}>Turno #{m.turn_number ?? m.turn_order}</Text>
                  </View>
                  {isBeneficiary
                    ? <View style={s.chipActive}><IconTarget /><Text style={[s.chipTxt, { color: '#6366f1' }]}>Su turno</Text></View>
                    : paid
                    ? <View style={s.chipPaid}><IconCheck /><Text style={[s.chipTxt, { color: '#10b981' }]}>Pagó</Text></View>
                    : <View style={s.chipPending}><IconPending /><Text style={[s.chipTxt, { color: '#d97706' }]}>Pendiente</Text></View>
                  }
                </View>
              );
            })}
          </View>
        )}

        {/* ── Accesos rápidos (admin) ── */}
        {isAdmin && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Gestión</Text>
            {[
              { label: 'Configuración', sub: 'Editar nombre, cuota y frecuencia', route: '/djangue-admin-settings', icon: <IconSettings /> },
              { label: 'Estadísticas', sub: 'Ver reportes y análisis del ciclo', route: '/djangue-admin-stats', icon: <IconStats /> },
            ].map(item => (
              <TouchableOpacity
                key={item.route}
                style={s.actionRow}
                onPress={() => router.push({ pathname: item.route, params: { id: djangueId } } as any)}
                activeOpacity={0.75}
              >
                <View style={s.actionIcon}>{item.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={s.actionLabel}>{item.label}</Text>
                  <Text style={s.actionSub}>{item.sub}</Text>
                </View>
                <IconChevron />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Botón flotante — Abrir Chat ── */}
      <View style={[s.fab, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          onPress={openChat}
          style={[s.fabBtn, !group.chat_group_id && { backgroundColor: '#94a3b8' }]}
          activeOpacity={0.85}
        >
          <IconChat />
          <Text style={s.fabTxt}>
            {group.chat_group_id ? 'Abrir chat del grupo' : 'Chat no disponible'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  freqDot: { width: 6, height: 6, borderRadius: 3 },
  freqLabel: { fontSize: 11, fontWeight: '700' },
  headerDot: { fontSize: 11, color: '#cbd5e1' },
  roleLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  chatBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  heroAvatar: { width: 64, height: 64, borderRadius: 16 },
  heroAvatarPlaceholder: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroInitials: { fontSize: 24, fontWeight: '900' },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  heroDesc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  cardSub: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // Progreso
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: '#e2e8f0' },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  statLbl: { fontSize: 9, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },

  // Pill pagados
  paidPill: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  paidPillTxt: { fontSize: 11, fontWeight: '700', color: '#059669' },

  // Miembros
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 10 },
  memberAvatarPh: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 14, fontWeight: '800' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  memberTurn: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  chipActive: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipPaid: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipPending: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef9c3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipTxt: { fontSize: 10, fontWeight: '700' },

  // Acciones admin
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f1fe', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  actionSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  // FAB
  fab: { position: 'absolute', left: 16, right: 16 },
  fabBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  fabTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
