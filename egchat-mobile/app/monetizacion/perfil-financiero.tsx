import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, RefreshControl, TextInput,
} from 'react-native';
import { InformeModal, InformeData } from '../../src/components/monetizacion/InformeModal';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface PerfilUsuario {
  id: string;
  nombre: string;
  telefono: string;
  mesesActivo: number;
  totalMovido: number;
  numTransacciones: number;
  montoPromedio: number;
  scoreFinanciero: number;
  usaTaxi: boolean;
  usaBarcos: boolean;
  usaServicios: boolean;
  usaWallet: boolean;
  ultimaTransaccion: string;
  historial: HistorialItem[];
}

interface HistorialItem {
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
  estado: 'completado' | 'pendiente' | 'cancelado';
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

function scoreColor(s: number) {
  if (s >= 70) return '#00FF88';
  if (s >= 40) return '#FFD700';
  return '#FF4444';
}

// ── Datos demo ─────────────────────────────────────────────────────────────
const PERFILES_DEMO: PerfilUsuario[] = [
  {
    id: '1', nombre: 'Inés Esono Abaga', telefono: '+240 222 555 001',
    mesesActivo: 14, totalMovido: 18500000, numTransacciones: 142,
    montoPromedio: 1321428, scoreFinanciero: 88,
    usaTaxi: true, usaBarcos: true, usaServicios: true, usaWallet: true,
    ultimaTransaccion: '2026-09-28',
    historial: [
      { tipo: '💳 Wallet', descripcion: 'Recarga desde BGFI Bank', monto: 1000000, fecha: '2026-09-28', estado: 'completado' },
      { tipo: '🚖 Taxi', descripcion: 'Viaje Malabo Centro → Aeropuerto', monto: 25000, fecha: '2026-09-27', estado: 'completado' },
      { tipo: '🛒 Servicio', descripcion: 'Compra Supermercados BM', monto: 85000, fecha: '2026-09-26', estado: 'completado' },
      { tipo: '⛵ Barco', descripcion: 'Billete Malabo → Bata', monto: 90000, fecha: '2026-09-20', estado: 'completado' },
      { tipo: '💳 Wallet', descripcion: 'Retiro a CCEI Bank', monto: 500000, fecha: '2026-09-15', estado: 'completado' },
    ],
  },
  {
    id: '2', nombre: 'Carlos Abaga Nguema', telefono: '+240 222 555 002',
    mesesActivo: 10, totalMovido: 9800000, numTransacciones: 87,
    montoPromedio: 980000, scoreFinanciero: 74,
    usaTaxi: true, usaBarcos: false, usaServicios: true, usaWallet: true,
    ultimaTransaccion: '2026-09-27',
    historial: [
      { tipo: '💳 Wallet', descripcion: 'Recarga desde Ecobank', monto: 600000, fecha: '2026-09-27', estado: 'completado' },
      { tipo: '🚖 Taxi', descripcion: 'Viaje Malabo → Luba', monto: 45000, fecha: '2026-09-25', estado: 'completado' },
      { tipo: '💊 Servicio', descripcion: 'Farmacia Central GE', monto: 32000, fecha: '2026-09-22', estado: 'completado' },
    ],
  },
  {
    id: '3', nombre: 'Elena Nzogo Ondo', telefono: '+240 222 555 003',
    mesesActivo: 7, totalMovido: 4200000, numTransacciones: 44,
    montoPromedio: 600000, scoreFinanciero: 52,
    usaTaxi: false, usaBarcos: false, usaServicios: true, usaWallet: true,
    ultimaTransaccion: '2026-09-20',
    historial: [
      { tipo: '💳 Wallet', descripcion: 'Recarga desde BGFI Bank', monto: 200000, fecha: '2026-09-20', estado: 'completado' },
      { tipo: '🛒 Servicio', descripcion: 'Restaurante El Patio', monto: 18000, fecha: '2026-09-18', estado: 'completado' },
    ],
  },
  {
    id: '4', nombre: 'Tomás Ondo Eyama', telefono: '+240 222 555 004',
    mesesActivo: 3, totalMovido: 1200000, numTransacciones: 12,
    montoPromedio: 400000, scoreFinanciero: 28,
    usaTaxi: true, usaBarcos: false, usaServicios: false, usaWallet: true,
    ultimaTransaccion: '2026-09-10',
    historial: [
      { tipo: '💳 Wallet', descripcion: 'Recarga desde Ecobank', monto: 150000, fecha: '2026-09-10', estado: 'completado' },
      { tipo: '🚖 Taxi', descripcion: 'Viaje local Malabo', monto: 15000, fecha: '2026-09-05', estado: 'completado' },
    ],
  },
  {
    id: '5', nombre: 'María Mbá Esono', telefono: '+240 222 555 005',
    mesesActivo: 18, totalMovido: 22000000, numTransacciones: 210,
    montoPromedio: 1222222, scoreFinanciero: 95,
    usaTaxi: true, usaBarcos: true, usaServicios: true, usaWallet: true,
    ultimaTransaccion: '2026-09-29',
    historial: [
      { tipo: '💳 Wallet', descripcion: 'Recarga desde BGFI Bank', monto: 2000000, fecha: '2026-09-29', estado: 'completado' },
      { tipo: '⛵ Barco', descripcion: 'Billete Bata → Malabo (x2)', monto: 180000, fecha: '2026-09-28', estado: 'completado' },
      { tipo: '🏨 Servicio', descripcion: 'Hotel Paraíso Bioko', monto: 450000, fecha: '2026-09-25', estado: 'completado' },
    ],
  },
];

const totalUsuarios = PERFILES_DEMO.length;
const scorePromedio = Math.round(PERFILES_DEMO.reduce((s, p) => s + p.scoreFinanciero, 0) / totalUsuarios);
const totalMovido = PERFILES_DEMO.reduce((s, p) => s + p.totalMovido, 0);

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function PerfilFinancieroScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilUsuario | null>(null);
  const [informeVisible, setInformeVisible] = useState(false);
  const [informeData, setInformeData] = useState<InformeData | null>(null);
  const [filtroScore, setFiltroScore] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');

