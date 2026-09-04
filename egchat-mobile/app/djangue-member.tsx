/**
 * Mi Djangue — Vista del Integrante
 * 
 * Pantalla personalizada para que cada integrante vea:
 * - Su posición en el turno
 * - Estado de pago actual
 * - Cuándo le toca recibir
 * - Botón de pago rápido
 * - Historial personal
 * - Acceso al chat grupal
 * - Justificar ausencia
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle, Defs, Stop } from 'react-native-svg';
import { apiFetch } from '../src/api';

const { width } = Dimensions.get('window');

interface MemberData {
  // Info del djangue
  group_id: string;
  group_name: string;
  group_logo: string | null;
  frequency: string;
  quota_amount: number;
  currency: string;
  current_turn: number;
  total_turns: number;
  status: string;
  chat_group_id: string | null;

  // Info personal
  my_turn_order: number;
  is_my_turn: boolean;
  paid_current_turn: boolean;
  amount_paid_current_turn: number;
  amount_owed: number;
  
  // Estado del turno
  turns_until_mine: number;
  my_turn_date_estimate: string | null;
  expected_payout: number;
  
  // Estadísticas personales
  total_paid: number;
  turns_received: number;
  total_received: number;
  payment_streak: number;
  on_time_percentage: number;
  
  // Historial personal
  my_contributions: Array<{
    id: string;
    turn_number: number;
    amount: number;
    paid_at: string;
    status: string;
  }>;
  
  my_payouts: Array<{
    id: string;
    turn_number: number;
    amount: number;
    received_at: string;
  }>;

  // Moras
  pending_penalties: number;
  total_penalties_paid: number;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  annual: 'Anual',
};

const fmtAmount = (n: number, currency = 'XAF') =>
  `${Number(n).toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
};

function PulseLoader() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00C8A0',
        opacity: pulse,
      }}
    />
  );
}

// ── Componente principal ───────────────────────────────────────────
export default function DjangueMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const historyHeight = useRef(new Animated.Value(0)).current;

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const response = await apiFetch(`/api/djangue/${id}/member-view`);
      setData(response);
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePay = () => {
    router.push({ pathname: '/djangue-pay', params: { id } } as any);
  };

  const handleJustifyAbsence = () => {
    Alert.prompt(
      'Justificar ausencia',
      'Explica por qué no podrás cotizar a tiempo:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async (note: string | undefined) => {
            if (!note?.trim()) return;
            try {
              await apiFetch(`/api/djangue/${id}/justify`, {
                method: 'POST',
                body: JSON.stringify({ note: note.trim() }),
              });
              Alert.alert('Listo', 'Tu justificación fue enviada al secretario.');
              load(true);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const openChat = () => {
    if (data?.chat_group_id) {
      router.push({ pathname: '/chat/[id]', params: { id: data.chat_group_id } } as any);
    }
  };

  const toggleHistory = () => {
    const toValue = showHistory ? 0 : 1;
    setShowHistory(!showHistory);
    Animated.spring(historyHeight, {
      toValue,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <View style={s.center}>
        <PulseLoader />
        <Text style={s.loadingTxt}>Cargando tu información...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={s.center}>
        <Text style={s.errorTxt}>{error || 'No encontrado'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={s.linkTxt}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allContributions = [...data.my_contributions].sort((a, b) =>
    new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            {data.group_logo ? (
              <Image
                source={{ uri: data.group_logo }}
                style={{ width: 40, height: 40, borderRadius: 20, marginBottom: 4 }}
                contentFit="cover"
              />
            ) : null}
            <Text style={s.headerTitle} numberOfLines={1}>{data.group_name}</Text>
            <Text style={s.headerSub}>{FREQ_LABELS[data.frequency]}</Text>
          </View>

          {data.chat_group_id && (
            <TouchableOpacity onPress={openChat} style={s.iconBtn} hitSlop={12}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor="#6366f1"
          />
        }
      >
        {/* Tu posición */}
        <LinearGradient colors={['#312e81', '#4c1d95']} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardLabel}>TU POSICIÓN</Text>
          </View>

          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <View style={s.turnCircle}>
              <Text style={s.turnNumber}>{data.my_turn_order}</Text>
            </View>
            <Text style={s.turnLabel}>de {data.total_turns}</Text>
          </View>

          {data.is_my_turn ? (
            <View style={s.highlightBanner}>
              <Text style={s.highlightEmoji}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.highlightTitle}>¡Es tu turno!</Text>
                <Text style={s.highlightSub}>
                  Recibirás {fmtAmount(data.expected_payout, data.currency)} cuando todos paguen
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={s.turnInfo}>
                Te toca en {data.turns_until_mine} turno{data.turns_until_mine !== 1 ? 's' : ''}
              </Text>
              {data.my_turn_date_estimate && (
                <Text style={s.turnDate}>
                  Estimado: {fmtDate(data.my_turn_date_estimate)}
                </Text>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Estado de pago */}
        {!data.is_my_turn && data.status === 'active' && (
          <View style={s.card}>
            <Text style={s.cardLabel}>CUOTA ACTUAL — TURNO {data.current_turn}</Text>

            {data.paid_current_turn ? (
              <View style={s.paidStatus}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none"
                  stroke="#10b981" strokeWidth={2.5} strokeLinecap="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M9 12l2 2 4-4" />
                </Svg>
                <Text style={s.paidTitle}>¡Pagaste esta cuota!</Text>
                <Text style={s.paidAmount}>
                  {fmtAmount(data.amount_paid_current_turn, data.currency)}
                </Text>
              </View>
            ) : (
              <>
                <View style={s.owedBox}>
                  <Text style={s.owedLabel}>Debes cotizar:</Text>
                  <Text style={s.owedAmount}>
                    {fmtAmount(data.amount_owed, data.currency)}
                  </Text>
                </View>

                <TouchableOpacity onPress={handlePay} activeOpacity={0.85}>
                  <LinearGradient colors={['#10b981', '#059669']} style={s.payBtn}>
                    <Text style={s.payBtnTxt}>💳 Pagar ahora</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleJustifyAbsence} style={s.justifyBtn}>
                  <Text style={s.justifyTxt}>📝 No puedo pagar a tiempo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Estadísticas personales */}
        <View style={s.card}>
          <Text style={s.cardLabel}>TUS ESTADÍSTICAS</Text>

          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{fmtAmount(data.total_paid, data.currency)}</Text>
              <Text style={s.statLabel}>Total cotizado</Text>
            </View>

            <View style={s.statBox}>
              <Text style={s.statValue}>{fmtAmount(data.total_received, data.currency)}</Text>
              <Text style={s.statLabel}>Total recibido</Text>
            </View>

            <View style={s.statBox}>
              <Text style={s.statValue}>{data.payment_streak}</Text>
              <Text style={s.statLabel}>Racha de pagos</Text>
            </View>

            <View style={s.statBox}>
              <Text style={s.statValue}>{data.on_time_percentage}%</Text>
              <Text style={s.statLabel}>A tiempo</Text>
            </View>
          </View>

          {data.pending_penalties > 0 && (
            <View style={s.penaltyWarning}>
              <Text style={s.penaltyTxt}>
                ⚠️ Tienes {fmtAmount(data.pending_penalties, data.currency)} en moras pendientes
              </Text>
            </View>
          )}
        </View>

        {/* Historial personal */}
        {allContributions.length > 0 && (
          <View style={s.card}>
            <TouchableOpacity
              onPress={toggleHistory}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={s.cardLabel}>📊 TU HISTORIAL ({allContributions.length})</Text>
              <Animated.View
                style={{
                  transform: [{
                    rotate: historyHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  }],
                }}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M6 9l6 6 6-6" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: historyHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, allContributions.length * 60 + 20],
                }),
                overflow: 'hidden',
              }}
            >
              <View style={{ gap: 8, marginTop: 8 }}>
                {allContributions.map(contrib => (
                  <View key={contrib.id} style={h.row}>
                    <View style={h.iconBox}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                        stroke="#10b981" strokeWidth={2} strokeLinecap="round">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    </View>
                    <View style={h.info}>
                      <Text style={h.title}>Turno {contrib.turn_number}</Text>
                      <Text style={h.date}>
                        {new Date(contrib.paid_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={h.amount}>{fmtAmount(contrib.amount, data.currency)}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        )}

        {/* Turnos recibidos */}
        {data.my_payouts.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>💰 TURNOS RECIBIDOS ({data.my_payouts.length})</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {data.my_payouts.map(payout => (
                <View key={payout.id} style={h.row}>
                  <View style={[h.iconBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                      stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
                      <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </Svg>
                  </View>
                  <View style={h.info}>
                    <Text style={h.title}>Turno {payout.turn_number}</Text>
                    <Text style={h.date}>
                      {new Date(payout.received_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[h.amount, { color: '#f59e0b' }]}>
                    {fmtAmount(payout.amount, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Botón flotante del chat */}
      {data.chat_group_id && (
        <TouchableOpacity
          style={s.chatFab}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            style={{ width: '100%', height: '100%', borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ── Estilos ────────────────────────────────────────────────────────

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

  card: {
    backgroundColor: '#2d3561',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  turnCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 3,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnNumber: { fontSize: 36, fontWeight: '900', color: '#6366f1' },
  turnLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  turnInfo: { fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center' },
  turnDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4 },

  highlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  highlightEmoji: { fontSize: 32 },
  highlightTitle: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },
  highlightSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 16 },

  paidStatus: { alignItems: 'center', paddingVertical: 8 },
  paidTitle: { fontSize: 16, fontWeight: '800', color: '#10b981', marginTop: 8 },
  paidAmount: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 4 },

  owedBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  owedLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  owedAmount: { fontSize: 24, fontWeight: '900', color: '#f59e0b', marginTop: 4 },

  payBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  payBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  justifyBtn: {
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.05)',
  },
  justifyTxt: { fontSize: 14, fontWeight: '600', color: '#a78bfa' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flex: 1,
    minWidth: (width - 32 - 16 - 10) / 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' },

  penaltyWarning: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginTop: 4,
  },
  penaltyTxt: { fontSize: 13, fontWeight: '600', color: '#ff6b6b', textAlign: 'center' },

  chatFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

const h = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  date: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: '#10b981' },
});
