import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { BarChart, BarChartDataPoint } from '../../src/components/monetizacion/BarChart';
import { RevenueTable, RevenueRow } from '../../src/components/monetizacion/RevenueTable';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ResumenMes {
  mes: string;
  empresas: number;
  taxis: number;
  barcos: number;
  wallet: number;
}

// ── Datos demo ─────────────────────────────────────────────────────────────
const RESUMEN_HISTORICO: ResumenMes[] = [
  { mes: 'Abr', empresas: 1320000, taxis: 295000, barcos: 112000, wallet: 58000 },
  { mes: 'May', empresas: 1360000, taxis: 310000, barcos: 120000, wallet: 62000 },
  { mes: 'Jun', empresas: 1390000, taxis: 328000, barcos: 128000, wallet: 67000 },
  { mes: 'Jul', empresas: 1410000, taxis: 340000, barcos: 130000, wallet: 65000 },
  { mes: 'Ago', empresas: 1430000, taxis: 360000, barcos: 142000, wallet: 72000 },
  { mes: 'Sep', empresas: 1445000, taxis: 387000, barcos: 156000, wallet: 78500 },
];

const MES_ACTUAL = RESUMEN_HISTORICO[RESUMEN_HISTORICO.length - 1];
const MES_ANTERIOR = RESUMEN_HISTORICO[RESUMEN_HISTORICO.length - 2];

const totalMesActual =
  MES_ACTUAL.empresas + MES_ACTUAL.taxis + MES_ACTUAL.barcos + MES_ACTUAL.wallet;
const totalMesAnterior =
  MES_ANTERIOR.empresas + MES_ANTERIOR.taxis + MES_ANTERIOR.barcos + MES_ANTERIOR.wallet;
