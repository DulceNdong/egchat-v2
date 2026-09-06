import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, TextInput, Linking, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { walletAPI } from '../src/api';
import { COMPANIES, type Company, type BetSlipItem, type Match } from '../src/data/apuestasData';
import { toast } from '../src/components/Toast';
import { Colors } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND = '#00c8a0';
const BRAND2 = '#00b4e6';

const makeStyles = (C: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 8, gap: 10, backgroundColor: C.bgSecondary, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgTertiary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.textPrimary, lineHeight: 32 },
  title: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: 11, color: C.textTertiary },
  balancePill: { backgroundColor: C.bgTertiary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  balanceLabel: { fontSize: 9, color: C.textTertiary, fontWeight: '600' },
  balanceVal: { fontSize: 13, fontWeight: '800', color: Colors.warning },
  promoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 14,
  },
  promoTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
  promoSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  disclaimer: { fontSize: 11, color: Colors.warning, marginBottom: 12, lineHeight: 16 },
  coCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.borderLight },
  coTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  coLogo: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  coName: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  licensed: { fontSize: 9, color: BRAND, fontWeight: '700', backgroundColor: BRAND + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coTag: { fontSize: 11, color: C.textTertiary, marginTop: 2 },
  coBonus: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  chevron: { fontSize: 22, color: C.border },
  coLink: { borderTopWidth: 1, padding: 12, alignItems: 'center' },
  coLinkText: { fontSize: 12, fontWeight: '700' },
  sportTabs: { maxHeight: 44, marginBottom: 8 },
  sportChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.borderLight },
  sportChipText: { color: C.textPrimary, fontWeight: '600', fontSize: 13 },
  matchCard: { backgroundColor: C.bgSecondary, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderWidth: 1, borderColor: C.borderLight },
  matchHead: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 4 },
  league: { fontSize: 11, color: C.textTertiary },
  liveBadge: { fontSize: 11, color: Colors.error, fontWeight: '700' },
  matchTime: { fontSize: 11, color: C.textTertiary },
  matchTeams: { fontSize: 15, fontWeight: '700', color: C.textPrimary, width: '100%', marginBottom: 8 },
  oddsRow: { flexDirection: 'row', gap: 8, width: '100%' },
  oddBtn: { flex: 1, backgroundColor: C.bgTertiary, borderRadius: 10, padding: 10, alignItems: 'center' },
  oddLabel: { fontSize: 11, color: C.textTertiary },
  oddVal: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  slipFab: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: 14, padding: 14, alignItems: 'center' },
  slipFabText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.bgSecondary, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, borderWidth: 1, borderColor: C.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary, marginBottom: 16 },
  slipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stakeInput: { width: 70, backgroundColor: C.bgTertiary, borderRadius: 8, padding: 8, color: C.textPrimary, textAlign: 'center' },
  input: { backgroundColor: C.bgTertiary, borderRadius: 12, padding: 14, color: C.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: C.borderLight },
  primaryBtn: { backgroundColor: BRAND, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const DISCLAIMER = '⚠️ El juego puede crear adicción. Solo mayores de 18 años. Juega con responsabilidad.';

export default function ApuestasScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const s = makeStyles(C);
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState(0);
  const [company, setCompany] = useState<Company | null>(null);
  const [sportId, setSportId] = useState('futbol');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [showSlip, setShowSlip] = useState(false);
  const [result, setResult] = useState<{ win: boolean; payout: number } | null>(null);
  const [casinoAmt, setCasinoAmt] = useState('');
  const [casinoRes, setCasinoRes] = useState<{ win: boolean; payout: number } | null>(null);
  const [lotSel, setLotSel] = useState<string | null>(null);

  useEffect(() => {
    walletAPI.getBalance().then(r => setBalance(r.balance || 0)).catch(() => {});
  }, []);

  const totalStake = betSlip.reduce((s, b) => s + (parseInt(b.stake, 10) || 0), 0);
  const totalPayout = betSlip.reduce((s, b) => s + Math.floor((parseInt(b.stake, 10) || 0) * b.odds), 0);

  const addBet = (match: Match, pick: string, odds: number) => {
    setBetSlip(prev => {
      const ex = prev.findIndex(b => b.id === match.id);
      const item: BetSlipItem = {
        id: match.id,
        matchLabel: `${match.home} vs ${match.away}`,
        pick, odds,
        stake: ex >= 0 ? prev[ex].stake : '',
      };
      if (ex >= 0) { const n = [...prev]; n[ex] = item; return n; }
      return [...prev, item];
    });
    setShowSlip(true);
  };

  const placeBets = () => {
    if (totalStake <= 0 || totalStake > balance) {
      Alert.alert('Error', 'Saldo insuficiente o importe inválido');
      return;
    }
    const win = Math.random() > 0.45;
    setResult({ win, payout: win ? totalPayout : 0 });
    setBalance(b => b - totalStake + (win ? totalPayout : 0));
    setBetSlip([]);
    setShowSlip(false);
    toast[win ? 'success' : 'info'](win ? `¡Ganaste ${totalPayout.toLocaleString()} XAF!` : 'Apuesta no acertada');
  };

  const playCasino = () => {
    const n = parseInt(casinoAmt, 10);
    if (!n || n < (company?.minBet || 200) || n > balance) {
      Alert.alert('Error', 'Importe inválido o saldo insuficiente');
      return;
    }
    const mults = [0, 0, 0.5, 1.5, 2, 3, 5, 10];
    const mult = mults[Math.floor(Math.random() * mults.length)];
    const payout = Math.floor(n * mult);
    setCasinoRes({ win: mult > 1, payout });
    setBalance(b => b - n + payout);
    setCasinoAmt('');
  };

  const playLottery = (price: number) => {
    if (price > balance) { Alert.alert('Error', 'Saldo insuficiente'); return; }
    const win = Math.random() > 0.8;
    const prize = win ? [500, 1000, 5000, 10000][Math.floor(Math.random() * 4)] : 0;
    setBalance(b => b - price + prize);
    toast[win ? 'success' : 'info'](win ? `¡Premio ${prize.toLocaleString()} XAF!` : 'Sin premio esta vez');
  };

  const goBack = () => {
    setCompany(null);
    setBetSlip([]);
    setResult(null);
    setCasinoRes(null);
    setLotSel(null);
  };

  // ── Hub de operadores ──
  if (!company) {
    return (
      <SafeAreaView style={s.container} edges={['left', 'right']}>
        <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Juegos & Apuestas</Text>
            <Text style={s.subtitle}>5 plataformas licenciadas</Text>
          </View>
          <View style={s.balancePill}>
            <Text style={s.balanceLabel}>SALDO</Text>
            <Text style={s.balanceVal}>{balance.toLocaleString()} XAF</Text>
          </View>
        </View>
        <LinearGradient colors={[BRAND, BRAND2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.promoBanner}>
          <Text style={{ fontSize: 32 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.promoTitle}>+120 eventos en vivo ahora</Text>
            <Text style={s.promoSub}>Premier League · Champions · NBA · UFC</Text>
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
          {COMPANIES.map(co => (
            <View key={co.id} style={s.coCard}>
              <TouchableOpacity style={s.coTop} onPress={() => { setCompany(co); setSportId(co.sports?.[0]?.id || 'futbol'); }}>
                <View style={[s.coLogo, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: co.color }}>
                    {co.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.coName}>{co.name}</Text>
                    <Text style={s.licensed}>✓ LICENCIADO</Text>
                  </View>
                  <Text style={s.coTag}>{co.tagline}</Text>
                  <Text style={[s.coBonus, { color: co.color }]}>🎁 {co.bonus}</Text>
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.coLink, { borderColor: co.color + '40' }]} onPress={() => Linking.openURL(co.url)}>
                <Text style={[s.coLinkText, { color: co.color }]}>Abrir sitio oficial</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const sport = company.sports?.find(sp => sp.id === sportId);

  // ── Deportes ──
  if (company.type === 'sports' && sport) {
    return (
      <SafeAreaView style={s.container} edges={['left', 'right']}>
        <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={goBack} style={s.backBtn}><Text style={s.backIcon}>‹</Text></TouchableOpacity>
          <Text style={[s.title, { flex: 1 }]}>{company.name}</Text>
          <View style={s.balancePill}>
            <Text style={s.balanceVal}>{balance.toLocaleString()} XAF</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sportTabs} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {company.sports!.map(sp => (
            <TouchableOpacity key={sp.id} style={[s.sportChip, sportId === sp.id && { backgroundColor: company.color }]} onPress={() => setSportId(sp.id)}>
              <Text style={[s.sportChipText, sportId === sp.id && { color: '#fff' }]}>{sp.icon} {sp.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: betSlip.length ? 100 : 40 }}>
          {sport.matches.map(match => (
            <View key={match.id} style={s.matchCard}>
              <View style={s.matchHead}>
                <Text style={s.league}>{match.league}</Text>
                {match.live && <Text style={s.liveBadge}>● EN VIVO {match.score}</Text>}
                <Text style={s.matchTime}>{match.time}</Text>
              </View>
              <Text style={s.matchTeams}>{match.home} vs {match.away}</Text>
              <View style={s.oddsRow}>
                <TouchableOpacity style={s.oddBtn} onPress={() => addBet(match, '1', match.odds1)}>
                  <Text style={s.oddLabel}>1</Text>
                  <Text style={s.oddVal}>{match.odds1}</Text>
                </TouchableOpacity>
                {match.oddsX != null && (
                  <TouchableOpacity style={s.oddBtn} onPress={() => addBet(match, 'X', match.oddsX!)}>
                    <Text style={s.oddLabel}>X</Text>
                    <Text style={s.oddVal}>{match.oddsX}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.oddBtn} onPress={() => addBet(match, '2', match.odds2)}>
                  <Text style={s.oddLabel}>2</Text>
                  <Text style={s.oddVal}>{match.odds2}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        {betSlip.length > 0 && (
          <TouchableOpacity style={[s.slipFab, { backgroundColor: company.color }]} onPress={() => setShowSlip(true)}>
            <Text style={s.slipFabText}>🎫 Cupón ({betSlip.length}) · {totalStake.toLocaleString()} XAF</Text>
          </TouchableOpacity>
        )}
        <BetSlipModal visible={showSlip} items={betSlip} totalStake={totalStake} totalPayout={totalPayout}
          onClose={() => setShowSlip(false)} onStakeChange={(id, stake) => setBetSlip(p => p.map(b => b.id === id ? { ...b, stake } : b))}
          onPlace={placeBets} onRemove={id => setBetSlip(p => p.filter(b => b.id !== id))} C={C} />
        <ResultModal visible={!!result} win={result?.win} payout={result?.payout || 0} onClose={() => setResult(null)} C={C} />
      </SafeAreaView>
    );
  }

  // ── Casino ──
  if (company.type === 'casino') {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={goBack} style={s.backBtn}><Text style={s.backIcon}>‹</Text></TouchableOpacity>
          <Text style={[s.title, { flex: 1 }]}>{company.name}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {company.casino?.map(g => (
            <View key={g.id} style={s.matchCard}>
              <Text style={{ fontSize: 28 }}>{g.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.coName}>{g.name}</Text>
                <Text style={s.coTag}>RTP {g.rtp}</Text>
              </View>
            </View>
          ))}
          <TextInput style={s.input} value={casinoAmt} onChangeText={setCasinoAmt} placeholder="Importe (XAF)" keyboardType="numeric" placeholderTextColor="#666" />
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: company.color }]} onPress={playCasino}>
            <Text style={s.primaryBtnText}>Jugar</Text>
          </TouchableOpacity>
          {casinoRes && (
            <Text style={{ textAlign: 'center', marginTop: 16, color: casinoRes.win ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
              {casinoRes.win ? `¡Ganaste ${casinoRes.payout.toLocaleString()} XAF!` : 'Sin premio'}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Lotería ──
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}><Text style={s.backIcon}>‹</Text></TouchableOpacity>
        <Text style={[s.title, { flex: 1 }]}>{company.name}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {company.lottery?.map(l => (
          <TouchableOpacity key={l.id} style={s.matchCard} onPress={() => playLottery(l.price)}>
            <Text style={{ fontSize: 28 }}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.coName}>{l.name}</Text>
              <Text style={s.coTag}>Bote: {l.jackpot}</Text>
            </View>
            <Text style={[s.oddVal, { color: company.color }]}>{l.price} XAF</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function BetSlipModal({ visible, items, totalStake, totalPayout, onClose, onStakeChange, onPlace, onRemove, C }: {
  visible: boolean; items: BetSlipItem[]; totalStake: number; totalPayout: number;
  onClose: () => void; onStakeChange: (id: string, stake: string) => void;
  onPlace: () => void; onRemove: (id: string) => void;
  C: typeof Colors;
}) {
  const s = makeStyles(C);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalSheet} onPress={() => {}}>
          <Text style={s.modalTitle}>Cupón de apuestas</Text>
          {items.map(b => (
            <View key={b.id} style={s.slipRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.coName}>{b.matchLabel}</Text>
                <Text style={s.coTag}>{b.pick} @ {b.odds}</Text>
              </View>
              <TextInput style={s.stakeInput} value={b.stake} onChangeText={v => onStakeChange(b.id, v)} keyboardType="numeric" placeholder="0" placeholderTextColor={C.textTertiary} />
              <TouchableOpacity onPress={() => onRemove(b.id)}><Text style={{ color: C.textPrimary }}>✕</Text></TouchableOpacity>
            </View>
          ))}
          <Text style={s.coTag}>Total: {totalStake.toLocaleString()} XAF · Ganancia pot.: {totalPayout.toLocaleString()} XAF</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={onPlace}><Text style={s.primaryBtnText}>Apostar</Text></TouchableOpacity>
        </Pressable>
      </Pressable>
        </KeyboardAvoidingView>
    </Modal>
  );
}

function ResultModal({ visible, win, payout, onClose, C }: { visible: boolean; win?: boolean; payout: number; onClose: () => void; C: typeof Colors }) {
  const s = makeStyles(C);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.modalOverlay, { justifyContent: 'center' }]}>
        <View style={[s.modalSheet, { margin: 24 }]}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>{win ? '🎉' : '😔'}</Text>
          <Text style={[s.modalTitle, { textAlign: 'center' }]}>
            {win ? `¡Ganaste ${payout.toLocaleString()} XAF!` : 'Apuesta no acertada'}
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={onClose}><Text style={s.primaryBtnText}>Cerrar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