  const perfilesFiltrados = PERFILES_DEMO
    .filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filtroScore === 'alto') return p.scoreFinanciero >= 70;
      if (filtroScore === 'medio') return p.scoreFinanciero >= 40 && p.scoreFinanciero < 70;
      if (filtroScore === 'bajo') return p.scoreFinanciero < 40;
      return true;
    });

  const handleGenerarInforme = (perfil: PerfilUsuario) => {
    const servicios: string[] = [];
    if (perfil.usaTaxi) servicios.push('Taxi');
    if (perfil.usaBarcos) servicios.push('Barcos');
    if (perfil.usaServicios) servicios.push('Servicios');
    if (perfil.usaWallet) servicios.push('Monedero');

    setInformeData({
      tipo: 'usuario',
      nombre: perfil.nombre,
      periodo: `Últimos ${perfil.mesesActivo} meses`,
      numTransacciones: perfil.numTransacciones,
      totalMovido: perfil.totalMovido,
      montoPromedio: perfil.montoPromedio,
      scoreFinanciero: perfil.scoreFinanciero,
      mesesActivo: perfil.mesesActivo,
      serviciosUsados: servicios,
      observaciones: perfil.scoreFinanciero >= 70
        ? 'Perfil financiero sólido con historial regular y volúmenes consistentes. Recomendado para productos de crédito.'
        : perfil.scoreFinanciero >= 40
        ? 'Perfil financiero moderado. Se recomienda evaluar condiciones específicas según el producto.'
        : 'Historial financiero en desarrollo. Se recomienda monitorear la actividad antes de aprobar crédito.',
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#00FF88" />
        }
      >
        {/* Métricas globales */}
        <View style={styles.metricsRow}>
          <MetricCard label="Usuarios" value={`${totalUsuarios}`} icon="👥" accentColor="#00FF88" subValue="Con historial" />
          <MetricCard label="Score Promedio" value={`${scorePromedio}/100`} icon="📊" accentColor={scoreColor(scorePromedio)} subValue="Promedio plataforma" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Volumen Total" value={fmt(totalMovido)} icon="💰" accentColor="#00D4FF" fullWidth />
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar usuario..."
            placeholderTextColor="#555577"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro por score */}
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

        {/* Lista perfiles */}
        {perfilesFiltrados.map(perfil => {
          const sc = perfil.scoreFinanciero;
          const sc_color = scoreColor(sc);
          const servicios = [
            perfil.usaTaxi && '🚖',
            perfil.usaBarcos && '⛵',
            perfil.usaServicios && '🛒',
            perfil.usaWallet && '💳',
          ].filter(Boolean).join(' ');

          return (
            <TouchableOpacity
              key={perfil.id}
              style={styles.card}
              onPress={() => setSelectedPerfil(selectedPerfil?.id === perfil.id ? null : perfil)}
              activeOpacity={0.85}
            >
              {/* Cabecera */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: sc_color + '22' }]}>
                  <Text style={[styles.avatarScore, { color: sc_color }]}>{sc}</Text>
                  <Text style={styles.avatarLabel}>score</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNombre}>{perfil.nombre}</Text>
                  <Text style={styles.cardSub}>📞 {perfil.telefono}</Text>
                  <Text style={styles.cardSub}>📅 {perfil.mesesActivo} meses activo · {servicios}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardTotal, { color: '#00D4FF' }]}>{fmt(perfil.totalMovido)}</Text>
                  <Text style={styles.cardTotalLabel}>total movido</Text>
                  <Text style={styles.cardTx}>{perfil.numTransacciones} tx</Text>
                </View>
              </View>

              {/* Barra score */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${sc}%`, backgroundColor: sc_color }]} />
                </View>
                <Text style={[styles.scoreLabel, { color: sc_color }]}>
                  {sc >= 70 ? 'Excelente' : sc >= 40 ? 'Moderado' : 'En desarrollo'}
                </Text>
              </View>

              {/* Detalle expandible */}
              {selectedPerfil?.id === perfil.id && (
                <View style={styles.expanded}>
                  <Text style={styles.expandedTitle}>📋 Últimas Transacciones</Text>
                  {perfil.historial.map((h, i) => (
                    <View key={i} style={styles.txRow}>
                      <Text style={styles.txTipo}>{h.tipo}</Text>
                      <View style={styles.txMiddle}>
                        <Text style={styles.txDesc} numberOfLines={1}>{h.descripcion}</Text>
                        <Text style={styles.txFecha}>{h.fecha}</Text>
                      </View>
                      <Text style={[
                        styles.txMonto,
                        { color: h.estado === 'completado' ? '#00FF88' : '#FF4444' },
                      ]}>{fmt(h.monto)}</Text>
                    </View>
                  ))}

                  <View style={styles.expandedStats}>
                    <RevenueTable
                      showBars={false}
                      rows={[
                        { label: 'Total transacciones', value: `${perfil.numTransacciones}` },
                        { label: 'Promedio mensual', value: fmt(perfil.montoPromedio) },
                        { label: 'Última actividad', value: perfil.ultimaTransaccion },
                      ]}
                    />
                  </View>

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
            <Text style={styles.emptyText}>No se encontraron perfiles</Text>
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
  filterBtnActive: { backgroundColor: '#00FF8822', borderColor: '#00FF88' },
  filterBtnText: { fontSize: 11, color: '#8888AA', fontWeight: '600' },
  filterBtnTextActive: { color: '#00FF88' },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarScore: { fontSize: 18, fontWeight: '900' },
  avatarLabel: { fontSize: 9, color: '#8888AA', fontWeight: '600' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNombre: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  cardSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 13, fontWeight: '800' },
  cardTotalLabel: { fontSize: 10, color: '#8888AA' },
  cardTx: { fontSize: 11, color: '#666688', marginTop: 2 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBarBg: { flex: 1, height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreLabel: { fontSize: 11, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  expanded: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 14 },
  expandedTitle: { fontSize: 13, fontWeight: '800', color: '#00D4FF', marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  txTipo: { fontSize: 16, width: 26 },
  txMiddle: { flex: 1, minWidth: 0 },
  txDesc: { fontSize: 12, color: '#CCCCEE' },
  txFecha: { fontSize: 10, color: '#666688', marginTop: 1 },
  txMonto: { fontSize: 12, fontWeight: '700' },
  expandedStats: { marginTop: 12 },
  informeBtn: {
    marginTop: 14, backgroundColor: '#00D4FF22', borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00D4FF66',
  },
  informeBtnText: { fontSize: 13, fontWeight: '800', color: '#00D4FF' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666688', fontSize: 14 },
});
