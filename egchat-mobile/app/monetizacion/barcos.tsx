import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { StatusBadge } from '../../src/components/monetizacion/StatusBadge';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';
import { BarChart, BarChartDataPoint } from '../../src/components/monetizacion/BarChart';
import { useBarcos } from '../../src/hooks/useMonetizacion';
import type { BarcoConStats } from '../../src/types/monetizacion';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface VentaMensual {
  mes: string;
  recaudacion: number;
  billetes: number;
}

const COMISION_PCT = 1;

const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

// ── Datos demo ─────────────────────────────────────────────────────────────
// ── Tipos locales de demo ──────────────────────────────────────────────────
interface BarcoDemo {
  id: string;
  nombre_operador: string;
  nombre_barco: string;
  matricula: string;
  ruta: string;
  origen: string;
  destino: string;
  capacidad: number;
  precio_base: number;
  activo: boolean;
  billetes_mes: number;
  recaudacion_mes: number;
}

const BARCOS_DEMO: BarcoDemo[] = [
  { id: '1', nombre_operador: 'Naviera Bioko S.A.', nombre_barco: 'Bioko Express', matricula: 'GQ-001-MBO', ruta: 'Malabo → Bata', origen: 'Malabo', destino: 'Bata', capacidad: 120, precio_base: 45000, activo: true, billetes_mes: 42, recaudacion_mes: 1890000 },
  { id: '2', nombre_operador: 'Transportes del Litoral', nombre_barco: 'Costa Verde', matricula: 'GQ-002-BTA', ruta: 'Bata → Malabo', origen: 'Bata', destino: 'Malabo', capacidad: 90, precio_base: 45000, activo: true, billetes_mes: 35, recaudacion_mes: 1575000 },
  { id: '3', nombre_operador: 'Naviera Guinea Ecuatorial', nombre_barco: 'Mongomo Star', matricula: 'GQ-003-MBO', ruta: 'Malabo → Annobon', origen: 'Malabo', destino: 'Annobon', capacidad: 60, precio_base: 80000, activo: true, billetes_mes: 9, recaudacion_mes: 720000 },
  { id: '4', nombre_operador: 'Servicios Marítimos GE', nombre_barco: 'Litoral GE', matricula: 'GQ-004-BTA', ruta: 'Bata → Cogo', origen: 'Bata', destino: 'Cogo', capacidad: 45, precio_base: 20000, activo: false, billetes_mes: 0, recaudacion_mes: 0 },
];

const VENTAS_HISTORICO: VentaMensual[] = [
  { mes: 'Abr', recaudacion: 3200000, billetes: 71 },
  { mes: 'May', recaudacion: 3500000, billetes: 78 },
  { mes: 'Jun', recaudacion: 3800000, billetes: 84 },
  { mes: 'Jul', recaudacion: 4100000, billetes: 91 },
  { mes: 'Ago', recaudacion: 4200000, billetes: 93 },
  { mes: 'Sep', recaudacion: 4185000, billetes: 86 },
];


