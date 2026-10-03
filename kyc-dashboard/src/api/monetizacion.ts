/**
 * Endpoints de monetización — acceso directo a Supabase.
 * Todas las funciones devuelven datos tipados o lanzan un Error.
 */
import { supabase } from './supabaseClient';
import type {
  Empresa, EmpresaIngreso,
  Taxista, TaxistaViaje,
  Barco, Billete,
  WalletMovimiento,
  ResumenMensual, ResumenMensualAgrupado,
  PerfilFinancieroUsuario, PerfilFinancieroNegocio,
  HistorialTransaccionUsuario,
  MonetizacionStats,
  EstadoPago,
} from '@/types/monetizacion';

// ── Helper ────────────────────────────────────────────────────────
function assertData<T>(data: T | null, error: unknown): T {
  if (error) throw new Error((error as { message?: string }).message ?? 'Supabase error');
  return data as T;
}

// ══════════════════════════════════════════════════════════════════
// RESUMEN / STATS GLOBALES
// ══════════════════════════════════════════════════════════════════
export const resumenApi = {
  /** Todos los resúmenes de los últimos N meses (todas las categorías) */
  getResumenes: async (meses = 6): Promise<ResumenMensual[]> => {
    const { data, error } = await supabase
      .from('monetizacion_resumen_mensual')
      .select('*')
      .order('anio', { ascending: false })
      .order('mes',  { ascending: false })
      .limit(meses * 4); // 4 categorías por mes
    return assertData(data, error) as ResumenMensual[];
  },

  /** Vista v_ingresos_mensuales — totales agrupados */
  getResumenAgrupado: async (): Promise<ResumenMensualAgrupado[]> => {
    const { data, error } = await supabase
      .from('v_ingresos_mensuales')
      .select('*')
      .limit(12);
    return assertData(data, error) as ResumenMensualAgrupado[];
  },

  /** Stats globales calculadas desde las tablas */
  getStats: async (): Promise<MonetizacionStats> => {
    const now = new Date();
    const mes  = now.getMonth() + 1;
    const anio = now.getFullYear();
    const mesPrev = mes === 1 ? 12 : mes - 1;
    const anioPrev = mes === 1 ? anio - 1 : anio;

    const [resumenActual, resumenAnterior, empresas, taxistas, barcos] = await Promise.all([
      supabase.from('monetizacion_resumen_mensual').select('*').eq('mes', mes).eq('anio', anio),
      supabase.from('monetizacion_resumen_mensual').select('*').eq('mes', mesPrev).eq('anio', anioPrev),
      supabase.from('monetizacion_empresas').select('id, estado_pago, activa'),
      supabase.from('monetizacion_taxistas').select('id, activo, fecha_venc_carnet, fecha_venc_seguro, fecha_venc_revision_tecnica'),
      supabase.from('monetizacion_barcos').select('id, activo'),
    ]);

    const actual   = (resumenActual.data   ?? []) as ResumenMensual[];
    const anterior = (resumenAnterior.data ?? []) as ResumenMensual[];

    const sum = (arr: ResumenMensual[], cat?: string) =>
      arr.filter(r => !cat || r.categoria === cat).reduce((s, r) => s + r.total_ingresos, 0);

    const hoy = new Date();
    const en30 = new Date(hoy); en30.setDate(hoy.getDate() + 30);

    const taxistasList = (taxistas.data ?? []) as Pick<Taxista, 'id' | 'activo' | 'fecha_venc_carnet' | 'fecha_venc_seguro' | 'fecha_venc_revision_tecnica'>[];
    const alertaDocs = taxistasList.filter(t => {
      const vence = (fecha: string | null) => {
        if (!fecha) return false;
        const d = new Date(fecha);
        return d <= en30;
      };
      return vence(t.fecha_venc_carnet) || vence(t.fecha_venc_seguro) || vence(t.fecha_venc_revision_tecnica);
    }).length;

    const empresasList = (empresas.data ?? []) as Pick<Empresa, 'id' | 'estado_pago' | 'activa'>[];

    return {
      total_ingresos_mes:         sum(actual),
      total_ingresos_mes_anterior: sum(anterior),
      ingresos_empresas:           sum(actual, 'empresas'),
      ingresos_taxis:              sum(actual, 'taxis'),
      ingresos_barcos:             sum(actual, 'barcos'),
      ingresos_wallet:             sum(actual, 'wallet'),
      empresas_activas:            empresasList.filter(e => e.activa).length,
      empresas_vencidas:           empresasList.filter(e => e.estado_pago === 'vencido').length,
      taxistas_activos:            taxistasList.filter(t => t.activo).length,
      taxistas_alerta_docs:        alertaDocs,
      barcos_activos:              ((barcos.data ?? []) as { activo: boolean }[]).filter(b => b.activo).length,
      total_viajes_mes:            actual.find(r => r.categoria === 'taxis')?.num_transacciones ?? 0,
      total_billetes_mes:          actual.find(r => r.categoria === 'barcos')?.num_transacciones ?? 0,
      total_movimientos_wallet:    actual.find(r => r.categoria === 'wallet')?.num_transacciones ?? 0,
    };
  },
};

