/**
 * Mi Djangue — Panel del Secretario
 * Gestionar miembros y enviar notificaciones/recordatorios
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { apiFetch } from '../src/api';

interface Member {
  id: string;
  user_id: string;
  turn_order: number;
  user: { id: string; full_name: string; phone: string; avatar_url: string | null };
  paid_current_turn: boolean;
  is_current_beneficiary: boolean;
  has_justified: boolean;
  justification_note?: string;
}

interface DjangueInfo {
  id: string;
  name: string;
  current_turn: number;
  quota_amount: number;
  currency: string;
  penalty_percent: number;
  notification_days_before: number;
  notification_final_days: number;
  period_end_date: string;
  members: Member[];
  paid_count: number;
  pending_count: number;
  chat_group_id?: string | null;
}

export default function DjangueSecretaryScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DjangueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'pending' | 'stats'>('pending');
  const [showAddMember, setShowAddMember] = useState(false);
  const [phoneToAdd, setPhoneToAdd] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id])
  );

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await apiFetch(`/api/djangue/${id}/secretary-view`);
      setData(response);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendReminderToAll = async () => {
    if (!data || data.pending_count === 0) return;

    Alert.alert(
      'Enviar recordatorio',
      `Se enviará una notificación a ${data.pending_count} integrante${data.pending_count > 1 ? 's' : ''} que no han cotizado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setSendingNotif(true);
            try {
              await apiFetch(`/api/djangue/${id}/send-reminder`, {
                method: 'POST',
                body: JSON.stringify({ type: 'secretary_manual' }),
              });
              Alert.alert('✅ Enviado', 'Los recordatorios se enviaron correctamente');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudieron enviar las notificaciones');
            } finally {
              setSendingNotif(false);
            }
          },
        },
      ]
    );
  };

  const sendReminderToOne = async (memberId: string, userName: string) => {
    Alert.alert(
      'Enviar recordatorio',
      `¿Enviar notificación a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              await apiFetch(`/api/djangue/${id}/send-reminder`, {
                method: 'POST',
                body: JSON.stringify({ type: 'secretary_manual', member_id: memberId }),
              });
              Alert.alert('✅ Enviado', `Recordatorio enviado a ${userName}`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo enviar la notificación');
            }
          },
        },
      ]
    );
  };

  const markAsJustified = async (memberId: string, userName: string) => {
    Alert.prompt(
      'Justificar ausencia',
      `Ingresa el motivo por el cual ${userName} no puede cotizar a tiempo:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (note: string | undefined) => {
            if (!note?.trim()) return;
            try {
              await apiFetch(`/api/djangue/${id}/justify-absence`, {
                method: 'POST',
                body: JSON.stringify({ member_id: memberId, note: note.trim() }),
              });
              Alert.alert('✅ Guardado', `${userName} ha sido justificado por este periodo`);
              load();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo guardar la justificación');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const addMember = async () => {
    if (!phoneToAdd.trim()) {
      Alert.alert('Error', 'Ingresa un número de teléfono');
      return;
    }

    setAddingMember(true);
    try {
      await apiFetch(`/api/djangue/${id}/add-member`, {
        method: 'POST',
        body: JSON.stringify({ phone: phoneToAdd.trim() }),
      });
      Alert.alert('✅ Agregado', 'El integrante se agregó correctamente');
      setPhoneToAdd('');
      setShowAddMember(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo agregar el integrante');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId: string, userName: string) => {
    Alert.alert(
      'Eliminar integrante',
      `¿Estás seguro de eliminar a ${userName} del djangue? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/djangue/${id}/remove-member`, {
                method: 'DELETE',
                body: JSON.stringify({ member_id: memberId }),
              });
              Alert.alert('✅ Eliminado', `${userName} fue removido del djangue`);
              load();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar el integrante');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['left', 'right']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadingText}>Cargando panel del secretario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const pendingMembers = data.members.filter((m) => !m.paid_current_turn && !m.is_current_beneficiary && !m.has_justified);
  const justifiedMembers = data.members.filter((m) => m.has_justified && !m.paid_current_turn);
  const paidMembers = data.members.filter((m) => m.paid_current_turn);

  const renderMember = ({ item: m }: { item: Member }) => (
    <View style={s.memberCard}>
      <View style={s.memberRow}>
        <View style={s.turnBadge}>
          <Text style={s.turnNum}>{m.turn_order}</Text>
        </View>
        <View style={s.memberInfo}>
          <Text style={s.memberName}>{m.user.full_name}</Text>
          <Text style={s.memberPhone}>{m.user.phone}</Text>
          {m.has_justified && m.justification_note && (
            <Text style={s.justificationNote}>📝 {m.justification_note}</Text>
          )}
        </View>
        <View style={s.memberStatus}>
          {m.is_current_beneficiary ? (
            <View style={s.beneficiaryBadge}>
              <Text style={s.beneficiaryText}>Recibe</Text>
            </View>
          ) : m.paid_current_turn ? (
            <View style={s.paidBadge}>
              <Text style={s.paidText}>✓ Pagó</Text>
            </View>
          ) : m.has_justified ? (
            <View style={s.justifiedBadge}>
              <Text style={s.justifiedText}>Justificado</Text>
            </View>
          ) : (
            <View style={s.pendingBadge}>
              <Text style={s.pendingText}>Pendiente</Text>
            </View>
          )}
        </View>
      </View>

      {/* Acciones del secretario */}
      {!m.is_current_beneficiary && (
        <View style={s.memberActions}>
          {!m.paid_current_turn && !m.has_justified && (
            <>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => sendReminderToOne(m.id, m.user.full_name)}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
                  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </Svg>
                <Text style={s.actionBtnText}>Recordar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnSecondary]}
                onPress={() => markAsJustified(m.id, m.user.full_name)}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </Svg>
                <Text style={s.actionBtnText}>Justificar</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDanger]}
            onPress={() => removeMember(m.id, m.user.full_name)}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
              <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </Svg>
            <Text style={[s.actionBtnText, { color: '#ef4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#4f46e5']} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Panel del Secretario</Text>
            <Text style={s.headerSub}>{data.name}</Text>
          </View>
          {/* #16 — Botón de chat del grupo djangue */}
          <TouchableOpacity
            style={s.iconBtn}
            hitSlop={12}
            onPress={() => {
              if (data.chat_group_id) {
                router.push(`/chat/${data.chat_group_id}` as any);
              } else {
                Alert.alert('Chat no disponible', 'Este djangue aún no tiene grupo de chat.');
              }
            }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Stats rápidas */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{data.paid_count}</Text>
            <Text style={s.statLbl}>Pagaron</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{pendingMembers.length}</Text>
            <Text style={s.statLbl}>Pendientes</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{justifiedMembers.length}</Text>
            <Text style={s.statLbl}>Justificados</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'pending' && s.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[s.tabText, activeTab === 'pending' && s.tabTextActive]}>
            Pendientes ({pendingMembers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'members' && s.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[s.tabText, activeTab === 'members' && s.tabTextActive]}>
            Todos ({data.members.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'stats' && s.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[s.tabText, activeTab === 'stats' && s.tabTextActive]}>
            📊 Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Acción rápida: enviar recordatorio a todos */}
      {activeTab === 'pending' && pendingMembers.length > 0 && (
        <View style={s.quickAction}>
          <TouchableOpacity
            style={s.sendAllBtn}
            onPress={sendReminderToAll}
            disabled={sendingNotif}
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.sendAllBtnGrad}>
              {sendingNotif ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth={2} strokeLinecap="round">
                    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </Svg>
                  <Text style={s.sendAllBtnText}>
                    Enviar recordatorio a {pendingMembers.length} pendiente{pendingMembers.length > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Agregar miembro */}
      <View style={s.addMemberSection}>
        <TouchableOpacity
          style={s.addMemberBtn}
          onPress={() => setShowAddMember(!showAddMember)}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
            <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM20 8v6M23 11h-6" />
          </Svg>
          <Text style={s.addMemberBtnText}>Agregar integrante</Text>
        </TouchableOpacity>
        {showAddMember && (
          <View style={s.addMemberForm}>
            <TextInput
              style={s.phoneInput}
              value={phoneToAdd}
              onChangeText={setPhoneToAdd}
              placeholder="Número de teléfono"
              keyboardType="phone-pad"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
            <TouchableOpacity
              style={[s.addBtn, addingMember && s.addBtnDisabled]}
              onPress={addMember}
              disabled={addingMember}
            >
              {addingMember ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.addBtnText}>Agregar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Lista de miembros o dashboard */}
      {activeTab === 'stats' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Barra de progreso de cobro */}
          <View style={s.dashCard}>
            <Text style={s.dashTitle}>💰 Cobro del turno actual</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${Math.round((data.paid_count / Math.max(1, data.members.length)) * 100)}%` as any }]} />
            </View>
            <Text style={s.barLabel}>{data.paid_count} de {data.members.length} han pagado ({Math.round((data.paid_count / Math.max(1, data.members.length)) * 100)}%)</Text>
            {/* C2 — Payout manual */}
            <TouchableOpacity
              style={s.payoutBtn}
              activeOpacity={0.8}
              onPress={() => {
                const beneficiary = data.members.find(m => m.is_current_beneficiary);
                const name = beneficiary?.user.full_name || 'el beneficiario';
                Alert.alert(
                  '💸 Ejecutar pago',
                  `¿Transferir el saldo del monedero al beneficiario del turno #${data.current_turn} (${name})?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Confirmar pago',
                      onPress: async () => {
                        try {
                          await apiFetch(`/api/djangue/${id}/manual-payout`, { method: 'POST' });
                          Alert.alert('✅ Pago ejecutado', `El saldo fue transferido a ${name}`);
                          load(true);
                        } catch (e: any) {
                          Alert.alert('Error', e.message || 'No se pudo ejecutar el pago');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={s.payoutBtnGrad}>
                <Text style={s.payoutBtnText}>💸 Pagar al beneficiario</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* D2 — Avanzar turno */}
            <TouchableOpacity
              style={[s.payoutBtn, { marginTop: 8 }]}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  '⏭ Avanzar turno',
                  `¿Cerrar el turno #${data.current_turn} y pasar al siguiente beneficiario?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Avanzar',
                      onPress: async () => {
                        try {
                          const res = await apiFetch(`/api/djangue/${id}/advance-turn`, { method: 'POST' });
                          Alert.alert('✅ Turno avanzado', `Ahora estamos en el turno #${res.new_turn}`);
                          load(true);
                        } catch (e: any) {
                          Alert.alert('Error', e.message || 'No se pudo avanzar el turno');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={s.payoutBtnGrad}>
                <Text style={s.payoutBtnText}>⏭ Avanzar al siguiente turno</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Resumen de miembros */}
          <View style={s.dashCard}>
            <Text style={s.dashTitle}>👥 Estado de miembros</Text>
            {[
              { label: '✅ Pagados', value: data.paid_count, color: '#10b981' },
              { label: '⏳ Pendientes', value: data.pending_count, color: '#f59e0b' },
              { label: '📋 Justificados', value: data.members.filter(m => m.has_justified).length, color: '#6366f1' },
              { label: '👑 Beneficiario actual', value: data.members.filter(m => m.is_current_beneficiary).length, color: '#00b4e6' },
            ].map(row => (
              <View key={row.label} style={s.dashRow}>
                <Text style={s.dashRowLabel}>{row.label}</Text>
                <View style={[s.dashChip, { backgroundColor: row.color + '22' }]}>
                  <Text style={[s.dashChipText, { color: row.color }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info del turno */}
          <View style={s.dashCard}>
            <Text style={s.dashTitle}>🔄 Turno actual</Text>
            <View style={s.dashRow}>
              <Text style={s.dashRowLabel}>Turno</Text>
              <Text style={s.dashRowValue}>#{data.current_turn}</Text>
            </View>
            <View style={s.dashRow}>
              <Text style={s.dashRowLabel}>Cuota</Text>
              <Text style={s.dashRowValue}>{data.quota_amount.toLocaleString()} {data.currency}</Text>
            </View>
            <View style={s.dashRow}>
              <Text style={s.dashRowLabel}>Penalización mora</Text>
              <Text style={s.dashRowValue}>{data.penalty_percent}%</Text>
            </View>
            <View style={s.dashRow}>
              <Text style={s.dashRowLabel}>Fin del período</Text>
              <Text style={s.dashRowValue}>{new Date(data.period_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
            </View>
          </View>

          {/* Ranking de pago */}
          <View style={s.dashCard}>
            <Text style={s.dashTitle}>🏆 Orden de turno</Text>
            {data.members.slice().sort((a, b) => a.turn_order - b.turn_order).map((m, i) => (
              <View key={m.id} style={[s.dashRow, { paddingVertical: 6 }]}>
                <Text style={[s.dashRowLabel, { opacity: 0.6 }]}>#{i + 1}</Text>
                <Text style={[s.dashRowLabel, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>{m.user.full_name}</Text>
                <View style={[s.dashChip, { backgroundColor: m.paid_current_turn ? '#10b98122' : '#f59e0b22' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: m.paid_current_turn ? '#10b981' : '#f59e0b' }}>
                    {m.paid_current_turn ? '✅ Pagó' : m.has_justified ? '📋 Just.' : '⏳'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
      <FlatList
        data={activeTab === 'pending' ? pendingMembers : data.members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {activeTab === 'pending'
                ? '✅ Todos han cotizado o están justificados'
                : 'No hay integrantes todavía'}
            </Text>
          </View>
        }
      />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#6366f1' },
  header: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: 'rgba(16,32,43,0.6)' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(16,32,43,0.08)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(16,32,43,0.5)' },
  tabTextActive: { color: '#6366f1' },
  quickAction: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(16,32,43,0.08)' },
  sendAllBtn: { borderRadius: 12, overflow: 'hidden' },
  sendAllBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  sendAllBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  addMemberSection: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(16,32,43,0.08)' },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  addMemberBtnText: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  addMemberForm: { flexDirection: 'row', gap: 8, marginTop: 10 },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: 'rgba(16,32,43,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  list: { padding: 16, gap: 12 },
  memberCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(16,32,43,0.08)' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  turnBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E7DCC3', alignItems: 'center', justifyContent: 'center' },
  turnNum: { fontSize: 13, fontWeight: '700', color: '#10202B' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#10202B' },
  memberPhone: { fontSize: 12, color: 'rgba(16,32,43,0.5)', marginTop: 2 },
  justificationNote: { fontSize: 11, color: '#f59e0b', marginTop: 4, fontStyle: 'italic' },
  memberStatus: { alignItems: 'flex-end' },
  beneficiaryBadge: { backgroundColor: '#E7C766', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  beneficiaryText: { fontSize: 11, fontWeight: '700', color: '#4A3A08' },
  paidBadge: { backgroundColor: '#DCEAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  paidText: { fontSize: 11, fontWeight: '700', color: '#2C6E63' },
  justifiedBadge: { backgroundColor: '#F1DFB8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  justifiedText: { fontSize: 11, fontWeight: '700', color: '#B8790F' },
  pendingBadge: { backgroundColor: '#F2DDD6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#A8432E' },
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  actionBtnSecondary: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
  actionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(16,32,43,0.5)', textAlign: 'center' },
  // Dashboard stats
  dashCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  dashTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  dashRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  dashRowLabel: { fontSize: 13, color: '#6b7280' },
  dashRowValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  dashChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dashChipText: { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginVertical: 6 },
  barFill: { height: 10, backgroundColor: '#6366f1', borderRadius: 5 },
  barLabel: { fontSize: 12, color: '#6b7280' },
  payoutBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  payoutBtnGrad: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  payoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
