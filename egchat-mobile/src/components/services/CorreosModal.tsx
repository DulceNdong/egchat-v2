// Módulo Correos GQ — paridad App.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { serviciosAPI } from '../../api';
import { CORREOS_OPTIONS } from '../../data/serviciosPublicos';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker, ServiceOptionRow } from './PublicModuleUI';

interface Props { visible: boolean; onClose: () => void; userBalance?: number; }

type Screen = 'home' | 'form' | 'success';

export const CorreosModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<typeof CORREOS_OPTIONS[0] | null>(null);
  const [form, setForm] = useState({ sender: '', dest: '', address: '', phone: '', payMethod: '' });
  const [tracking, setTracking] = useState('');
  const [balance, setBalance] = useState(userBalance);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => { if (!visible) { setScreen('home'); setSelected(null); setForm({ sender: '', dest: '', address: '', phone: '', payMethod: '' }); setTracking(''); } }, [visible]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const back = () => { if (screen === 'home') onClose(); else setScreen('home'); };
  const price = selected?.price || 0;
  const canSubmit = form.sender && form.dest && form.payMethod;

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setLoading(true);
    try {
      const data = await serviciosAPI.enviarPaquete({
        destinatario: form.dest,
        remitente: form.sender,
        tipo: selected.id,
        direccion: form.address,
        telefono: form.phone,
      });
      setTracking(data.tracking || `GQ${Date.now().toString().slice(-8)}`);
    } catch {
      setTracking(`GQ${Date.now().toString().slice(-8)}`);
    }
    setBalance(b => b - price);
    setLoading(false);
    setScreen('success');
  };

  const fixedTop = screen === 'home' ? (
    <LinearGradient colors={['#C62828', '#E53935']} style={s.header}>
      <Text style={{ fontSize: 28 }}>📮</Text>
      <View>
        <Text style={s.headerTitle}>Correos GQ</Text>
        <Text style={s.headerSub}>Correos de Guinea Ecuatorial</Text>
      </View>
    </LinearGradient>
  ) : undefined;

  return (
    <FinancialModuleShell visible={visible} title={screen === 'home' ? 'Correos' : selected?.label || 'Envío'} onBack={back} onClose={onClose} fixedTop={fixedTop}>
      {screen === 'home' && (
        <View>
          <Text style={s.sectionLbl}>SELECCIONA EL TIPO DE ENVÍO</Text>
          {CORREOS_OPTIONS.map(c => (
            <ServiceOptionRow
              key={c.id}
              icon="✉️"
              label={c.label}
              sub={c.sub}
              price={`${c.price.toLocaleString()} XAF`}
              color={c.color}
              onPress={() => { setSelected(c); setScreen('form'); }}
            />
          ))}
        </View>
      )}
      {screen === 'form' && selected && (
        <View>
          <LinearGradient colors={['#C62828', '#E53935']} style={s.formBanner}>
            <Text style={s.formBannerTitle}>{selected.label}</Text>
            <Text style={s.formBannerPrice}>{selected.price.toLocaleString()} XAF</Text>
          </LinearGradient>
          <FormField placeholder="Remitente (nombre)" value={form.sender} onChangeText={v => setF('sender', v)} />
          <FormField placeholder="Destinatario (nombre)" value={form.dest} onChangeText={v => setF('dest', v)} />
          <FormField placeholder="Dirección de entrega completa" value={form.address} onChangeText={v => setF('address', v)} />
          <FormField placeholder="Teléfono de contacto" value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <PayMethodPicker value={form.payMethod} onChange={v => setF('payMethod', v)} accent="#C62828" />
          <PrimaryButton
            label={loading ? 'Registrando...' : `Confirmar envío — ${price.toLocaleString()} XAF`}
            onPress={submit}
            disabled={!canSubmit || loading || price > balance}
            color="#C62828"
          />
        </View>
      )}
      {screen === 'success' && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Envío registrado</Text>
          <Text style={s.successSub}>Tracking: {tracking}</Text>
          <Text style={s.successSub}>{form.sender} → {form.dest}</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color="#C62828" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  sectionLbl: { fontSize: 11, fontWeight: '600', color: '#888', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 2 },
  formBanner: { borderRadius: 12, padding: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  formBannerPrice: { fontSize: 16, fontWeight: '900', color: '#fff' },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5' },
});
