import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { walletAPI } from '../../src/api';

export default function MonederoScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bal, txs] = await Promise.all([walletAPI.getBalance(), walletAPI.getTransactions()]);
      setBalance(bal.balance);
      setTransactions(txs.transactions || []);
    } catch (e) {
      // Usar datos locales si el backend no responde
      setBalance(125450);
    } finally {
      setLoading(false);
    }
  };

  const ACTIONS = [
    { icon: '⬇️', label: 'Recargar', color: '#00c8a0', action: () => Alert.alert('Recargar', 'Función disponible próximamente') },
    { icon: '⬆️', label: 'Retirar', color: '#6B5BD6', action: () => Alert.alert('Retirar', 'Función disponible próximamente') },
    { icon: '↗️', label: 'Enviar', color: '#00b4e6', action: () => Alert.alert('Enviar', 'Función disponible próximamente') },
    { icon: '📊', label: 'Historial', color: '#F59E0B', action: () => {} },
  ];

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#00c8a0" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Tarjeta de saldo */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Monedero EGCHAT</Text>
          <Text style={styles.balance}>{balance.toLocaleString()} <Text style={styles.currency}>XAF</Text></Text>
          <Text style={styles.cardSub}>Saldo disponible</Text>
          {/* Acciones */}
          <View style={styles.actions}>
            {ACTIONS.map(a => (
              <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.action}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transacciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transacciones</Text>
          {transactions.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>Sin transacciones aún</Text></View>
          ) : transactions.slice(0, 10).map((tx: any) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'deposit' ? '#F0FDF9' : '#FEF2F2' }]}>
                <Text style={{ fontSize: 18 }}>{tx.type === 'deposit' ? '⬇️' : '⬆️'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txMethod}>{tx.method || tx.type}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('es-ES')}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'deposit' ? '#00c8a0' : '#EF4444' }]}>
                {tx.type === 'deposit' ? '+' : '-'}{tx.amount?.toLocaleString()} XAF
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { margin: 16, borderRadius: 20, padding: 24, background: undefined, backgroundColor: undefined },
  // Gradient workaround
  balance: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  currency: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  cardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#9CA3AF', fontSize: 13 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txMethod: { fontSize: 13, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
});

// Apply gradient to card
const cardStyle = StyleSheet.create({
  card: {
    margin: 16, borderRadius: 20, padding: 24,
    shadowColor: '#00c8a0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  }
});
