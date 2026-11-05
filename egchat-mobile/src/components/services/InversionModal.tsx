// Módulo Inversión — paridad invest screen web
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { INVEST_OPTIONS } from '../../data/serviciosFinancieros';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

interface Props { visible: boolean; onClose: () => void; }

export const InversionModal: React.FC<Props> = ({ visible, onClose }) => {
  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { if (!visible) { setSelected(''); setAmount(''); setMonths(''); setDone(false); } }, [visible]);

  const opt = INVEST_OPTIONS.find(o => o.id === selected);
  const gain = amount && months ? Math.round(parseInt(amount, 10) * 0.08 * parseInt(months, 10) / 12) : 0;

  return (
    <FinancialModuleShell
      visible={visible}
      title={done ? 'Completado' : 'Inversión'}
      subtitle={!done ? 'Oportunidades de inversión en Guinea Ecuatorial' : undefined}
      onBack={() => done ? onClose() : onClose()}
      onClose={onClose}
      onRefresh={!done ? () => { setSelected(''); setAmount(''); } : undefined}
    >
      {!done ? (
        <View>
          {INVEST_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.id}
              style={[s.row, selected === o.id && { borderColor: o.color }]}
              onPress={() => setSelected(o.id)}
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
          {selected && (
            <View style={s.form}>
              <FormField placeholder="Monto a invertir (XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <FormField placeholder="Plazo en meses" value={months} onChangeText={setMonths} keyboardType="numeric" />
              {gain > 0 && (
                <View style={s.gainBox}>
                  <Text style={s.gainLbl}>Ganancia estimada</Text>
                  <Text style={s.gainVal}>+{gain.toLocaleString()} XAF</Text>
                </View>
              )}
              <PrimaryButton
                label="Invertir ahora"
                color={opt?.color || '#6B5BD6'}
                disabled={!amount || !months}
                onPress={() => setDone(true)}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Inversión registrada</Text>
          <Text style={s.successSub}>{opt?.label} — {parseInt(amount, 10).toLocaleString()} XAF</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color="#6B5BD6" />
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
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 16 },
});
