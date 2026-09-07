/**
 * Mi Djangue - Lista de Mis Djangues
 * Tabs: Administro / Participo
 * Diseño simple y claro para adultos mayores
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Image } from 'expo-image';
import { apiFetch } from '../src/api';

interface DjangueItem {
  id: string;
  name: string;
  logo_url: string | null;
  frequency: string;
  quota_amount: number;
  currency: string;
  my_role: 'owner' | 'secretary' | 'member';
  status: string;
  current_turn: number;
  total_turns: number;
  my_turn_order: number;
  is_my_turn: boolean;
  paid_current_turn: boolean;   // campo del servidor = my_paid_this_turn
  my_paid_this_turn?: boolean;  // alias del servidor
  next_payout_date: string | null;
  member_count: number;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  annual: 'Anual',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Administrador',
  secretary: 'Secretario',
  member: 'Integrante',
};

const fmt = (n: number, c = 'XAF') => `${Number(n).toLocaleString('fr-FR')} ${c}`;

function DjangueCard({ djangue, onPress }: { djangue: DjangueItem; onPress: () => void }) {
  const isAdmin = djangue.my_role === 'owner' || djangue.my_role === 'secretary';
  
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.cardGradient}>
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.cardHeaderLeft}>
            {djangue.logo_url ? (
              <Image
                source={{ uri: djangue.logo_url }}
                style={s.logo}
                contentFit="cover"
              />
            ) : (
              <View style={[s.logoPlaceholder, { backgroundColor: isAdmin ? '#f0f1fe' : '#f0fdf4' }]}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke={isAdmin ? '#6366f1' : '#10b981'} strokeWidth={2} />
                  <Path d="M12 6v12M6 12h12" stroke={isAdmin ? '#6366f1' : '#10b981'} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.cardName} numberOfLines={1}>{djangue.name}</Text>
              <Text style={s.cardRole}>{ROLE_LABELS[djangue.my_role]}</Text>
            </View>
          </View>
          
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>

        {/* Info Grid */}
        <View style={s.infoGrid}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Frecuencia</Text>
            <Text style={s.infoValue}>{FREQ_LABELS[djangue.frequency]}</Text>
          </View>
          
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Cuota</Text>
            <Text style={s.infoValue}>{fmt(djangue.quota_amount, djangue.currency)}</Text>
          </View>
          
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Turno</Text>
            <Text style={s.infoValue}>{djangue.current_turn}/{djangue.total_turns}</Text>
          </View>
        </View>

        {/* Status Badge */}
        {djangue.is_my_turn && (
          <View style={s.myTurnBadge}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#f59e0b" strokeWidth={2} />
              <Path d="M12 6v6l4 2" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={s.myTurnText}>¡Es tu turno!</Text>
          </View>
        )}
        
        {!djangue.is_my_turn && !djangue.paid_current_turn && (
          <View style={s.pendingBadge}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#ef4444" strokeWidth={2} />
              <Path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={s.pendingText}>Pendiente de pago</Text>
          </View>
        )}
        
        {!djangue.is_my_turn && djangue.paid_current_turn && (
          <View style={s.paidBadge}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#10b981" strokeWidth={2} />
              <Path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={s.paidText}>Al día</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DjangueListScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'admin' | 'member'>('member');
  const [adminDjangues, setAdminDjangues] = useState<DjangueItem[]>([]);
  const [memberDjangues, setMemberDjangues] = useState<DjangueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/djangue/my-list');
      setAdminDjangues(response.admin || []);
      setMemberDjangues(response.member || []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar djangues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const currentList = activeTab === 'admin' ? adminDjangues : memberDjangues;

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Line x1="19" y1="12" x2="5" y2="12" />
            <Path d="M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mis Djangues</Text>
        <TouchableOpacity
          onPress={() => router.push('/djangue-admin-create')}
          style={s.iconBtn} hitSlop={12}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="12" y1="5" x2="12" y2="19" />
            <Line x1="5" y1="12" x2="19" y2="12" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'member' && s.tabActive]}
          onPress={() => setActiveTab('member')}
        >
          <Text style={[s.tabText, activeTab === 'member' && s.tabTextActive]}>
            Participo ({memberDjangues.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'admin' && s.tabActive]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[s.tabText, activeTab === 'admin' && s.tabTextActive]}>
            Administro ({adminDjangues.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#00C8A0" />
          <Text style={s.loadingTxt}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={s.retryBtn}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : currentList.length === 0 ? (
        <View style={s.empty}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="rgba(0,200,160,0.3)" strokeWidth={2} />
            <Path d="M8 12h8M12 8v8" stroke="rgba(0,200,160,0.3)" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={s.emptyTitle}>
            {activeTab === 'admin' ? 'No administras ningún djangue' : 'No participas en ningún djangue'}
          </Text>
          <Text style={s.emptySub}>
            {activeTab === 'admin'
              ? 'Crea tu primer djangue para empezar'
              : 'Únete a un djangue para comenzar a ahorrar'}
          </Text>
          {activeTab === 'admin' && (
            <TouchableOpacity
              style={s.createBtn}
              onPress={() => router.push('/djangue-admin-create')}
            >
              <Text style={s.createBtnTxt}>Crear Djangue</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor="#00C8A0"
            />
          }
        >
          {currentList.map((djangue) => (
            <DjangueCard
              key={djangue.id}
              djangue={djangue}
              onPress={() => {
                const screen = activeTab === 'admin' ? '/djangue-detail' : '/djangue-member';
                router.push({ pathname: screen, params: { id: djangue.id } } as any);
              }}
            />
          ))}
          
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, gap: 4, paddingBottom: 0 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTxt: { marginTop: 16, fontSize: 14, color: '#94a3b8' },
  errorTxt: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#6366f1', borderRadius: 10 },
  retryTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  createBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#6366f1', borderRadius: 12 },
  createBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  // Cards
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardGradient: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9' },
  logoPlaceholder: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  cardRole: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  infoGrid: { flexDirection: 'row', gap: 8 },
  infoBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  infoLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  myTurnBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef9c3', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#fde68a' },
  myTurnText: { fontSize: 13, fontWeight: '700', color: '#d97706' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#fecaca' },
  pendingText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#dcfce7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  paidText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
});
