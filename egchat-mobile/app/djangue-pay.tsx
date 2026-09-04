/**
 * Mi Djangue — Pagar cuota del turno actual
 * Descuenta del monedero personal y acredita al monedero del djangue.
 */
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { apiFetch } from '../src/api';

const fmtAmount = (n: number, currency = 'XAF') =>
  `${Number(n).toLocaleString('fr-FR')} ${currency}`;

interface DjangueInfo {
  id: string; name: string; frequency: string;
  quota_amount: number; currency: string;
  current_turn: number; total_turns: number;
  wallet: { balance: number };
  total_paid_this_turn: number;
  expected_total_this_turn: number;
  paid_count: number;
}

interface WalletInfo {
  balance: number; currency: string;
}

export default function DjanguePayScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup]   = useState<DjangueInfo | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [paid, setPaid]         = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [detail, walletData] = await Promise.all([
          apiFetch(`/api/djangue/${id}`),
          apiFetch('/api/wallet/balance'),
        ]);
        setGroup(detail);
        setWallet(walletData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePay = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return Alert.alert('No autenticado', 'Debes iniciar sesión.');
    if (!group || !wallet) return;
    if (wallet.balance < group.quota_amount) {
      Alert.alert(
        'Saldo insuficiente',
        `Necesitas ${fmtAmount(group.quota_amount, group.currency)} pero tienes ${fmtAmount(wallet.balance, wallet.currency)}.\n\nRecarga tu monedero para poder pagar.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Recargar', onPress: () => router.push('/(tabs)/monedero' as any) },
        ],
      );
      return;
    }

    Alert.alert(
      'Confirmar pago',
      `¿Pagar ${fmtAmount(group.quota_amount, group.currency)} para el turno ${group.current_turn} del djangue "${group.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar pago',
          onPress: async () => {
            setPaying(true);
            try {
              const result = await apiFetch(`/api/djangue/${id}/pay`, { method: 'POST' });
              setPaid(true);
              setWallet(prev => prev ? { ...prev, balance: result.new_balance } : prev);
              if (result.all_paid) {
                Alert.alert(
                  '🎉 ¡Todos pagaron!',
                  result.message,
                  [{ text: 'Ver djangue', onPress: () => router.back() }],
                );
              }
            } catch (e: any) {
              Alert.alert('Error al pagar', e.message);
            } finally {
              setPaying(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  );

  if (error || !group || !wallet) return (
    <View style={s.center}>
      <Text style={{ color: '#ef4444', fontSize: 15 }}>{error || 'Error al cargar'}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#6366f1', fontWeight: '700' }}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const hasFunds = wallet.balance >= group.quota_amount;
  const collectionProgress = group.expected_total_this_turn > 0
    ? group.total_paid_this_turn / group.expected_total_this_turn : 0;

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
            <Text style={s.headerTitle}>Pagar Cuota</Text>
            <Text style={s.headerSub}>{group.name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <View style={s.content}>
        {paid ? (
          /* ── Pantalla de éxito ── */
          <View style={s.successBox}>
            <LinearGradient colors={['#10b981', '#059669']} style={s.successCircle}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </LinearGradient>
            <Text style={s.successTitle}>¡Cuota pagada!</Text>
            <Text style={s.successAmount}>{fmtAmount(group.quota_amount, group.currency)}</Text>
            <Text style={s.successSub}>
              Turno {group.current_turn} · {group.name}
            </Text>
            <Text style={s.successBalance}>
              Tu saldo: {fmtAmount(wallet.balance, wallet.currency)}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backBtnTxt}>Ver Djangue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Pantalla de pago ── */
          <>
            {/* Importe */}
            <LinearGradient colors={['#312e81', '#4c1d95']} style={s.amountCard}>
              <Text style={s.amountLabel}>Cuota a pagar</Text>
              <Text style={s.amountValue}>{fmtAmount(group.quota_amount, group.currency)}</Text>
              <Text style={s.amountSub}>Turno {group.current_turn} de {group.total_turns}</Text>
            </LinearGradient>

            {/* Saldo disponible */}
            <View style={[s.balanceCard, !hasFunds && s.balanceCardLow]}>
              <View>
                <Text style={s.balanceLabel}>Tu saldo disponible</Text>
                <Text style={[s.balanceValue, !hasFunds && { color: '#ef4444' }]}>
                  {fmtAmount(wallet.balance, wallet.currency)}
                </Text>
              </View>
              {hasFunds ? (
                <View style={s.suffBadge}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke="#10b981" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                  <Text style={s.suffTxt}>Suficiente</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/monedero' as any)}
                  style={s.rechargeBtn}
                >
                  <Text style={s.rechargeTxt}>Recargar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Progreso del turno */}
            <View style={s.progressCard}>
              <View style={s.progressHeader}>
                <Text style={s.progressTitle}>Estado del turno actual</Text>
                <Text style={s.progressCount}>{group.paid_count} pagaron</Text>
              </View>
              <View style={s.progressBg}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={[s.progressFill, { width: `${Math.min(collectionProgress * 100, 100)}%` }]}
                />
              </View>
              <Text style={s.progressGoal}>
                Recaudado: {fmtAmount(group.total_paid_this_turn, group.currency)} / {fmtAmount(group.expected_total_this_turn, group.currency)}
              </Text>
            </View>

            {/* Botón pagar */}
            <TouchableOpacity
              onPress={handlePay}
              disabled={paying || !hasFunds}
              activeOpacity={0.85}
              style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
            >
              <LinearGradient
                colors={!hasFunds ? ['#374151', '#374151'] : paying ? ['#374151', '#374151'] : ['#10b981', '#059669']}
                style={s.payBtn}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.payBtnTxt}>
                    {hasFunds ? `💳 Confirmar — ${fmtAmount(group.quota_amount, group.currency)}` : 'Saldo insuficiente'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.disclaimer}>
              El pago se hará desde tu monedero EGChat al monedero del djangue. Cuando todos los miembros paguen, el fondo se transferirá automáticamente al beneficiario del turno.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00C8A0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1f3a' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  content: { flex: 1, padding: 16, gap: 14 },
  amountCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 4 },
  amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#fff' },
  amountSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2d3561', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  balanceCardLow: { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.06)' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  balanceValue: { fontSize: 20, fontWeight: '800', color: '#10b981' },
  suffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  suffTxt: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  rechargeBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  rechargeTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressCard: { backgroundColor: '#2d3561', borderRadius: 14, padding: 14, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#10b981' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, minWidth: 8 },
  progressGoal: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  payBtn: { paddingVertical: 18, alignItems: 'center', borderRadius: 14 },
  payBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  disclaimer: { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 18 },
  // Success
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  successAmount: { fontSize: 32, fontWeight: '900', color: '#10b981' },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  successBalance: { fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  backBtn: { marginTop: 16, backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  backBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
