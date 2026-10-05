import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { InformeModal, InformeData } from '../../src/components/monetizacion/InformeModal';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { BarChart, BarChartDataPoint } from '../../src/components/monetizacion/BarChart';
import { usePerfilNegocio } from '../../src/hooks/useMonetizacion';
import type { PerfilFinancieroNegocio } from '../../src/types/monetizacion';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface PerfilNegocio {
  id: string;
  razonSocial: string;
  nif: string;
  responsable: string;
  sector: string;
  mesesOperacion: number;
  facturacionMensual: number[];  // últimos 6 meses
  numTransacciones: number;
  scoreFinanciero: number;
  serviciosActivos: string[];
  tendencia: number; // % cambio último mes
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

function scoreColor(s: number) {
  if (s >= 70) return '#00FF88';
  if (s >= 40) return '#FFD700';
  return '#FF4444';
}

const MESES = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];

const PERFILES_DEMO: PerfilNegocio[] = [
  {
    id: '1', razonSocial: 'Telecomunicaciones GETESA', nif: 'GQ-001-2019',
    responsable: 'Pedro Abeso', sector: '📡 Telecomunicaciones',
    mesesOperacion: 18, facturacionMensual: [7800000, 8100000, 8500000, 8900000, 9200000, 9500000],
    numTransacciones: 2840, scoreFinanciero: 96, serviciosActivos: ['App Pagos', 'Plataforma Digital', 'Recargas'],
    tendencia: 3.3,
  },
  {
    id: '2', razonSocial: 'Supermercados BM Malabo', nif: 'GQ-002-2021',
    responsable: 'Carlos Ngema', sector: '🛒 Supermercado',
    mesesOperacion: 14, facturacionMensual: [3800000, 4100000, 4200000, 4500000, 4700000, 4800000],
    numTransacciones: 1240, scoreFinanciero: 82, serviciosActivos: ['Pagos App', 'Delivery'],
    tendencia: 2.1,
  },
  {
    id: '3', razonSocial: 'Hotel Paraíso Bioko', nif: 'GQ-003-2022',
    responsable: 'Ana Nze', sector: '🏨 Hostelería',
    mesesOperacion: 12, facturacionMensual: [2200000, 2400000, 2800000, 2900000, 3100000, 3200000],
    numTransacciones: 456, scoreFinanciero: 78, serviciosActivos: ['Reservas App', 'Pagos'],
    tendencia: 3.2,
  },
  {
    id: '4', razonSocial: 'Farmacia Central GE', nif: 'GQ-004-2021',
    responsable: 'María Esono', sector: '💊 Farmacia',
    mesesOperacion: 15, facturacionMensual: [900000, 950000, 1000000, 1050000, 1100000, 1200000],
    numTransacciones: 890, scoreFinanciero: 71, serviciosActivos: ['Pedidos App'],
    tendencia: 9.1,
  },
  {
    id: '5', razonSocial: 'Restaurante El Patio', nif: 'GQ-005-2023',
    responsable: 'José Mba', sector: '🍽️ Restauración',
    mesesOperacion: 6, facturacionMensual: [450000, 490000, 520000, 580000, 640000, 680000],
    numTransacciones: 320, scoreFinanciero: 55, serviciosActivos: ['Pedidos App'],
    tendencia: 6.3,
  },
  {
    id: '6', razonSocial: 'Clínica San Carlos GE', nif: 'GQ-006-2020',
    responsable: 'Dr. Nguema', sector: '🏥 Salud',
    mesesOperacion: 9, facturacionMensual: [0, 0, 0, 0, 0, 0],
    numTransacciones: 0, scoreFinanciero: 22, serviciosActivos: [],
    tendencia: 0,
  },
];

