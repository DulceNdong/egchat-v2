import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GAS_COMPANIES, GAS_REF_PRICES, GasCompany } from '../../data/serviciosDiarios';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';

type GasScreen = 'companies' | 'stations';
interface Props { visible: boolean; onClose: () => void; }

export const GasolinerasModal: React.FC<Props> = ({ visible, onClose }) => {
  const [view, setView] = useState<GasScreen>('companies');
  const [company, setCompany] = useState<GasCompany | null>(null);
  const [city, setCity] = useState('Malabo');

  useEffect(() => {
    if (!visible) { setView('companies'); setCompany(null); setCity('Malabo'); }
  }, [visible]);

  const stations = company?.estaciones.filter(s => city === 'Todos' || s.ciudad === city) || [];

  const fixedTop = view === 'stations' ? (
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
      title="Gasolinera"
      subtitle="Compañías en Guinea Ecuatorial · Precios actualizados"
      onBack={() => view === 'companies' ? onClose() : setView('companies')}
      onClose={onClose}
      centerTitle
      fixedTop={fixedTop}
      onRefresh={() => { setView('companies'); setCompany(null); }}
      headerGradient={['#C47D2A', '#F59E0B']}
    >
      {view === 'companies' && (
        <View>
          <View style={st.refBox}>
            <Text style={st.refTitle}>Precios de referencia (XAF/L)</Text>
            <View style={st.refGrid}>
              <View style={st.refCol}><Text style={[st.refLbl, { color: '#C47D2A' }]}>Gasolina</Text><Text style={[st.refVal, { color: '#C47D2A' }]}>{GAS_REF_PRICES.g95}</Text></View>
              <View style={st.refCol}><Text style={[st.refLbl, { color: '#576B95' }]}>Diesel</Text><Text style={[st.refVal, { color: '#576B95' }]}>{GAS_REF_PRICES.diesel}</Text></View>
              <View style={st.refCol}><Text style={[st.refLbl, { color: '#16A34A' }]}>Gas</Text><Text style={[st.refVal, { color: '#16A34A' }]}>{GAS_REF_PRICES.glp}</Text></View>
            </View>
          </View>
          {GAS_COMPANIES.map(c => (
            <TouchableOpacity key={c.id} style={st.companyRow} onPress={() => { setCompany(c); setView('stations'); }} activeOpacity={0.85}>
              <View style={[st.abbrBox, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[st.abbr, { color: c.color }]}>{c.abbr}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.companyName}>{c.nombre}</Text>
                <Text style={st.companySub}>{c.estaciones.length} estaciones · Malabo, Bata y más</Text>
              </View>
              <Text style={st.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view === 'stations' && company && (
        <View>
          <LinearGradient colors={[company.color, '#F59E0B']} style={st.banner}>
            <Text style={st.bannerTitle}>{company.nombre}</Text>
            <Text style={st.bannerSub}>{stations.length} estaciones</Text>
          </LinearGradient>
          {stations.map((s, i) => (
            <View key={i} style={st.stationCard}>
              <Text style={st.stationName}>{s.nombre}</Text>
              <Text style={st.stationMeta}>📍 {s.barrio}, {s.ciudad} · 🕐 {s.horario}</Text>
              <View style={st.priceRow}>
                <Text style={st.fuelPrice}>G95: {s.g95}</Text>
                <Text style={st.fuelPrice}>Diesel: {s.diesel}</Text>
                <Text style={st.fuelPrice}>GLP: {s.glp}</Text>
              </View>
              <TouchableOpacity style={st.callBtn} onPress={() => Linking.openURL(`tel:${s.tel}`)}>
                <Text style={st.callBtnText}>📞 Llamar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  refBox: { backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A' },
  refTitle: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  refGrid: { flexDirection: 'row' },
  refCol: { flex: 1, alignItems: 'center' },
  refLbl: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  refVal: { fontSize: 22, fontWeight: '900' },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  abbrBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  abbr: { fontSize: 12, fontWeight: '800' },
  companyName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  companySub: { fontSize: 11, color: '#9CA3AF' },
  chevron: { fontSize: 16, color: '#9CA3AF' },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  stationCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  stationName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stationMeta: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  priceRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  fuelPrice: { fontSize: 11, fontWeight: '700', color: '#C47D2A' },
  callBtn: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, alignItems: 'center' },
  callBtnText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
});
