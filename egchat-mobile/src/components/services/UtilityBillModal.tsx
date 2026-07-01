// Electricidad (SEGESA) / Agua (SNGE) — paridad capturas web App.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { serviciosAPI } from '../../api';
import { UTILITY_CONFIG, UtilityVariant, CLIENT_TYPES } from '../../data/serviciosPublicos';
import { FinancialModuleShell } from './FinancialModuleUI';
import { PrimaryButton } from './ServiceModuleUI';
import {
  UtilityProviderBanner, IconFormField, PayMethodPicker, FacturaResultCard,
} from './PublicModuleUI';

interface Props {
  visible: boolean;
  onClose: () => void;
  variant: UtilityVariant;
  userBalance?: number;
}

type Screen = 'main' | 'confirm' | 'success';

export const UtilityBillModal: React.FC<Props> = ({ visible, onClose, variant, userBalance = 100000 }) => {
  const cfg = UTILITY_CONFIG[variant];
  const [screen, setScreen] = useState<Screen>('main');
  const [clientType, setClientType] = useState('Residencial');
  const [contrato, setContrato] = useState('');
  const [factura, setFactura] = useState<{ importe: number; periodo: string; vencimiento: string; estado: string } | null>(null);
  const [payMethod, setPayMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(userBalance);

  const activeStep = screen === 'success' ? 3 : screen === 'confirm' ? 2 : factura ? (payMethod ? 2 : 1) : 0;

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  const resetForm = () => {
    setScreen('main'); setClientType('Residencial'); setContrato(''); setFactura(null);
    setPayMethod(''); setLoading(false);
  };

  const consultar = async () => {
    if (!contrato.trim()) return;
    setLoading(true);
    try {
      const res = variant === 'elec'
        ? await serviciosAPI.consultarFacturaElec(contrato.trim())
        : await serviciosAPI.consultarFacturaAgua(contrato.trim());
      setFactura({
        importe: res.importe || cfg.mockImporte,
        periodo: res.periodo || 'Marzo 2026',
        vencimiento: res.vencimiento || '30/04/2026',
        estado: res.estado || 'Pendiente',
      });
    } catch {
      setFactura({ importe: cfg.mockImporte, periodo: 'Marzo 2026', vencimiento: '30/04/2026', estado: 'Pendiente' });
    } finally { setLoading(false); }
  };

  const pagar = async () => {
    if (!factura || !payMethod) return;
    setLoading(true);
    try {
      if (variant === 'elec') await serviciosAPI.pagarElectricidad(contrato, factura.importe, payMethod);
      else await serviciosAPI.pagarAgua(contrato, factura.importe, payMethod);
    } catch { /* demo */ }
    setBalance(b => b - factura.importe);
    setLoading(false);
    setScreen('success');
  };

  const back = () => {
    if (screen === 'main') onClose();
    else if (screen === 'confirm') setScreen('main');
    else onClose();
  };

  const titles: Record<Screen, string> = {
    main: variant === 'elec' ? 'Electricidad' : 'Agua',
    confirm: 'Confirmar pago',
    success: 'Confirmación',
  };

  const fixedTop = screen === 'main' ? (
    <UtilityProviderBanner
      variant={variant}
      title={cfg.title}
      subtitle={cfg.subtitle}
      statusLabel={variant === 'elec' ? 'Servicio disponible 24h' : 'Servicio disponible'}
      statusColor={variant === 'elec' ? '#4ADE80' : '#4FC3F7'}
      activeStep={activeStep}
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
              <Text style={s.lbl}>Tipo de cliente</Text>
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
          <Text style={s.lbl}>Número de contrato / medidor</Text>
          <IconFormField
            icon={variant === 'elec' ? '▦' : '💧'}
            placeholder={cfg.placeholder}
            value={contrato}
            onChangeText={v => { setContrato(v); setFactura(null); setPayMethod(''); }}
          />
          <Text style={s.hint}>{cfg.hint}</Text>
          {contrato.trim() && !factura && (
            <PrimaryButton
              label={loading ? 'Consultando...' : '🔍 Consultar factura'}
              onPress={consultar}
              disabled={loading}
              color={cfg.accent}
            />
          )}
          {factura && (
            <View>
              <FacturaResultCard
                accent={cfg.accent}
                periodo={factura.periodo}
                vencimiento={factura.vencimiento}
                importe={factura.importe}
                estado={factura.estado}
              />
              <PayMethodPicker value={payMethod} onChange={setPayMethod} accent={cfg.accent} />
              <PrimaryButton
                label={`Pagar ${factura.importe.toLocaleString()} XAF`}
                onPress={() => setScreen('confirm')}
                disabled={!payMethod}
                color={cfg.accent}
              />
            </View>
          )}
        </View>
      )}
      {screen === 'confirm' && factura && (
        <View style={s.body}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>{cfg.title}</Text>
            <Text style={s.confirmSub}>Contrato: {contrato}</Text>
            <Text style={[s.confirmAmt, { color: cfg.accent }]}>{factura.importe.toLocaleString()} XAF</Text>
            <Text style={s.confirmBal}>Saldo EGCHAT: {balance.toLocaleString()} XAF</Text>
          </View>
          <PrimaryButton
            label={loading ? 'Procesando...' : 'Confirmar pago'}
            onPress={pagar}
            disabled={loading || factura.importe > balance}
            color={cfg.accent}
          />
        </View>
      )}
      {screen === 'success' && factura && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Pago realizado</Text>
          <Text style={s.successSub}>{cfg.title} — {factura.importe.toLocaleString()} XAF</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color={cfg.accent} />
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