const trendTotal = ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100;

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M XAF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XAF`;
  return `${n} XAF`;
};

const trendOf = (curr: number, prev: number) =>
  Math.round(((curr - prev) / prev) * 100 * 10) / 10;

// Datos para el gráfico total mensual
const CHART_DATA: BarChartDataPoint[] = RESUMEN_HISTORICO.map(m => ({
  label: m.mes,
  value: m.empresas + m.taxis + m.barcos + m.wallet,
}));

// Tabla top fuentes
const TOP_FUENTES: RevenueRow[] = [
  {
    label: 'Cuotas Empresas',
    subLabel: '7 empresas activas',
    value: fmt(1_200_000),
    color: '#00D4FF',
    percentage: Math.round((1_200_000 / totalMesActual) * 100),
  },
  {
    label: 'Comisiones Taxis (5%)',
    subLabel: '1.240 viajes este mes',
    value: fmt(387_000),
    color: '#FFD700',
    percentage: Math.round((387_000 / totalMesActual) * 100),
  },
  {
    label: 'Comisiones Empresas (1.5%)',
    subLabel: 'Ventas en plataforma',
    value: fmt(245_000),
    color: '#00FF88',
    percentage: Math.round((245_000 / totalMesActual) * 100),
  },
  {
    label: 'Comisiones Barcos (1%)',
    subLabel: '89 billetes vendidos',
    value: fmt(156_000),
    color: '#FF8800',
    percentage: Math.round((156_000 / totalMesActual) * 100),
  },
  {
    label: 'Comisiones Monedero (0.5%)',
    subLabel: '2.100 movimientos',
    value: fmt(78_500),
    color: '#CC88FF',
    percentage: Math.round((78_500 / totalMesActual) * 100),
  },
];

// ── Módulos de navegación ──────────────────────────────────────────────────
interface ModuleItem {
  icon: string;
  label: string;
  sub: string;
  route: string;
  color: string;
  revenue: string;
}

const MODULES: ModuleItem[] = [
  { icon: '🏢', label: 'Empresas', sub: '7 activas', route: '/monetizacion/empresas', color: '#00D4FF', revenue: fmt(1_445_000) },
  { icon: '🚖', label: 'Taxis', sub: '23 taxistas', route: '/monetizacion/taxis', color: '#FFD700', revenue: fmt(387_000) },
  { icon: '⛵', label: 'Barcos', sub: '4 rutas', route: '/monetizacion/barcos', color: '#FF8800', revenue: fmt(156_000) },
  { icon: '💳', label: 'Monedero', sub: '2.1K movimientos', route: '/monetizacion/monedero', color: '#CC88FF', revenue: fmt(78_500) },
  { icon: '👤', label: 'Perfiles', sub: 'Usuarios', route: '/monetizacion/perfil-financiero', color: '#00FF88', revenue: 'Historial' },
  { icon: '🏪', label: 'Negocios', sub: 'Empresas', route: '/monetizacion/perfil-negocio', color: '#FF4488', revenue: 'Informes' },
];

// ── Componente principal ───────────────────────────────────────────────────
export default function MonetizacionDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4FF"
            colors={['#00D4FF']}
          />
        }
      >
        {/* Hero header */}
        <LinearGradient
          colors={['#0D0D2B', '#0A0A0A']}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>INGRESOS TOTALES</Text>
              <Text style={styles.heroValue}>{fmt(totalMesActual)}</Text>
              <View style={styles.heroTrend}>
                <Text style={[styles.heroTrendText, { color: trendTotal >= 0 ? '#00FF88' : '#FF4444' }]}>
                  {trendTotal >= 0 ? '↑' : '↓'} {Math.abs(trendTotal).toFixed(1)}% vs mes anterior
                </Text>
              </View>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Sep 2026</Text>
            </View>
          </View>

          {/* Mini desglose */}
          <View style={styles.heroBreakdown}>
            {[
              { label: 'Empresas', value: MES_ACTUAL.empresas, color: '#00D4FF' },
              { label: 'Taxis', value: MES_ACTUAL.taxis, color: '#FFD700' },
              { label: 'Barcos', value: MES_ACTUAL.barcos, color: '#FF8800' },
              { label: 'Wallet', value: MES_ACTUAL.wallet, color: '#CC88FF' },
            ].map(item => (
              <View key={item.label} style={styles.heroBreakdownItem}>
                <View style={[styles.heroBreakdownDot, { backgroundColor: item.color }]} />
                <Text style={styles.heroBreakdownLabel}>{item.label}</Text>
                <Text style={[styles.heroBreakdownVal, { color: item.color }]}>
                  {(item.value / 1000).toFixed(0)}K
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Métricas rápidas */}
        <Text style={styles.sectionTitle}>📊 Métricas del Mes</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Empresas"
            value={fmt(MES_ACTUAL.empresas)}
            subValue="Cuotas + comisiones"
            trend={trendOf(MES_ACTUAL.empresas, MES_ANTERIOR.empresas)}
            icon="🏢"
            accentColor="#00D4FF"
          />
          <MetricCard
            label="Taxis"
            value={fmt(MES_ACTUAL.taxis)}
            subValue="5% por viaje"
            trend={trendOf(MES_ACTUAL.taxis, MES_ANTERIOR.taxis)}
            icon="🚖"
            accentColor="#FFD700"
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Barcos"
            value={fmt(MES_ACTUAL.barcos)}
            subValue="1% por billete"
            trend={trendOf(MES_ACTUAL.barcos, MES_ANTERIOR.barcos)}
            icon="⛵"
            accentColor="#FF8800"
          />
          <MetricCard
            label="Monedero"
            value={fmt(MES_ACTUAL.wallet)}
            subValue="0.5% por movimiento"
            trend={trendOf(MES_ACTUAL.wallet, MES_ANTERIOR.wallet)}
            icon="💳"
            accentColor="#CC88FF"
          />
        </View>

        {/* Gráfico evolución */}
        <Text style={styles.sectionTitle}>📈 Evolución 6 Meses</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={CHART_DATA}
            height={200}
            barColor="#00D4FF"
            barColorSecondary="#004488"
            formatValue={v => `${(v / 1000).toFixed(0)}K`}
            title="Ingresos totales mensuales (XAF)"
          />
        </View>

        {/* Top fuentes de ingresos */}
        <Text style={styles.sectionTitle}>🏆 Top Fuentes de Ingresos</Text>
        <RevenueTable
          rows={TOP_FUENTES}
          showBars
        />

        {/* Módulos de acceso rápido */}
        <Text style={styles.sectionTitle}>⚡ Módulos</Text>
        <View style={styles.modulesGrid}>
          {MODULES.map(mod => (
            <TouchableOpacity
              key={mod.route}
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['#1A1A2E', '#12122A']}
                style={styles.moduleGradient}
              >
                <View style={[styles.moduleIconBg, { backgroundColor: mod.color + '22' }]}>
                  <Text style={styles.moduleIcon}>{mod.icon}</Text>
                </View>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                <Text style={styles.moduleSub}>{mod.sub}</Text>
                <Text style={[styles.moduleRevenue, { color: mod.color }]}>{mod.revenue}</Text>
                <View style={[styles.moduleAccentBar, { backgroundColor: mod.color }]} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alertas */}
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Alertas Pendientes</Text>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: '#FF4444' }]} />
            <Text style={styles.alertText}>1 empresa con pago vencido: Clínica San Carlos</Text>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.alertText}>2 taxistas con documentación próxima a vencer</Text>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.alertText}>2 empresas con pago pendiente este mes</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },

  // Hero
  hero: {
    padding: 20,
    paddingTop: 24,
    marginBottom: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11, color: '#8888AA', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  heroValue: {
    fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginTop: 4,
  },
  heroTrend: { marginTop: 4 },
  heroTrendText: { fontSize: 13, fontWeight: '600' },
  heroBadge: {
    backgroundColor: '#00D4FF22', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#00D4FF44',
  },
  heroBadgeText: { color: '#00D4FF', fontSize: 12, fontWeight: '700' },
  heroBreakdown: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12,
  },
  heroBreakdownItem: { alignItems: 'center', gap: 4 },
  heroBreakdownDot: { width: 8, height: 8, borderRadius: 4 },
  heroBreakdownLabel: { fontSize: 10, color: '#8888AA', fontWeight: '500' },
  heroBreakdownVal: { fontSize: 13, fontWeight: '800' },

  // Sección
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#FFFFFF',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 8,
  },

  // Métricas
  metricsRow: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 4 },

  // Gráfico
  chartCard: {
    marginHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: '#2A2A4A',
    overflow: 'hidden',
  },

  // Top fuentes tabla
  // (usa el componente, solo márgenes)

  // Módulos
  modulesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 0,
  },
  moduleCard: {
    width: '47%',
    margin: '1.5%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  moduleGradient: {
    padding: 16,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  moduleIconBg: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  moduleIcon: { fontSize: 22 },
  moduleLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  moduleSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  moduleRevenue: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  moduleAccentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },

  // Alertas
  alertCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#1A0A00', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#FF440044',
  },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#FFD700', marginBottom: 12 },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { fontSize: 13, color: '#CCCCAA', flex: 1, lineHeight: 18 },
});