// ══════════════════════════════════════════════════════════════════
// EMPRESAS
// ══════════════════════════════════════════════════════════════════
export const empresasApi = {
  getAll: async (): Promise<Empresa[]> => {
    const { data, error } = await supabase
      .from('monetizacion_empresas')
      .select('*')
      .order('created_at', { ascending: false });
    return assertData(data, error) as Empresa[];
  },

  getById: async (id: string): Promise<Empresa> => {
    const { data, error } = await supabase
      .from('monetizacion_empresas')
      .select('*')
      .eq('id', id)
      .single();
    return assertData(data, error) as Empresa;
  },

  create: async (empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fecha_registro'>): Promise<Empresa> => {
    const { data, error } = await supabase
      .from('monetizacion_empresas')
      .insert(empresa)
      .select()
      .single();
    return assertData(data, error) as Empresa;
  },

  update: async (id: string, updates: Partial<Empresa>): Promise<Empresa> => {
    const { data, error } = await supabase
      .from('monetizacion_empresas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return assertData(data, error) as Empresa;
  },

  marcarPago: async (id: string, estado: EstadoPago): Promise<void> => {
    const { error } = await supabase
      .from('monetizacion_empresas')
      .update({ estado_pago: estado, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  getIngresos: async (empresaId: string): Promise<EmpresaIngreso[]> => {
    const { data, error } = await supabase
      .from('monetizacion_empresa_ingresos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .limit(12);
    return assertData(data, error) as EmpresaIngreso[];
  },
};

// ══════════════════════════════════════════════════════════════════
// TAXIS
// ══════════════════════════════════════════════════════════════════
export const taxistasApi = {
  getAll: async (): Promise<Taxista[]> => {
    const { data, error } = await supabase
      .from('v_taxistas_documentacion')
      .select('*')
      .order('created_at', { ascending: false });
    return assertData(data, error) as Taxista[];
  },

  getById: async (id: string): Promise<Taxista> => {
    const { data, error } = await supabase
      .from('v_taxistas_documentacion')
      .select('*')
      .eq('id', id)
      .single();
    return assertData(data, error) as Taxista;
  },

  create: async (taxista: Omit<Taxista, 'id' | 'created_at' | 'updated_at' | 'estado_carnet' | 'estado_seguro' | 'estado_revision' | 'comisiones_mes_actual'>): Promise<Taxista> => {
    const { data, error } = await supabase
      .from('monetizacion_taxistas')
      .insert(taxista)
      .select()
      .single();
    return assertData(data, error) as Taxista;
  },

  update: async (id: string, updates: Partial<Taxista>): Promise<void> => {
    const { error } = await supabase
      .from('monetizacion_taxistas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  getViajes: async (taxistaId: string, mes?: number, anio?: number): Promise<TaxistaViaje[]> => {
    let q = supabase
      .from('monetizacion_taxista_viajes')
      .select('*')
      .eq('taxista_id', taxistaId)
      .order('fecha', { ascending: false })
      .limit(50);
    if (mes)  q = q.eq('mes', mes);
    if (anio) q = q.eq('anio', anio);
    const { data, error } = await q;
    return assertData(data, error) as TaxistaViaje[];
  },

  getComisionesTotal: async (mes: number, anio: number): Promise<number> => {
    const { data, error } = await supabase
      .from('monetizacion_taxista_viajes')
      .select('comision_monto')
      .eq('mes', mes)
      .eq('anio', anio)
      .eq('estado', 'completado');
    if (error) throw new Error(error.message);
    return (data as { comision_monto: number }[]).reduce((s, v) => s + v.comision_monto, 0);
  },
};

// ══════════════════════════════════════════════════════════════════
// BARCOS
// ══════════════════════════════════════════════════════════════════
export const barcosApi = {
  getAll: async (): Promise<Barco[]> => {
    const { data, error } = await supabase
      .from('monetizacion_barcos')
      .select('*')
      .order('created_at', { ascending: false });
    return assertData(data, error) as Barco[];
  },

  getBilletes: async (barcoId?: string, mes?: number, anio?: number): Promise<Billete[]> => {
    let q = supabase
      .from('monetizacion_billetes')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100);
    if (barcoId) q = q.eq('barco_id', barcoId);
    if (mes)     q = q.eq('mes', mes);
    if (anio)    q = q.eq('anio', anio);
    const { data, error } = await q;
    return assertData(data, error) as Billete[];
  },

  create: async (barco: Omit<Barco, 'id' | 'created_at' | 'updated_at'>): Promise<Barco> => {
    const { data, error } = await supabase
      .from('monetizacion_barcos')
      .insert(barco)
      .select()
      .single();
    return assertData(data, error) as Barco;
  },

  update: async (id: string, updates: Partial<Barco>): Promise<void> => {
    const { error } = await supabase
      .from('monetizacion_barcos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ══════════════════════════════════════════════════════════════════
// MONEDERO
// ══════════════════════════════════════════════════════════════════
export const monederoApi = {
  getMovimientos: async (params?: {
    mes?: number; anio?: number;
    tipo?: string; estado?: string;
    limit?: number;
  }): Promise<WalletMovimiento[]> => {
    let q = supabase
      .from('monetizacion_wallet_movimientos')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(params?.limit ?? 100);
    if (params?.mes)    q = q.eq('mes', params.mes);
    if (params?.anio)   q = q.eq('anio', params.anio);
    if (params?.tipo)   q = q.eq('tipo', params.tipo);
    if (params?.estado) q = q.eq('estado', params.estado);
    const { data, error } = await q;
    return assertData(data, error) as WalletMovimiento[];
  },

  getTopUsuarios: async (mes: number, anio: number, limit = 10) => {
    const { data, error } = await supabase
      .from('monetizacion_wallet_movimientos')
      .select('user_id, monto, comision_monto')
      .eq('mes', mes)
      .eq('anio', anio)
      .eq('estado', 'completado');
    if (error) throw new Error(error.message);
    // Agrupar por user_id en cliente
    const map = new Map<string, { total: number; comision: number; count: number }>();
    for (const row of (data as { user_id: string; monto: number; comision_monto: number }[])) {
      const prev = map.get(row.user_id) ?? { total: 0, comision: 0, count: 0 };
      map.set(row.user_id, {
        total:    prev.total    + row.monto,
        comision: prev.comision + row.comision_monto,
        count:    prev.count    + 1,
      });
    }
    return Array.from(map.entries())
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },
};

// ══════════════════════════════════════════════════════════════════
// PERFILES FINANCIEROS
// ══════════════════════════════════════════════════════════════════
export const perfilesApi = {
  getUsuarios: async (): Promise<PerfilFinancieroUsuario[]> => {
    const { data, error } = await supabase
      .from('perfiles_financieros_usuarios')
      .select('*')
      .order('score_financiero', { ascending: false });
    return assertData(data, error) as PerfilFinancieroUsuario[];
  },

  getHistorialUsuario: async (userId: string): Promise<HistorialTransaccionUsuario[]> => {
    const { data, error } = await supabase
      .from('historial_transacciones_usuarios')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(20);
    return assertData(data, error) as HistorialTransaccionUsuario[];
  },

  getNegocios: async (): Promise<PerfilFinancieroNegocio[]> => {
    const { data, error } = await supabase
      .from('perfiles_financieros_negocios')
      .select(`
        *,
        empresa:empresa_id (nombre, responsable, email, estado_pago)
      `)
      .order('score_financiero', { ascending: false });
    return assertData(data, error) as PerfilFinancieroNegocio[];
  },

  upsertUsuario: async (perfil: Omit<PerfilFinancieroUsuario, 'id' | 'created_at'>): Promise<void> => {
    const { error } = await supabase
      .from('perfiles_financieros_usuarios')
      .upsert({ ...perfil, ultima_actualizacion: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
  },
};
