// Módulo Inversión — registra intención, no cobra ni promete rentabilidad.
//
// La proyección se calcula con el rango publicado en el directorio y se marca
// como orientativa: nadie puede garantizar ese rendimiento. El dinero no se
// mueve del monedero hasta que la entidad confirma la posición.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { INVEST_OPTIONS } from '../../data/serviciosFinancieros';
import { serviciosAPI } from '../../api';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { useTranslation } from '../../context/LanguageContext';

interface Props { visible: boolean; onClose: () => void; }

// '+8-12% anual' -> [8, 12]; '+6% anual' -> [6, 6]; 'Variable'/'Consultar' -> null
const rangoTasa = (rate: string): [number, number] | null => {
  const nums = (rate.match(/[\d.]+/g) || []).map(Number);
  if (nums.length === 0) return null;
  return [nums[0], nums.length > 1 ? nums[1] : nums[0]];
};

export const InversionModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const [recibo, setRecibo] = useState('');
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState('');

  useEffect(() => {
    if (!visible) { setSelected(''); setAmount(''); setMonths(''); setRecibo(''); setRef(''); }
  }, [visible]);

  const opt = INVEST_OPTIONS.find(o => o.id === selected);
  const rango = opt ? rangoTasa(opt.rate) : null;
  const monto = parseInt(amount, 10) || 0;
  const plazo = parseInt(months, 10) || 0;
  const gananciaMin = rango && monto > 0 && plazo > 0 ? Math.round(monto * rango[0] / 100 * plazo / 12) : 0;
  const gananciaMax = rango && monto > 0 && plazo > 0 ? Math.round(monto * rango[1] / 100 * plazo / 12) : 0;

  const elegir = (id: string) => {
    setSelected(id);
    setRef(`INV-${id}-${Date.now()}`);
  };

  const enviar = async () => {
    if (!opt || sending) return;
    setSending(true);
    try {
      const res = await serviciosAPI.solicitud({
        provider: 'inversiones',
        tipo: 'intencion',
        referencia: opt.id,
        datos: {
          producto: opt.label,
          tasa_publicada: opt.rate,
          monto,
          plazo_meses: plazo,
          proyeccion_min: gananciaMin || null,
          proyeccion_max: gananciaMax || null,
        },
        external_id: ref || `INV-${opt.id}-${Date.now()}`,
      });
      setRecibo(res.solicitudId);
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || 'No se pudo registrar la intención de inversión.');
    } finally {
      setSending(false);
    }
  };

  return (
    <FinancialModuleShell
      visible={visible}
      title={recibo ? t('svcCompleted') : t('investment')}
      subtitle={!recibo ? t('svcInvestSubtitle') : undefined}
      onBack={onClose}
      onClose={onClose}
      onRefresh={!recibo ? () => { setSelected(''); setAmount(''); setMonths(''); } : undefined}
    >
      {!recibo ? (
        <View>
          {INVEST_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.id}
              style={[s.row, selected === o.id && { borderColor: o.color }]}
              onPress={() => elegir(o.id)}
            >
              <View style={[s.icon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text>📈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{o.label}</Text>
                <Text style={s.sub}>{o.sub}</Text>
              </View>
              <Text style={[s.rate, { color: o.color }]}>{o.rate}</Text>
            </TouchableOpacity>
          ))}
          {opt && (
            <View style={s.form}>
              <FormField placeholder={t("svcInvestAmountPh")} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <FormField placeholder={t("svcInvestTermPh")} value={months} onChangeText={setMonths} keyboardType="numeric" />
              {gananciaMin > 0 && (
                <View style={s.gainBox}>
                  <Text style={s.gainLbl}>{t('svcEstimatedGain')} — orientativo</Text>
                  <Text style={s.gainVal}>
                    +{gananciaMin.toLocaleString()}{gananciaMax > gananciaMin ? ` a +${gananciaMax.toLocaleString()}` : ''} XAF
                  </Text>
                  <Text style={s.gainNote}>
                    Proyección con {opt.rate} del directorio. Ninguna inversión está garantizada;
                    la entidad confirma la tasa al aceptar.
                  </Text>
                </View>
              )}
              <Text style={s.notice}>
                EGChat no invierte por ti ni mueve tu monedero. Se envía la intención y la entidad
                te contacta para abrir la posición.
              </Text>
              <PrimaryButton
                label={sending ? 'Enviando…' : 'Enviar intención de inversión'}
                color={opt.color}
                disabled={!monto || !plazo || sending}
                onPress={enviar}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>📨</Text>
          <Text style={s.successTitle}>Intención registrada</Text>
          <Text style={s.successSub}>{opt?.label} — {monto.toLocaleString()} XAF a {plazo} meses</Text>
          <Text style={s.refText}>{recibo}</Text>
          <Text style={s.notice}>No se ha debitado nada del monedero.</Text>
          <PrimaryButton label={t('close')} onPress={onClose} color="#6B5BD6" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#1A2B4A' },
  sub: { fontSize: 11, color: '#8A9BB5' },
  rate: { fontSize: 12, fontWeight: '800' },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 4 },
  gainBox: { backgroundColor: '#F0FAF5', borderRadius: 10, padding: 12, marginBottom: 10 },
  gainLbl: { fontSize: 11, color: '#8A9BB5' },
  gainVal: { fontSize: 22, fontWeight: '800', color: '#07C160' },
  gainNote: { fontSize: 10.5, color: '#8A9BB5', lineHeight: 15, marginTop: 4 },
  notice: { fontSize: 11.5, color: '#8A9BB5', lineHeight: 16, marginBottom: 10 },
  refText: { fontSize: 12, fontWeight: '800', color: '#1A2B4A', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 8 },
});
