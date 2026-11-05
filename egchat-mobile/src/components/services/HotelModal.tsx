import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOTELS, Hotel } from '../../data/serviciosDiarios';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type HotelScreen = 'list' | 'detail' | 'book' | 'ok';
interface Props { visible: boolean; onClose: () => void; }

const StarRow = ({ n }: { n: number }) => (
  <Text style={{ fontSize: 11, color: '#F59E0B' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</Text>
);

export const HotelModal: React.FC<Props> = ({ visible, onClose }) => {
  const [city, setCity] = useState('Malabo');
  const [view, setView] = useState<HotelScreen>('list');
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', checkin: '', checkout: '', guests: '1' });

  useEffect(() => {
    if (!visible) { setView('list'); setCity('Malabo'); setSelected(null); setForm({ name: '', phone: '', checkin: '', checkout: '', guests: '1' }); }
  }, [visible]);

  const filtered = HOTELS.filter(h => city === 'Todos' || h.ciudad === city);
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const nights = 1;
  const total = selected ? selected.precio * nights : 0;

  const fixedTop = (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <FilterChips
        options={['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Todos'].map(c => ({ id: c, label: c }))}
        value={city} onChange={setCity} activeColor="#1485EE"
      />
    </View>
  );

  return (
    <FinancialModuleShell
      visible={visible}
      title="Hotel"
      subtitle={`${HOTELS.length} hoteles · Guinea Ecuatorial`}
      onBack={() => view === 'list' ? onClose() : setView('list')}
      onClose={onClose}
      centerTitle
      hideBack={view === 'ok'}
      fixedTop={view !== 'book' && view !== 'ok' ? fixedTop : undefined}
      onRefresh={() => { setView('list'); setCity('Malabo'); }}
      headerGradient={['#1B3A6B', '#00b4e6']}
    >
      {view === 'list' && (
        <View style={st.grid}>
          {filtered.map(h => (
            <TouchableOpacity key={h.id} style={st.card} onPress={() => { setSelected(h); setView('detail'); }} activeOpacity={0.85}>
              <View style={st.cardTop}>
                <View style={[st.iconBox, { backgroundColor: '#EFF5FD' }]}><Text>🏨</Text></View>
                <StarRow n={h.estrellas} />
              </View>
              <Text style={st.name}>{h.nombre}</Text>
              <Text style={st.meta}>📍 {h.barrio}</Text>
              <View style={st.priceRow}>
                <Text style={st.priceLbl}>Desde</Text>
                <Text style={st.price}>{h.precio.toLocaleString()} XAF</Text>
                <Text style={st.priceLbl}>por noche</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view === 'detail' && selected && (
        <View>
          <LinearGradient colors={['#1B3A6B', '#00b4e6']} style={st.banner}>
            <Text style={st.bannerTitle}>{selected.nombre}</Text>
            <StarRow n={selected.estrellas} />
            <Text style={st.bannerSub}>📍 {selected.barrio}, {selected.ciudad}</Text>
          </LinearGradient>
          <Text style={st.sectionLbl}>Servicios incluidos</Text>
          {selected.amenities.map(a => (
            <View key={a} style={st.amenityRow}><Text style={st.amenityDot}>●</Text><Text style={st.meta}>{a}</Text></View>
          ))}
          <Text style={st.priceBig}>{selected.precio.toLocaleString()} XAF <Text style={st.priceLbl}>/ noche</Text></Text>
          <View style={st.rowBtns}>
            <TouchableOpacity style={[st.actBtn, { backgroundColor: '#EFF5FD', flex: 1 }]} onPress={() => Linking.openURL(`tel:${selected.telefono}`)}>
              <Text style={[st.actText, { color: '#1485EE' }]}>📞 Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actBtn, { backgroundColor: '#1485EE', flex: 1 }]} onPress={() => setView('book')}>
              <Text style={[st.actText, { color: '#fff' }]}>Reservar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {view === 'book' && selected && (
        <View>
          <FormField placeholder="Nombre completo" value={form.name} onChangeText={v => setF('name', v)} />
          <FormField placeholder="Teléfono" value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder="Check-in (DD/MM/AAAA)" value={form.checkin} onChangeText={v => setF('checkin', v)} />
          <FormField placeholder="Check-out (DD/MM/AAAA)" value={form.checkout} onChangeText={v => setF('checkout', v)} />
          <FormField placeholder="Huéspedes" value={form.guests} onChangeText={v => setF('guests', v)} keyboardType="numeric" />
          <View style={st.summaryBox}>
            <Text style={st.meta}>{selected.nombre}</Text>
            <Text style={st.priceBig}>{total.toLocaleString()} XAF</Text>
          </View>
          <PrimaryButton label="Confirmar reserva" onPress={() => setView('ok')} color="#1485EE" disabled={!form.name || !form.phone || !form.checkin} />
        </View>
      )}

      {view === 'ok' && selected && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={st.successTitle}>¡Reserva confirmada!</Text>
          <Text style={st.successSub}>{selected.nombre}</Text>
          <Text style={st.successSub}>{form.checkin} → {form.checkout || 'A confirmar'}</Text>
          <PrimaryButton label="Ver más hoteles" onPress={() => { setView('list'); setSelected(null); }} color="#1485EE" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 10, color: '#9CA3AF' },
  priceRow: { marginTop: 8 },
  priceLbl: { fontSize: 9, color: '#9CA3AF' },
  price: { fontSize: 14, fontWeight: '900', color: '#1B3A6B' },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  sectionLbl: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  amenityDot: { color: '#1485EE', fontSize: 8 },
  priceBig: { fontSize: 20, fontWeight: '900', color: '#1B3A6B', marginVertical: 12 },
  rowBtns: { flexDirection: 'row', gap: 8 },
  actBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  actText: { fontSize: 12, fontWeight: '700' },
  summaryBox: { backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14, marginBottom: 12 },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
