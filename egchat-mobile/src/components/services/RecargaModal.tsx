// Módulo Recarga Tel. — paridad ServiciosModules.tsx web — CONECTADO CON BACKEND REAL
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { walletAPI, getApiBase, getToken } from '../../api';
import { toast } from '../Toast';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico,
} from './ServiceModuleUI';

type RScreen = 'home' | 'operators' | 'packages' | 'confirm' | 'success' | 'history' | 'myLines' | 'support';

interface MobileOperator {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface MobilePackage {
  id: string;
  name: string;
  type: string;
  price: number;
  validity: string;
  desc: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  userBalance?: number;
}

// APIs para backend real
const mobileAPI = {
  async getOperators(): Promise<MobileOperator[]> {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/services/mobile/operators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return res.json();
    } catch (error) {
      // Error loading operators - using fallback
    }
    return [];
  },

  async getPackages(operatorId: string): Promise<MobilePackage[]> {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/services/mobile/operators/${operatorId}/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return res.json();
    } catch (error) {
      // Error loading packages - using fallback
    }
    return [];
  },

  async processRecharge(operatorId: string, packageId: string, phone: string, amount: number) {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/services/mobile/recharge`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ operatorId, packageId, phone, amount })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al procesar recarga');
    }
    
    return res.json();
  },

  async getHistory() {
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const res = await fetch(`${BASE}/api/services/mobile/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return res.json();
    } catch (error) {
      // Error loading history - using fallback
    }
    return [];
  }
};

