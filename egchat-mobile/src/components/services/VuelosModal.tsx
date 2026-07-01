import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AIRLINES, Airline } from '../../data/serviciosDiarios';
import { FinancialModuleShell, SegmentTabs } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type FlightScreen = 'airlines' | 'routes' | 'book' | 'ok';
interface Props { visible: boolean; onClose: () => void; }

export const VuelosModal: React.FC<Props> = ({ visible, onClose }) => {
  const [view, setView] = useState<FlightScreen>('airlines');
  const [tab, setTab] = useState<'nacional' | 'intl'>('nacional');
  const [airline, setAirline] = useState<Airline | null>(null);
  const [route, setRoute] = useState<Airline['rutas'][0] | null>(null);
  const [trip, setTrip] = useState('Ida');
  const [clase, setClase] = useState('Turista');
  const [form, setForm] = useState({ name: '', dni: '', phone: '', date: '', pax: '1', payMethod: '' });

  useEffect(() => {
    if (!visible) {
      setView('airlines'); setTab('nacional'); setAirline(null); setRoute(null);
      setTrip('Ida'); setClase('Turista');
      setForm({ name: '', dni: '', phone: '', date: '', pax: '1', payMethod: '' });
    }
  }, [visible]);

  const airlines = AIRLINES.filter(a => tab === 'nacional' ? a.nacional : !a.nacional);
  const total = route ? Math.round(route.precio * (clase === 'Business' ? 1.8 : 1) * (trip === 'Ida y vuelta' ? 2 : 1) * parseInt(form.pax || '1')) : 0;
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const canBook = form.name && form.dni && form.phone && form.date && form.payMethod;

  const fixedTop = view === 'airlines' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SegmentTabs
        options={[{ id: 'nacional', label: 'GQ Nacionales' }, { id: 'intl', label: '🌍 Internacionales' }]}
        value={tab} onChange={id => setTab(id as 'nacional' | 'intl')} activeColor="#1B3A6B"
      />
    </View>
  ) : null;

  return (
    <FinancialModuleShell
      visible={visible}
      title="Vuelos"
      subtitle="Aerolíneas que operan en Guinea Ecuatorial"
      onBack={() => {
        if (view === 'book') setView('routes');
        else if (view === 'routes') setView('airlines');
        else onClose();
      }}
      onClose={onClose}
      centerTitle
      hideBack={view === 'ok'}
      fixedTop={fixedTop}
      onRefresh={() => setView('airlines')}
      headerGradient={['#1B3A6B', '#00b4e6']}
    >
      {view === 'airlines' && airlines.map(a => (
        <TouchableOpacity key={a.id} style={st.airlineRow} onPress={() => { setAirline(a); setView('routes'); }} activeOpacity={0.85}>
          <View style={[st.iataBox, { backgroundColor: a.color + '18' }]}>
            <Text style={[st.iata, { color: a.color }]}>{a.iata}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.airlineName}>{a.nombre}</Text>
            <Text style={st.airlineSub}>{a.pais}</Text>
          </View>
          <View style={[st.routeBadge, { backgroundColor: a.color + '15' }]}>
            <Text style={[st.routeBadgeText, { color: a.color }]}>{a.rutas.length} rutas</Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      {view === 'routes' && airline && (
        <View>
          <LinearGradient colors={[airline.color, '#00b4e6']} style={st.banner}>
            <Text style={st.bannerTitle}>{airline.nombre}</Text>
            <Text style={st.bannerSub}>{airline.rutas.length} rutas disponibles</Text>
          </LinearGradient>
          {airline.rutas.map((r, i) => (
            <View key={i} style={st.routeCard}>
              <View style={st.routeTop}>
                <View style={{ flex: 1 }}>
                  <Text style={st.routeName}>{r.origen} → {r.destino}</Text>
                  <Text style={st.routeMeta}>{r.duracion} · {r.frecuencia}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[st.routePrice, { color: airline.color }]}>{r.precio.toLocaleString()}</Text>
                  <Text style={st.routeMeta}>XAF/pax</Text>
                </View>
              </View>
              <TouchableOpacity style={[st.bookBtn, { backgroundColor: airline.color }]} onPress={() => { setRoute(r); setView('book'); }}>
                <Text style={st.bookBtnText}>Reservar este vuelo</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {view === 'book' && route && airline && (
        <View>
          <LinearGradient colors={[airline.color, '#00b4e6']} style={st.banner}>
            <Text style={st.bannerSub}>{airline.nombre}</Text>
            <Text style={st.bannerTitle}>{route.origen} → {route.destino}</Text>
          </LinearGradient>
          <View style={st.chipRow}>
            {['Ida', 'Ida y vuelta'].map(t => (
              <TouchableOpacity key={t} style={[st.chip, trip === t && st.chipActive]} onPress={() => setTrip(t)}>
                <Text style={[st.chipText, trip === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={st.chipRow}>
            {['Turista', 'Business'].map(c => (
              <TouchableOpacity key={c} style={[st.chip, clase === c && { backgroundColor: '#00b4e6', borderColor: '#00b4e6' }]} onPress={() => setClase(c)}>
                <Text style={[st.chipText, clase === c && { color: '#fff' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField placeholder="Nombre completo" value={form.name} onChangeText={v => setF('name', v)} />
          <FormField placeholder="Pasaporte / DNI" value={form.dni} onChangeText={v => setF('dni', v)} />
          <FormField placeholder="Teléfono" value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder="Fecha salida (DD/MM/AAAA)" value={form.date} onChangeText={v => setF('date', v)} />
          <FormField placeholder="Nº pasajeros" value={form.pax} onChangeText={v => setF('pax', v)} keyboardType="numeric" />
          <View style={st.totalBox}>
            <Text style={st.totalLbl}>Total estimado</Text>
            <Text style={st.totalVal}>{total.toLocaleString()} XAF</Text>
          </View>
          <View style={st.chipRow}>
            {[{ id: 'wallet', label: 'EGCHAT' }, { id: 'bank', label: 'Banco' }, { id: 'card', label: 'Tarjeta' }].map(m => (
              <TouchableOpacity key={m.id} style={[st.payChip, form.payMethod === m.id && st.payChipActive]} onPress={() => setF('payMethod', m.id)}>
                <Text style={[st.chipText, form.payMethod === m.id && { color: '#1B3A6B' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <PrimaryButton label="Reservar vuelo" onPress={() => setView('ok')} color="#1B3A6B" disabled={!canBook} />
        </View>
      )}

      {view === 'ok' && route && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={st.successTitle}>¡Reserva confirmada!</Text>
          <Text style={st.successSub}>{route.origen} → {route.destino}</Text>
          <Text style={st.totalVal}>{total.toLocaleString()} XAF</Text>
          <PrimaryButton label="Ver más vuelos" onPress={() => setView('airlines')} color="#1B3A6B" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  iataBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iata: { fontSize: 14, fontWeight: '800' },
  airlineName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  airlineSub: { fontSize: 11, color: '#9CA3AF' },
  routeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  routeBadgeText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 16, color: '#9CA3AF' },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  routeCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  routeTop: { flexDirection: 'row', marginBottom: 10 },
  routeName: { fontSize: 13, fontWeight: '800', color: '#111827' },
  routeMeta: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  routePrice: { fontSize: 16, fontWeight: '900' },
  bookBtn: { borderRadius: 10, padding: 10, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1B3A6B', borderColor: '#1B3A6B' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  payChip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  payChipActive: { backgroundColor: '#EFF5FD', borderColor: '#00b4e6' },
  totalBox: { backgroundColor: '#EFF5FD', borderRadius: 10, padding: 12, marginBottom: 12 },
  totalLbl: { fontSize: 11, color: '#1B3A6B', fontWeight: '600' },
  totalVal: { fontSize: 22, fontWeight: '900', color: '#1B3A6B' },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
