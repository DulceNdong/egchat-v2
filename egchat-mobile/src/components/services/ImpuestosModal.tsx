// Módulo Impuestos DGI — paridad App.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { serviciosAPI } from '../../api';
import { IMPUESTOS_OPTIONS } from '../../data/serviciosPublicos';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker, ServiceOptionRow } from './PublicModuleUI';

interface Props { visible: boolean; onClose: () => void; userBalance?: number; }

type Screen = 'home' | 'form' | 'success';

export const ImpuestosModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<typeof IMPUESTOS_OPTIONS[0] | null>(null);
  const [form, setForm] = useState({ nif: '', ref: '', period: '', amount: '', payMethod: '' });
  const [balance, setBalance] = useState(userBalance);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => { if (!visible) { setScreen('home'); setSelected(null); setForm({ nif: '', ref: '', period: '', amount: '', payMethod: '' }); } }, [visible]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const back = () => { if (screen === 'home') onClose(); else setScreen('home'); };
  const amount = parseInt(form.amount, 10) || 0;
  const canPay = form.nif && form.amount && form.payMethod;

  const pagar = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      await serviciosAPI.pagarDGI(form.nif.trim(), amount, form.ref.trim() || `DGI-${Date.now()}`);
    } catch { /* demo */ }
    setBalance(b => b - amount);
    setLoading(false);
    setScreen('success');
  };

  const fixedTop = screen === 'home' ? (
    <LinearGradient colors={['#1B3A6B', '#2A5298']} style={s.header}>
      <Text style={{ fontSize: 28 }}>🏛️</Text>
      <View>
        <Text style={s.headerTitle}>DGI</Text>
        <Text style={s.headerSub}>Dirección General de Impuestos</Text>
      </View>
    </LinearGradient>
  ) : undefined;

  return (
    <FinancialModuleShell visible={visible} title={screen === 'home' ? 'Impuestos' : selected?.label || 'Pago DGI'} onBack={back} onClose={onClose} fixedTop={fixedTop}>
      {screen === 'home' && (
        <View>
          <Text style={s.sectionLbl}>TIPO DE DECLARACIÓN / PAGO</Text>
          {IMPUESTOS_OPTIONS.map(imp => (
            <ServiceOptionRow
              key={imp.id}
              icon="📋"
              label={imp.label}
              sub={imp.sub}
              color={imp.color}
              onPress={() => { setSelected(imp); setScreen('form'); }}
            />
          ))}
        </View>
      )}
      {screen === 'form' && selected && (
        <View>
          <LinearGradient colors={['#1B3A6B', '#2A5298']} style={s.formBanner}>
            <Text style={s.formBannerTitle}>{selected.label}</Text>
            <Text style={s.formBannerSub}>Dirección General de Impuestos — GQ</Text>
          </LinearGradient>
          <FormField placeholder="NIF / DNI del contribuyente" value={form.nif} onChangeText={v => setF('nif', v)} />
          <FormField placeholder="Referencia de pago / expediente" value={form.ref} onChangeText={v => setF('ref', v)} />
          <FormField placeholder="Período fiscal (ej: 2025)" value={form.period} onChangeText={v => setF('period', v)} />
          <FormField placeholder="Importe a pagar (XAF)" value={form.amount} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
          <View style={s.infoBox}>
            <Text style={s.infoText}>ℹ️ El pago genera un justificante oficial. Guarda el número de referencia.</Text>
          </View>
          <PayMethodPicker value={form.payMethod} onChange={v => setF('payMethod', v)} accent="#1B3A6B" />
          <PrimaryButton
            label={loading ? 'Procesando...' : `Pagar ${amount > 0 ? amount.toLocaleString() + ' XAF' : ''}`}
            onPress={pagar}
            disabled={!canPay || loading || amount > balance}
            color="#1B3A6B"
          />
        </View>
      )}
      {screen === 'success' && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Pago registrado</Text>
          <Text style={s.successSub}>{selected?.label} — NIF: {form.nif}</Text>
          <Text style={s.successSub}>{amount.toLocaleString()} XAF</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color="#1B3A6B" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  sectionLbl: { fontSize: 11, fontWeight: '600', color: '#888', letterSpacing: 0.5, marginBottom: 8 },
  formBanner: { borderRadius: 12, padding: 14, marginBottom: 14 },
  formBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  formBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  infoBox: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 12 },
  infoText: { fontSize: 12, color: '#92400E' },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5' },
});
