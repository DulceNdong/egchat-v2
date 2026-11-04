// Módulo Impuestos DGI — paridad App.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { serviciosAPI, walletAPI, BillFactura } from '../../api';
import { IMPUESTOS_OPTIONS } from '../../data/serviciosPublicos';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker, ServiceOptionRow, FacturaResultCard } from './PublicModuleUI';
import { t as tr } from '../../translations';

interface Props { visible: boolean; onClose: () => void; }

type Screen = 'home' | 'form' | 'success';

const ACCENT = '#1B3A6B';

export const ImpuestosModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<typeof IMPUESTOS_OPTIONS[0] | null>(null);
  const [nif, setNif] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [facturas, setFacturas] = useState<BillFactura[]>([]);
  const [seleccion, setSeleccion] = useState<BillFactura | null>(null);
  const [payMethod, setPayMethod] = useState('');
  const [recibo, setRecibo] = useState<{ importe: number; balance: number } | null>(null);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) { cargarSaldo(); return; }
    setScreen('home'); setSelected(null); setNif(''); setPeriodo(''); setFacturas([]);
    setSeleccion(null); setPayMethod(''); setRecibo(null); setError(''); setLoading(false);
  }, [visible]);

  const cargarSaldo = async () => {
    try {
      const r = await walletAPI.getBalance();
      setBalance(Number(r.balance) || 0);
    } catch {
      setBalance(null);
    }
  };

  const back = () => { if (screen === 'home') onClose(); else if (screen === 'form') setScreen('home'); else onClose(); };

  // La deuda la fija la base de datos. El contribuyente no escribe cuánto debe.
  const consultar = async () => {
    if (!nif.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await serviciosAPI.consultarDGI(nif.trim());
      const lista = res.facturas || [];
      setFacturas(lista);
      setSeleccion(lista.length === 1 ? lista[0] : null);
      if (!lista.length) setError('No hay deuda pendiente para el NIF ' + res.contract + '.');
    } catch (e: any) {
      setFacturas([]); setSeleccion(null);
      setError(e?.message || 'No se pudo consultar la deuda.');
    } finally { setLoading(false); }
  };

  const pagar = async () => {
    if (!seleccion || !payMethod) return;
    setLoading(true); setError('');
    try {
      const res = await serviciosAPI.pagarDGI(seleccion.id);
      setRecibo({ importe: Number(res.importe), balance: Number(res.balance) });
      setBalance(Number(res.balance));
      setScreen('success');
    } catch (e: any) {
      setError(e?.message || 'No se pudo completar el pago.');
    } finally { setLoading(false); }
  };

  const fixedTop = screen === 'home' ? (
    <LinearGradient colors={[ACCENT, '#2A5298']} style={s.header}>
      <Text style={{ fontSize: 28 }}>🏛️</Text>
      <View>
        <Text style={s.headerTitle}>DGI</Text>
        <Text style={s.headerSub}>{tr('svcDgiName')}</Text>
      </View>
    </LinearGradient>
  ) : undefined;

  return (
    <FinancialModuleShell visible={visible} title={screen === 'home' ? 'Impuestos' : selected?.label || 'Pago DGI'} onBack={back} onClose={onClose} fixedTop={fixedTop}>
      {screen === 'home' && (
        <View>
          <Text style={s.sectionLbl}>{tr('xtTIPODEDECLARACIONPAGO')}</Text>
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
      {screen === 'form' && (
        <View>
          <LinearGradient colors={[ACCENT, '#2A5298']} style={s.formBanner}>
            <Text style={s.formBannerTitle}>{selected?.label || 'Pago DGI'}</Text>
            <Text style={s.formBannerSub}>{tr('svcDgiNameGq')}</Text>
          </LinearGradient>
          <FormField placeholder={tr('xtNIFDNIDelContribuyente')} value={nif} onChangeText={v => { setNif(v); setFacturas([]); setSeleccion(null); setError(''); setPayMethod(''); }} />
          <FormField placeholder={tr('xtPeriodoFiscalEj2025')} value={periodo} onChangeText={setPeriodo} />
          {!facturas.length && (
            <PrimaryButton
              label={loading ? 'Consultando...' : tr('xtConsultarFactura')}
              onPress={consultar}
              disabled={loading || !nif.trim()}
              color={ACCENT}
            />
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
          {facturas.length > 0 && (
            <View>
              <Text style={s.sectionLbl}>
                {facturas.length === 1 ? 'LIQUIDACIÓN PENDIENTE' : `ELIGE UNA LIQUIDACIÓN (${facturas.length})`}
              </Text>
              {facturas.map(f => (
                <ServiceOptionRow
                  key={f.id}
                  icon="🏛️"
                  label={`${Number(f.amount).toLocaleString()} XAF`}
                  sub={[f.period, f.concept, f.due_date ? `vence ${f.due_date}` : null].filter(Boolean).join(' · ') || f.contract_ref}
                  color={ACCENT}
                  onPress={() => { setSeleccion(f); setError(''); }}
                />
              ))}
              {seleccion && (
                <View>
                  <FacturaResultCard
                    accent={ACCENT}
                    periodo={seleccion.period || seleccion.contract_ref}
                    vencimiento={seleccion.due_date || '-'}
                    importe={Number(seleccion.amount)}
                    estado={tr('kyPending')}
                  />
                  <PayMethodPicker value={payMethod} onChange={setPayMethod} accent={ACCENT} />
                  <Text style={s.saldoNote}>
                    {`Saldo del monedero: ${balance === null ? 'sin datos' : `${balance.toLocaleString()} XAF`}`}
                  </Text>
                  <PrimaryButton
                    label={`Pagar ${Number(seleccion.amount).toLocaleString()} XAF`}
                    onPress={pagar}
                    disabled={!payMethod || loading || (balance !== null && Number(seleccion.amount) > balance)}
                    color={ACCENT}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
      {screen === 'success' && seleccion && recibo && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>{tr('xtPagoRegistrado')}</Text>
          <Text style={s.successSub}>{selected?.label} — NIF: {seleccion.contract_ref}</Text>
          <Text style={s.successAmt}>{recibo.importe.toLocaleString()} XAF</Text>
          <Text style={s.successSub}>Saldo restante: {recibo.balance.toLocaleString()} XAF</Text>
          <PrimaryButton label={tr('close')} onPress={onClose} color={ACCENT} />
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
  error: { fontSize: 12, color: '#DC2626', marginVertical: 10 },
  saldoNote: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5' },
  successAmt: { fontSize: 26, fontWeight: '900', color: ACCENT, marginVertical: 4 },
});
