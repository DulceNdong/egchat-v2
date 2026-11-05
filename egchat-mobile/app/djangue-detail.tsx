/**
 * Mi Djangue — Detalle del grupo
 * Diseño moderno: fondo neutro, iconos SVG, sin fondos de color pesado
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { apiFetch } from '../src/api';

// ── Tipos ─────────────────────────────────────────────────────────
interface DjangueDetail {
  id: string;
  name: string;
  slogan?: string | null;
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
  my_turn_number?: number;
  is_my_turn?: boolean;
  owner_id: string;
  secretary_id?: string | null;
  members: Member[];
  wallet?: { balance: number; currency?: string } | null;
  current_turn_contributions?: Contribution[];
  chat_group_id?: string | null;
}

interface Member {
  id: string;
  user_id: string;
  turn_number?: number;
  turn_order?: number;
  status: string;
  users: { id: string; full_name: string; phone: string; avatar_url?: string | null };
}

interface Contribution {
  id: string;
  amount: number;
  status: string;
  djangue_members?: { user_id: string; turn_number: number };
}

// ── Helpers ───────────────────────────────────────────────────────
const FREQ: Record<string, { label: string; color: string }> = {
  daily:   { label: 'Diario',   color: '#f59e0b' },
  weekly:  { label: 'Semanal',  color: '#10b981' },
  monthly: { label: 'Mensual',  color: '#6366f1' },
  annual:  { label: 'Anual',    color: '#ec4899' },
};

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

// ── Iconos SVG ────────────────────────────────────────────────────
const IconBack = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round">
    <Line x1="19" y1="12" x2="5" y2="12"/>
    <Path d="M12 19l-7-7 7-7"/>
  </Svg>
);
const IconChat = ({ color = '#6366f1' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </Svg>
);
const IconAdd = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="12" y1="5" x2="12" y2="19"/>
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);
const IconWallet = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <Circle cx="18" cy="15" r="1" fill="#10b981"/>
  </Svg>
);
const IconSettings = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3"/>
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </Svg>
);
const IconDoc = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <Polyline points="14 2 14 8 20 8"/>
    <Line x1="16" y1="13" x2="8" y2="13"/>
    <Line x1="16" y1="17" x2="8" y2="17"/>
    <Line x1="10" y1="9" x2="8" y2="9"/>
  </Svg>
);
const IconStats = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10"/>
    <Line x1="12" y1="20" x2="12" y2="4"/>
    <Line x1="6" y1="20" x2="6" y2="14"/>
    <Line x1="2" y1="20" x2="22" y2="20"/>
  </Svg>
);
const IconCheck = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M20 6L9 17l-5-5"/>
  </Svg>
);
const IconClock = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10"/>
    <Path d="M12 6v6l4 2"/>
  </Svg>
);
const IconTarget = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.2} strokeLinecap="round">
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

// ── Componente ────────────────────────────────────────────────────
export default function DjangueDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: djangueId } = useLocalSearchParams<{ id: string }>();

  const [djangue, setDjangue] = useState<DjangueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadDjangue = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await apiFetch(`/api/djangue/${djangueId}`);
      setDjangue(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el djangue');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [djangueId]);

  useFocusEffect(useCallback(() => { loadDjangue(); }, [loadDjangue]));

  const handleAddMember = async () => {
    if (!newMemberPhone.trim()) return Alert.alert('Error', 'Ingresa el teléfono del nuevo miembro');
    setAddingMember(true);
    try {
      await apiFetch(`/api/djangue/${djangueId}/members`, {
        method: 'POST',
        body: JSON.stringify({ phone: newMemberPhone.trim() }),
      });
      Alert.alert('✅ Miembro agregado', 'Usuario agregado exitosamente');
      setNewMemberPhone('');
      setShowAddMember(false);
      loadDjangue(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo agregar el miembro');
    } finally {
      setAddingMember(false);
    }
  };

  const handleOpenChat = async () => {
    if (djangue?.chat_group_id) {
      router.push(`/chat/${djangue.chat_group_id}` as any);
      return;
    }
    // Intentar crear el chat directamente desde el cliente
    Alert.alert(
      'Crear chat del grupo',
      'Este djangue no tiene chat aún. ¿Crear uno ahora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear chat',
          onPress: async () => {
            try {
              // Crear grupo de chat usando el endpoint estándar
              const memberIds = (djangue?.members || []).map(m => m.user_id);
              const chatGroup = await apiFetch('/api/chats/group', {
                method: 'POST',
                body: JSON.stringify({
                  name: `💰 ${djangue?.name}`,
                  participant_ids: memberIds,
                }),
              });
              if (chatGroup?.id) {
                // Vincular el chat al djangue en el servidor
                try {
                  await apiFetch(`/api/djangue/${djangueId}/ensure-chat`, { method: 'POST' });
                } catch { /* puede fallar si no está desplegado aún */ }
                setDjangue(prev => prev ? { ...prev, chat_group_id: chatGroup.id } : prev);
                router.push(`/chat/${chatGroup.id}` as any);
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo crear el chat');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['left', 'right']}>
        <View style={[s.loadWrap, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadTxt}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!djangue) return null;

  const isAdmin = djangue.my_role === 'owner' || djangue.my_role === 'secretary';
  const members = djangue.members || [];
  const contributions = djangue.current_turn_contributions || [];
  const paidCount = contributions.filter(c => c.status === 'paid').length;
  const freq = FREQ[djangue.frequency] ?? { label: djangue.frequency, color: '#6366f1' };
  const progress = djangue.total_turns > 0
    ? Math.min((djangue.current_turn - 1) / djangue.total_turns, 1)
    : 0;
  const currency = djangue.currency || djangue.wallet?.currency || 'XAF';

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} hitSlop={12}>
          <IconBack />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{djangue.name}</Text>
          <View style={s.roleRow}>
            <View style={[s.roleDot, { backgroundColor: freq.color }]} />
            <Text style={s.roleText}>
              {djangue.my_role === 'owner' ? 'Administrador' :
               djangue.my_role === 'secretary' ? 'Secretario' : 'Integrante'}
            </Text>
            <Text style={s.roleDiv}>·</Text>
            <Text style={[s.freqBadge, { color: freq.color }]}>{freq.label}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleOpenChat} style={s.headerBtn} hitSlop={12}>
          <IconChat />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDjangue(true); }} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          <View style={s.heroLeft}>
            {djangue.logo_url ? (
              <Image source={{ uri: djangue.logo_url }} style={s.heroAvatar} contentFit="cover" />
            ) : (
              <View style={[s.heroAvatarPlaceholder, { backgroundColor: freq.color + '18' }]}>
                <Text style={[s.heroAvatarInitials, { color: freq.color }]}>
                  {initials(djangue.name)}
                </Text>
              </View>
            )}
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{djangue.name}</Text>
              {djangue.description ? (
                <Text style={s.heroDesc} numberOfLines={2}>{djangue.description}</Text>
              ) : null}
              <View style={[s.statusPill, { backgroundColor: djangue.status === 'active' ? '#dcfce7' : '#f1f5f9' }]}>
                <View style={[s.statusDot, { backgroundColor: djangue.status === 'active' ? '#10b981' : '#94a3b8' }]} />
                <Text style={[s.statusTxt, { color: djangue.status === 'active' ? '#059669' : '#64748b' }]}>
                  {djangue.status === 'active' ? 'Activo' :
                   djangue.status === 'completed' ? 'Completado' :
                   djangue.status === 'paused' ? 'Pausado' : 'Cancelado'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Progreso de turnos ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Progreso del ciclo</Text>
            <Text style={s.cardSub}>Turno {djangue.current_turn} de {djangue.total_turns || '?'}</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: freq.color }]} />
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: freq.color }]}>{djangue.quota_amount.toLocaleString()}</Text>
              <Text style={s.statLbl}>Cuota {freq.label} ({currency})</Text>
            </View>
            <View style={[s.statItem, s.statBorder]}>
              <Text style={[s.statNum, { color: '#1e293b' }]}>{members.length}/{djangue.max_members}</Text>
              <Text style={s.statLbl}>Integrantes</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: '#1e293b' }]}>{Math.round(progress * 100)}%</Text>
              <Text style={s.statLbl}>Completado</Text>
            </View>
          </View>
        </View>

        {/* ── Balance del monedero (visible para todos) ── */}
        {djangue.wallet != null && (
          <View style={[s.card, s.walletCard]}>
            <View style={s.walletTop}>
              <View style={s.walletIconWrap}>
                <IconWallet />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.walletLabel}>Balance del Djangue</Text>
                <Text style={s.walletBalance}>
                  {djangue.wallet.balance.toLocaleString()} {currency}
                </Text>
              </View>
            </View>
            <View style={s.walletBar}>
              <View style={s.walletBarItem}>
                <Text style={s.walletBarNum}>{paidCount}</Text>
                <Text style={s.walletBarLbl}>Pagaron</Text>
              </View>
              <View style={s.walletBarDiv} />
              <View style={s.walletBarItem}>
                <Text style={[s.walletBarNum, { color: '#f59e0b' }]}>{members.length - paidCount}</Text>
                <Text style={s.walletBarLbl}>Pendientes</Text>
              </View>
              <View style={s.walletBarDiv} />
              <View style={s.walletBarItem}>
                <Text style={[s.walletBarNum, { color: freq.color }]}>{djangue.current_turn}</Text>
                <Text style={s.walletBarLbl}>Turno actual</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Lista de integrantes ── */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <Text style={s.cardTitle}>Integrantes ({members.length})</Text>
            {isAdmin && members.length < djangue.max_members && (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => setShowAddMember(v => !v)}
                activeOpacity={0.8}
              >
                <IconAdd />
                <Text style={s.addBtnTxt}>Añadir</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddMember && (
            <View style={s.addForm}>
              <TextInput
                style={s.addInput}
                value={newMemberPhone}
                onChangeText={setNewMemberPhone}
                placeholder="+240 222..."
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                autoFocus
              />
              <TouchableOpacity
                style={[s.addConfirmBtn, addingMember && { opacity: 0.5 }]}
                onPress={handleAddMember}
                disabled={addingMember}
              >
                {addingMember
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.addConfirmTxt}>Agregar</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {members.map((member) => {
            const contrib = contributions.find(c => c.djangue_members?.user_id === member.user_id);
            const hasPaid = contrib?.status === 'paid';
            const isCurrentTurn = member.turn_number === djangue.current_turn;

            return (
              <View key={member.id} style={s.memberRow}>
                {/* Avatar */}
                {member.users?.avatar_url ? (
                  <Image source={{ uri: member.users.avatar_url }} style={s.memberAvatar} contentFit="cover" />
                ) : (
                  <View style={[s.memberAvatarPlaceholder, { backgroundColor: freq.color + '20' }]}>
                    <Text style={[s.memberInitials, { color: freq.color }]}>
                      {initials(member.users?.full_name || '?')}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={s.memberInfo}>
                  <Text style={s.memberName} numberOfLines={1}>{member.users?.full_name || 'Usuario'}</Text>
                  <Text style={s.memberPhone}>{member.users?.phone}</Text>
                </View>

                {/* Estado */}
                <View style={s.memberRight}>
                  <Text style={[s.turnNum, { color: freq.color }]}>#{member.turn_number}</Text>
                  {isCurrentTurn
                    ? <View style={s.statusChipActive}><IconTarget /><Text style={[s.statusChipTxt, { color: '#6366f1' }]}>Su turno</Text></View>
                    : hasPaid
                    ? <View style={s.statusChipPaid}><IconCheck /><Text style={[s.statusChipTxt, { color: '#10b981' }]}>Pagado</Text></View>
                    : <View style={s.statusChipPending}><IconClock /><Text style={[s.statusChipTxt, { color: '#f59e0b' }]}>Pendiente</Text></View>
                  }
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Acciones de administrador ── */}
        {isAdmin && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Gestión</Text>

            <TouchableOpacity
              style={s.actionRow}
              onPress={() => router.push({ pathname: '/djangue-admin-settings', params: { id: djangueId } } as any)}
              activeOpacity={0.75}
            >
              <View style={s.actionIcon}><IconSettings /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>Configuración</Text>
                <Text style={s.actionSub}>Editar nombre, cuota y frecuencia</Text>
              </View>
              <IconChevron />
            </TouchableOpacity>

            <View style={s.actionSep} />

            <TouchableOpacity
              style={s.actionRow}
              onPress={() => router.push({ pathname: '/djangue-secretary', params: { id: djangueId } } as any)}
              activeOpacity={0.75}
            >
              <View style={s.actionIcon}><IconDoc /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>Panel del Secretario</Text>
                <Text style={s.actionSub}>Gestionar pagos y ausencias</Text>
              </View>
              <IconChevron />
            </TouchableOpacity>

            <View style={s.actionSep} />

            <TouchableOpacity
              style={s.actionRow}
              onPress={() => router.push({ pathname: '/djangue-admin-stats', params: { id: djangueId } } as any)}
              activeOpacity={0.75}
            >
              <View style={s.actionIcon}><IconStats /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>Estadísticas</Text>
                <Text style={s.actionSub}>Reportes y análisis del ciclo</Text>
              </View>
              <IconChevron />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Orden de turnos / calendario de repartos ── */}
        {members.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Orden de cobros</Text>
            <Text style={[s.cardSub, { marginBottom: 4 }]}>Quién recibe el fondo en cada turno</Text>
            {members
              .slice()
              .sort((a, b) => (a.turn_number ?? a.turn_order ?? 0) - (b.turn_number ?? b.turn_order ?? 0))
              .map((m) => {
                const turnNum = m.turn_number ?? m.turn_order ?? 0;
                const isCurrent = turnNum === djangue.current_turn;
                const isPast = turnNum < djangue.current_turn;
                return (
                  <View key={m.id} style={s.turnRow}>
                    {/* Número de turno */}
                    <View style={[
                      s.turnNumBadge,
                      isCurrent && { backgroundColor: freq.color + '20', borderColor: freq.color },
                      isPast && { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
                    ]}>
                      <Text style={[
                        s.turnNumTxt,
                        isCurrent && { color: freq.color },
                        isPast && { color: '#10b981' },
                      ]}>
                        {turnNum}
                      </Text>
                    </View>
                    {/* Avatar */}
                    {m.users?.avatar_url ? (
                      <Image source={{ uri: m.users.avatar_url }} style={s.turnAvatar} contentFit="cover" />
                    ) : (
                      <View style={[s.turnAvatarPh, { backgroundColor: isCurrent ? freq.color + '20' : '#f1f5f9' }]}>
                        <Text style={[s.turnAvatarInitials, { color: isCurrent ? freq.color : '#64748b' }]}>
                          {initials(m.users?.full_name || '?')}
                        </Text>
                      </View>
                    )}
                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.turnName, isCurrent && { fontWeight: '800', color: '#1e293b' }]}>
                        {m.users?.full_name || 'Integrante'}
                      </Text>
                      <Text style={s.turnPhone}>{m.users?.phone}</Text>
                    </View>
                    {/* Estado */}
                    {isCurrent && (
                      <View style={[s.turnChip, { backgroundColor: freq.color + '18' }]}>
                        <Text style={[s.turnChipTxt, { color: freq.color }]}>🎯 Turno actual</Text>
                      </View>
                    )}
                    {isPast && (
                      <View style={[s.turnChip, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[s.turnChipTxt, { color: '#10b981' }]}>✓ Ya cobró</Text>
                      </View>
                    )}
                    {!isCurrent && !isPast && (
                      <View style={[s.turnChip, { backgroundColor: '#f8fafc' }]}>
                        <Text style={[s.turnChipTxt, { color: '#94a3b8' }]}>
                          Turno {turnNum - djangue.current_turn > 0 ? `+${turnNum - djangue.current_turn}` : turnNum}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt: { fontSize: 15, color: '#64748b', fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerBtn: {
    width: 40, height: 40,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: 0.1 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  roleDiv: { fontSize: 11, color: '#cbd5e1' },
  freqBadge: { fontSize: 11, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },

  // Hero
  heroCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatar: { width: 60, height: 60, borderRadius: 16 },
  heroAvatarPlaceholder: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarInitials: { fontSize: 22, fontWeight: '900' },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#1e293b', letterSpacing: 0.1 },
  heroDesc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },

  // Cards genéricas
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // Progreso
  progressTrack: {
    height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  statNum: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  statLbl: { fontSize: 10, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },

  // Wallet
  walletCard: { borderWidth: 1, borderColor: '#dcfce7' },
  walletTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  walletBalance: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginTop: 2 },
  walletBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 12,
  },
  walletBarItem: { flex: 1, alignItems: 'center', gap: 2 },
  walletBarDiv: { width: StyleSheet.hairlineWidth, backgroundColor: '#e2e8f0' },
  walletBarNum: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  walletBarLbl: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  // Sección head
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6366f1', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  addForm: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 10,
  },
  addInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1e293b', fontWeight: '600',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  addConfirmBtn: {
    backgroundColor: '#6366f1', borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  addConfirmTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Miembros
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 12 },
  memberAvatarPlaceholder: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 16, fontWeight: '800' },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  memberPhone: { fontSize: 11, color: '#94a3b8' },
  memberRight: { alignItems: 'flex-end', gap: 4 },
  turnNum: { fontSize: 13, fontWeight: '800' },
  statusChipActive: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipPaid: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipPending: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef9c3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipTxt: { fontSize: 10, fontWeight: '700' },

  // Acciones
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  actionIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f0f1fe',
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  actionSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  actionSep: { height: StyleSheet.hairlineWidth, backgroundColor: '#f1f5f9' },

  // Turnos de reparto
  turnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  turnNumBadge: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', flexShrink: 0,
  },
  turnNumTxt: { fontSize: 13, fontWeight: '800', color: '#94a3b8' },
  turnAvatar: { width: 36, height: 36, borderRadius: 10 },
  turnAvatarPh: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  turnAvatarInitials: { fontSize: 13, fontWeight: '800' },
  turnName: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  turnPhone: { fontSize: 11, color: '#cbd5e1', marginTop: 1 },
  turnChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  turnChipTxt: { fontSize: 10, fontWeight: '700' },
});
