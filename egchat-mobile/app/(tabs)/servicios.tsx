import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';

const SERVICES = [
  { icon: '⚡', label: 'Electricidad', color: '#F59E0B', sub: 'SEGESA' },
  { icon: '💧', label: 'Agua', color: '#00b4e6', sub: 'SNGE' },
  { icon: '🏥', label: 'Salud', color: '#EF4444', sub: 'Hospitales' },
  { icon: '🛒', label: 'Supermercado', color: '#00c8a0', sub: 'Compras online' },
  { icon: '🚕', label: 'MiTaxi', color: '#F59E0B', sub: 'Pedir taxi' },
  { icon: '📱', label: 'Recarga', color: '#6B5BD6', sub: 'Telefonía' },
  { icon: '📺', label: 'Canales TV', color: '#EF4444', sub: 'Suscripciones' },
  { icon: '🌐', label: 'Internet', color: '#00b4e6', sub: 'Datos móviles' },
  { icon: '🏦', label: 'Bancos', color: '#1B3A6B', sub: 'BANGE, CCEI...' },
  { icon: '🛡️', label: 'Seguros', color: '#065F46', sub: 'Vida, auto...' },
  { icon: '📋', label: 'Impuestos', color: '#374151', sub: 'DGI' },
  { icon: '📮', label: 'Correos', color: '#C0392B', sub: 'Envíos' },
];

export default function ServiciosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servicios</Text>
        <Text style={styles.sub}>Guinea Ecuatorial</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {SERVICES.map(s => (
          <TouchableOpacity key={s.label} style={styles.item}
            onPress={() => Alert.alert(s.label, `${s.sub} — Próximamente disponible en la app móvil`)}>
            <View style={[styles.iconBox, { backgroundColor: s.color + '18' }]}>
              <Text style={styles.icon}>{s.icon}</Text>
            </View>
            <Text style={styles.label}>{s.label}</Text>
            <Text style={styles.itemSub}>{s.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  item: { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F0F2F5', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#111827', textAlign: 'center' },
  itemSub: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
});
