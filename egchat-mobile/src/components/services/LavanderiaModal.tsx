import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LAUNDRY } from '../../data/serviciosDiarios';
import { FinancialModuleShell } from './FinancialModuleUI';

interface Props { visible: boolean; onClose: () => void; }

export const LavanderiaModal: React.FC<Props> = ({ visible, onClose }) => (
  <FinancialModuleShell
    visible={visible}
    title="Lavandería"
    subtitle="Servicios de lavado en Guinea Ecuatorial"
    onBack={onClose}
    onClose={onClose}
    centerTitle
    headerGradient={['#1485EE', '#00b4e6']}
  >
    {LAUNDRY.map(l => (
      <View key={l.id} style={st.card}>
        <Text style={{ fontSize: 24 }}>🧺</Text>
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{l.nombre}</Text>
          <Text style={st.meta}>📍 {l.area} · 🕐 {l.hours}</Text>
          <Text style={st.price}>{l.price}</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${l.tel}`)}>
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
      </View>
    ))}
  </FinancialModuleShell>
);

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  price: { fontSize: 12, fontWeight: '700', color: '#1485EE', marginTop: 4 },
});
