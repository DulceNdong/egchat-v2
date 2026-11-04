// Módulo Seguros — la prima la fija service_tariffs y el cargo lo hace el libro
// mayor del servidor. Nada de catálogo local ni solicitudes imaginarias.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { segurosAPI, walletAPI } from '../../api';
import { toast } from '../Toast';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { t as tr } from '../../translations';

type SgScreen = 'home' | 'contratar' | 'exitos' | 'polizas' | 'siniestro';

interface Props { visible: boolean; onClose: () => void; }

interface Oferta {
  companyId: string;
  companyName: string;
  variant: string;
  name: string;
  price: number;
  currency: string;
  coverage: string;
}

const VARIANT_LABEL: Record<string, string> = {
  vida: 'Vida',
  salud: 'Salud',
  auto: 'Auto',
  hogar: 'Hogar',
  viaje: 'Viaje',
  empresarial: 'Empresarial',
  transporte: 'Transporte',
};

const VARIANT_EMOJI: Record<string, string> = {
  vida: '❤️', salud: '🏥', auto: '🚗', hogar: '🏠', viaje: '✈️', empresarial: '🏢', transporte: '🚚',
};

const VARIANT_COLOR: Record<string, string> = {
  vida: '#E05C7A', salud: '#2E9E6B', auto: '#3B7DD8', hogar: '#C47D2A', viaje: '#6B5BD6',
  empresarial: '#0E7FA8', transporte: '#F97316',
};

const FILTER_OPTS = [
  { id: 'all', label: 'Todos' },
  { id: 'vida', label: 'Vida' }, { id: 'salud', label: 'Salud' }, { id: 'auto', label: 'Auto' },
  { id: 'hogar', label: 'Hogar' }, { id: 'viaje', label: 'Viaje' }, { id: 'empresarial', label: 'Empresarial' },
  { id: 'transporte', label: 'Transporte' },
];

// Las tres aseguradoras que el servidor reconoce (ASEGURADORAS). Cualquier otra
// que aparezca en el futuro se pinta con la marca por defecto.
const MARCA: Record<string, { color: string; color2: string; initials: string; desc: string }> = {
  coge:    { color: '#1B7A52', color2: '#2E9E6B', initials: 'CG', desc: 'COGE Seguros — Guinea Ecuatorial' },
  siat:    { color: '#3B7DD8', color2: '#5A9BE8', initials: 'SI', desc: 'SIAT Guinea — seguros generales' },
  allianz: { color: '#0E5A8A', color2: '#1B7FBF', initials: 'AL', desc: 'Allianz GE — cobertura internacional' },
};

const marcaDe = (id: string, name: string) => MARCA[id] || {
  color: '#2E9E6B',
  color2: '#1B7A52',
  initials: name.slice(0, 2).toUpperCase(),
  desc: name,
};

