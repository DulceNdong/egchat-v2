import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { BEAUTY } from '../../data/serviciosDiarios';
import { FinancialModuleShell } from './FinancialModuleUI';

interface Props { visible: boolean; onClose: () => void; }

export const BellezaModal: React.FC<Props> = ({ visible, onClose }) => (
  <FinancialModuleShell
    visible={visible}
    title="Belleza"
    subtitle="Salones y centros de belleza"
    onBack={onClose}
    onClose={onClose}
    centerTitle
    headerGradient={['#C0392B', '#EC4899']}
  >
    {BEAUTY.map(b => (
      <TouchableOpacity
        key={b.id}
        style={st.card}
        onPress={() => Alert.alert(b.nombre, b.desc, [
          { text: 'Cerrar', style: 'cancel' },
          { text: '📞 Llamar', onPress: () => Linking.openURL(`tel:${b.tel}`) },
        ])}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 28 }}>{b.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{b.nombre}</Text>
          <Text style={st.desc}>{b.desc}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </TouchableOpacity>
    ))}
  </FinancialModuleShell>
);

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 18, color: '#9CA3AF' },
});
