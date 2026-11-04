// Electricidad (SEGESA) / Agua (SNGE) — paridad capturas web App.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { serviciosAPI, walletAPI, BillFactura } from '../../api';
import { UTILITY_CONFIG, UtilityVariant, CLIENT_TYPES } from '../../data/serviciosPublicos';
import { FinancialModuleShell } from './FinancialModuleUI';
import { PrimaryButton } from './ServiceModuleUI';
import {
  UtilityProviderBanner, IconFormField, PayMethodPicker, FacturaResultCard, ServiceOptionRow,
} from './PublicModuleUI';
import { t as tr } from '../../translations';

interface Props {
  visible: boolean;
  onClose: () => void;
  variant: UtilityVariant;
}

type Screen = 'main' | 'confirm' | 'success';

export const UtilityBillModal: React.FC<Props> = ({ visible, onClose, variant }) => {
  const cfg = UTILITY_CONFIG[variant];
  const [screen, setScreen] = useState<Screen>('main');
  const [clientType, setClientType] = useState('Residencial');
  const [contrato, setContrato] = useState('');
  const [facturas, setFacturas] = useState<BillFactura[]>([]);
  const [seleccion, setSeleccion] = useState<BillFactura | null>(null);
  const [sinDeuda, setSinDeuda] = useState(false);
  const [error, setError] = useState('');
  const [recibo, setRecibo] = useState<{ importe: number; balance: number } | null>(null);
  const [payMethod, setPayMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const activoStep = screen === 'success' ? 3 : screen === 'confirm' ? 2 : seleccion ? (payMethod ? 2 : 1) : 0;

  useEffect(() => { if (visible) { cargarSaldo(); return; } }, [visible]);
  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  const cargarSaldo = async () => {
    try {
      const r = await walletAPI.getBalance();
      setBalance(Number(r.balance) || 0);
    } catch {
      setBalance(null);
    }
  };

  const resetForm = () => {
    setScreen('main'); setClientType('Residencial'); setContrato(''); setFacturas([]);
    setSeleccion(null); setSinDeuda(false); setError(''); setRecibo(null);
    setPayMethod(''); setLoading(false);
  };

  // La deuda la fija la base de datos: aqui se lista lo que debe ese contrato y
  // se paga UNA de esas facturas, por el importe que trae la fila.
  const consultar = async () => {
    if (!contrato.trim()) return;
    setLoading(true); setError('');
    try {
      const res = variant === 'elec'
        ? await serviciosAPI.consultarFacturaElec(contrato.trim())
        : await serviciosAPI.consultarFacturaAgua(contrato.trim());
      const lista = res.facturas || [];
      setFacturas(lista);
      setSinDeuda(lista.length === 0);
      setSeleccion(lista.length === 1 ? lista[0] : null);
      if (!lista.length) setError('No hay deuda pendiente para ese contrato.');
    } catch (e: any) {
      setFacturas([]); setSinDeuda(false); setSeleccion(null);
      setError(e?.message || 'No se pudo consultar la deuda.');
    } finally { setLoading(false); }
  };

  const pagar = async () => {
    if (!seleccion || !payMethod) return;
    setLoading(true); setError('');
    try {
      const res = variant === 'elec'
        ? await serviciosAPI.pagarElectricidad(seleccion.id)
        : await serviciosAPI.pagarAgua(seleccion.id);
      setRecibo({ importe: Number(res.importe), balance: Number(res.balance) });
      setBalance(Number(res.balance));
      setScreen('success');
    } catch (e: any) {
      setError(e?.message || 'No se pudo completar el pago.');
    } finally { setLoading(false); }
  };

  const back = () => {
    if (screen === 'main') onClose();
    else if (screen === 'confirm') setScreen('main');
    else onClose();
  };

  const titles: Record<Screen, string> = {
    main: variant === 'elec' ? 'Electricidad' : 'Agua',
    confirm: tr('djhConfirmPayout'),
    success: tr('xtConfirmacion'),
  };

  const fixedTop = screen === 'main' ? (
    <UtilityProviderBanner
      variant={variant}
      title={cfg.title}
      subtitle={cfg.subtitle}
      statusLabel={variant === 'elec' ? 'Servicio disponible 24h' : 'Servicio disponible'}
      statusColor={variant === 'elec' ? '#4ADE80' : '#4FC3F7'}
      activeStep={activoStep}
    />
  ) : undefined;

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      onBack={back}
      onClose={onClose}
      fixedTop={fixedTop}
      hideBack={screen === 'main'}
      centerTitle={screen === 'main'}
      onRefresh={screen === 'main' ? resetForm : undefined}
    >
      {screen === 'main' && (
        <View style={s.body}>
          {variant === 'elec' && (
            <View style={s.block}>
              <Text style={s.lbl}>{tr('xtTipoDeCliente')}</Text>
              <View style={s.chipRow}>
                {CLIENT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.chip, clientType === t && { backgroundColor: cfg.accent, borderColor: cfg.accent }]}
                    onPress={() => setClientType(t)}
                  >
                    <Text style={[s.chipText, clientType === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <Text style={s.lbl}>{tr('svcContractMeter')}</Text>
          <IconFormField
            icon={variant === 'elec' ? '▦' : '💧'}
            placeholder={cfg.placeholder}
            value={contrato}
            onChangeText={v => { setContrato(v); setFacturas([]); setSeleccion(null); setSinDeuda(false); setError(''); setPayMethod(''); }}
          />
          <Text style={s.hint}>{cfg.hint}</Text>
          {contrato.trim() && !facturas.length && !sinDeuda && (
            <PrimaryButton
              label={loading ? 'Consultando...' : tr('xtConsultarFactura')}
              onPress={consultar}
              disabled={loading}
              color={cfg.accent}
            />
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
          {sinDeuda && (
            <Text style={s.okTxt}>No hay deuda pendiente para {contrato}.</Text>
          )}
          {facturas.length > 0 && (
            <View>
              <Text style={s.lbl}>
                {facturas.length === 1 ? 'FACTURA PENDIENTE' : `ELIGE UNA FACTURA (${facturas.length})`}
              </Text>
              {facturas.map(f => (
                <ServiceOptionRow
                  key={f.id}
                  icon={cfg.icon}
                  label={`${Number(f.amount).toLocaleString()} XAF`}
                  sub={[f.period, f.concept, f.due_date ? `vence ${f.due_date}` : null].filter(Boolean).join(' · ') || f.contract_ref}
                  color={cfg.accent}
                  onPress={() => { setSeleccion(f); setError(''); }}
                />
              ))}
              {seleccion && (
                <View>
                  <FacturaResultCard
                    accent={cfg.accent}
                    periodo={seleccion.period || seleccion.contract_ref}
                    vencimiento={seleccion.due_date || '-'}
                    importe={Number(seleccion.amount)}
                    estado={tr('kyPending')}
                  />
                  <PayMethodPicker value={payMethod} onChange={setPayMethod} accent={cfg.accent} />
                  <PrimaryButton
                    label={`Pagar ${Number(seleccion.amount).toLocaleString()} XAF`}
                    onPress={() => setScreen('confirm')}
                    disabled={!payMethod}
                    color={cfg.accent}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
      {screen === 'confirm' && seleccion && (
        <View style={s.body}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>{cfg.title}</Text>
            <Text style={s.confirmSub}>Contrato: {seleccion.contract_ref}</Text>
            <Text style={[s.confirmAmt, { color: cfg.accent }]}>{Number(seleccion.amount).toLocaleString()} XAF</Text>
            <Text style={s.confirmBal}>
              {`Saldo EGPAY: ${balance === null ? 'sin datos' : `${balance.toLocaleString()} XAF`}`}
            </Text>
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
          <PrimaryButton
            label={loading ? tr('processing') : tr('djhConfirmPayout')}
            onPress={pagar}
            disabled={loading || (balance !== null && Number(seleccion.amount) > balance)}
            color={cfg.accent}
          />
        </View>
      )}
      {screen === 'success' && seleccion && recibo && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>{tr('svcPaymentDone')}</Text>
          <Text style={s.successSub}>{cfg.title} — {recibo.importe.toLocaleString()} XAF</Text>
          <Text style={s.successSub}>Saldo restante: {recibo.balance.toLocaleString()} XAF</Text>
          <PrimaryButton label={tr('close')} onPress={onClose} color={cfg.accent} />
        </View>
      )}
    </FinancialModuleShell>
  );
};

export const ElectricidadModal: React.FC<Omit<Props, 'variant'>> = (props) => (
  <UtilityBillModal {...props} variant="elec" />
);

export const AguaModal: React.FC<Omit<Props, 'variant'>> = (props) => (
  <UtilityBillModal {...props} variant="agua" />
);

const s = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  block: { marginBottom: 14 },
  lbl: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  hint: { fontSize: 10, color: '#9CA3AF', marginBottom: 14 },
  error: { fontSize: 12, color: '#DC2626', marginBottom: 12 },
  okTxt: { fontSize: 12, color: '#16A34A', marginBottom: 12, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, alignItems: 'center' },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  confirmSub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  confirmAmt: { fontSize: 28, fontWeight: '900', marginTop: 12 },
  confirmBal: { fontSize: 11, color: '#6B7280', marginTop: 8 },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 16 },
});
