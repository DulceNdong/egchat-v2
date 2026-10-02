import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, StatusBar, RefreshControl,
} from 'react-native';
import { StatusBadge } from '../../src/components/monetizacion/StatusBadge';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Taxista {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  num_licencia: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  color_vehiculo: string;
  fecha_venc_carnet: string;   // YYYY-MM-DD
  fecha_venc_seguro: string;
  fecha_venc_revision: string;
  total_viajes_mes: number;
  horas_activo_mes: number;
  ingresos_viajes_mes: number; // monto bruto de viajes
  activo: boolean;
  verificado: boolean;
}

// ── Utilidades ─────────────────────────────────────────────────────────────
const hoy = new Date();

function docStatus(fechaStr: string): 'vigente' | 'proximo' | 'vencido' {
  const fecha = new Date(fechaStr);
  const diff = (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'vencido';
  if (diff < 30) return 'proximo';
  return 'vigente';
}

function docColor(status: string) {
  if (status === 'vencido') return '#FF4444';
  if (status === 'proximo') return '#FFD700';
  return '#00FF88';
}

function daysLeft(fechaStr: string) {
  const diff = Math.ceil((new Date(fechaStr).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Venció hace ${Math.abs(diff)}d`;
  if (diff === 0) return 'Vence hoy';
  return `${diff} días`;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const COMISION_PCT = 5;

// ── Datos demo ─────────────────────────────────────────────────────────────
const TAXISTAS_DEMO: Taxista[] = [
  { id: '1', nombre: 'Marcos', apellido: 'Nfono Ela', telefono: '+240 222 111 001', num_licencia: 'GQ-TX-0021', marca_vehiculo: 'Toyota', modelo_vehiculo: 'Corolla', color_vehiculo: 'Blanco', fecha_venc_carnet: '2027-03-15', fecha_venc_seguro: '2026-11-20', fecha_venc_revision: '2026-10-05', total_viajes_mes: 87, horas_activo_mes: 142, ingresos_viajes_mes: 1305000, activo: true, verificado: true },
  { id: '2', nombre: 'Samuel', apellido: 'Owono Mba', telefono: '+240 222 111 002', num_licencia: 'GQ-TX-0034', marca_vehiculo: 'Hyundai', modelo_vehiculo: 'Accent', color_vehiculo: 'Rojo', fecha_venc_carnet: '2026-10-28', fecha_venc_seguro: '2027-01-10', fecha_venc_revision: '2027-02-14', total_viajes_mes: 65, horas_activo_mes: 108, ingresos_viajes_mes: 975000, activo: true, verificado: true },
  { id: '3', nombre: 'Pedro', apellido: 'Abaga Nguema', telefono: '+240 222 111 003', num_licencia: 'GQ-TX-0047', marca_vehiculo: 'Kia', modelo_vehiculo: 'Rio', color_vehiculo: 'Azul', fecha_venc_carnet: '2025-08-01', fecha_venc_seguro: '2025-07-15', fecha_venc_revision: '2026-04-20', total_viajes_mes: 43, horas_activo_mes: 76, ingresos_viajes_mes: 645000, activo: false, verificado: false },
  { id: '4', nombre: 'Luis', apellido: 'Esono Ondo', telefono: '+240 222 111 004', num_licencia: 'GQ-TX-0052', marca_vehiculo: 'Nissan', modelo_vehiculo: 'Sentra', color_vehiculo: 'Gris', fecha_venc_carnet: '2027-06-30', fecha_venc_seguro: '2026-12-01', fecha_venc_revision: '2026-10-18', total_viajes_mes: 102, horas_activo_mes: 165, ingresos_viajes_mes: 1530000, activo: true, verificado: true },
  { id: '5', nombre: 'José', apellido: 'Nve Mba', telefono: '+240 222 111 005', num_licencia: 'GQ-TX-0065', marca_vehiculo: 'Toyota', modelo_vehiculo: 'Yaris', color_vehiculo: 'Negro', fecha_venc_carnet: '2027-01-22', fecha_venc_seguro: '2026-10-30', fecha_venc_revision: '2027-03-08', total_viajes_mes: 78, horas_activo_mes: 130, ingresos_viajes_mes: 1170000, activo: true, verificado: true },
  { id: '6', nombre: 'Ana', apellido: 'Nguema Eyama', telefono: '+240 222 111 006', num_licencia: 'GQ-TX-0078', marca_vehiculo: 'Suzuki', modelo_vehiculo: 'Swift', color_vehiculo: 'Plateado', fecha_venc_carnet: '2026-11-05', fecha_venc_seguro: '2027-02-28', fecha_venc_revision: '2026-12-10', total_viajes_mes: 55, horas_activo_mes: 95, ingresos_viajes_mes: 825000, activo: true, verificado: true },
];

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function TaxisScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [detailTaxista, setDetailTaxista] = useState<Taxista | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'activo' | 'alerta'>('todos');

  const taxistasFiltrados = filtro === 'todos'
    ? TAXISTAS_DEMO
    : filtro === 'activo'
    ? TAXISTAS_DEMO.filter(t => t.activo && t.verificado)
    : TAXISTAS_DEMO.filter(t =>
        docStatus(t.fecha_venc_carnet) !== 'vigente' ||
        docStatus(t.fecha_venc_seguro) !== 'vigente' ||
        docStatus(t.fecha_venc_revision) !== 'vigente'
      );

  const totalViajes = TAXISTAS_DEMO.reduce((s, t) => s + t.total_viajes_mes, 0);
  const totalHoras = TAXISTAS_DEMO.reduce((s, t) => s + t.horas_activo_mes, 0);
  const totalIngresos = TAXISTAS_DEMO.reduce((s, t) => s + t.ingresos_viajes_mes, 0);
  const totalComisiones = totalIngresos * COMISION_PCT / 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <MetricCard label="Viajes Mes" value={`${totalViajes}`} icon="🚗" accentColor="#FFD700" trend={7.5} subValue="Total todos los taxistas" />
        <MetricCard label="Comisiones (5%)" value={fmt(totalComisiones)} icon="💰" accentColor="#00FF88" trend={7.5} />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Horas Activas" value={`${totalHoras}h`} icon="⏱️" accentColor="#FF8800" subValue="Este mes" />
        <MetricCard label="Taxistas Activos" value={`${TAXISTAS_DEMO.filter(t => t.activo).length}`} icon="🚖" accentColor="#00D4FF" subValue={`de ${TAXISTAS_DEMO.length} registrados`} />
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'activo', label: '✓ Activos' },
          { key: 'alerta', label: '⚠ Alertas' },
        ] as const).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filtro === f.key && styles.filterBtnActive]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filterBtnText, filtro === f.key && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#FFD700" />
        }
      >
        {taxistasFiltrados.map(taxista => {
          const carnetStatus = docStatus(taxista.fecha_venc_carnet);
          const seguroStatus = docStatus(taxista.fecha_venc_seguro);
          const revStatus = docStatus(taxista.fecha_venc_revision);
          const tieneAlerta = carnetStatus !== 'vigente' || seguroStatus !== 'vigente' || revStatus !== 'vigente';
          const comision = taxista.ingresos_viajes_mes * COMISION_PCT / 100;

          return (
            <TouchableOpacity
              key={taxista.id}
              style={[styles.card, tieneAlerta && styles.cardAlert]}
              onPress={() => setDetailTaxista(taxista)}
              activeOpacity={0.8}
            >
              {/* Cabecera */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: taxista.activo ? '#FFD70022' : '#66668822' }]}>
                  <Text style={styles.avatarText}>{taxista.nombre[0]}{taxista.apellido[0]}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.cardNombre}>{taxista.nombre} {taxista.apellido}</Text>
                  <Text style={styles.cardSub}>🪪 {taxista.num_licencia} · {taxista.marca_vehiculo} {taxista.modelo_vehiculo}</Text>
                  <Text style={styles.cardSub}>📞 {taxista.telefono}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <StatusBadge status={taxista.activo ? 'activo' : 'inactivo'} size="sm" />
                  {taxista.verificado && <Text style={styles.verificado}>✓ Ver.</Text>}
                </View>
              </View>

              {/* Stats viajes */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{taxista.total_viajes_mes}</Text>
                  <Text style={styles.statLabel}>Viajes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{taxista.horas_activo_mes}h</Text>
                  <Text style={styles.statLabel}>Horas activo</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#00FF88' }]}>{fmt(comision)}</Text>
                  <Text style={styles.statLabel}>Comisión (5%)</Text>
                </View>
              </View>

              {/* Documentación */}
              <View style={styles.docRow}>
                {[
                  { label: '🪪 Carnet', status: carnetStatus, fecha: taxista.fecha_venc_carnet },
                  { label: '🛡 Seguro', status: seguroStatus, fecha: taxista.fecha_venc_seguro },
                  { label: '🔧 Revisión', status: revStatus, fecha: taxista.fecha_venc_revision },
                ].map(doc => (
                  <View key={doc.label} style={[styles.docItem, { borderColor: docColor(doc.status) + '44' }]}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    <Text style={[styles.docStatus, { color: docColor(doc.status) }]}>
                      {daysLeft(doc.fecha)}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal detalle taxista */}
      <Modal visible={!!detailTaxista} animationType="slide" transparent onRequestClose={() => setDetailTaxista(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {detailTaxista && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>{detailTaxista.nombre} {detailTaxista.apellido}</Text>
                    <Text style={styles.sheetSub}>{detailTaxista.num_licencia} · {detailTaxista.marca_vehiculo} {detailTaxista.modelo_vehiculo} {detailTaxista.color_vehiculo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailTaxista(null)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailSection}>📊 Actividad del Mes</Text>
                  <RevenueTable
                    showBars={false}
                    rows={[
                      { label: 'Total viajes', value: `${detailTaxista.total_viajes_mes}` },
                      { label: 'Horas activo', value: `${detailTaxista.horas_activo_mes} horas` },
                      { label: 'Ingresos brutos viajes', value: fmt(detailTaxista.ingresos_viajes_mes) },
                      { label: 'Comisión EGChat (5%)', value: fmt(detailTaxista.ingresos_viajes_mes * COMISION_PCT / 100), color: '#00FF88' },
                      { label: 'Promedio por viaje', value: fmt(detailTaxista.ingresos_viajes_mes / Math.max(detailTaxista.total_viajes_mes, 1)) },
                    ]}
                  />
                  <Text style={[styles.detailSection, { marginTop: 16 }]}>📋 Documentación</Text>
                  <RevenueTable
                    showBars={false}
                    rows={[
                      { label: '🪪 Carnet conducir', value: `${detailTaxista.fecha_venc_carnet} (${daysLeft(detailTaxista.fecha_venc_carnet)})`, color: docColor(docStatus(detailTaxista.fecha_venc_carnet)) },
                      { label: '🛡 Seguro vehículo', value: `${detailTaxista.fecha_venc_seguro} (${daysLeft(detailTaxista.fecha_venc_seguro)})`, color: docColor(docStatus(detailTaxista.fecha_venc_seguro)) },
                      { label: '🔧 Revisión técnica', value: `${detailTaxista.fecha_venc_revision} (${daysLeft(detailTaxista.fecha_venc_revision)})`, color: docColor(docStatus(detailTaxista.fecha_venc_revision)) },
                    ]}
                  />
                </ScrollView>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setDetailTaxista(null)}>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginVertical: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A4A' },
  filterBtnActive: { backgroundColor: '#FFD70022', borderColor: '#FFD700' },
  filterBtnText: { fontSize: 12, color: '#8888AA', fontWeight: '600' },
  filterBtnTextActive: { color: '#FFD700' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  cardAlert: { borderColor: '#FF444455' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FFD700' },
  cardHeaderInfo: { flex: 1, minWidth: 0 },
  cardNombre: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  cardSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  verificado: { fontSize: 10, color: '#00D4FF', fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: '#0F0F1E', borderRadius: 10, padding: 10, marginBottom: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: '#FFD700' },
  statLabel: { fontSize: 10, color: '#8888AA', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2A2A4A', marginHorizontal: 4 },
  docRow: { flexDirection: 'row', gap: 6 },
  docItem: { flex: 1, backgroundColor: '#0F0F1E', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1 },
  docLabel: { fontSize: 10, color: '#8888AA', marginBottom: 3 },
  docStatus: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F0F1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderColor: '#2A2A4A' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  sheetSub: { fontSize: 12, color: '#8888AA', marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  detailSection: { fontSize: 13, fontWeight: '800', color: '#FFD700', marginBottom: 8, marginTop: 4 },
  sheetActions: { marginTop: 16 },
  btnSecondary: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  btnSecondaryText: { fontSize: 14, color: '#8888AA', fontWeight: '600' },
});
