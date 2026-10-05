import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { StatusBadge } from '../../src/components/monetizacion/StatusBadge';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';
import { BarChart, BarChartDataPoint } from '../../src/components/monetizacion/BarChart';
import { useMonedero } from '../../src/hooks/useMonetizacion';
import type { MovimientoConNombre, TopUsuario as TopUsuarioType } from '../../src/types/monetizacion';

const COMISION_PCT = 0.5;
const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

// ── Datos demo (fallback) ──────────────────────────────────────────────────
const MOVIMIENTOS_DEMO: MovimientoConNombre[] = [
  { id: '1', user_id: 'u1', usuario: 'Elena Nzogo', tipo: 'recarga_banco', monto: 500000, comision_monto: 2500, comision: 2500, banco: 'BGFI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-28' },
  { id: '2', user_id: 'u2', usuario: 'Tomás Ondo', tipo: 'retiro_banco', monto: 200000, comision_monto: 1000, comision: 1000, banco: 'CCEI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-28' },
  { id: '3', user_id: 'u3', usuario: 'Inés Esono', tipo: 'recarga_banco', monto: 1000000, comision_monto: 5000, comision: 5000, banco: 'BGFI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-27' },
  { id: '4', user_id: 'u4', usuario: 'Carlos Abaga', tipo: 'recarga_banco', monto: 150000, comision_monto: 750, comision: 750, banco: 'Ecobank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-27' },
  { id: '5', user_id: 'u5', usuario: 'María Mba', tipo: 'retiro_banco', monto: 300000, comision_monto: 1500, comision: 1500, banco: 'BGFI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-26' },
  { id: '6', user_id: 'u6', usuario: 'Pedro Nguema', tipo: 'recarga_banco', monto: 750000, comision_monto: 3750, comision: 3750, banco: 'CCEI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-26' },
  { id: '7', user_id: 'u7', usuario: 'Rosa Eyama', tipo: 'recarga_banco', monto: 80000, comision_monto: 400, comision: 400, banco: 'Ecobank', estado: 'pendiente', mes: 9, anio: 2026, fecha: '2026-09-25' },
  { id: '8', user_id: 'u8', usuario: 'Juan Nfono', tipo: 'retiro_banco', monto: 400000, comision_monto: 2000, comision: 2000, banco: 'BGFI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-25' },
  { id: '9', user_id: 'u9', usuario: 'Ana Obiang', tipo: 'recarga_banco', monto: 250000, comision_monto: 1250, comision: 1250, banco: 'CCEI Bank', estado: 'fallido', mes: 9, anio: 2026, fecha: '2026-09-24' },
  { id: '10', user_id: 'u10', usuario: 'Luis Nve', tipo: 'recarga_banco', monto: 600000, comision_monto: 3000, comision: 3000, banco: 'BGFI Bank', estado: 'completado', mes: 9, anio: 2026, fecha: '2026-09-24' },
];

const TOP_USUARIOS: TopUsuarioType[] = [
  { user_id: 'u3', nombre: 'Inés Esono', numMovimientos: 24, totalMovido: 12500000, comisionesTotales: 62500 },
  { user_id: 'u4', nombre: 'Carlos Abaga', numMovimientos: 18, totalMovido: 9800000, comisionesTotales: 49000 },
  { user_id: 'u6', nombre: 'Pedro Nguema', numMovimientos: 15, totalMovido: 8200000, comisionesTotales: 41000 },
  { user_id: 'u1', nombre: 'Elena Nzogo', numMovimientos: 12, totalMovido: 6500000, comisionesTotales: 32500 },
  { user_id: 'u10', nombre: 'Luis Nve', numMovimientos: 10, totalMovido: 5100000, comisionesTotales: 25500 },
];

const CHART_DATA: BarChartDataPoint[] = [
  { label: 'Abr', value: 58000 },
  { label: 'May', value: 62000 },
  { label: 'Jun', value: 68000 },
  { label: 'Jul', value: 65000 },
  { label: 'Ago', value: 72000 },
  { label: 'Sep', value: 78500 },
];

