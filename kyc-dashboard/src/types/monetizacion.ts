// ══════════════════════════════════════════════════════════════════
// Tipos — Dashboard Monetización EGChat
// ══════════════════════════════════════════════════════════════════

// ── Empresas ──────────────────────────────────────────────────────
export type EstadoPago = 'pagado' | 'pendiente' | 'vencido';

export interface Empresa {
  id: string;
  nombre: string;
  responsable: string;
  email: string | null;
  telefono: string | null;
  tipo_servicio: string;
  cuota_mensual: number;
  comision_pct: number;
  total_ventas_mes: number;
  estado_pago: EstadoPago;
  activa: boolean;
  fecha_registro: string;
  created_at: string;
  updated_at: string;
}

export interface EmpresaIngreso {
  id: string;
  empresa_id: string;
  tipo: 'cuota_mensual' | 'comision_venta';
  monto: number;
  descripcion: string | null;
  mes: number;
  anio: number;
  fecha: string;
}

// ── Taxis ─────────────────────────────────────────────────────────
export type DocStatus = 'vigente' | 'proximo' | 'vencido';

export interface Taxista {
  id: string;
  user_id: string | null;
  nombre: string;
  apellido: string;
  telefono: string | null;
  num_licencia: string;
  num_matricula: string | null;
  marca_vehiculo: string | null;
  modelo_vehiculo: string | null;
  anio_vehiculo: number | null;
  color_vehiculo: string | null;
  foto_url: string | null;
  fecha_venc_carnet: string | null;
  fecha_venc_seguro: string | null;
  fecha_venc_revision_tecnica: string | null;
  fecha_venc_permiso_operacion: string | null;
  total_viajes_mes: number;
  horas_activo_mes: number;
  activo: boolean;
  verificado: boolean;
  created_at: string;
  // Campos calculados por la vista v_taxistas_documentacion
  estado_carnet?: DocStatus;
  estado_seguro?: DocStatus;
  estado_revision?: DocStatus;
  comisiones_mes_actual?: number;
}

export interface TaxistaViaje {
  id: string;
  taxista_id: string;
  user_id: string | null;
  origen: string | null;
  destino: string | null;
  distancia_km: number | null;
  duracion_min: number | null;
  monto_viaje: number;
  comision_pct: number;
  comision_monto: number;
  estado: 'completado' | 'cancelado' | 'reembolsado';
  mes: number;
  anio: number;
  fecha: string;
}

// ── Barcos ────────────────────────────────────────────────────────
export interface Barco {
  id: string;
  nombre_operador: string;
  nombre_barco: string;
  matricula: string | null;
  ruta: string;
  origen: string | null;
  destino: string | null;
  capacidad_pasajeros: number;
  precio_billete_base: number;
  horario: string | null;
  activo: boolean;
  created_at: string;
}

export interface Billete {
  id: string;
  barco_id: string;
  user_id: string | null;
  num_pasajeros: number;
  monto_total: number;
  comision_pct: number;
  comision_monto: number;
  fecha_viaje: string | null;
  estado: 'vendido' | 'cancelado' | 'usado';
  referencia: string | null;
  mes: number;
  anio: number;
  fecha: string;
}

// ── Monedero ──────────────────────────────────────────────────────
export type TipoMovimiento = 'recarga_banco' | 'retiro_banco' | 'recarga_otro';
export type EstadoMovimiento = 'completado' | 'pendiente' | 'fallido';

export interface WalletMovimiento {
  id: string;
  user_id: string;
  tipo: TipoMovimiento;
  monto: number;
  comision_pct: number;
  comision_monto: number;
  banco: string | null;
  referencia: string | null;
  estado: EstadoMovimiento;
  mes: number;
  anio: number;
  fecha: string;
}

// ── Resumen mensual ───────────────────────────────────────────────
export type CategoriaResumen = 'empresas' | 'taxis' | 'barcos' | 'wallet';

export interface ResumenMensual {
  id: string;
  categoria: CategoriaResumen;
  mes: number;
  anio: number;
  total_comisiones: number;
  total_cuotas: number;
  total_ingresos: number;
  num_transacciones: number;
  actualizado_at: string;
}

export interface ResumenMensualAgrupado {
  mes: number;
  anio: number;
  total_general: number;
  ingresos_empresas: number;
  ingresos_taxis: number;
  ingresos_barcos: number;
  ingresos_wallet: number;
}

// ── Perfiles financieros ──────────────────────────────────────────
export interface PerfilFinancieroUsuario {
  id: string;
  user_id: string;
  nombre_completo: string | null;
  score_financiero: number;
  total_movido: number;
  num_transacciones: number;
  monto_promedio_mensual: number;
  meses_activo: number;
  usa_taxi: boolean;
  usa_barcos: boolean;
  usa_servicios: boolean;
  usa_wallet: boolean;
  primera_transaccion: string | null;
  ultima_transaccion: string | null;
  ultima_actualizacion: string;
}

export interface PerfilFinancieroNegocio {
  id: string;
  empresa_id: string;
  razon_social: string;
  nif: string | null;
  sector: string | null;
  score_financiero: number;
  facturacion_mensual_promedio: number;
  facturacion_total: number;
  meses_operacion: number;
  num_transacciones_total: number;
  servicios_activos: string[];
  ultima_actualizacion: string;
  // join empresa
  empresa?: Pick<Empresa, 'nombre' | 'responsable' | 'email' | 'estado_pago'>;
}

export interface HistorialTransaccionUsuario {
  id: string;
  user_id: string;
  tipo: string;
  referencia_id: string | null;
  descripcion: string | null;
  monto: number;
  estado: string;
  mes: number;
  anio: number;
  fecha: string;
}

// ── Stats globales (calculadas en el dashboard) ───────────────────
export interface MonetizacionStats {
  total_ingresos_mes: number;
  total_ingresos_mes_anterior: number;
  ingresos_empresas: number;
  ingresos_taxis: number;
  ingresos_barcos: number;
  ingresos_wallet: number;
  empresas_activas: number;
  empresas_vencidas: number;
  taxistas_activos: number;
  taxistas_alerta_docs: number;
  barcos_activos: number;
  total_viajes_mes: number;
  total_billetes_mes: number;
  total_movimientos_wallet: number;
}
