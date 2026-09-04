/**
 * Mi Djangue — Detalle del Djangue
 * Vista completa para administradores con lista de integrantes y acciones
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { apiFetch } from '../src/api';

interface DjangueDetail {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  logo_url: string | null;
  frequency: string;
  quota_amount: number;
  currency: string;
  max_members: number;
  penalty_percent: number;
  status: string;
  current_turn: number;
  total_turns: number;
  my_role: 'owner' | 'secretary' | 'member';
  my_turn_number: number;
  is_my_turn: boolean;
  owner_id: string;
  secretary_id: string | null;
  members: Member[];
  wallet: {
    balance: number;
    currency: string;
  } | null;
  current_turn_contributions: Contribution[];
  chat_group_id?: string | null;
}

interface Member {
  id: string;
  user_id: string;
  turn_number: number;
  status: string;
  users: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url: string | null;
  };
}

interface Contribution {
  id: string;
  amount: number;
  status: string;
  djangue_members: {
    user_id: string;
    turn_number: number;
  };
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  annual: 'Anual',
};

export default function DjangueDetailScreen() {
  const params = useLocalSearchParams();
  const djangueId = params.id as string;

  const [djangue, setDjangue] = useState<DjangueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadDjangue = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await apiFetch(`/api/djangue/${djangueId}`);
      setDjangue(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cargar el djangue');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDjangue();
    }, [djangueId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDjangue(true);
  };

  const handleAddMember = async () => {
    if (!newMemberPhone.trim()) {
      Alert.alert('Error', 'Ingresa el teléfono del nuevo miembro');
      return;
    }

    setAddingMember(true);
    try {
      await apiFetch(`/api/djangue/${djangueId}/members`, {
        method: 'POST',
        body: JSON.stringify({ phone: newMemberPhone.trim() }),
      });

      Alert.alert('✅ Miembro agregado', 'El usuario fue agregado exitosamente al djangue');
      setNewMemberPhone('');
      setShowAddMember(false);
      loadDjangue(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo agregar el miembro');
    } finally {
      setAddingMember(false);
    }
  };

  const handleOpenChat = () => {
    if (djangue?.chat_group_id) {
      router.push(`/chat/${djangue.chat_group_id}` as any);
    } else {
      Alert.alert(
        'Chat no disponible',
        'Este djangue aún no tiene un grupo de chat configurado.\nContacta al administrador.',
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#00C8A0" />
          <Text style={s.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!djangue) {
    return null;
  }

  const isAdmin = djangue.my_role === 'owner' || djangue.my_role === 'secretary';
  const paidCount = (djangue.current_turn_contributions || []).filter(c => c.status === 'paid').length;
  const pendingCount = (djangue.members || []).length - paidCount;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.gradient}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Line x1="19" y1="12" x2="5" y2="12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              <Path d="M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>{djangue.name}</Text>
            <Text style={s.headerSub}>
              {djangue.my_role === 'owner' ? '👑 Administrador' : djangue.my_role === 'secretary' ? '📋 Secretario' : '👤 Integrante'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleOpenChat} style={s.chatBtn} hitSlop={12}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
          }
        >
          {/* Logo y Info Principal */}
          <View style={s.heroCard}>
            {djangue.logo_url ? (
              <Image source={{ uri: djangue.logo_url }} style={s.heroLogo} contentFit="cover" />
            ) : (
              <View style={s.heroLogoPlaceholder}>
                <Text style={s.heroLogoEmoji}>💰</Text>
              </View>
            )}
            <Text style={s.heroName}>{djangue.name}</Text>
            {djangue.slogan && <Text style={s.heroSlogan}>{djangue.slogan}</Text>}
            {djangue.description && <Text style={s.heroDesc}>{djangue.description}</Text>}
          </View>

          {/* Stats */}
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{djangue.current_turn}/{djangue.total_turns}</Text>
              <Text style={s.statLabel}>Turno Actual</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{(djangue.members || []).length}/{djangue.max_members}</Text>
              <Text style={s.statLabel}>Miembros</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>
                {djangue.quota_amount.toLocaleString()} {djangue.currency}
              </Text>
              <Text style={s.statLabel}>Cuota {FREQUENCY_LABELS[djangue.frequency]}</Text>
            </View>
          </View>

          {/* Balance del Wallet */}
          {isAdmin && djangue.wallet && (
            <View style={s.walletCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={s.walletGradient}>
                <View style={s.walletHeader}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 12V7H5a2 2 0 0 1 0-4h14v4"
                      stroke="#fff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={s.walletTitle}>Balance del Djangue</Text>
                </View>
                <Text style={s.walletBalance}>
                  {djangue.wallet.balance.toLocaleString()} {djangue.wallet.currency}
                </Text>
                <Text style={s.walletSub}>
                  {paidCount} de {(djangue.members || []).length} pagados • {pendingCount} pendientes
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Lista de Integrantes */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Integrantes ({(djangue.members || []).length})</Text>
              {isAdmin && (djangue.members || []).length < djangue.max_members && (
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => setShowAddMember(!showAddMember)}
                  activeOpacity={0.7}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
                    <Path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                  <Text style={s.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Formulario para agregar miembro */}
            {showAddMember && (
              <View style={s.addMemberForm}>
                <Text style={s.addMemberLabel}>Teléfono del nuevo miembro</Text>
                <View style={s.addMemberRow}>
                  <TextInput
                    style={s.addMemberInput}
                    value={newMemberPhone}
                    onChangeText={setNewMemberPhone}
                    placeholder="+240..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={[s.addMemberSubmit, addingMember && s.addMemberSubmitDisabled]}
                    onPress={handleAddMember}
                    disabled={addingMember}
                  >
                    {addingMember ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.addMemberSubmitText}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Miembros */}
            {(djangue.members || []).map((member, index) => {
              const contribution = (djangue.current_turn_contributions || []).find(
                c => c.djangue_members?.user_id === member.user_id
              );
              const hasPaid = contribution?.status === 'paid';
              const isCurrentTurn = member.turn_number === djangue.current_turn;

              return (
                <View key={member.id} style={s.memberCard}>
                  <View style={s.memberLeft}>
                    {member.users?.avatar_url ? (
                      <Image source={{ uri: member.users.avatar_url }} style={s.memberAvatar} contentFit="cover" />
                    ) : (
                      <View style={s.memberAvatarPlaceholder}>
                        <Text style={s.memberAvatarText}>
                          {member.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={s.memberInfo}>
                      <Text style={s.memberName}>{member.users?.full_name || 'Usuario'}</Text>
                      <Text style={s.memberPhone}>{member.users?.phone}</Text>
                    </View>
                  </View>

                  <View style={s.memberRight}>
                    <View style={s.memberTurnBadge}>
                      <Text style={s.memberTurnText}>Turno {member.turn_number}</Text>
                    </View>
                    {isCurrentTurn && (
                      <View style={[s.memberStatusBadge, { backgroundColor: 'rgba(251,146,60,0.2)' }]}>
                        <Text style={[s.memberStatusText, { color: '#f59e0b' }]}>🎯 Su turno</Text>
                      </View>
                    )}
                    {!isCurrentTurn && hasPaid && (
                      <View style={[s.memberStatusBadge, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                        <Text style={[s.memberStatusText, { color: '#10b981' }]}>✅ Pagado</Text>
                      </View>
                    )}
                    {!isCurrentTurn && !hasPaid && (
                      <View style={[s.memberStatusBadge, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                        <Text style={[s.memberStatusText, { color: '#ef4444' }]}>⏳ Pendiente</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Acciones de Administrador */}
          {isAdmin && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Acciones de Administrador</Text>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => router.push({ pathname: '/djangue-admin-settings', params: { id: djangueId } } as any)}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={3} stroke="#6366f1" strokeWidth={2} />
                  <Path
                    d="M12 1v6m0 6v6M23 12h-6m-6 0H5"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={s.actionBtnText}>Configuración del Djangue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => router.push({ pathname: '/djangue-secretary', params: { id: djangueId } } as any)}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={s.actionBtnText}>Panel de Secretario</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => router.push({ pathname: '/djangue-admin-stats', params: { id: djangueId } } as any)}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 3v18h18"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M18 17V9M13 17v-4M8 17v-8" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={s.actionBtnText}>Estadísticas y Reportes</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#6366f1' },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chatBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  heroLogo: { width: 100, height: 100, borderRadius: 50 },
  heroLogoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E7DCC3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoEmoji: { fontSize: 50 },
  heroName: { fontSize: 24, fontWeight: '900', color: '#10202B', textAlign: 'center', letterSpacing: 0.3 },
  heroSlogan: { fontSize: 15, fontWeight: '600', color: '#6366f1', textAlign: 'center', fontStyle: 'italic' },
  heroDesc: { fontSize: 14, fontWeight: '500', color: 'rgba(16,32,43,0.7)', textAlign: 'center', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#10202B', letterSpacing: 0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(16,32,43,0.6)', textAlign: 'center' },
  walletCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  walletGradient: { padding: 20, gap: 8 },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  walletBalance: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginTop: 8 },
  walletSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#10202B', letterSpacing: 0.3 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  addMemberForm: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  addMemberLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  addMemberRow: { flexDirection: 'row', gap: 10 },
  addMemberInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  addMemberSubmit: {
    width: 44,
    height: 44,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberSubmitDisabled: { opacity: 0.5 },
  addMemberSubmitText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 50, height: 50, borderRadius: 25 },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#10202B' },
  memberPhone: { fontSize: 12, fontWeight: '500', color: 'rgba(16,32,43,0.6)' },
  memberRight: { alignItems: 'flex-end', gap: 6 },
  memberTurnBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberTurnText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  memberStatusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  memberStatusText: { fontSize: 11, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#10202B' },
});