export const SegurosModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<SgScreen>('home');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [companias, setCompanias] = useState<{ id: string; name: string }[]>([]);
  const [sinPrima, setSinPrima] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Oferta | null>(null);
  const [form, setForm] = useState({ name: '', dni: '', phone: '', email: '', address: '', city: '' });
  const [externalId, setExternalId] = useState('');
  const [recibo, setRecibo] = useState<{ poliza: string; prima: number; balance: number | null; caduca: string } | null>(null);
  const [polizas, setPolizas] = useState<any[]>([]);
  const [siniestro, setSiniestro] = useState<{ poliza: any; amount: string; notes: string } | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setScreen('home'); setOfertas([]); setCompanias([]); setSinPrima([]); setFilter('all');
      setSelected(null); setExternalId(''); setRecibo(null); setSiniestro(null);
      setError(''); setSending(false);
      return;
    }
    loadPrimas();
    walletAPI.getBalance().then(r => setBalance(Number(r?.balance) || 0)).catch(() => {});
  }, [visible]);

  const loadPrimas = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const cs = await segurosAPI.companias();
      const lista = Array.isArray(cs) ? cs : [];
      setCompanias(lista);
      const porCompania = await Promise.all(lista.map(async c => {
        try {
          const rows = await segurosAPI.productos(c.id);
          return { id: c.id, name: c.name, productos: Array.isArray(rows) ? rows : [] };
        } catch {
          return { id: c.id, name: c.name, productos: [] as any[] };
        }
      }));
      const flat: Oferta[] = [];
      const sinTarifa: string[] = [];
      porCompania.forEach(c => {
        if (!c.productos.length) sinTarifa.push(c.name);
        c.productos.forEach(p => flat.push({
          companyId: c.id,
          companyName: c.name,
          variant: String(p.id),
          name: String(p.name ?? p.id),
          price: Number(p.price),
          currency: p.currency || 'XAF',
          coverage: p.coverage || '12 meses',
        }));
      });
      setOfertas(flat);
      setSinPrima(sinTarifa);
      if (!flat.length) setError('Las primas no estan disponibles ahora mismo. No se puede contratar ningun seguro.');
    } catch (e: any) {
      setOfertas([]);
      setError(e?.message || 'No se pudieron cargar las primas de las aseguradoras.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPolizas = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await segurosAPI.polizas();
      setPolizas(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar tus polizas.');
      setPolizas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtradas = filter === 'all' ? ofertas : ofertas.filter(o => o.variant === filter);

  const formOk = !!(form.name.trim() && form.dni.trim() && form.phone.trim());

  const back = () => {
    if (screen === 'home') onClose();
    else if (screen === 'contratar') setScreen('home');
    else if (screen === 'exitos') setScreen('home');
    else if (screen === 'siniestro') setScreen('polizas');
    else setScreen('home');
  };

  const titles: Record<SgScreen, string> = {
    home: 'Seguros', contratar: tr('xtSolicitarSeguro'), exitos: 'Poliza emitida',
    polizas: 'Mis polizas', siniestro: 'Abrir siniestro',
  };

  const abrirContratacion = (o: Oferta) => {
    setSelected(o);
    // Una referencia por intento de contratacion: reintentar tras un corte de red
    // no vuelve a cobrar la prima.
    setExternalId(prev => prev || `POL-${Date.now()}`);
    setScreen('contratar');
  };

  const contratar = async () => {
    if (!selected || sending) return;
    if (balance < selected.price) {
      Alert.alert(
        tr('svcInsufficientBalance'),
        `La prima es ${selected.price.toLocaleString()} ${selected.currency} y tu monedero tiene ${balance.toLocaleString()} XAF. Recarga el monedero y vuelve a intentarlo.`,
        [{ text: tr('cancel'), style: 'cancel' }]
      );
      return;
    }
    setSending(true);
    try {
      const res = await segurosAPI.contratar({
        companyId: selected.companyId,
        producto: selected.variant,
        datos: { ...form },
        external_id: externalId,
      });
      const prima = Number(res.premium ?? selected.price);
      const tras = res.balance == null ? null : Number(res.balance);
      if (tras != null && Number.isFinite(tras)) setBalance(tras);
      setRecibo({
        poliza: String(res.policyId || res.solicitudId || ''),
        prima,
        balance: tras,
        caduca: res.expires_at ? String(res.expires_at).slice(0, 10) : '',
      });
      setExternalId('');
      setScreen('exitos');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo emitir la poliza.');
    } finally {
      setSending(false);
    }
  };

  const abrirSiniestro = async () => {
    if (!siniestro) return;
    const monto = Number(siniestro.amount);
    if (!(monto > 0)) { toast.error('Indica el importe reclamado.'); return; }
    setSending(true);
    try {
      const res = await segurosAPI.abrirSiniestro(String(siniestro.poliza.id), {
        amount: monto,
        notes: siniestro.notes.trim() || undefined,
      });
      setSiniestro(null);
      setScreen('polizas');
      toast.success(`Siniestro registrado (${res.claim_ref}). La aseguradora lo revisara.`);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar el siniestro.');
    } finally {
      setSending(false);
    }
  };

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `${companias.length} aseguradoras — primas de la base de datos` : undefined}
      onBack={back}
      onClose={onClose}
      headerGradient={['#2E9E6B', '#1B7A52']}
      onRefresh={screen === 'home' ? loadPrimas : screen === 'polizas' ? loadPolizas : undefined}
    >
      {screen === 'home' && (
        <View>
          <TouchableOpacity style={s.myPoliciesBtn} onPress={() => { setScreen('polizas'); loadPolizas(); }}>
            <Text style={s.myPoliciesTxt}>📄 Mis polizas y siniestros</Text>
            <Text style={s.chev}>›</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
            {FILTER_OPTS.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[s.filterChip, filter === f.id && s.filterActive]}>
                <Text style={[s.filterText, filter === f.id && s.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={s.centerBox}><ActivityIndicator size="large" color="#2E9E6B" /><Text style={s.centerTxt}>Cargando primas…</Text></View>
          ) : (
            <>
              {!!error && <Text style={s.errorTxt}>{error}</Text>}
              {!!sinPrima.length && (
                <Text style={s.warnTxt}>{sinPrima.join(', ')}: sin prima publicada. No se pueden contratar hasta que la aseguradora la registre.</Text>
              )}
              {filtradas.map((o, i) => {
                const m = marcaDe(o.companyId, o.companyName);
                return (
                  <TouchableOpacity key={`${o.companyId}-${o.variant}`} style={s.prodCard} onPress={() => abrirContratacion(o)}>
                    <View style={[s.prodIcon, { backgroundColor: (VARIANT_COLOR[o.variant] || m.color) + '15' }]}>
                      <Text>{VARIANT_EMOJI[o.variant] || '🛡️'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.prodName}>{o.name}</Text>
                      <Text style={s.prodCo}>{o.companyName}</Text>
                      <Text style={s.prodDesc}>{o.coverage}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.prodPrice}>{o.price.toLocaleString()}</Text>
                      <Text style={s.prodCov}>{o.currency}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {!filtradas.length && !error && (
                <Text style={s.centerTxt}>No hay pólizas publicadas para este filtro.</Text>
              )}
              <Text style={s.sectionLbl}>ASEGURADORAS</Text>
              <View style={s.insGrid}>
                {companias.map(c => {
                  const m = marcaDe(c.id, c.name);
                  const n = ofertas.filter(o => o.companyId === c.id).length;
                  return (
                    <TouchableOpacity key={c.id} style={s.insCell} onPress={() => { setFilter('all'); loadPrimas(); }}>
                      <LinearGradient colors={[m.color, m.color2]} style={s.insLogo}>
                        <Text style={s.insInit}>{m.initials}</Text>
                      </LinearGradient>
                      <Text style={s.insName} numberOfLines={2}>{c.name}</Text>
                      <View style={[s.insPill, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                        <Text style={[s.insPillText, { color: m.color }]}>{n ? `${n} primas` : 'sin primas'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}

      {screen === 'contratar' && selected && (
        <View>
          <View style={s.detailCard}>
            <Text style={s.detailName}>{selected.name}</Text>
            <Text style={s.detailSub}>{selected.companyName}</Text>
            <Text style={s.priceBig}>{selected.price.toLocaleString()} {selected.currency}</Text>
            <Text style={s.detailDesc}>Prima anual. Se debitan del monedero al emitir la póliza.</Text>
            <View style={[s.covBox, { backgroundColor: (VARIANT_COLOR[selected.variant] || '#2E9E6B') + '10' }]}>
              <Text style={s.covLbl}>Cobertura</Text>
              <Text style={[s.covVal, { color: VARIANT_COLOR[selected.variant] || '#2E9E6B' }]}>{selected.coverage}</Text>
            </View>
            <Text style={[s.balanceLine, { color: balance >= selected.price ? '#2E9E6B' : '#DC2626' }]}>
              Monedero: {balance.toLocaleString()} XAF
            </Text>
          </View>
          {([['name', 'Nombre completo'], ['dni', 'DNI / Pasaporte'], ['phone', 'Teléfono'], ['email', 'Correo electrónico'], ['address', 'Dirección'], ['city', tr('xtCiudadBarrio')]] as const).map(([k, l]) => (
            <FormField key={k} placeholder={l} value={form[k]} onChangeText={v => setForm(p => ({ ...p, [k]: v }))} keyboardType={k === 'phone' ? 'phone-pad' : 'default'} />
          ))}
          <PrimaryButton
            label={sending ? 'Emitiendo…' : `Contratar por ${selected.price.toLocaleString()} ${selected.currency}`}
            disabled={!formOk || sending || balance < selected.price}
            onPress={contratar}
            color="#2E9E6B"
          />
        </View>
      )}

      {screen === 'exitos' && recibo && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Poliza emitida</Text>
          <Text style={s.successSub}>{selected?.name} — {selected?.companyName}</Text>
          <View style={s.receipt}>
            <View style={s.receiptRow}><Text style={s.receiptLbl}>Póliza</Text><Text style={s.receiptVal}>{recibo.poliza}</Text></View>
            <View style={s.receiptRow}><Text style={s.receiptLbl}>Prima cobrada</Text><Text style={s.receiptVal}>{recibo.prima.toLocaleString()} XAF</Text></View>
            {!!recibo.caduca && <View style={s.receiptRow}><Text style={s.receiptLbl}>Caduca</Text><Text style={s.receiptVal}>{recibo.caduca}</Text></View>}
            <View style={s.receiptRow}><Text style={s.receiptLbl}>Saldo</Text><Text style={s.receiptVal}>{recibo.balance == null ? '—' : `${recibo.balance.toLocaleString()} XAF`}</Text></View>
          </View>
          <PrimaryButton label="Ver mis polizas" onPress={() => { setScreen('polizas'); loadPolizas(); }} color="#2E9E6B" />
          <TouchableOpacity style={s.textBtn} onPress={onClose}><Text style={s.textBtnTxt}>{tr('close')}</Text></TouchableOpacity>
        </View>
      )}

      {screen === 'polizas' && (
        <View>
          {loading ? (
            <View style={s.centerBox}><ActivityIndicator size="large" color="#2E9E6B" /><Text style={s.centerTxt}>Cargando pólizas…</Text></View>
          ) : !polizas.length ? (
            <Text style={s.centerTxt}>Todavía no tienes ninguna póliza contratada.</Text>
          ) : (
            polizas.map(p => (
              <View key={String(p.id)} style={s.policyCard}>
                <Text style={s.prodName}>{p.product} · {p.company}</Text>
                <Text style={s.prodCo}>{p.policy_ref}</Text>
                <View style={s.policyRow}>
                  <Text style={s.policyPrima}>{Number(p.premium).toLocaleString()} {p.currency || 'XAF'}</Text>
                  <Text style={[s.policyStatus, { color: p.status === 'active' ? '#2E9E6B' : '#8A9BB5' }]}>{p.status}</Text>
                </View>
                {!!p.expires_at && <Text style={s.policyDates}>Vigente hasta {String(p.expires_at).slice(0, 10)}</Text>}
                {p.status === 'active' && (
                  <TouchableOpacity
                    style={s.claimBtn}
                    onPress={() => { setSiniestro({ poliza: p, amount: '', notes: '' }); setScreen('siniestro'); }}
                  >
                    <Text style={s.claimBtnTxt}>Abrir siniestro</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {screen === 'siniestro' && siniestro && (
        <View>
          <View style={s.detailCard}>
            <Text style={s.detailName}>{siniestro.poliza.product}</Text>
            <Text style={s.detailSub}>{siniestro.poliza.policy_ref}</Text>
            <Text style={s.detailDesc}>Registrar un siniestro no abona nada: la aseguradora lo revisa y el pago se asentará después por el operador.</Text>
          </View>
          <Text style={s.fieldLbl}>Importe reclamado (XAF)</Text>
          <TextInput
            style={s.amountInput}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={siniestro.amount}
            onChangeText={v => setSiniestro(prev => prev && ({ ...prev, amount: v.replace(/[^0-9]/g, '') }))}
          />
          <Text style={s.fieldLbl}>Qué ha pasado</Text>
          <TextInput
            style={[s.amountInput, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Fecha, lugar y descripción del hecho"
            placeholderTextColor="#9CA3AF"
            multiline
            value={siniestro.notes}
            onChangeText={v => setSiniestro(prev => prev && ({ ...prev, notes: v }))}
          />
          <PrimaryButton
            label={sending ? 'Registrando…' : 'Registrar siniestro'}
            disabled={sending || !(Number(siniestro.amount) > 0)}
            onPress={abrirSiniestro}
            color="#2E9E6B"
          />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  filters: { marginBottom: 12, maxHeight: 36 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterActive: { backgroundColor: '#EEF2F7', borderColor: '#07C160' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#8A9BB5' },
  filterTextActive: { color: '#1A2B4A' },
  myPoliciesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 },
  myPoliciesTxt: { fontSize: 14, fontWeight: '800', color: '#1A2B4A' },
  chev: { fontSize: 20, color: '#8A9BB5' },
  centerBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  centerTxt: { fontSize: 13, color: '#8A9BB5', textAlign: 'center' },
  errorTxt: { fontSize: 12, color: '#DC2626', marginBottom: 12 },
  warnTxt: { fontSize: 11, color: '#B45309', marginBottom: 12 },
  prodCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  prodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prodName: { fontSize: 14, fontWeight: '800', color: '#1A2B4A' },
  prodCo: { fontSize: 11, color: '#8A9BB5' },
  prodDesc: { fontSize: 12, color: '#5A7090', marginTop: 4 },
  prodPrice: { fontSize: 13, fontWeight: '800', color: '#07C160' },
  prodCov: { fontSize: 10, color: '#8A9BB5' },
  sectionLbl: { fontSize: 12, fontWeight: '700', color: '#8A9BB5', letterSpacing: 1, marginVertical: 12 },
  insGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insCell: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 4 },
  insLogo: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  insInit: { color: '#fff', fontSize: 14, fontWeight: '900' },
  insName: { fontSize: 13, fontWeight: '800', color: '#1A2B4A' },
  insPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  insPillText: { fontSize: 10, fontWeight: '700' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, alignItems: 'center' },
  detailName: { fontSize: 18, fontWeight: '900', color: '#1A2B4A', textAlign: 'center' },
  detailSub: { fontSize: 11, color: '#8A9BB5', marginBottom: 8 },
  detailDesc: { fontSize: 12, color: '#5A7090', lineHeight: 18, textAlign: 'center' },
  priceBig: { fontSize: 28, fontWeight: '900', color: '#07C160', marginVertical: 8 },
  covBox: { borderRadius: 10, padding: 10, width: '100%', marginTop: 8 },
  covLbl: { fontSize: 11, color: '#8A9BB5' },
  covVal: { fontSize: 13, fontWeight: '700' },
  balanceLine: { fontSize: 12, fontWeight: '700', marginTop: 10 },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 8 },
  receipt: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  receiptLbl: { fontSize: 12, color: '#8A9BB5' },
  receiptVal: { fontSize: 13, fontWeight: '800', color: '#1A2B4A' },
  textBtn: { paddingVertical: 10 },
  textBtnTxt: { fontSize: 13, color: '#8A9BB5', fontWeight: '700' },
  policyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  policyPrima: { fontSize: 14, fontWeight: '900', color: '#07C160' },
  policyStatus: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  policyDates: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  claimBtn: { marginTop: 10, backgroundColor: '#EFF5FD', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  claimBtnTxt: { fontSize: 12, fontWeight: '800', color: '#3B7DD8' },
  fieldLbl: { fontSize: 11, fontWeight: '700', color: '#8A9BB5', marginBottom: 6, marginTop: 4 },
  amountInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1A2B4A', marginBottom: 12 },
});
