// Módulo Mis Facturas — paridad ServiciosModules.tsx web — CONECTADO CON BACKEND REAL
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getApiBase, getToken, walletAPI } from '../../api';
import { toast } from '../Toast';
import { FinancialModuleShell, SummaryCard, FilterChips, StatusPill } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type FScreen = 'home' | 'add' | 'detail' | 'pay' | 'success';

interface Bill {
  id: string;
  service: string;
  provider: string;
  amount: number;
  due_date: string;
  reference: string;
  category_id: string;
  icon: string;
  color: string;
  status: 'pendiente' | 'vencida' | 'pagada';
  paid_at?: string;
  created_at: string;
}

interface BillCategory {
  id: string;
  name: string;
  icon: string;
  provider: string;
  color: string;
}

interface Props { 
  visible: boolean; 
  onClose: () => void; 
  userBalance?: number; 
}

const FILTER_OPTS = [
  { id: 'todas', label: 'Todas' }, 
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'vencida', label: 'Vencida' }, 
  { id: 'pagada', label: 'Pagada' },
];

// APIs para backend real
const billsAPI = {
  async getCategories(): Promise<BillCategory[]> {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/services/bills/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return res.json();
    } catch (error) {
      // Error loading categories - using fallback
    }
    return [];
  },

  async getBills(status?: string): Promise<Bill[]> {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const url = `${BASE}/api/services/bills${status && status !== 'todas' ? `?status=${status}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return res.json();
    } catch (error) {
      // Error loading bills - using fallback
    }
    return [];
  },

  async createBill(billData: any) {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/services/bills`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billData)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear factura');
    }
    
    return res.json();
  },

  async payBill(billId: string, paymentMethod: string = 'EGCHAT') {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/services/bills/${billId}/pay`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentMethod })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al pagar factura');
    }
    
    return res.json();
  },

  async deleteBill(billId: string) {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/services/bills/${billId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al eliminar factura');
    }
    
    return res.json();
  }
};

