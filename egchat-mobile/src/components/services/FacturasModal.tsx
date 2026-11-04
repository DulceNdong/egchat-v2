// Módulo Mis Facturas — paridad ServiciosModules.tsx web — CONECTADO CON BACKEND REAL
//
// Las deudas las carga el operador (`/api/servicios/facturas/cargar`, solo admin);
// la app lee `service_bills` y paga por `factura_id` en la ruta del proveedor.
// Aquí no se crea ni se borra ninguna factura, y el importe nunca lo escribe el
// usuario: se paga lo que dice la fila.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { serviciosAPI, BillFactura, walletAPI } from '../../api';
import { toast } from '../Toast';
import { FinancialModuleShell, SummaryCard, FilterChips, StatusPill } from './FinancialModuleUI';
import { PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker } from './PublicModuleUI';
import { t as tr } from '../../translations';

type FScreen = 'home' | 'detail' | 'pay' | 'success';
type FilterId = 'todas' | 'pendiente' | 'vencida' | 'pagada';

const PROVIDERS: Record<string, { name: string; icon: string; color: string; pay: (id: string) => Promise<any> }> = {
  segesa: { name: 'SEGESA', icon: '⚡', color: '#1A3A6B', pay: id => serviciosAPI.pagarElectricidad(id) },
  snge: { name: 'SNGE', icon: '💧', color: '#0A4A8A', pay: id => serviciosAPI.pagarAgua(id) },
  dgi: { name: 'DGI', icon: '🏛️', color: '#1B3A6B', pay: id => serviciosAPI.pagarDGI(id) },
};

const prov = (p: string) => PROVIDERS[p] || { name: (p || '').toUpperCase(), icon: '📄', color: '#C47D2A', pay: () => Promise.reject(new Error('Proveedor sin ruta de pago')) };

const FILTER_OPTS: { id: FilterId; label: string }[] = [
  { id: 'todas', label: tr('all') },
  { id: 'pendiente', label: tr('kyPending') },
  { id: 'vencida', label: 'Vencida' },
  { id: 'pagada', label: 'Pagada' },
];

const isOverdue = (b: BillFactura) => {
  if (b.status !== 'pending' || !b.due_date) return false;
  const due = new Date(b.due_date).getTime();
  return !Number.isNaN(due) && due < Date.now();
};