// ── Pantalla ───────────────────────────────────────────────────────────────
export default function BarcosScreen() {
  const { barcos, historico, loading, error, refresh } = useBarcos();
  const [detailBarco, setDetailBarco] = useState<BarcoConStats | null>(null);

  // Fallback a demo si Supabase aún no tiene datos
  const fuenteBarcos = barcos.length > 0 ? barcos : BARCOS_DEMO;
  const fuenteHistorico: BarChartDataPoint[] = historico.length > 0
    ? historico.map(h => ({ label: h.label, value: h.value }))
    : VENTAS_HISTORICO.map(v => ({ label: v.mes, value: v.recaudacion }));

  const totalBilletes = fuenteBarcos.reduce((s, b) => s + b.billetes_mes, 0);
  const totalRecaudacion = fuenteBarcos.reduce((s, b) => s + b.recaudacion_mes, 0);
  const totalComisiones = totalRecaudacion * COMISION_PCT / 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#FF8800" />
        }
      >
        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard label="Billetes Mes" value={`${totalBilletes}`} icon="🎫" accentColor="#FF8800" trend={-7.5} subValue="Todos los barcos" />
          <MetricCard label="Comisiones (1%)" value={fmt(totalComisiones)} icon="💰" accentColor="#00FF88" trend={-0.4} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Recaudación Total" value={fmt(totalRecaudacion)} icon="💵" accentColor="#FF8800" fullWidth />
        </View>

        {/* Gráfico evolución */}
        <Text style={styles.sectionTitle}>📈 Evolución Ventas</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={chartData}
            height={180}
            barColor="#FF8800"
            barColorSecondary="#884400"
            formatValue={v => `${(v / 1_000_000).toFixed(1)}M`}
            title="Recaudación mensual de billetes (XAF)"
          />
        </View>

        {/* Lista barcos */}
        <Text style={styles.sectionTitle}>⛵ Operadores Registrados</Text>
        {BARCOS_DEMO.map(barco => {
          const comision = barco.recaudacion_mes * COMISION_PCT / 100;
          const ocupacion = barco.billetes_mes > 0
            ? Math.round((barco.billetes_mes / (barco.capacidad * 0.8)) * 100)
            : 0;

          return (
            <TouchableOpacity
              key={barco.id}
              style={[styles.card, !barco.activo && styles.cardInactive]}
              onPress={() => setDetailBarco(barco)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeOrigen}>{barco.origen}</Text>
                  <Text style={styles.routeArrow}>→</Text>
                  <Text style={styles.routeDestino}>{barco.destino}</Text>
                </View>
                <StatusBadge status={barco.activo ? 'activo' : 'inactivo'} size="sm" />
              </View>

              <Text style={styles.barcoNombre}>{barco.nombre_barco}</Text>
              <Text style={styles.barcoSub}>🧑‍✈️ {barco.nombre_operador} · {barco.matricula}</Text>
              <Text style={styles.barcoSub}>👥 Capacidad: {barco.capacidad} pasajeros · Tarifa: {fmt(barco.precio_base)}</Text>

              <View style={styles.cardDivider} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{barco.billetes_mes}</Text>
                  <Text style={styles.statLabel}>Billetes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#FF8800' }]}>{fmt(barco.recaudacion_mes)}</Text>
                  <Text style={styles.statLabel}>Recaudación</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#00FF88' }]}>{fmt(comision)}</Text>
                  <Text style={styles.statLabel}>Comisión 1%</Text>
                </View>
              </View>

              {/* Barra de ocupación */}
              {barco.activo && (
                <View style={styles.ocupacionRow}>
                  <Text style={styles.ocupacionLabel}>Ocupación est.: {ocupacion}%</Text>
                  <View style={styles.ocupacionBar}>
                    <View style={[styles.ocupacionFill, {
                      width: `${ocupacion}%`,
                      backgroundColor: ocupacion > 70 ? '#00FF88' : ocupacion > 40 ? '#FFD700' : '#FF8800',
                    }]} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Desglose por ruta */}
        <Text style={styles.sectionTitle}>📊 Desglose por Ruta</Text>
        <View style={{ marginHorizontal: 16 }}>
          <RevenueTable
            rows={BARCOS_DEMO.filter(b => b.activo).map(b => ({
              label: b.ruta,
              subLabel: `${b.billetes_mes} billetes`,
              value: fmt(b.recaudacion_mes * COMISION_PCT / 100),
              color: '#FF8800',
              percentage: Math.round((b.recaudacion_mes / totalRecaudacion) * 100),
            }))}
            title="Comisiones por ruta"
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal detalle barco */}
      <Modal visible={!!detailBarco} animationType="slide" transparent onRequestClose={() => setDetailBarco(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {detailBarco && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>{detailBarco.nombre_barco}</Text>
                    <Text style={styles.sheetSub}>{detailBarco.ruta}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailBarco(null)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  <RevenueTable
                    showBars={false}
                    rows={[
                      { label: 'Operador', value: detailBarco.nombre_operador },
                      { label: 'Matrícula', value: detailBarco.matricula },
                      { label: 'Ruta', value: detailBarco.ruta },
                      { label: 'Capacidad', value: `${detailBarco.capacidad} pasajeros` },
                      { label: 'Precio base billete', value: fmt(detailBarco.precio_base) },
                      { label: 'Billetes vendidos mes', value: `${detailBarco.billetes_mes}` },
                      { label: 'Recaudación bruta mes', value: fmt(detailBarco.recaudacion_mes) },
                      { label: `Comisión EGChat (${COMISION_PCT}%)`, value: fmt(detailBarco.recaudacion_mes * COMISION_PCT / 100), color: '#00FF88' },
                      { label: 'Estado', value: detailBarco.activo ? 'Activo' : 'Inactivo' },
                    ]}
                  />
                </ScrollView>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setDetailBarco(null)}>
                    <Text style={styles.btnSecondaryText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  metricsRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  chartCard: { marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A4A', overflow: 'hidden' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  cardInactive: { opacity: 0.55 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF880022', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  routeOrigen: { fontSize: 12, color: '#FF8800', fontWeight: '700' },
  routeArrow: { fontSize: 12, color: '#8888AA' },
  routeDestino: { fontSize: 12, color: '#FF8800', fontWeight: '700' },
  barcoNombre: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  barcoSub: { fontSize: 11, color: '#8888AA', marginTop: 3 },
  cardDivider: { height: 1, backgroundColor: '#2A2A4A', marginVertical: 10 },
  statsRow: { flexDirection: 'row', backgroundColor: '#0F0F1E', borderRadius: 10, padding: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: '#8888AA', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2A2A4A' },
  ocupacionRow: { marginTop: 10 },
  ocupacionLabel: { fontSize: 11, color: '#8888AA', marginBottom: 4 },
  ocupacionBar: { height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden' },
  ocupacionFill: { height: 6, borderRadius: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F0F1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderColor: '#2A2A4A' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  sheetSub: { fontSize: 12, color: '#8888AA', marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sheetActions: { marginTop: 16 },
  btnSecondary: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  btnSecondaryText: { fontSize: 14, color: '#8888AA', fontWeight: '600' },
});
