import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RESTAURANTS, Restaurant, precioColor, precioLabel } from '../../data/serviciosDiarios';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { SearchField } from './PublicModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type RestScreen = 'list' | 'menu' | 'reserva' | 'ok';
interface Props { visible: boolean; onClose: () => void; }

export const RestaurantesModal: React.FC<Props> = ({ visible, onClose }) => {
  const [city, setCity] = useState('Malabo');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<RestScreen>('list');
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', date: '', hora: '', personas: '2', notas: '' });

  useEffect(() => {
    if (!visible) { setView('list'); setCity('Malabo'); setSearch(''); setSelected(null); setForm({ name: '', phone: '', date: '', hora: '', personas: '2', notas: '' }); }
  }, [visible]);

  const filtered = RESTAURANTS.filter(r =>
    (city === 'Todos' || r.ciudad === city) &&
    (!search || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase()))
  );

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const canReserve = form.name && form.phone && form.date && form.hora;

  const fixedTop = view === 'list' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <FilterChips
        options={['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Todos'].map(c => ({ id: c, label: c }))}
        value={city} onChange={setCity} activeColor="#C47D2A"
      />
    </View>
  ) : null;

  return (
    <FinancialModuleShell
      visible={visible}
      title="Restaurante"
      subtitle={view === 'list' ? `Guinea Ecuatorial · ${RESTAURANTS.length} restaurantes` : selected?.nombre}
      onBack={() => view === 'list' ? onClose() : setView('list')}
      onClose={onClose}
      centerTitle
      hideBack={view === 'ok'}
      fixedTop={fixedTop}
      onRefresh={() => { setView('list'); setSearch(''); setCity('Malabo'); }}
      headerGradient={view === 'list' ? ['#92400E', '#F59E0B'] : undefined}
    >
      {view === 'list' && (
        <View>
          <SearchField placeholder="Buscar restaurante o tipo..." value={search} onChangeText={setSearch} />
          {filtered.map(r => (
            <View key={r.id} style={st.card}>
              <View style={st.cardTop}>
                <Text style={{ fontSize: 22 }}>🍽️</Text>
                <View style={{ flex: 1 }}>
                  <View style={st.nameRow}>
                    <Text style={st.name}>{r.nombre}</Text>
                    <Text style={[st.priceTag, { backgroundColor: precioColor(r.precio) + '18', color: precioColor(r.precio) }]}>{precioLabel(r.precio)}</Text>
                  </View>
                  <Text style={st.meta}>{r.tipo} · {r.especialidad}</Text>
                  <Text style={st.meta}>📍 {r.barrio}, {r.ciudad}</Text>
                  <Text style={st.meta}>🕐 {r.horario}</Text>
                </View>
              </View>
              <View style={st.actions}>
                <TouchableOpacity style={[st.actBtn, { backgroundColor: '#EFF5FD' }]} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.barrio + ', ' + r.ciudad)}`)}>
                  <Text style={[st.actText, { color: '#1485EE' }]}>📍 GPS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.actBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => { setSelected(r); setView('menu'); }}>
                  <Text style={[st.actText, { color: '#92400E' }]}>Ver menú</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.actBtn, { backgroundColor: '#C47D2A' }]} onPress={() => { setSelected(r); setView('reserva'); }}>
                  <Text style={[st.actText, { color: '#fff' }]}>Reservar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {view === 'menu' && selected && (
        <View>
          <LinearGradient colors={['#92400E', '#F59E0B']} style={st.menuBanner}>
            <Text style={st.menuTitle}>{selected.nombre}</Text>
            <Text style={st.menuSub}>{selected.tipo} · {selected.barrio}</Text>
          </LinearGradient>
          {selected.menu.map((item, i) => (
            <View key={i} style={st.menuRow}>
              <Text style={st.menuPlato}>{item.plato}</Text>
              <Text style={st.menuPrecio}>{item.precio.toLocaleString()} XAF</Text>
            </View>
          ))}
          <PrimaryButton label="Reservar mesa" onPress={() => setView('reserva')} color="#C47D2A" />
        </View>
      )}

      {view === 'reserva' && selected && (
        <View>
          <LinearGradient colors={['#92400E', '#F59E0B']} style={st.menuBanner}>
            <Text style={st.menuTitle}>{selected.nombre}</Text>
            <Text style={st.menuSub}>{selected.barrio} · {selected.ciudad}</Text>
          </LinearGradient>
          <FormField placeholder="Tu nombre completo" value={form.name} onChangeText={v => setF('name', v)} />
          <FormField placeholder="Teléfono de contacto" value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder="Fecha (DD/MM/AAAA)" value={form.date} onChangeText={v => setF('date', v)} />
          <FormField placeholder="Hora de llegada" value={form.hora} onChangeText={v => setF('hora', v)} />
          <FormField placeholder="Número de personas" value={form.personas} onChangeText={v => setF('personas', v)} keyboardType="numeric" />
          <PrimaryButton label="Confirmar reserva" onPress={() => setView('ok')} color="#C47D2A" disabled={!canReserve} />
        </View>
      )}

      {view === 'ok' && selected && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={st.successTitle}>¡Reserva confirmada!</Text>
          <Text style={st.successSub}>{selected.nombre}</Text>
          <Text style={st.successSub}>{form.date} · {form.hora} · {form.personas} personas</Text>
          <PrimaryButton label="Ver más restaurantes" onPress={() => { setView('list'); setSelected(null); }} color="#C47D2A" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5' },
  cardTop: { flexDirection: 'row', gap: 12, padding: 14 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  priceTag: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  meta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  actBtn: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  actText: { fontSize: 10, fontWeight: '700' },
  menuBanner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  menuTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  menuSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  menuPlato: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  menuPrecio: { fontSize: 13, fontWeight: '800', color: '#C47D2A' },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