const BANCOS_DATA = [
  { banco: 'BGFI Bank', movimientos: 1180, volumen: 8900000 },
  { banco: 'CCEI Bank', movimientos: 620, volumen: 4200000 },
  { banco: 'Ecobank', movimientos: 300, volumen: 2100000 },
];

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function MonederoScreen() {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'recarga_banco' | 'retiro_banco'>('todos');

  const { movimientos, topUsuarios, historico, bancos, totales, loading, error, refresh } = useMonedero();

  // Fuentes con fallback a demo data
  const fuenteMovimientos = movimientos.length > 0 ? movimientos : MOVIMIENTOS_DEMO;
  const fuenteTop = topUsuarios.length > 0 ? topUsuarios : TOP_USUARIOS;
  const fuenteBancos = bancos.length > 0 ? bancos : BANCOS_DATA;
  const chartDataFinal: BarChartDataPoint[] = historico.length > 0
    ? historico.map(h => ({ label: h.label, value: h.value }))
    : CHART_DATA;

  // Métricas con fallback
  const displayMovimientos = (!loading && totales.movimientos > 0) ? totales.movimientos : (loading ? 0 : 2100);
  const displayVolumen = (!loading && totales.volumen > 0) ? totales.volumen : (loading ? 0 : 15200000);
  const displayComisiones = (!loading && totales.comisiones > 0) ? totales.comisiones : (loading ? 0 : displayVolumen * COMISION_PCT / 100);

  const movimientosFiltrados: MovimientoConNombre[] = filtroTipo === 'todos'
    ? fuenteMovimientos
    : fuenteMovimientos.filter(m => m.tipo === filtroTipo);

  const tipoLabel = (tipo: string) => tipo === 'recarga_banco' ? '↓ Recarga' : '↑ Retiro';
  const tipoColor = (tipo: string) => tipo === 'recarga_banco' ? '#00FF88' : '#FF8800';

  // Total volumen para porcentajes de la tabla de bancos
  const totalVolumenBancos = fuenteBancos.reduce((s, b) => s + b.volumen, 0) || 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#CC88FF" />
        }
      >
        {loading && movimientos.length === 0 && (
          <ActivityIndicator color="#CC88FF" style={{ marginTop: 40 }} />
        )}
        {error && movimientos.length === 0 && !loading && (
          <Text style={{ color: '#FF4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>
        )}

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard label="Movimientos" value={`${displayMovimientos}`} icon="🔄" accentColor="#CC88FF" trend={9.7} subValue="Este mes" />
          <MetricCard label="Comisiones (0.5%)" value={fmt(displayComisiones)} icon="💰" accentColor="#00FF88" trend={9.0} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Volumen Total" value={fmt(displayVolumen)} icon="💵" accentColor="#CC88FF" fullWidth />
        </View>

        {/* Gráfico evolución comisiones */}
        <Text style={styles.sectionTitle}>📈 Comisiones por Mes</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={chartDataFinal}
            height={180}
            barColor="#CC88FF"
            barColorSecondary="#664488"
            formatValue={v => `${(v / 1000).toFixed(0)}K`}
            title="Comisiones mensuales monedero (XAF)"
          />
        </View>

        {/* Por banco */}
        <Text style={styles.sectionTitle}>🏦 Por Banco</Text>
        <View style={{ marginHorizontal: 16 }}>
          <RevenueTable
            rows={fuenteBancos.map((b, i) => {
              const colors = ['#CC88FF', '#9944DD', '#6622AA'];
              return {
                label: b.banco,
                subLabel: `${b.movimientos} movimientos`,
                value: fmt(b.volumen * COMISION_PCT / 100),
                color: colors[i % colors.length],
                percentage: Math.round((b.volumen / totalVolumenBancos) * 100),
              };
            })}
            title="Comisiones por banco"
          />
        </View>

        {/* Top usuarios */}
        <Text style={styles.sectionTitle}>🏆 Top Usuarios por Volumen</Text>
        <View style={{ marginHorizontal: 16 }}>
          {fuenteTop.map((u, i) => (
            <View key={u.user_id} style={styles.topUserCard}>
              <View style={styles.topUserRank}>
                <Text style={styles.topUserRankText}>{i + 1}</Text>
              </View>
              <View style={styles.topUserInfo}>
                <Text style={styles.topUserName}>{u.nombre}</Text>
                <Text style={styles.topUserSub}>{u.numMovimientos} movimientos · {fmt(u.totalMovido)}</Text>
              </View>
              <View style={styles.topUserComision}>
                <Text style={styles.topUserComisionVal}>{fmt(u.comisionesTotales)}</Text>
                <Text style={styles.topUserComisionLabel}>comisión</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Últimas transacciones */}
        <Text style={styles.sectionTitle}>📋 Últimas Transacciones</Text>
        <View style={styles.filterRow}>
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'recarga_banco', label: '↓ Recargas' },
            { key: 'retiro_banco', label: '↑ Retiros' },
          ] as const).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filtroTipo === f.key && styles.filterBtnActive]}
              onPress={() => setFiltroTipo(f.key)}
            >
              <Text style={[styles.filterBtnText, filtroTipo === f.key && styles.filterBtnTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {movimientosFiltrados.map(mov => (
          <View key={mov.id} style={styles.txCard}>
            <View style={[styles.txIcon, { backgroundColor: tipoColor(mov.tipo) + '22' }]}>
              <Text style={[styles.txIconText, { color: tipoColor(mov.tipo) }]}>
                {mov.tipo === 'recarga_banco' ? '↓' : '↑'}
              </Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txUsuario}>{mov.usuario}</Text>
              <Text style={styles.txDetalle}>{tipoLabel(mov.tipo)} · {mov.banco} · {mov.fecha}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txMonto, { color: tipoColor(mov.tipo) }]}>
                {fmt(mov.monto)}
              </Text>
              <Text style={styles.txComision}>+{fmt(mov.comision)}</Text>
              <StatusBadge status={mov.estado as any} size="sm" />
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  metricsRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  chartCard: { marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A4A', overflow: 'hidden' },
  topUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A4A', gap: 10 },
  topUserRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#CC88FF22', alignItems: 'center', justifyContent: 'center' },
  topUserRankText: { fontSize: 13, fontWeight: '800', color: '#CC88FF' },
  topUserInfo: { flex: 1, minWidth: 0 },
  topUserName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  topUserSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  topUserComision: { alignItems: 'flex-end' },
  topUserComisionVal: { fontSize: 13, fontWeight: '800', color: '#00FF88' },
  topUserComisionLabel: { fontSize: 10, color: '#8888AA' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A4A' },
  filterBtnActive: { backgroundColor: '#CC88FF22', borderColor: '#CC88FF' },
  filterBtnText: { fontSize: 12, color: '#8888AA', fontWeight: '600' },
  filterBtnTextActive: { color: '#CC88FF' },
  txCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2A2A4A', gap: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18, fontWeight: '900' },
  txInfo: { flex: 1, minWidth: 0 },
  txUsuario: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  txDetalle: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 3 },
  txMonto: { fontSize: 13, fontWeight: '800' },
  txComision: { fontSize: 11, color: '#00FF88' },
});
