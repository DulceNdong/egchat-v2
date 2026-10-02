import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge } from '../../src/components/monetizacion/StatusBadge';
import { MetricCard } from '../../src/components/monetizacion/MetricCard';
import { RevenueTable } from '../../src/components/monetizacion/RevenueTable';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Empresa {
  id: string;
  nombre: string;
  responsable: string;
  email: string;
  tipo: string;
  cuota_mensual: number;
  comision_pct: number;
  ventas_mes: number;
  estado_pago: 'pagado' | 'pendiente' | 'vencido';
  activa: boolean;
}

// ── Datos demo ─────────────────────────────────────────────────────────────
const EMPRESAS_DEMO: Empresa[] = [
  { id: '1', nombre: 'Supermercados BM Malabo', responsable: 'Carlos Ngema', email: 'c.ngema@bm.gq', tipo: '🛒 Supermercado', cuota_mensual: 150000, comision_pct: 1.5, ventas_mes: 4800000, estado_pago: 'pagado', activa: true },
  { id: '2', nombre: 'Farmacia Central GE', responsable: 'María Esono', email: 'm.esono@farmacia.gq', tipo: '💊 Farmacia', cuota_mensual: 80000, comision_pct: 1.5, ventas_mes: 1200000, estado_pago: 'pagado', activa: true },
  { id: '3', nombre: 'Restaurante El Patio', responsable: 'José Mba', email: 'j.mba@elpatio.gq', tipo: '🍽️ Restaurante', cuota_mensual: 60000, comision_pct: 1.5, ventas_mes: 680000, estado_pago: 'pendiente', activa: true },
  { id: '4', nombre: 'Hotel Paraíso Bioko', responsable: 'Ana Nze', email: 'a.nze@hotel.gq', tipo: '🏨 Hotel', cuota_mensual: 200000, comision_pct: 1.5, ventas_mes: 3200000, estado_pago: 'pagado', activa: true },
  { id: '5', nombre: 'Telecomunicaciones GETESA', responsable: 'Pedro Abeso', email: 'p.abeso@getesa.gq', tipo: '📡 Telecom', cuota_mensual: 500000, comision_pct: 1.5, ventas_mes: 9500000, estado_pago: 'pagado', activa: true },
  { id: '6', nombre: 'Clínica San Carlos', responsable: 'Dr. Nguema', email: 'dr.nguema@clinica.gq', tipo: '🏥 Salud', cuota_mensual: 120000, comision_pct: 1.5, ventas_mes: 0, estado_pago: 'vencido', activa: true },
  { id: '7', nombre: 'Agencia Viajes Bioko', responsable: 'Rosa Eyama', email: 'r.eyama@bioko.gq', tipo: '✈️ Viajes', cuota_mensual: 90000, comision_pct: 1.5, ventas_mes: 520000, estado_pago: 'pendiente', activa: true },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const totalCuotas = EMPRESAS_DEMO.reduce((s, e) => s + e.cuota_mensual, 0);
const totalComisiones = EMPRESAS_DEMO.reduce((s, e) => s + (e.ventas_mes * e.comision_pct / 100), 0);
const totalIngresos = totalCuotas + totalComisiones;

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function EmpresasScreen() {
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_DEMO);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailEmpresa, setDetailEmpresa] = useState<Empresa | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'pagado' | 'pendiente' | 'vencido'>('todas');

  // Form nueva empresa
  const [form, setForm] = useState({
    nombre: '', responsable: '', email: '', tipo: 'General',
    cuota_mensual: '50000', comision_pct: '1.5',
  });

  const empresasFiltradas = filtro === 'todas'
    ? empresas
    : empresas.filter(e => e.estado_pago === filtro);

  const handleAdd = () => {
    if (!form.nombre || !form.responsable) {
      Alert.alert('Error', 'Nombre y responsable son obligatorios');
      return;
    }
    const nueva: Empresa = {
      id: Date.now().toString(),
      nombre: form.nombre,
      responsable: form.responsable,
      email: form.email,
      tipo: form.tipo,
      cuota_mensual: parseFloat(form.cuota_mensual) || 50000,
      comision_pct: parseFloat(form.comision_pct) || 1.5,
      ventas_mes: 0,
      estado_pago: 'pendiente',
      activa: true,
    };
    setEmpresas(prev => [nueva, ...prev]);
    setModalVisible(false);
    setForm({ nombre: '', responsable: '', email: '', tipo: 'General', cuota_mensual: '50000', comision_pct: '1.5' });
  };

  const handleToggleEstado = (id: string) => {
    setEmpresas(prev => prev.map(e =>
      e.id === id
        ? { ...e, estado_pago: e.estado_pago === 'pagado' ? 'pendiente' : 'pagado' as any }
        : e
    ));
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Resumen métricas */}
      <View style={styles.metricsBar}>
        <MetricCard label="Cuotas Mes" value={fmt(totalCuotas)} icon="📋" accentColor="#00D4FF" trend={2.1} />
        <MetricCard label="Comisiones" value={fmt(totalComisiones)} icon="💰" accentColor="#00FF88" trend={4.3} />
      </View>
      <View style={styles.totalBar}>
        <LinearGradient colors={['#0D2A1A', '#0A0A0A']} style={styles.totalGrad}>
          <Text style={styles.totalLabel}>INGRESOS TOTALES EMPRESAS</Text>
          <Text style={styles.totalValue}>{fmt(totalIngresos)}</Text>
        </LinearGradient>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {(['todas', 'pagado', 'pendiente', 'vencido'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filtro === f && styles.filterBtnActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filterBtnText, filtro === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#00D4FF" />
        }
      >
        {empresasFiltradas.map(empresa => {
          const comision = empresa.ventas_mes * empresa.comision_pct / 100;
          const ingresoTotal = empresa.cuota_mensual + comision;
          return (
            <TouchableOpacity
              key={empresa.id}
              style={styles.card}
              onPress={() => setDetailEmpresa(empresa)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTipo}>{empresa.tipo}</Text>
                  <Text style={styles.cardNombre} numberOfLines={1}>{empresa.nombre}</Text>
                  <Text style={styles.cardResponsable}>👤 {empresa.responsable}</Text>
                </View>
                <StatusBadge status={empresa.estado_pago} size="sm" />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardMetrics}>
                <View style={styles.cardMetric}>
                  <Text style={styles.cardMetricLabel}>Cuota mensual</Text>
                  <Text style={styles.cardMetricValue}>{fmt(empresa.cuota_mensual)}</Text>
                </View>
                <View style={styles.cardMetric}>
                  <Text style={styles.cardMetricLabel}>Comisión ({empresa.comision_pct}%)</Text>
                  <Text style={[styles.cardMetricValue, { color: '#00FF88' }]}>{fmt(comision)}</Text>
                </View>
                <View style={styles.cardMetric}>
                  <Text style={styles.cardMetricLabel}>Total mes</Text>
                  <Text style={[styles.cardMetricValue, { color: '#00D4FF', fontSize: 15 }]}>{fmt(ingresoTotal)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardEmail}>✉ {empresa.email}</Text>
                <TouchableOpacity
                  style={[
                    styles.pagoBtn,
                    { backgroundColor: empresa.estado_pago === 'pagado' ? '#00FF8820' : '#FFD70020' },
                  ]}
                  onPress={() => handleToggleEstado(empresa.id)}
                >
                  <Text style={[
                    styles.pagoBtnText,
                    { color: empresa.estado_pago === 'pagado' ? '#00FF88' : '#FFD700' },
                  ]}>
                    {empresa.estado_pago === 'pagado' ? '✓ Pagado' : 'Marcar pagado'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Botón agregar */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#00D4FF', '#0088AA']} style={styles.fabGrad}>
          <Text style={styles.fabText}>+ Empresa</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal agregar empresa */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>🏢 Nueva Empresa</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {[
                { key: 'nombre', label: 'Nombre de la empresa *', placeholder: 'Ej: Supermercado Bioko' },
                { key: 'responsable', label: 'Responsable / Contacto *', placeholder: 'Nombre y apellido' },
                { key: 'email', label: 'Email', placeholder: 'correo@empresa.gq' },
                { key: 'tipo', label: 'Tipo de servicio', placeholder: 'Ej: Supermercado, Farmacia...' },
                { key: 'cuota_mensual', label: 'Cuota mensual (XAF)', placeholder: '50000', keyboardType: 'numeric' },
                { key: 'comision_pct', label: 'Comisión por ventas (%)', placeholder: '1.5', keyboardType: 'decimal-pad' },
              ].map(field => (
                <View key={field.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor="#555577"
                    keyboardType={(field as any).keyboardType || 'default'}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAdd}>
                <Text style={styles.btnPrimaryText}>Registrar Empresa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal detalle empresa */}
      <Modal visible={!!detailEmpresa} animationType="slide" transparent onRequestClose={() => setDetailEmpresa(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {detailEmpresa && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{detailEmpresa.nombre}</Text>
                  <TouchableOpacity onPress={() => setDetailEmpresa(null)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 420 }}>
                  <RevenueTable
                    rows={[
                      { label: 'Responsable', value: detailEmpresa.responsable },
                      { label: 'Email', value: detailEmpresa.email },
                      { label: 'Tipo', value: detailEmpresa.tipo },
                      { label: 'Cuota mensual', value: fmt(detailEmpresa.cuota_mensual), color: '#00D4FF' },
                      { label: 'Ventas del mes', value: fmt(detailEmpresa.ventas_mes) },
                      { label: `Comisión (${detailEmpresa.comision_pct}%)`, value: fmt(detailEmpresa.ventas_mes * detailEmpresa.comision_pct / 100), color: '#00FF88' },
                      { label: 'Total ingreso mes', value: fmt(detailEmpresa.cuota_mensual + detailEmpresa.ventas_mes * detailEmpresa.comision_pct / 100), color: '#FFD700' },
                    ]}
                    showBars={false}
                  />
                </ScrollView>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setDetailEmpresa(null)}>
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
  metricsBar: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 12 },
  totalBar: { marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  totalGrad: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#00FF8833' },
  totalLabel: { fontSize: 11, color: '#00FF88', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A4A' },
  filterBtnActive: { backgroundColor: '#00D4FF22', borderColor: '#00D4FF' },
  filterBtnText: { fontSize: 12, color: '#8888AA', fontWeight: '600' },
  filterBtnTextActive: { color: '#00D4FF' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  cardTipo: { fontSize: 11, color: '#8888AA', marginBottom: 3 },
  cardNombre: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  cardResponsable: { fontSize: 12, color: '#8888AA', marginTop: 3 },
  cardDivider: { height: 1, backgroundColor: '#2A2A4A', marginVertical: 12 },
  cardMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMetric: { alignItems: 'center', flex: 1 },
  cardMetricLabel: { fontSize: 10, color: '#6666AA', textAlign: 'center', marginBottom: 3 },
  cardMetricValue: { fontSize: 13, fontWeight: '700', color: '#CCCCEE', textAlign: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cardEmail: { fontSize: 11, color: '#6666AA', flex: 1 },
  pagoBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pagoBtnText: { fontSize: 11, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, right: 20, borderRadius: 30, overflow: 'hidden', elevation: 8, shadowColor: '#00D4FF', shadowOpacity: 0.4, shadowRadius: 12 },
  fabGrad: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 30 },
  fabText: { fontSize: 14, fontWeight: '800', color: '#000000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F0F1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderColor: '#2A2A4A' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 12, color: '#8888AA', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, color: '#FFFFFF', fontSize: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  sheetActions: { gap: 10, marginTop: 16 },
  btnPrimary: { backgroundColor: '#00D4FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#000000' },
  btnSecondary: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  btnSecondaryText: { fontSize: 14, color: '#8888AA', fontWeight: '600' },
});
