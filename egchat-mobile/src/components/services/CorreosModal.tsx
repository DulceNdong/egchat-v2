// Módulo Correos GQ — paridad App.tsx web
//
// Las variantes y sus importes salen de service_tariffs (servicio 'correos'):
// la lista local de JavaScript tenia 'carta' 500 y 'paquete' 2000, que el
// servidor no conoce y cobraba como nacional 2.500. Aqui no se muestra ni se
// envia numero que no venga de la tabla.
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { serviciosAPI, walletAPI, Tarifa } from '../../api';
import { toast } from '../Toast';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker, ServiceOptionRow } from './PublicModuleUI';
import { useTranslation } from '../../context/LanguageContext';
import { t as tr } from '../../translations';

interface Props { visible: boolean; onClose: () => void; }

type Screen = 'home' | 'form' | 'success';

const ACCENT = '#C62828';

export const CorreosModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('home');
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [selected, setSelected] = useState<Tarifa | null>(null);
  const [form, setForm] = useState({ sender: '', dest: '', address: '', phone: '', peso: '', payMethod: '' });
  const [recibo, setRecibo] = useState<{ tracking: string; tarifa: number; balance: number; estimado: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) { loadTarifas(); cargarSaldo(); return; }
    setScreen('home'); setSelected(null); setRecibo(null); setError('');
    setForm({ sender: '', dest: '', address: '', phone: '', peso: '', payMethod: '' });
  }, [visible]);

  const cargarSaldo = async () => {
    try {
      const r = await walletAPI.getBalance();
      setBalance(Number(r.balance) || 0);
    } catch {
      setBalance(null);
    }
  };

  const loadTarifas = async () => {
    setError('');
    try {
      const res = await serviciosAPI.tarifas();
      const lista = (res.tarifas || []).filter(x => x.service === 'correos');
      setTarifas(lista);
      if (!lista.length) setError('Las tarifas de Correos no están disponibles ahora mismo.');
    } catch (e: any) {
      setTarifas([]);
      setError(e?.message || 'No se pudieron cargar las tarifas de Correos.');
    }
  };

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const back = () => { if (screen === 'home') onClose(); else setScreen('home'); };
  const price = selected ? Number(selected.amount) : 0;
  const canSubmit = !!(form.sender && form.dest && form.payMethod);

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setLoading(true); setError('');
    try {
      const data = await serviciosAPI.enviarPaquete({
        destinatario: form.dest,
        peso: Number(form.peso) || undefined,
        tipo: selected.variant,
      });
      // El numero de seguimiento y lo cobrado los decide el servidor.
      setRecibo({
        tracking: data.tracking,
        tarifa: Number(data.tarifa),
        balance: Number(data.balance),
        estimado: data.estimado || '',
      });
      setBalance(Number(data.balance));
      setScreen('success');
    } catch (e: any) {
      const msg = e?.message || 'No se pudo registrar el envío.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fixedTop = screen === 'home' ? (
    <LinearGradient colors={['#C62828', '#E53935']} style={s.header}>
      <Text style={{ fontSize: 28 }}>📮</Text>
      <View>
        <Text style={s.headerTitle}>{tr('xtCorreosGQ')}</Text>
        <Text style={s.headerSub}>{tr('xtCorreosDeGuineaEcuatorial')}</Text>
      </View>
    </LinearGradient>
  ) : undefined;

  return (
    <FinancialModuleShell visible={visible} title={screen === 'home' ? t('mail') : selected?.variant || t('svcShipment')} onBack={back} onClose={onClose} fixedTop={fixedTop} onRefresh={screen === 'home' ? loadTarifas : undefined}>
      {screen === 'home' && (
        <View>
          <Text style={s.sectionLbl}>{t('svcSelectShipmentType')}</Text>
          {!!error && !tarifas.length && <Text style={s.errorTxt}>{error}</Text>}
          {tarifas.map(c => (
            <ServiceOptionRow
              key={c.variant}
              icon="✉️"
              label={c.variant.charAt(0).toUpperCase() + c.variant.slice(1)}
              sub={c.concept || ''}
              price={`${Number(c.amount).toLocaleString()} ${c.currency || 'XAF'}`}
              color={ACCENT}
              onPress={() => { setSelected(c); setError(''); setScreen('form'); }}
            />
          ))}
        </View>
      )}
      {screen === 'form' && selected && (
        <View>
          <LinearGradient colors={['#C62828', '#E53935']} style={s.formBanner}>
            <Text style={s.formBannerTitle}>{selected.concept || selected.variant}</Text>
            <Text style={s.formBannerPrice}>{price.toLocaleString()} XAF</Text>
          </LinearGradient>
          <FormField placeholder={t('svcSenderName')} value={form.sender} onChangeText={v => setF('sender', v)} />
          <FormField placeholder={t('svcRecipientName')} value={form.dest} onChangeText={v => setF('dest', v)} />
          <FormField placeholder={t('svcFullDeliveryAddress')} value={form.address} onChangeText={v => setF('address', v)} />
          <FormField placeholder={t('svcContactPhone')} value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder="Peso (kg, opcional)" value={form.peso} onChangeText={v => setF('peso', v)} keyboardType="numeric" />
          <PayMethodPicker value={form.payMethod} onChange={v => setF('payMethod', v)} accent={ACCENT} />
          <Text style={s.saldoNote}>
            {`Saldo del monedero: ${balance === null ? 'sin datos' : `${balance.toLocaleString()} XAF`}`}
          </Text>
          {!!error && <Text style={s.errorTxt}>{error}</Text>}
          <PrimaryButton
            label={loading ? t('svcRegistering') : `${t('svcConfirmShipment')} — ${price.toLocaleString()} XAF`}
            onPress={submit}
            disabled={!canSubmit || loading || (balance !== null && price > balance)}
            color={ACCENT}
          />
        </View>
      )}
      {screen === 'success' && recibo && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>{t('svcShipmentRecorded')}</Text>
          <Text style={s.successSub}>{t('svcTrackingLabel')}: {recibo.tracking}</Text>
          <Text style={s.successTotal}>{recibo.tarifa.toLocaleString()} XAF</Text>
          <Text style={s.successSub}>Saldo restante: {recibo.balance.toLocaleString()} XAF</Text>
          {!!recibo.estimado && <Text style={s.successSub}>Entrega estimada: {recibo.estimado}</Text>}
          <Text style={s.successSub}>{form.sender} → {form.dest}</Text>
          <PrimaryButton label={t('close')} onPress={onClose} color={ACCENT} />
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
  formBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  formBannerPrice: { fontSize: 16, fontWeight: '900', color: '#fff' },
  errorTxt: { fontSize: 12, color: '#DC2626', marginVertical: 10 },
  saldoNote: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5' },
  successTotal: { fontSize: 26, fontWeight: '900', color: ACCENT, marginVertical: 4 },
});