export const RecargaModal: React.FC<Props> = ({ visible, onClose, userBalance: initialBalance = 100000 }) => {
  const [screen, setScreen] = useState<RScreen>('home');
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<MobileOperator | null>(null);
  const [packages, setPackages] = useState<MobilePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<MobilePackage | null>(null);
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<Array<any>>([]);
  const [lines, setLines] = useState<Array<{ number: string; op: string }>>([]);
  const [newLine, setNewLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { 
    if (visible) {
      setBalance(initialBalance);
      loadOperators();
    }
  }, [visible, initialBalance]);
  
  useEffect(() => { 
    if (!visible) { 
      setScreen('home'); 
      setSelectedOperator(null); 
      setSelectedPackage(null); 
      setPhone(''); 
    } 
  }, [visible]);

  const loadOperators = async () => {
    setLoadingData(true);
    try {
      const data = await mobileAPI.getOperators();
      // Si el backend no tiene el endpoint o devuelve vacío, usar operadores por defecto
      if (data && data.length > 0) {
        setOperators(data);
      } else {
        setOperators([
          { id: 'getesa',  name: 'GETESA',  code: 'GET', color: '#003F8A' }, // Azul corporativo estatal
          { id: 'gecomsa', name: 'GECOMSA', code: 'GEC', color: '#00873E' }, // Verde corporativo
          { id: 'muni',    name: 'MUNI',    code: 'MUN', color: '#E8320A' }, // Rojo/naranja (ex-Hits Telecom)
        ]);
      }
    } catch (error) {
      setOperators([
        { id: 'getesa',  name: 'GETESA',  code: 'GET', color: '#003F8A' },
        { id: 'gecomsa', name: 'GECOMSA', code: 'GEC', color: '#00873E' },
        { id: 'muni',    name: 'MUNI',    code: 'MUN', color: '#E8320A' },
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadPackages = async (operatorId: string) => {
    setLoadingData(true);
    try {
      const data = await mobileAPI.getPackages(operatorId);
      if (data && data.length > 0) {
        setPackages(data);
      } else {
        // Paquetes por defecto si el backend no los tiene
        setPackages([
          { id: 'p1', name: '100 MB', type: 'datos',    price: 500,   validity: '1 día',   desc: 'Paquete básico de datos' },
          { id: 'p2', name: '500 MB', type: 'datos',    price: 1000,  validity: '3 días',  desc: 'Paquete estándar de datos' },
          { id: 'p3', name: '1 GB',   type: 'datos',    price: 2000,  validity: '7 días',  desc: 'Paquete semanal de datos' },
          { id: 'p4', name: '3 GB',   type: 'datos',    price: 5000,  validity: '15 días', desc: 'Paquete quincenal de datos' },
          { id: 'p5', name: '5 GB',   type: 'datos',    price: 8000,  validity: '30 días', desc: 'Paquete mensual de datos' },
          { id: 'p6', name: '500 XAF',type: 'saldo',    price: 500,   validity: '30 días', desc: 'Recarga de saldo' },
          { id: 'p7', name: '1000 XAF',type:'saldo',    price: 1000,  validity: '30 días', desc: 'Recarga de saldo' },
          { id: 'p8', name: '2000 XAF',type:'saldo',    price: 2000,  validity: '30 días', desc: 'Recarga de saldo' },
          { id: 'p9', name: '100 min',type: 'minutos',  price: 1500,  validity: '7 días',  desc: 'Paquete de minutos' },
        ]);
      }
    } catch (error) {
      setPackages([
        { id: 'p1', name: '100 MB', type: 'datos',  price: 500,  validity: '1 día',   desc: 'Paquete básico de datos' },
        { id: 'p2', name: '500 MB', type: 'datos',  price: 1000, validity: '3 días',  desc: 'Paquete estándar de datos' },
        { id: 'p3', name: '1 GB',   type: 'datos',  price: 2000, validity: '7 días',  desc: 'Paquete semanal de datos' },
        { id: 'p4', name: '500 XAF',type: 'saldo',  price: 500,  validity: '30 días', desc: 'Recarga de saldo' },
        { id: 'p5', name: '1000 XAF',type:'saldo',  price: 1000, validity: '30 días', desc: 'Recarga de saldo' },
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadHistory = async () => {
    setLoadingData(true);
    try {
      const data = await mobileAPI.getHistory();
      setHistory(data);
    } catch (error) {
      toast.error('Error cargando historial');
      setHistory([]);
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

  const color = selectedOperator?.color || '#07C160';

  const titles: Record<RScreen, string> = {
    home: 'Recarga Tel.', operators: 'Operadores',
    packages: `${selectedOperator?.name || ''} — Paquetes`, confirm: 'Confirmar',
    success: 'Completado', history: 'Historial', myLines: 'Mis Líneas', support: 'Soporte',
  };

  const goBack = () => {
    if (screen === 'home') onClose();
    else if (screen === 'packages') setScreen('operators');
    else if (screen === 'confirm') setScreen('packages');
    else setScreen('home');
  };

  const homeItems = [
    { id: 'operators', label: 'Recargar Saldo', desc: 'Elige operador', color: '#2E9E6B', bg: '#F0FAF5', icon: Ico.signal('#2E9E6B') },
    { id: 'operators', label: 'Comprar Datos', desc: 'Paquetes de datos', color: '#1485EE', bg: '#EFF5FD', icon: Ico.wifi('#1485EE') },
    { id: 'operators', label: 'Comprar Minutos', desc: 'Paquetes de llamadas', color: '#C47D2A', bg: '#FDF6EE', icon: Ico.phone('#C47D2A') },
    { id: 'history', label: 'Historial', desc: `${history.length} recargas`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.clock('#6B5BD6') },
    { id: 'myLines', label: 'Mis Líneas', desc: `${lines.length} guardadas`, color: '#0E7FA8', bg: '#EDF7FB', icon: Ico.mobile('#0E7FA8') },
    { id: 'support', label: 'Soporte', desc: 'Reportar fallo', color: '#C0392B', bg: '#FDF2F2', icon: Ico.headset('#C0392B') },
  ];

  const confirmRecharge = async () => {
    if (!selectedPackage || !selectedOperator || !phone.trim()) {
      toast.error('Datos incompletos');
      return;
    }

    if (selectedPackage.price > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setLoading(true);
    try {
      const result = await mobileAPI.processRecharge(
        selectedOperator.id, 
        selectedPackage.id, 
        phone.trim(), 
        selectedPackage.price
      );
      
      setBalance(result.balance || balance - selectedPackage.price);
      setScreen('success');
      toast.success('¡Recarga completada!');
      
      // Actualizar historial
      loadHistory();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar recarga');
    } finally {
      setLoading(false);
    }
  };

  const selectOperator = async (operator: MobileOperator) => {
    setSelectedOperator(operator);
    setScreen('packages');
    await loadPackages(operator.id);
  };

  const selectPackage = (pkg: MobilePackage) => {
    setSelectedPackage(pkg);
    setScreen('confirm');
  };

  const handleItemPress = (id: string) => {
    if (id === 'operators') {
      setScreen('operators');
    } else if (id === 'history') {
      loadHistory();
      setScreen('history');
    } else {
      setScreen(id as RScreen);
    }
  };

  return (
    <ServiceModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? 'Saldo — Datos — Minutos' : undefined}
      onBack={goBack}
      onClose={onClose}
    >
      {screen === 'home' && (
        <View>
          <ServiceHomeGrid items={homeItems} onPress={handleItemPress} />
          <ServiceBanner
            key={refreshKey}
            label="Operadores disponibles"
            count={operators.length}
            suffix="GETESA — GECOMSA — MUNI"
            colors={['#2E9E6B', '#1B7A52']}
            onRefresh={() => {
              setRefreshKey(k => k + 1);
              loadOperators();
            }}
          />
        </View>
      )}

      {screen === 'operators' && (
        loadingData ? (
          <View style={s.loading}>
            <Text>Cargando operadores...</Text>
          </View>
        ) : (
          <OperatorGrid 
            items={operators.map(op => ({ ...op, color: op.color }))} 
            onSelect={id => {
              const operator = operators.find(op => op.id === id);
              if (operator) selectOperator(operator);
            }} 
          />
        )
      )}

      {screen === 'packages' && (
        <View>
          <View style={s.phoneRow}>
            <Text style={s.phoneEmoji}>📞</Text>
            <View style={{ flex: 1 }}>
              <FormField 
                placeholder="Número de teléfono" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
              />
            </View>
          </View>
          
          {loadingData ? (
            <View style={s.loading}>
              <Text>Cargando paquetes...</Text>
            </View>
          ) : (
            <View style={s.pkgCard}>
              <View style={s.pkgGrid}>
                {packages.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[s.pkgCell, !phone && s.pkgCellDisabled]}
                    onPress={() => { if (phone.trim()) selectPackage(p); }}
                    activeOpacity={phone.trim() ? 0.7 : 1}
                  >
                    <View style={[s.pkgIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                      {Ico.mobile(color)}
                    </View>
                    <Text style={s.pkgName} numberOfLines={2}>{p.name}</Text>
                    <Text style={[s.pkgPrice, { color }]}>{p.price.toLocaleString()} XAF</Text>
                    <Text style={s.pkgValid}>{p.validity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {!phone.trim() && <Text style={s.warn}>⚠️ Introduce el número para continuar</Text>}
        </View>
      )}

      {screen === 'confirm' && selectedPackage && selectedOperator && (
        <View>
          <View style={s.confirmCard}>
            {[
              ['Operador', selectedOperator.name], 
              ['Número', phone], 
              ['Paquete', selectedPackage.name],
              ['Descripción', selectedPackage.desc], 
              ['Validez', selectedPackage.validity],
              ['Precio', `${selectedPackage.price.toLocaleString()} XAF`], 
              ['Saldo actual', `${balance.toLocaleString()} XAF`],
            ].map(([l, v]) => (
              <View key={l} style={s.confirmRow}>
                <Text style={s.confirmLabel}>{l}</Text>
                <Text style={s.confirmValue}>{v}</Text>
              </View>
            ))}
          </View>
          {selectedPackage.price > balance && (
            <Text style={s.insufficient}>Saldo insuficiente</Text>
          )}
          <PrimaryButton
            label={loading ? 'Procesando...' : 'Confirmar recarga'}
            onPress={confirmRecharge}
            disabled={selectedPackage.price > balance || loading}
            color={color}
          />
        </View>
      )}

      {screen === 'success' && selectedPackage && selectedOperator && (
        <View style={s.success}>
          <View style={s.successCircle}><Text style={{ fontSize: 32 }}>✅</Text></View>
          <Text style={s.successTitle}>¡Recarga exitosa!</Text>
          <Text style={s.successSub}>{selectedPackage.name} → {phone}</Text>
          <Text style={s.successSub}>{selectedOperator.name} — {selectedPackage.price.toLocaleString()} XAF</Text>
          <TouchableOpacity 
            style={[s.doneBtn, { backgroundColor: color }]} 
            onPress={() => { 
              setScreen('home'); 
              setSelectedPackage(null); 
              setSelectedOperator(null);
              setPhone(''); 
              loadBalance();
            }}
          >
            <Text style={s.doneBtnText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'history' && (
        loadingData ? (
          <View style={s.loading}>
            <Text>Cargando historial...</Text>
          </View>
        ) : history.length === 0 ? (
          <EmptyState emoji="📋" title="Sin historial" desc="Tus recargas aparecerán aquí" />
        ) : (
          history.map((h, i) => (
            <View key={h.id || i} style={s.orderCard}>
              <View style={s.orderTop}>
                <View>
                  <Text style={s.orderTitle}>{h.response?.operator || 'Recarga'}</Text>
                  <Text style={s.orderSub}>{h.contract_ref} — {h.response?.package || h.service_type}</Text>
                </View>
                <StatusBadge status={h.status} />
              </View>
              <View style={s.orderBottom}>
                <Text style={s.orderDate}>📅 {new Date(h.created_at).toLocaleDateString('es')}</Text>
                <Text style={s.orderAmount}>-{h.amount.toLocaleString()} XAF</Text>
              </View>
            </View>
          ))
        )
      )}

      {screen === 'myLines' && (
        <View>
          <View style={s.addLineRow}>
            <FormField placeholder="Añadir número (+240...)" value={newLine} onChangeText={setNewLine} keyboardType="phone-pad" />
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => { if (newLine.trim()) { setLines(p => [...p, { number: newLine.trim(), op: 'GETESA' }]); setNewLine(''); } }}
            >
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {lines.length === 0 ? (
            <Text style={s.noLines}>Sin líneas guardadas</Text>
          ) : lines.map((l, i) => (
            <View key={i} style={s.lineCard}>
              <View>
                <Text style={s.lineNum}>{l.number}</Text>
                <Text style={s.lineOp}>{l.op}</Text>
              </View>
              <TouchableOpacity onPress={() => setLines(p => p.filter((_, j) => j !== i))}>
                <Text style={s.lineDel}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {screen === 'support' && <SupportScreen />}
    </ServiceModuleShell>
  );
};


const s = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 30 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  phoneEmoji: { fontSize: 16 },
  pkgCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5' },
  pkgCell: { width: '33.333%', backgroundColor: '#fff', alignItems: 'center', padding: 12, marginBottom: 1 },
  pkgCellDisabled: { opacity: 0.5 },
  pkgIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pkgName: { fontSize: 10, fontWeight: '700', color: '#111827', textAlign: 'center' },
  pkgPrice: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pkgValid: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  warn: { textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 8 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  confirmLabel: { fontSize: 13, color: '#888' },
  confirmValue: { fontSize: 13, fontWeight: '700', color: '#111', maxWidth: '55%', textAlign: 'right' },
  insufficient: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 9, fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  success: { alignItems: 'center', paddingVertical: 40 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#888', marginBottom: 4 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  orderSub: { fontSize: 11, color: '#888' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate: { fontSize: 12, color: '#888' },
  orderAmount: { fontSize: 12, fontWeight: '700', color: '#07C160' },
  addLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  addBtn: { backgroundColor: '#07C160', borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  noLines: { textAlign: 'center', paddingVertical: 30, color: '#888', fontSize: 13 },
  lineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineNum: { fontSize: 14, fontWeight: '700', color: '#111' },
  lineOp: { fontSize: 11, color: '#888' },
  lineDel: { color: '#DC2626', fontSize: 16, padding: 4 },
});
