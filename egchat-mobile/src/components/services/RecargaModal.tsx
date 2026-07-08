// Módulo Recarga Tel. — paridad ServiciosModules.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { walletAPI } from '../../api';
import { MOBILE_OPERATORS, MOBILE_PACKAGES, MobilePackage } from '../../data/serviciosBasicos';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico,
} from './ServiceModuleUI';

type RScreen = 'home' | 'operators' | 'packages' | 'confirm' | 'success' | 'history' | 'myLines' | 'support';

interface Props {
  visible: boolean;
  onClose: () => void;
  userBalance?: number;
}

export const RecargaModal: React.FC<Props> = ({ visible, onClose, userBalance: initialBalance = 100000 }) => {
  const [screen, setScreen] = useState<RScreen>('home');
  const [operator, setOperator] = useState('');
  const [pkg, setPkg] = useState<MobilePackage | null>(null);
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<Array<{ id: string; op: string; phone: string; type: string; amount: number; date: string; status: string }>>([]);
  const [lines, setLines] = useState<Array<{ number: string; op: string }>>([]);
  const [newLine, setNewLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (visible) setBalance(initialBalance); }, [visible, initialBalance]);
  useEffect(() => { if (!visible) { setScreen('home'); setOperator(''); setPkg(null); setPhone(''); } }, [visible]);

  const selOp = MOBILE_OPERATORS.find(o => o.id === operator);
  const opPackages = operator ? (MOBILE_PACKAGES[operator] || []) : [];
  const color = selOp?.color || '#07C160';

  const titles: Record<RScreen, string> = {
    home: 'Recarga Tel.', operators: 'Operadores',
    packages: `${selOp?.name || ''} — Paquetes`, confirm: 'Confirmar',
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
    if (!pkg || pkg.price > balance) return;
    setLoading(true);
    try {
      await walletAPI.withdraw(pkg.price, 'recarga_movil', phone);
    } catch { /* demo mode — continúa igual que web */ }
    setBalance(b => b - pkg.price);
    setHistory(p => [...p, {
      id: `rh${Date.now()}`, op: selOp?.name || '', phone, type: pkg.type,
      amount: pkg.price, date: new Date().toLocaleDateString('es'), status: 'completado',
    }]);
    setLoading(false);
    setScreen('success');
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
          <ServiceHomeGrid items={homeItems} onPress={id => setScreen(id as RScreen)} />
          <ServiceBanner
            key={refreshKey}
            label="Operadores disponibles"
            count={MOBILE_OPERATORS.length}
            suffix="GETESA — GECOMSA — Orange GE — Otros"
            colors={['#2E9E6B', '#1B7A52']}
            onRefresh={() => setRefreshKey(k => k + 1)}
          />
        </View>
      )}

      {screen === 'operators' && (
        <OperatorGrid items={MOBILE_OPERATORS} onSelect={id => { setOperator(id); setScreen('packages'); }} />
      )}

      {screen === 'packages' && (
        <View>
          <View style={s.phoneRow}>
            <Text style={s.phoneEmoji}>📞</Text>
            <View style={{ flex: 1 }}>
              <FormField placeholder="Número de teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={s.pkgCard}>
            <View style={s.pkgGrid}>
              {opPackages.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.pkgCell, !phone && s.pkgCellDisabled]}
                  onPress={() => { if (phone) { setPkg(p); setScreen('confirm'); } }}
                  activeOpacity={phone ? 0.7 : 1}
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
          {!phone && <Text style={s.warn}>⚠️ Introduce el número para continuar</Text>}
        </View>
      )}

      {screen === 'confirm' && pkg && (
        <View>
          <View style={s.confirmCard}>
            {[
              ['Operador', selOp?.name || ''], ['Número', phone], ['Paquete', pkg.name],
              ['Descripción', pkg.desc], ['Validez', pkg.validity],
              ['Precio', `${pkg.price.toLocaleString()} XAF`], ['Saldo actual', `${balance.toLocaleString()} XAF`],
            ].map(([l, v]) => (
              <View key={l} style={s.confirmRow}>
                <Text style={s.confirmLabel}>{l}</Text>
                <Text style={s.confirmValue}>{v}</Text>
              </View>
            ))}
          </View>
          {pkg.price > balance && (
            <Text style={s.insufficient}>Saldo insuficiente</Text>
          )}
          <PrimaryButton
            label={loading ? 'Procesando...' : 'Confirmar recarga'}
            onPress={confirmRecharge}
            disabled={pkg.price > balance || loading}
            color={color}
          />
        </View>
      )}

      {screen === 'success' && pkg && (
        <View style={s.success}>
          <View style={s.successCircle}><Text style={{ fontSize: 32 }}>✅</Text></View>
          <Text style={s.successTitle}>¡Recarga exitosa!</Text>
          <Text style={s.successSub}>{pkg.name} → {phone}</Text>
          <Text style={s.successSub}>{selOp?.name} — {pkg.price.toLocaleString()} XAF</Text>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: color }]} onPress={() => { setScreen('home'); setPkg(null); setPhone(''); }}>
            <Text style={s.doneBtnText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'history' && (
        history.length === 0 ? (
          <EmptyState emoji="📋" title="Sin historial" desc="Tus recargas aparecerán aquí" />
        ) : (
          history.map(h => (
            <View key={h.id} style={s.orderCard}>
              <View style={s.orderTop}>
                <View>
                  <Text style={s.orderTitle}>{h.op}</Text>
                  <Text style={s.orderSub}>{h.phone} — {h.type}</Text>
                </View>
                <StatusBadge status={h.status} />
              </View>
              <View style={s.orderBottom}>
                <Text style={s.orderDate}>📅 {h.date}</Text>
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
              onPress={() => { if (newLine) { setLines(p => [...p, { number: newLine, op: 'GETESA' }]); setNewLine(''); } }}
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
