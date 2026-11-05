import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FOOD_DELIVERY } from '../../data/serviciosDiarios';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type ComidaScreen = 'list' | 'order' | 'ok';
interface Props { visible: boolean; onClose: () => void; }

export const ComidaModal: React.FC<Props> = ({ visible, onClose }) => {
  const [view, setView] = useState<ComidaScreen>('list');
  const [selected, setSelected] = useState<typeof FOOD_DELIVERY[0] | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    if (!visible) { setView('list'); setSelected(null); setForm({ name: '', phone: '', address: '', notes: '' }); }
  }, [visible]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <FinancialModuleShell
      visible={visible}
      title="Comida"
      subtitle="Delivery a domicilio · Guinea Ecuatorial"
      onBack={() => view === 'list' ? onClose() : setView('list')}
      onClose={onClose}
      centerTitle
      hideBack={view === 'ok'}
      onRefresh={() => setView('list')}
      headerGradient={['#C0392B', '#E74C3C']}
    >
      {view === 'list' && (
        <View>
          <LinearGradient colors={['#C0392B', '#E74C3C']} style={st.banner}>
            <Text style={st.bannerTitle}>🍱 Comida a domicilio</Text>
            <Text style={st.bannerSub}>Pide y recibe en casa</Text>
          </LinearGradient>
          {FOOD_DELIVERY.map(f => (
            <TouchableOpacity
              key={f.id}
              style={st.row}
              onPress={() => { setSelected(f); setView('order'); }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 28 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{f.nombre}</Text>
                <Text style={st.desc}>{f.desc}</Text>
              </View>
              <Text style={st.time}>⏱ {f.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view === 'order' && selected && (
        <View>
          <View style={st.orderHeader}>
            <Text style={{ fontSize: 32 }}>{selected.icon}</Text>
            <View>
              <Text style={st.name}>{selected.nombre}</Text>
              <Text style={st.desc}>⏱ {selected.time}</Text>
            </View>
          </View>
          <FormField placeholder="Nombre completo" value={form.name} onChangeText={v => setF('name', v)} />
          <FormField placeholder="Teléfono" value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder="Dirección de entrega" value={form.address} onChangeText={v => setF('address', v)} />
          <FormField placeholder="Notas del pedido (opcional)" value={form.notes} onChangeText={v => setF('notes', v)} />
          <PrimaryButton
            label="Confirmar pedido"
            onPress={() => setView('ok')}
            color="#C0392B"
            disabled={!form.name || !form.phone || !form.address}
          />
          <TouchableOpacity style={st.callLink} onPress={() => Linking.openURL(`tel:${selected.tel}`)}>
            <Text style={st.callLinkText}>📞 O llamar directamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'ok' && selected && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={st.successTitle}>¡Pedido enviado!</Text>
          <Text style={st.successSub}>{selected.nombre}</Text>
          <Text style={st.successSub}>Entrega estimada: {selected.time}</Text>
          <PrimaryButton label="Pedir de nuevo" onPress={() => { setView('list'); setSelected(null); }} color="#C0392B" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  banner: { borderRadius: 14, padding: 16, marginBottom: 12 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 11, color: '#9CA3AF' },
  time: { fontSize: 11, fontWeight: '700', color: '#C0392B' },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  callLink: { alignItems: 'center', marginTop: 12 },
  callLinkText: { fontSize: 13, color: '#1485EE', fontWeight: '600' },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