const stateOf = (b: BillFactura): FilterId =>
  b.status === 'paid' ? 'pagada' : isOverdue(b) ? 'vencida' : 'pendiente';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const FacturasModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<FScreen>('home');
  const [bills, setBills] = useState<BillFactura[]>([]);
  const [selected, setSelected] = useState<BillFactura | null>(null);
  const [filter, setFilter] = useState<FilterId>('todas');
  const [payMethod, setPayMethod] = useState('egpay');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [recibo, setRecibo] = useState<{ importe: number; balance: number } | null>(null);

  useEffect(() => {
    if (visible) {
      loadBalance();
      loadBills();
    } else {
      setScreen('home'); setSelected(null); setRecibo(null);
    }
  }, [visible]);

  const loadBills = async () => {
    setLoadingData(true);
    try {
      const res = await serviciosAPI.facturas('todas');
      setBills(res.facturas || []);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar las facturas.');
    } finally {
      setLoadingData(false);
    }
  };

  const loadBalance = async () => {
    try {
      const result = await walletAPI.getBalance();
      setBalance(Number(result.balance ?? 0));
    } catch { /* sigue con el saldo en caché */ }
  };

  const pendiente = bills.filter(b => b.status === 'pending');
  const totalPending = pendiente.reduce((s, b) => s + Number(b.amount || 0), 0);
  const overdue = bills.filter(isOverdue);
  const filtered = filter === 'todas' ? bills : bills.filter(b => stateOf(b) === filter);

  const back = () => {
    if (screen === 'home') onClose();
    else if (screen === 'success') { setSelected(null); setRecibo(null); setScreen('home'); loadBalance(); }
    else setScreen('home');
  };

  const payBill = async () => {
    if (!selected || !payMethod) {
      toast.error(tr('xtSeleccionaMetodoDePago'));
      return;
    }
    setLoading(true);
    try {
      const res = await prov(selected.provider).pay(selected.id);
      setRecibo({ importe: Number(res.importe), balance: Number(res.balance) });
      setBalance(Number(res.balance));
      setBills(p => p.map(b => b.id === selected.id ? { ...b, status: 'paid', paid_at: new Date().toISOString() } : b));
      setScreen('success');
      toast.success(tr('xtPagoCompletado'));
    } catch (e: any) {
      toast.error(e?.message || tr('xtErrorAlProcesarPago'));
    } finally {
      setLoading(false);
    }
  };

  const fixedTop = screen === 'home' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SummaryCard
        label={tr('xtTotalPendienteDePago')}
        amount={totalPending}
        colors={['#C47D2A', '#D97706']}
        stats={[
          { v: bills.filter(b => stateOf(b) === 'pendiente').length, l: 'Pendientes' },
          { v: overdue.length, l: 'Vencidas' },
          { v: bills.filter(b => b.status === 'paid').length, l: 'Pagadas' },
        ]}
      />
      <FilterChips options={FILTER_OPTS} value={filter} onChange={id => setFilter(id as FilterId)} activeColor="#C47D2A" />
    </View>
  ) : undefined;

  const titles: Record<FScreen, string> = {
    home: tr('xtMisFacturas'),
    detail: selected ? prov(selected.provider).name : tr('xtFactura'),
    pay: tr('xtPagarFactura'),
    success: tr('xtPagoCompletado2'),
  };

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `${pendiente.length} pendientes — ${overdue.length} vencidas` : undefined}
      onBack={back}
      onClose={onClose}
      fixedTop={fixedTop}
      onRefresh={screen === 'home' ? loadBills : undefined}
    >
      {screen === 'home' && (
        <View>
          {loadingData ? (
            <View style={s.loading}><Text>Cargando facturas...</Text></View>
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={s.emptyTitle}>{tr('xtSinFacturas')}</Text>
              <Text style={s.emptySub}>Las deudas las carga el proveedor; pulsa actualizar.</Text>
            </View>
          ) : filtered.map(b => (
            <TouchableOpacity key={b.id} style={s.billRow} onPress={() => { setSelected(b); setScreen('detail'); }}>
              <View style={s.billIcon}>
                <Text style={{ fontSize: 22 }}>{prov(b.provider).icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.billTop}>
                  <Text style={s.billService}>{prov(b.provider).name}</Text>
                  <Text style={[s.billAmt, b.status === 'paid' && { color: '#16A34A' }, isOverdue(b) && { color: '#DC2626' }]}>
                    {Number(b.amount).toLocaleString()} {b.currency || 'XAF'}
                  </Text>
                </View>
                <View style={s.billBottom}>
                  <Text style={s.billMeta}>{b.contract_ref} — {b.due_date ? `Vence ${new Date(b.due_date).toLocaleDateString('es')}` : (b.period || '—')}</Text>
                  <StatusPill status={stateOf(b)} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'detail' && selected && (
        <View>
          <View style={s.detailCard}>
            <View style={[s.billIcon, { width: 56, height: 56 }]}><Text style={{ fontSize: 28 }}>{prov(selected.provider).icon}</Text></View>
            <Text style={s.detailName}>{prov(selected.provider).name}</Text>
            <Text style={s.detailProv}>{selected.concept || selected.contract_ref}</Text>
            {[
              [tr('xtReferencia'), selected.contract_ref || '—'],
              [tr('xtVencimiento'), selected.due_date ? new Date(selected.due_date).toLocaleDateString('es') : '—'],
              [tr('mznStatusField'), stateOf(selected)],
              [tr('walAmount'), `${Number(selected.amount).toLocaleString()} ${selected.currency || 'XAF'}`],
            ].map(([l, v]) => (
              <View key={l} style={s.detailRow}>
                <Text style={s.detailLbl}>{l}</Text>
                <Text style={s.detailVal}>{v}</Text>
              </View>
            ))}
          </View>
          {selected.status !== 'paid' ? (
            <PrimaryButton label={tr('xtPagarAhora')} color={prov(selected.provider).color} onPress={() => setScreen('pay')} />
          ) : (
            <View style={s.paidBanner}>
              <Text style={s.paidText}>{tr('xtEstaFacturaYaEstaPagada')}</Text>
              {selected.paid_at && <Text style={s.paidDate}>{new Date(selected.paid_at).toLocaleString('es')}</Text>}
            </View>
          )}
        </View>
      )}

      {screen === 'pay' && selected && (
        <View>
          <View style={s.detailCard}>
            <Text style={s.payTitle}>{tr('djhConfirmPayout')}</Text>
            <Text style={[s.payAmt, { color: prov(selected.provider).color }]}>{Number(selected.amount).toLocaleString()} XAF</Text>
            <Text style={s.balHint}>
              {`Saldo monedero: ${balance === null ? 'sin datos' : `${balance.toLocaleString()} XAF`}`}
            </Text>
          </View>
          <PayMethodPicker value={payMethod} onChange={setPayMethod} accent="#C47D2A" />
          <PrimaryButton
            label={loading ? tr('processing') : tr('djhConfirmPayout')}
            color="#C47D2A"
            disabled={!payMethod || loading || (balance !== null && Number(selected.amount) > balance)}
            onPress={payBill}
          />
        </View>
      )}

      {screen === 'success' && selected && recibo && (
        <View style={s.success}>
          <Text style={{ fontSize: 52 }}>✅</Text>
          <Text style={s.successTitle}>{tr('svcPaymentDone')}</Text>
          <Text style={s.successSub}>{prov(selected.provider).name} — {recibo.importe.toLocaleString()} XAF</Text>
          <Text style={s.successSub}>Saldo restante: {recibo.balance.toLocaleString()} XAF</Text>
          <PrimaryButton label="Listo" onPress={back} color="#C47D2A" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 30 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  billIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  billService: { fontSize: 14, fontWeight: '700', color: '#111827' },
  billAmt: { fontSize: 14, fontWeight: '800', color: '#111827' },
  billBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billMeta: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 12, color: '#9CA3AF' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, alignItems: 'center' },
  detailName: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12 },
  detailProv: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLbl: { fontSize: 13, color: '#9CA3AF' },
  detailVal: { fontSize: 13, fontWeight: '700', color: '#111827' },
  paidBanner: { backgroundColor: '#F0FAF5', borderRadius: 12, padding: 14, alignItems: 'center' },
  paidText: { color: '#16A34A', fontWeight: '700', fontSize: 14 },
  paidDate: { color: '#16A34A', fontSize: 11, marginTop: 4 },
  payTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  payAmt: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  balHint: { fontSize: 12, color: '#8A9BB5' },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  successSub: { fontSize: 13, color: '#888' },
});