export const FacturasModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [screen, setScreen] = useState<FScreen>('home');
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [filter, setFilter] = useState<'todas' | 'pendiente' | 'vencida' | 'pagada'>('todas');
  const [form, setForm] = useState({ service: '', provider: '', amount: '', dueDate: '', reference: '', categoryId: '' });
  const [payMethod, setPayMethod] = useState('EGCHAT');
  const [balance, setBalance] = useState(userBalance);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { 
    if (visible) {
      setBalance(userBalance);
      loadData();
    }
  }, [visible, userBalance]);
  
  useEffect(() => { 
    if (!visible) { 
      setScreen('home'); 
      setSelected(null); 
    } 
  }, [visible]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [billsData, categoriesData] = await Promise.all([
        billsAPI.getBills(filter),
        billsAPI.getCategories()
      ]);
      setBills(billsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Error cargando datos');
    } finally {
      setLoadingData(false);
    }
  };

  const loadBills = async (status?: string) => {
    setLoadingData(true);
    try {
      const data = await billsAPI.getBills(status);
      setBills(data);
    } catch (error) {
      toast.error('Error cargando facturas');
    } finally {
      setLoadingData(false);
    }
  };

  const loadBalance = async () => {
    try {
      const result = await walletAPI.getBalance();
      setBalance(result.balance || 0);
    } catch (error) {
      // Error loading balance - continue with cached value
    }
  };

  // Calcular estadísticas
  const pending = bills.filter(b => b.status !== 'pagada');
  const totalPending = pending.reduce((s, b) => s + b.amount, 0);
  const overdue = bills.filter(b => b.status === 'vencida');
  const filtered = filter === 'todas' ? bills : bills.filter(b => b.status === filter);
  
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const back = () => { 
    if (screen === 'home') onClose(); 
    else setScreen('home'); 
  };

  const payBill = async () => {
    if (!selected || !payMethod) {
      toast.error('Selecciona método de pago');
      return;
    }

    if (selected.amount > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setLoading(true);
    try {
      const result = await billsAPI.payBill(selected.id, payMethod);
      setBalance(result.balance || balance - selected.amount);
      
      // Actualizar la factura en el estado local
      setBills(p => p.map(b => b.id === selected.id ? { ...b, status: 'pagada' as const } : b));
      
      setScreen('success');
      toast.success('¡Pago completado!');
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar pago');
    } finally {
      setLoading(false);
    }
  };

  const addBill = async () => {
    const cat = categories.find(c => c.id === form.categoryId);
    if (!form.service.trim() || !form.amount.trim() || !form.dueDate.trim()) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const billData = {
        service: form.service.trim(),
        provider: form.provider.trim() || cat?.provider || '',
        amount: form.amount.trim(),
        dueDate: form.dueDate.trim(),
        reference: form.reference.trim(),
        categoryId: form.categoryId || 'otros'
      };

      await billsAPI.createBill(billData);
      
      setForm({ service: '', provider: '', amount: '', dueDate: '', reference: '', categoryId: '' });
      setScreen('home');
      toast.success('Factura creada correctamente');
      
      // Recargar facturas
      loadBills(filter);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as typeof filter);
    loadBills(newFilter === 'todas' ? undefined : newFilter);
  };

  const headerAction = screen === 'home' ? (
    <TouchableOpacity style={s.addBtn} onPress={() => setScreen('add')}>
      <Text style={s.addBtnText}>+ Añadir</Text>
    </TouchableOpacity>
  ) : undefined;

  const fixedTop = screen === 'home' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SummaryCard
        label="Total pendiente de pago"
        amount={totalPending}
        colors={['#C47D2A', '#D97706']}
        stats={[
          { v: bills.filter(b => b.status === 'pendiente').length, l: 'Pendientes' },
          { v: overdue.length, l: 'Vencidas' },
          { v: bills.filter(b => b.status === 'pagada').length, l: 'Pagadas' },
        ]}
      />
      <FilterChips 
        options={FILTER_OPTS} 
        value={filter} 
        onChange={handleFilterChange} 
        activeColor="#C47D2A" 
      />
    </View>
  ) : undefined;

  const titles: Record<FScreen, string> = {
    home: 'Mis Facturas', 
    add: 'Nueva Factura', 
    detail: selected?.service || 'Factura',
    pay: 'Pagar Factura', 
    success: 'Pago completado',
  };

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `${pending.length} pendientes — ${overdue.length} vencidas` : undefined}
      onBack={back}
      onClose={onClose}
      headerAction={headerAction}
      fixedTop={fixedTop}
      onRefresh={screen === 'home' ? () => {
        setRefreshKey(k => k + 1);
        loadBills(filter);
      } : undefined}
    >
      {screen === 'home' && (
        <View key={refreshKey}>
          {loadingData ? (
            <View style={s.loading}>
              <Text>Cargando facturas...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={s.emptyTitle}>Sin facturas</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => setScreen('add')}>
                <Text style={s.addBtnText}>+ Añadir factura</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.map(b => (
            <TouchableOpacity key={b.id} style={s.billRow} onPress={() => { setSelected(b); setScreen('detail'); }}>
              <View style={[s.billIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                <Text style={{ fontSize: 22 }}>{b.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.billTop}>
                  <Text style={s.billService}>{b.service}</Text>
                  <Text style={[s.billAmt, b.status === 'pagada' && { color: '#16A34A' }, b.status === 'vencida' && { color: '#DC2626' }]}>
                    {b.amount.toLocaleString()} XAF
                  </Text>
                </View>
                <View style={s.billBottom}>
                  <Text style={s.billMeta}>{b.provider} — Vence {new Date(b.due_date).toLocaleDateString('es')}</Text>
                  <StatusPill status={b.status} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'add' && (
        <View>
          <Text style={s.catLbl}>Categoría</Text>
          <View style={s.catGrid}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.catCell, form.categoryId === c.id && { backgroundColor: 'transparent', borderBottomWidth: 2, borderBottomColor: c.color }]}
                onPress={() => { 
                  setF('categoryId', c.id); 
                  setF('service', c.name); 
                  setF('provider', c.provider); 
                }}
              >
                <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                <Text style={[s.catLabel, form.categoryId === c.id && { color: c.color }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField placeholder="Nombre del servicio" value={form.service} onChangeText={v => setF('service', v)} />
          <FormField placeholder="Proveedor / Empresa" value={form.provider} onChangeText={v => setF('provider', v)} />
          <FormField placeholder="Número de referencia / contrato" value={form.reference} onChangeText={v => setF('reference', v)} />
          <FormField placeholder="Importe (XAF)" value={form.amount} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
          <FormField placeholder="Fecha de vencimiento (AAAA-MM-DD)" value={form.dueDate} onChangeText={v => setF('dueDate', v)} />
          <PrimaryButton 
            label={loading ? 'Guardando...' : 'Guardar factura'} 
            color="#C47D2A" 
            disabled={!form.service.trim() || !form.amount.trim() || !form.dueDate.trim() || loading} 
            onPress={addBill} 
          />
        </View>
      )}

      {screen === 'detail' && selected && (
        <View>
          <View style={s.detailCard}>
            <View style={[s.billIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', width: 56, height: 56 }]}>
              <Text style={{ fontSize: 28 }}>{selected.icon}</Text>
            </View>
            <Text style={s.detailName}>{selected.service}</Text>
            <Text style={s.detailProv}>{selected.provider}</Text>
            {[
              ['Referencia', selected.reference || '—'], 
              ['Vencimiento', new Date(selected.due_date).toLocaleDateString('es')], 
              ['Estado', selected.status], 
              ['Importe', `${selected.amount.toLocaleString()} XAF`]
            ].map(([l, v]) => (
              <View key={l} style={s.detailRow}>
                <Text style={s.detailLbl}>{l}</Text>
                <Text style={s.detailVal}>{v}</Text>
              </View>
            ))}
          </View>
          {selected.status !== 'pagada' ? (
            <PrimaryButton label="💳 Pagar ahora" color={selected.color} onPress={() => setScreen('pay')} />
          ) : (
            <View style={s.paidBanner}>
              <Text style={s.paidText}>✅ Esta factura ya está pagada</Text>
            </View>
          )}
        </View>
      )}

      {screen === 'pay' && selected && (
        <View>
          <View style={s.detailCard}>
            <Text style={s.payTitle}>Método de pago</Text>
            <Text style={s.payAmt}>{selected.amount.toLocaleString()} XAF</Text>
            <Text style={s.balHint}>Saldo monedero: {balance.toLocaleString()} XAF</Text>
          </View>
          {([['EGCHAT', 'Monedero EGCHAT'], ['banco', 'Cuenta bancaria'], ['tarjeta', 'Tarjeta de débito']] as const).map(([id, label]) => (
            <TouchableOpacity key={id} style={[s.payOpt, payMethod === id && s.payOptActive]} onPress={() => setPayMethod(id)}>
              <Text style={s.payOptText}>{label}</Text>
            </TouchableOpacity>
          ))}
          <PrimaryButton
            label={loading ? 'Procesando...' : 'Confirmar pago'}
            color="#C47D2A"
            disabled={!payMethod || selected.amount > balance || loading}
            onPress={payBill}
          />
        </View>
      )}

      {screen === 'success' && selected && (
        <View style={s.success}>
          <Text style={{ fontSize: 52 }}>✅</Text>
          <Text style={s.successTitle}>Pago realizado</Text>
          <Text style={s.successSub}>{selected.service} — {selected.amount.toLocaleString()} XAF</Text>
          <PrimaryButton 
            label="Listo" 
            onPress={() => { 
              setSelected(null); 
              setScreen('home');
              loadBalance();
            }} 
            color="#C47D2A" 
          />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 30 },
  addBtn: { backgroundColor: '#C47D2A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  billIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  billService: { fontSize: 14, fontWeight: '700', color: '#111827' },
  billAmt: { fontSize: 14, fontWeight: '800', color: '#111827' },
  billBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billMeta: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  catLbl: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  catCell: { width: '25%', backgroundColor: '#fff', alignItems: 'center', padding: 12, marginBottom: 1 },
  catLabel: { fontSize: 9, fontWeight: '600', color: '#374151', textAlign: 'center', marginTop: 4 },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, alignItems: 'center' },
  detailName: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12 },
  detailProv: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLbl: { fontSize: 13, color: '#9CA3AF' },
  detailVal: { fontSize: 13, fontWeight: '700', color: '#111827' },
  paidBanner: { backgroundColor: '#F0FAF5', borderRadius: 12, padding: 14, alignItems: 'center' },
  paidText: { color: '#16A34A', fontWeight: '700', fontSize: 14 },
  payTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  payAmt: { fontSize: 28, fontWeight: '900', color: '#C47D2A', marginBottom: 8 },
  balHint: { fontSize: 12, color: '#8A9BB5' },
  payOpt: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  payOptActive: { borderColor: '#C47D2A', backgroundColor: '#FDF6EE' },
  payOptText: { fontSize: 13, fontWeight: '600', color: '#1A2B4A' },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  successSub: { fontSize: 13, color: '#888', marginBottom: 16 },
});
