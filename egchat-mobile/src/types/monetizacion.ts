// Tipos de monetización — alineados con el schema real de Supabase

export type EstadoPago = 'pagado' | 'pendiente' | 'vencido';
export type DocStatus = 'vigente' | 'proximo' | 'vencido';

// ── Tabla monetizacion_empresas ────────────────────────────────────────────
export interface Empresa {
  id: string;
  nombre: string;
  responsable: string;
  email: string | null;
  tipo_servicio: string;
  cuota_mensual: number;
  comision_pct: number;
  total_ventas_mes: number;
  estado_pago: EstadoPago;
  activa: boolean;
}

export type NuevaEmpresa = {
  nombre: string;
  responsable: string;
  email: string;
  tipo_servicio: string;
  cuota_mensual: number;
  comision_pct: number;
};

// ── Vista v_taxistas_documentacion ─────────────────────────────────────────
export interface Taxista {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  num_licencia: string;
  marca_vehiculo: string | null;
  modelo_vehiculo: string | null;
  color_vehiculo: string | null;
  fecha_venc_carnet: string | null;
  fecha_venc_seguro: string | null;
  fecha_venc_revision_tecnica: string | null;
  total_viajes_mes: number;
  horas_activo_mes: number;
  activo: boolean;
  verificado: boolean;
  estado_carnet?: DocStatus;
  estado_seguro?: DocStatus;
  estado_revision?: DocStatus;
  comisiones_mes_actual?: number;
}

// Taxista enriquecido con ingresos calculados desde viajes
export interface TaxistaConIngresos extends Taxista {
  ingresos_viajes_mes: number;
  // alias para compatibilidad con la UI
  fecha_venc_revision: string | null;
}

// ── Tabla monetizacion_taxista_viajes ──────────────────────────────────────
export interface TaxistaViaje {
  taxista_id: string;
  monto_viaje: number;
  comision_monto: number;
  mes: number;
  anio: number;
}

// ── Tabla monetizacion_barcos ──────────────────────────────────────────────
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
  activo: boolean;
}

export interface BarcoConStats extends Barco {
  billetes_mes: number;
  recaudacion_mes: number;
  // aliases para compatibilidad con la UI existente
  capacidad: number;
  precio_base: number;
}

// ── Tabla monetizacion_billetes ────────────────────────────────────────────
export interface Billete {
  barco_id: string;
  num_pasajeros: number;
  monto_total: number;
  comision_monto: number;
  mes: number;
  anio: number;
}

// ── Tabla monetizacion_wallet_movimientos ──────────────────────────────────
export interface WalletMovimiento {
  id: string;
  user_id: string;
  tipo: 'recarga_banco' | 'retiro_banco' | 'recarga_otro';
  monto: number;
  comision_monto: number;
  banco: string | null;
  estado: 'completado' | 'pendiente' | 'fallido';
  mes: number;
  anio: number;
  fecha: string;
}

export interface MovimientoConNombre extends WalletMovimiento {
  usuario: string;
  // alias para compatibilidad con la UI existente
  comision: number;
}

export interface TopUsuario {
  user_id: string;
  nombre: string;
  numMovimientos: number;
  totalMovido: number;
  comisionesTotales: number;
}

// ── Vista v_ingresos_mensuales ─────────────────────────────────────────────
export interface ResumenMensualAgrupado {
  mes: number;
  anio: number;
  total_general: number;
  ingresos_empresas: number;
  ingresos_taxis: number;
  ingresos_barcos: number;
  ingresos_wallet: number;
}

// ── Tabla monetizacion_resumen_mensual ─────────────────────────────────────
export interface ResumenMensual {
  categoria: 'empresas' | 'taxis' | 'barcos' | 'wallet';
  mes: number;
  anio: number;
  total_comisiones: number;
  total_cuotas: number;
  total_ingresos: number;
  num_transacciones: number;
}

// ── Tabla perfiles_financieros_usuarios ────────────────────────────────────
export interface PerfilFinancieroUsuario {
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
  ultima_transaccion: string | null;
}

// ── Tabla historial_transacciones_usuarios ─────────────────────────────────
export interface HistorialTxUsuario {
  id: string;
  user_id: string;
  tipo: string;
  descripcion: string | null;
  monto: number;
  estado: string;
  mes: number;
  anio: number;
  fecha: string;
}

// ── Tabla perfiles_financieros_negocios ────────────────────────────────────
export interface PerfilFinancieroNegocio {
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
}

// ── Tabla historial_transacciones_negocios ─────────────────────────────────
export interface HistorialTxNegocio {
  id: string;
  empresa_id: string;
  tipo: string;
  descripcion: string | null;
  monto: number;
  comision: number;
  estado: string;
  mes: number;
  anio: number;
  fecha: string;
}
