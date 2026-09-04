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
  paid_current_turn: boolean;
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
      <LinearGradient
        colors={isAdmin ? ['#6366f1', '#4f46e5'] : ['#00C8A0', '#00B4E6']}
        style={s.cardGradient}
      >
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
              <View style={s.logoPlaceholder}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
                  <Path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.cardName} numberOfLines={1}>{djangue.name}</Text>
              <Text style={s.cardRole}>{ROLE_LABELS[djangue.my_role]}</Text>
            </View>
          </View>
          
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
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
      </LinearGradient>
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
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Line x1="19" y1="12" x2="5" y2="12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              <Path d="M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          
          <Text style={s.headerTitle}>Mis Djangues</Text>
          
          <TouchableOpacity
            onPress={() => router.push('/djangue-admin-create')}
            style={s.iconBtn}
            hitSlop={12}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2.5} />
              <Path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
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
      </LinearGradient>

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
  root: { flex: 1, backgroundColor: '#00C8A0' },
  header: { paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: '#00C8A0',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTxt: { marginTop: 16, fontSize: 15, color: 'rgba(0,0,0,0.5)' },
  errorTxt: { fontSize: 15, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00C8A0', borderRadius: 12 },
  retryTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(0,0,0,0.8)', textAlign: 'center' },
  emptySub: { fontSize: 14, color: 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 20 },
  createBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#00C8A0', borderRadius: 12 },
  createBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  myTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  myTurnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  paidText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
});