const totalNegocios = PERFILES_DEMO.length;
const scorePromedio = Math.round(PERFILES_DEMO.reduce((s, p) => s + p.scoreFinanciero, 0) / totalNegocios);
const facturacionTotal = PERFILES_DEMO.reduce(
  (s, p) => s + p.facturacionMensual[p.facturacionMensual.length - 1], 0
);

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function PerfilNegocioScreen() {
  const [search, setSearch] = useState('');
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilNegocio | null>(null);
  const [informeVisible, setInformeVisible] = useState(false);
  const [informeData, setInformeData] = useState<InformeData | null>(null);
  const [filtroScore, setFiltroScore] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');
  const [facturacionCache, setFacturacionCache] = useState<{ [id: string]: number[] }>({});

  const { perfiles, loading, error, refresh, fetchHistorial, fetchFacturacionMensual } = usePerfilNegocio();

  // Mapear datos del hook a la interfaz local PerfilNegocio
  const perfilesMapeados: PerfilNegocio[] = perfiles.map(p => ({
    id: p.empresa_id,
    razonSocial: p.empresa?.nombre ?? p.razon_social ?? 'Sin nombre',
    nif: p.nif ?? '',
    responsable: p.empresa?.responsable ?? '',
    sector: p.sector ?? '',
    mesesOperacion: p.meses_operacion ?? 0,
    facturacionMensual: facturacionCache[p.empresa_id] ?? [0, 0, 0, 0, 0, p.facturacion_mensual_promedio ?? 0],
    numTransacciones: p.num_transacciones_total ?? 0,
    scoreFinanciero: p.score_financiero ?? 0,
    serviciosActivos: p.servicios_activos ?? [],
    tendencia: 0,
  }));

  const fuente: PerfilNegocio[] = perfilesMapeados.length > 0 ? perfilesMapeados : PERFILES_DEMO;

  const totalNegocios = fuente.length;
  const scorePromedioVal = totalNegocios > 0
    ? Math.round(fuente.reduce((s, p) => s + p.scoreFinanciero, 0) / totalNegocios)
    : 0;
  const facturacionTotalVal = fuente.reduce(
    (s, p) => s + (p.facturacionMensual[p.facturacionMensual.length - 1] ?? 0), 0,
  );

  const handleOpenPerfil = async (perfil: PerfilNegocio) => {
    const isExpanded = selectedPerfil?.id === perfil.id;
    setSelectedPerfil(isExpanded ? null : perfil);
    if (!isExpanded && !facturacionCache[perfil.id]) {
      try {
        const fact = await fetchFacturacionMensual(perfil.id);
        setFacturacionCache(prev => ({ ...prev, [perfil.id]: fact }));
        setSelectedPerfil(prev => prev ? { ...prev, facturacionMensual: fact } : null);
      } catch { /* usar datos actuales */ }
    }
  };
    .filter(p => p.razonSocial.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filtroScore === 'alto') return p.scoreFinanciero >= 70;
      if (filtroScore === 'medio') return p.scoreFinanciero >= 40 && p.scoreFinanciero < 70;
      if (filtroScore === 'bajo') return p.scoreFinanciero < 40;
      return true;
    });

  const handleGenerarInforme = (perfil: PerfilNegocio) => {
    const facturacionPromedio = perfil.facturacionMensual.filter(v => v > 0).length > 0
      ? perfil.facturacionMensual.reduce((a, b) => a + b, 0) / Math.max(perfil.facturacionMensual.filter(v => v > 0).length, 1)
      : 0;
    const facturacionTotalAcum = perfil.facturacionMensual.reduce((a, b) => a + b, 0);

    setInformeData({
      tipo: 'negocio',
      nombre: perfil.razonSocial,
      razonSocial: perfil.razonSocial,
      nif: perfil.nif,
      sector: perfil.sector.replace(/\p{Emoji}/gu, '').trim(),
      periodo: `Últimos ${perfil.mesesOperacion} meses`,
      scoreFinanciero: perfil.scoreFinanciero,
      numTransacciones: perfil.numTransacciones,
      facturacionMensualPromedio: Math.round(facturacionPromedio),
      facturacionTotal: facturacionTotalAcum,
      mesesOperacion: perfil.mesesOperacion,
      serviciosActivos: perfil.serviciosActivos,
      observaciones: perfil.scoreFinanciero >= 70
        ? 'Negocio con facturación estable y creciente. Historial sólido en plataforma EGChat. Recomendado para líneas de crédito empresarial.'
        : perfil.scoreFinanciero >= 40
        ? 'Negocio en crecimiento con historial moderado. Evaluar condiciones según volumen solicitado.'
        : 'Negocio con actividad insuficiente en la plataforma. Se recomienda mayor historial antes de aprobar crédito.',
    });
    setInformeVisible(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#FF4488" />
        }
      >
        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard label="Negocios" value={`${totalNegocios}`} icon="🏪" accentColor="#FF4488" subValue="Registrados" />
          <MetricCard label="Score Promedio" value={`${scorePromedio}/100`} icon="📊" accentColor={scoreColor(scorePromedio)} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Facturación Mes" value={fmt(facturacionTotal)} icon="💰" accentColor="#FF4488" fullWidth />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar negocio..."
            placeholderTextColor="#555577"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <View style={styles.filterRow}>
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'alto', label: '🟢 Alto (70+)' },
            { key: 'medio', label: '🟡 Medio' },
            { key: 'bajo', label: '🔴 Bajo' },
          ] as const).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filtroScore === f.key && styles.filterBtnActive]}
              onPress={() => setFiltroScore(f.key)}
            >
              <Text style={[styles.filterBtnText, filtroScore === f.key && styles.filterBtnTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista perfiles negocio */}
        {perfilesFiltrados.map(perfil => {
          const sc = perfil.scoreFinanciero;
          const sc_color = scoreColor(sc);
          const facturacionActual = perfil.facturacionMensual[perfil.facturacionMensual.length - 1];
          const isExpanded = selectedPerfil?.id === perfil.id;

          const chartData: BarChartDataPoint[] = MESES.map((m, i) => ({
            label: m,
            value: perfil.facturacionMensual[i],
          }));

          return (
            <TouchableOpacity
              key={perfil.id}
              style={styles.card}
              onPress={() => setSelectedPerfil(isExpanded ? null : perfil)}
              activeOpacity={0.85}
            >
              {/* Cabecera */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: sc_color + '22' }]}>
                  <Text style={[styles.avatarScore, { color: sc_color }]}>{sc}</Text>
                  <Text style={styles.avatarLabel}>score</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNombre} numberOfLines={1}>{perfil.razonSocial}</Text>
                  <Text style={styles.cardSub}>{perfil.sector}</Text>
                  <Text style={styles.cardSub}>👤 {perfil.responsable} · NIF: {perfil.nif}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#FF4488' }]}>{fmt(facturacionActual)}</Text>
                  <Text style={styles.statLabel}>Facturación mes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{perfil.numTransacciones}</Text>
                  <Text style={styles.statLabel}>Transacciones</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{perfil.mesesOperacion}m</Text>
                  <Text style={styles.statLabel}>Operando</Text>
                </View>
              </View>

              {/* Score bar */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${sc}%`, backgroundColor: sc_color }]} />
                </View>
                <Text style={[styles.scoreLabel, { color: sc_color }]}>
                  {sc >= 70 ? '✓ Apto crédito' : sc >= 40 ? '⚠ Evaluar' : '✗ Insuficiente'}
                </Text>
              </View>

              {/* Tendencia */}
              {perfil.tendencia !== 0 && (
                <Text style={[styles.tendencia, { color: perfil.tendencia > 0 ? '#00FF88' : '#FF4444' }]}>
                  {perfil.tendencia > 0 ? '↑' : '↓'} {Math.abs(perfil.tendencia)}% vs mes anterior
                </Text>
              )}

              {/* Expandido */}
              {isExpanded && (
                <View style={styles.expanded}>
                  {/* Gráfico facturación */}
                  <Text style={styles.expandedTitle}>📈 Facturación 6 Meses</Text>
                  <View style={styles.expandedChart}>
                    <BarChart
                      data={chartData}
                      height={160}
                      barColor="#FF4488"
                      barColorSecondary="#881144"
                      formatValue={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}
                    />
                  </View>

                  {/* Detalle financiero */}
                  <Text style={[styles.expandedTitle, { marginTop: 14 }]}>📊 Datos Financieros</Text>
                  <RevenueTable
                    showBars={false}
                    rows={[
                      { label: 'NIF Fiscal', value: perfil.nif },
                      { label: 'Sector', value: perfil.sector.replace(/\p{Emoji}/gu, '').trim() },
                      { label: 'Meses en operación', value: `${perfil.mesesOperacion} meses` },
                      {
                        label: 'Facturación promedio',
                        value: fmt(Math.round(perfil.facturacionMensual.filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.max(perfil.facturacionMensual.filter(v => v > 0).length, 1))),
                        color: '#FF4488',
                      },
                      {
                        label: 'Facturación total',
                        value: fmt(perfil.facturacionMensual.reduce((a, b) => a + b, 0)),
                        color: '#00D4FF',
                      },
                      { label: 'Servicios activos', value: perfil.serviciosActivos.join(', ') || 'Ninguno' },
                    ]}
                  />

                  <TouchableOpacity
                    style={styles.informeBtn}
                    onPress={() => handleGenerarInforme(perfil)}
                  >
                    <Text style={styles.informeBtnText}>📄 Generar Informe Bancario</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {perfilesFiltrados.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron negocios</Text>
          </View>
        )}
      </ScrollView>

      <InformeModal
        visible={informeVisible}
        onClose={() => setInformeVisible(false)}
        data={informeData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  metricsRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginTop: 14, marginBottom: 8, backgroundColor: '#1A1A2E',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#2A2A4A', gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  searchClear: { color: '#666688', fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A4A' },
  filterBtnActive: { backgroundColor: '#FF448822', borderColor: '#FF4488' },
  filterBtnText: { fontSize: 11, color: '#8888AA', fontWeight: '600' },
  filterBtnTextActive: { color: '#FF4488' },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarScore: { fontSize: 18, fontWeight: '900' },
  avatarLabel: { fontSize: 9, color: '#8888AA', fontWeight: '600' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNombre: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  cardSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#0F0F1E', borderRadius: 10, padding: 10, marginBottom: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#8888AA', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#2A2A4A' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBarBg: { flex: 1, height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreLabel: { fontSize: 11, fontWeight: '700', minWidth: 90, textAlign: 'right' },
  tendencia: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  expanded: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 14 },
  expandedTitle: { fontSize: 13, fontWeight: '800', color: '#FF4488', marginBottom: 10 },
  expandedChart: { backgroundColor: '#0F0F1E', borderRadius: 10, padding: 12, overflow: 'hidden' },
  informeBtn: {
    marginTop: 14, backgroundColor: '#FF448822', borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FF448866',
  },
  informeBtnText: { fontSize: 13, fontWeight: '800', color: '#FF4488' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666688', fontSize: 14 },
});
