import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Pressable, ActivityIndicator, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { cemacAPI, walletAPI } from '../src/api';
import { toast } from '../src/components/Toast';
import { CemacLogo } from '../src/components/CemacLogo';
import {
  LANGS, COUNTRIES, T, SERVICES, LEISURE, CAT_ICON, ATMS, NEWS, RATES, HISTORY, NEWS_COLOR,
  type Lang, type CountryCode, type CemacTab,
} from '../src/data/cemacData';

export default function CemacScreen() {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<Lang | null>(null);
  const [country, setCountry] = useState<CountryCode | null>(null);
  const [tab, setTab] = useState<CemacTab>('servicios');
  const [query, setQuery] = useState('');
  const [balance, setBalance] = useState(0);
  const [transferOpen, setTransferOpen] = useState(false);
  const [xfer, setXfer] = useState({ from: 'GQ', to: 'CM', name: '', account: '', amount: '' });
  const [xferLoading, setXferLoading] = useState(false);
  const [fromCur, setFromCur] = useState('XAF');
  const [toCur, setToCur] = useState('EUR');
  const [amt, setAmt] = useState('');

  const t = T[lang || 'ES'];

  useEffect(() => {
    walletAPI.getBalance().then(r => setBalance(r.balance || 0)).catch(() => {});
  }, []);

  const enterCountry = (code: CountryCode) => {
    setLang(prev => prev || 'ES');
    setCountry(code);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter(s => s.nameES.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
  }, [query]);

  const convertResult = useMemo(() => {
    const n = parseFloat(amt);
    if (!n || fromCur === toCur) return null;
    if (fromCur === 'XAF') return (n * (RATES[toCur] || 0)).toFixed(4);
    if (toCur === 'XAF') return (n / (RATES[fromCur] || 1)).toFixed(0);
    return (n * (RATES[toCur] || 0) / (RATES[fromCur] || 1)).toFixed(4);
  }, [amt, fromCur, toCur]);

  const sendTransfer = async () => {
    const amount = parseInt(xfer.amount, 10);
    if (!xfer.name.trim() || !xfer.account.trim() || !amount || amount > balance) {
      toast.error('Datos incompletos o saldo insuficiente');
      return;
    }
    setXferLoading(true);
    try {
      await cemacAPI.createTransfer({
        from_country: xfer.from,
        to_country: xfer.to,
        beneficiary_name: xfer.name.trim(),
        beneficiary_account: xfer.account.trim(),
        amount,
      });
      toast.success('Transferencia enviada');
      setTransferOpen(false);
      setXfer({ from: 'GQ', to: 'CM', name: '', account: '', amount: '' });
      const r = await walletAPI.getBalance();
      setBalance(r.balance || 0);
    } catch {
      toast.error('No se pudo enviar la transferencia');
    } finally {
      setXferLoading(false);
    }
  };

  const ctry = COUNTRIES.find(c => c.code === country);

  if (!country) {
    return (
      <LinearGradient
        colors={['#003d22', '#006b3c', '#00a86b', '#00c8a0', '#00b4e6']}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={s.welcomeBack}>
          <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>‹</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Volver</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={s.welcomeScroll} showsVerticalScrollIndicator={false}>
            <View style={s.welcomeHero}>
              <CemacLogo size={80} />
              <Text style={s.welcomeTitle}>Bienvenido a la CEMAC</Text>
              <Text style={s.welcomeSub}>Comunidad Económica y Monetaria de África Central</Text>
              <View style={s.statsRow}>
                {[{ v: '6', l: 'Países' }, { v: 'XAF', l: 'Moneda' }, { v: '60M+', l: 'Personas' }].map(st => (
                  <View key={st.l} style={s.statItem}>
                    <Text style={s.statVal}>{st.v}</Text>
                    <Text style={s.statLabel}>{st.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.glassCard}>
              <Text style={s.glassLabel}>TOCA UN PAÍS PARA ENTRAR</Text>
              <View style={s.countryGrid}>
                {COUNTRIES.map(c => (
                  <TouchableOpacity key={c.code} style={s.countryCell} onPress={() => enterCountry(c.code)} activeOpacity={0.85}>
                    <LinearGradient colors={[c.g1, c.g2]} style={s.countryIcon}>
                      <Text style={s.countryFlag}>{c.flag}</Text>
                    </LinearGradient>
                    <Text style={s.countryShort}>{c.shortES}</Text>
                    <Text style={s.countryCap}>{c.capital}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[s.glassCard, { marginBottom: 24 }]}>
              <Text style={s.glassLabel}>ELIGE TU IDIOMA</Text>
              <View style={s.langGrid}>
                {LANGS.map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[s.langCell, lang === l.code && s.langCellActive]}
                    onPress={() => setLang(l.code)}
                    activeOpacity={0.85}
                  >
                    <View style={s.langCodeBox}>
                      <Text style={s.langCode}>{l.code}</Text>
                    </View>
                    <Text style={[s.langName, lang === l.code && { fontWeight: '800' }]}>{l.native}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        </LinearGradient>
    );
  }

  const TABS: { id: CemacTab; label: string }[] = [
    { id: 'servicios', label: t.services },
    { id: 'ocio', label: t.leisure },
    { id: 'cajeros', label: t.atms },
    { id: 'cuenta', label: t.account },
    { id: 'noticias', label: t.news },
    { id: 'cambio', label: t.exchange },
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: ctry?.g1 || '#00b96b' }]} edges={['left', 'right']}>
      <LinearGradient colors={[ctry?.g1 || '#00b96b', ctry?.g2 || '#00e5a0']} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>CEMAC</Text>
          <Text style={s.headerSub}>{ctry?.nameES || 'Zona CEMAC'} · {lang}</Text>
        </View>
        <TouchableOpacity onPress={() => setTransferOpen(true)} style={s.sendBtn}>
          <Text style={s.sendBtnText}>💸</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {TABS.map(tb => (
          <TouchableOpacity key={tb.id} style={[s.tab, tab === tb.id && s.tabActive]} onPress={() => setTab(tb.id)}>
            <Text style={[s.tabText, tab === tb.id && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ backgroundColor: '#f0f2f5' }} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {tab === 'servicios' && (
          <>
            <TextInput style={s.search} value={query} onChangeText={setQuery} placeholder={t.search} placeholderTextColor="#888" />
            {filtered.length === 0 && <Text style={s.empty}>{t.noResults}</Text>}
            <View style={s.grid}>
              {filtered.map(sv => (
                <TouchableOpacity key={sv.id} style={s.svcCard} onPress={() => {
                  if (sv.id === 's1') { setTransferOpen(true); return; }
                  if (sv.id === 's2') { router.push('/_qr-scanner' as any); return; }
                  // Servicios s3-s8: navegar a servicios de la app principal
                  const routeMap: Record<string, string> = {
                    's3': '/(tabs)/servicios?service=supermercado',
                    's4': '/(tabs)/servicios?service=recarga',
                    's5': '/(tabs)/servicios?service=electricidad',
                    's6': '/(tabs)/servicios?service=agua',
                    's7': '/(tabs)/servicios?service=seguros',
                    's8': '/(tabs)/servicios?service=impuestos',
                  };
                  if (routeMap[sv.id]) router.push(routeMap[sv.id] as any);
                }}>
                  <View style={[s.svcIcon, { backgroundColor: sv.bg }]}>
                    <Text style={{ fontSize: 22 }}>{sv.icon}</Text>
                  </View>
                  <Text style={s.svcName}>{sv.nameES}</Text>
                  <Text style={s.svcDesc}>{sv.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tab === 'ocio' && LEISURE.map(l => (
          <View key={l.id} style={s.card}>
            <Text style={{ fontSize: 28 }}>{CAT_ICON[l.cat] || '📍'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{l.nameES}</Text>
              <Text style={s.cardSub}>⭐ {l.rating} · {l.price}</Text>
              <Text style={s.cardSub}>{l.addr}</Text>
            </View>
          </View>
        ))}

        {tab === 'cajeros' && ATMS.map(a => (
          <View key={a.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{a.bank}</Text>
              <Text style={s.cardSub}>{a.addr}</Text>
              <Text style={s.cardSub}>{t.fee}: {a.fee} · Límite: {a.limit}</Text>
            </View>
            <Text style={{ color: a.ok ? '#22c55e' : '#ef4444', fontWeight: '700', fontSize: 11 }}>
              {a.ok ? '● Abierto' : '● Cerrado'}
            </Text>
          </View>
        ))}

        {tab === 'cuenta' && (
          <>
            <View style={s.balanceCard}>
              <Text style={s.balanceLabel}>{t.balance}</Text>
              <Text style={s.balanceVal}>{balance.toLocaleString()} XAF</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => setTransferOpen(true)}>
                <Text style={s.primaryBtnText}>{t.sendMoney}</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.sectionLabel}>HISTORIAL</Text>
            {HISTORY.map(h => (
              <View key={h.id} style={s.histRow}>
                <Text style={{ fontSize: 18 }}>{h.type === 'in' ? '📥' : '📤'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{h.desc}</Text>
                  <Text style={s.cardSub}>{h.date}</Text>
                </View>
                <Text style={{ color: h.type === 'in' ? '#22c55e' : '#ef4444', fontWeight: '800' }}>
                  {h.type === 'in' ? '+' : '-'}{h.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {tab === 'noticias' && NEWS.map(n => (
          <View key={n.id} style={s.newsCard}>
            <View style={[s.newsCat, { backgroundColor: (NEWS_COLOR[n.cat] || '#666') + '22' }]}>
              <Text style={{ fontSize: 10, color: NEWS_COLOR[n.cat], fontWeight: '700' }}>{n.cat.toUpperCase()}</Text>
            </View>
            <Text style={s.cardTitle}>{n.title}</Text>
            <Text style={s.cardSub}>{n.source} · {n.time}</Text>
          </View>
        ))}

        {tab === 'cambio' && (
          <>
            <Text style={s.sectionLabel}>{t.rates}</Text>
            {Object.entries(RATES).filter(([k]) => k !== 'XOF').map(([cur, rate]) => (
              <View key={cur} style={s.rateRow}>
                <Text style={s.cardTitle}>1 XAF → {cur}</Text>
                <Text style={s.rateVal}>{rate}</Text>
              </View>
            ))}
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>{t.convert}</Text>
            <TextInput style={s.search} value={amt} onChangeText={setAmt} placeholder="Cantidad" keyboardType="numeric" placeholderTextColor="#888" />
            <View style={s.curRow}>
              {['XAF', 'EUR', 'USD'].map(c => (
                <TouchableOpacity key={`f-${c}`} style={[s.chip, fromCur === c && s.chipActive]} onPress={() => setFromCur(c)}>
                  <Text style={[s.chipText, fromCur === c && s.chipTextActive]}>{t.from} {c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.curRow}>
              {['EUR', 'USD', 'GBP'].map(c => (
                <TouchableOpacity key={`t-${c}`} style={[s.chip, toCur === c && s.chipActive]} onPress={() => setToCur(c)}>
                  <Text style={[s.chipText, toCur === c && s.chipTextActive]}>{t.to} {c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {convertResult && (
              <Text style={s.resultText}>{t.result}: {convertResult} {toCur}</Text>
            )}
          </>
        )}

        <TouchableOpacity style={s.webLink} onPress={() => Linking.openURL('https://www.cemac.int')}>
          <Text style={s.webLinkText}>🌐 Sitio oficial CEMAC</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={transferOpen} transparent animationType="slide" onRequestClose={() => setTransferOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={s.modalOverlay} onPress={() => setTransferOpen(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>{t.sendMoney}</Text>
            <Text style={s.fieldLabel}>{t.from}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {COUNTRIES.map(c => (
                <TouchableOpacity key={`f-${c.code}`} style={[s.chip, xfer.from === c.code && s.chipActive]} onPress={() => setXfer(p => ({ ...p, from: c.code }))}>
                  <Text style={[s.chipText, xfer.from === c.code && s.chipTextActive]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.fieldLabel}>{t.to}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {COUNTRIES.map(c => (
                <TouchableOpacity key={`t-${c.code}`} style={[s.chip, xfer.to === c.code && s.chipActive]} onPress={() => setXfer(p => ({ ...p, to: c.code }))}>
                  <Text style={[s.chipText, xfer.to === c.code && s.chipTextActive]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={s.search} value={xfer.name} onChangeText={v => setXfer(p => ({ ...p, name: v }))} placeholder={t.recipient} placeholderTextColor="#888" />
            <TextInput style={s.search} value={xfer.account} onChangeText={v => setXfer(p => ({ ...p, account: v }))} placeholder="Cuenta / IBAN" placeholderTextColor="#888" />
            <TextInput style={s.search} value={xfer.amount} onChangeText={v => setXfer(p => ({ ...p, amount: v }))} placeholder={t.amount} keyboardType="numeric" placeholderTextColor="#888" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setTransferOpen(false)}>
                <Text style={s.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.primaryBtn} onPress={sendTransfer} disabled={xferLoading}>
                {xferLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t.send}</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  welcomeBack: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  welcomeScroll: { paddingHorizontal: 12, paddingBottom: 20 },
  welcomeHero: { alignItems: 'center', paddingTop: 8, paddingBottom: 10, paddingHorizontal: 20 },
  welcomeTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8, marginBottom: 2 },
  welcomeSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center', marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 4 },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  glassLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  countryCell: { width: '31%', alignItems: 'center', gap: 5, paddingVertical: 4 },
  countryIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  countryCode: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  countryFlag: { fontSize: 28 },
  countryShort: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  countryCap: { color: 'rgba(255,255,255,0.6)', fontSize: 9, textAlign: 'center' },
  langGrid: { flexDirection: 'row', gap: 6 },
  langCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  langCellActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  langCodeBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCode: { color: '#fff', fontWeight: '900', fontSize: 11 },
  langName: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a24', borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#00c8a0', borderColor: '#00c8a0' },
  chipText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: '#00c8a0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 18, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { fontSize: 20 },
  tabBar: { backgroundColor: '#fff', maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { paddingHorizontal: 14, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00c8a0' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#00c8a0' },
  search: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14, color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  svcCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  svcIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  svcName: { fontSize: 13, fontWeight: '700', color: '#111' },
  svcDesc: { fontSize: 11, color: '#888', marginTop: 4 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  cardSub: { fontSize: 11, color: '#888', marginTop: 2 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: '#888' },
  balanceVal: { fontSize: 28, fontWeight: '900', color: '#111', marginVertical: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 0.8, marginBottom: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  newsCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  newsCat: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  rateVal: { fontWeight: '800', color: '#00c8a0' },
  curRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  resultText: { fontSize: 16, fontWeight: '800', color: '#00c8a0', textAlign: 'center', marginTop: 8 },
  empty: { textAlign: 'center', color: '#aaa', padding: 20 },
  webLink: { alignItems: 'center', marginTop: 20, padding: 12 },
  webLinkText: { color: '#00c8a0', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '700' },
});
