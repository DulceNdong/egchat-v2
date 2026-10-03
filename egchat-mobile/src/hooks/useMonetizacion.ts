/**
 * useMonetizacion.ts
 * Hooks de datos para todas las pantallas de monetización.
 * Cada hook consulta Supabase y retorna { data, loading, error, refresh }.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type {
  Empresa,
  NuevaEmpresa,
  EstadoPago,
  TaxistaConIngresos,
  BarcoConStats,
  MovimientoConNombre,
  TopUsuario,
  ResumenMensualAgrupado,
  PerfilFinancieroUsuario,
  HistorialTxUsuario,
  PerfilFinancieroNegocio,
  HistorialTxNegocio,
} from '../types/monetizacion';

// ── Utilidades ─────────────────────────────────────────────────────────────

function mesActual() {
  const now = new Date();
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}

// ── 1. useResumenDashboard ─────────────────────────────────────────────────

export interface ResumenDashboard {
  historico: ResumenMensualAgrupado[];
  stats: { empresas_vencidas: number; taxistas_alerta_docs: number };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useResumenDashboard(): ResumenDashboard {
  const [historico, setHistorico] = useState<ResumenMensualAgrupado[]>([]);
  const [stats, setStats] = useState({ empresas_vencidas: 0, taxistas_alerta_docs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, empresasRes, taxistasRes] = await Promise.all([
        supabase
          .from('v_ingresos_mensuales')
          .select('*')
          .order('anio', { ascending: false })
          .order('mes', { ascending: false })
          .limit(6),
        supabase
          .from('monetizacion_empresas')
          .select('estado_pago')
          .eq('estado_pago', 'vencido'),
        supabase
          .from('v_taxistas_documentacion')
          .select('estado_carnet, estado_seguro, estado_revision'),
      ]);

      if (histRes.error) throw histRes.error;

      const hist = (histRes.data ?? []).reverse() as ResumenMensualAgrupado[];
      setHistorico(hist);

      const empresasVencidas = empresasRes.data?.length ?? 0;

      const taxistasAlerta = (taxistasRes.data ?? []).filter(
        (t: { estado_carnet?: string; estado_seguro?: string; estado_revision?: string }) =>
          t.estado_carnet !== 'vigente' ||
          t.estado_seguro !== 'vigente' ||
          t.estado_revision !== 'vigente',
      ).length;

      setStats({ empresas_vencidas: empresasVencidas, taxistas_alerta_docs: taxistasAlerta });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar resumen';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { historico, stats, loading, error, refresh: fetch };
}

// ── 2. useEmpresas ─────────────────────────────────────────────────────────

export interface EmpresasHook {
  empresas: Empresa[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  crearEmpresa: (data: NuevaEmpresa) => Promise<void>;
  marcarPago: (id: string, estado: EstadoPago) => Promise<void>;
}

export function useEmpresas(): EmpresasHook {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('monetizacion_empresas')
        .select(
          'id, nombre, responsable, email, tipo_servicio, cuota_mensual, comision_pct, total_ventas_mes, estado_pago, activa',
        )
        .order('activa', { ascending: false })
        .order('nombre', { ascending: true });

      if (err) throw err;
      setEmpresas((data ?? []) as Empresa[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar empresas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const crearEmpresa = useCallback(
    async (form: NuevaEmpresa) => {
      const { error: err } = await supabase.from('monetizacion_empresas').insert({
        nombre: form.nombre,
        responsable: form.responsable,
        email: form.email,
        tipo_servicio: form.tipo_servicio,
        cuota_mensual: form.cuota_mensual,
        comision_pct: form.comision_pct,
        total_ventas_mes: 0,
        estado_pago: 'pendiente',
        activa: true,
      });
      if (err) throw err;
      await fetch();
    },
    [fetch],
  );

  const marcarPago = useCallback(
    async (id: string, estado: EstadoPago) => {
      // Optimistic update
      setEmpresas(prev =>
        prev.map(e => (e.id === id ? { ...e, estado_pago: estado } : e)),
      );
      const { error: err } = await supabase
        .from('monetizacion_empresas')
        .update({ estado_pago: estado })
        .eq('id', id);
      if (err) {
        // Revert on error
        await fetch();
        throw err;
      }
    },
    [fetch],
  );

  return { empresas, loading, error, refresh: fetch, crearEmpresa, marcarPago };
}

// ── 3. useTaxistas ─────────────────────────────────────────────────────────

export interface TaxistasHook {
  taxistas: TaxistaConIngresos[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTaxistas(): TaxistasHook {
  const [taxistas, setTaxistas] = useState<TaxistaConIngresos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { mes, anio } = mesActual();

      const [taxRes, viajesRes] = await Promise.all([
        supabase
          .from('v_taxistas_documentacion')
          .select('*')
          .order('activo', { ascending: false })
          .order('nombre', { ascending: true }),
        supabase
          .from('monetizacion_taxista_viajes')
          .select('taxista_id, monto_viaje, comision_monto')
          .eq('mes', mes)
          .eq('anio', anio),
      ]);

      if (taxRes.error) throw taxRes.error;

      // Build ingresos map per taxista
      type ViajeRow = { taxista_id: string; monto_viaje: number; comision_monto: number };
      const ingresoMap: Record<string, number> = {};
      for (const v of (viajesRes.data ?? []) as ViajeRow[]) {
        ingresoMap[v.taxista_id] = (ingresoMap[v.taxista_id] ?? 0) + v.monto_viaje;
      }

      const enriquecidos: TaxistaConIngresos[] = (taxRes.data ?? []).map(
        (t: Record<string, unknown>) => ({
          ...(t as TaxistaConIngresos),
          ingresos_viajes_mes: ingresoMap[t.id as string] ?? 0,
          // alias used by the UI
          fecha_venc_revision: (t.fecha_venc_revision_tecnica as string | null) ?? null,
        }),
      );

      setTaxistas(enriquecidos);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar taxistas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { taxistas, loading, error, refresh: fetch };
}

// ── 4. useBarcos ───────────────────────────────────────────────────────────

export interface BarcosHook {
  barcos: BarcoConStats[];
  historico: { label: string; value: number; billetes: number }[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useBarcos(): BarcosHook {
  const [barcos, setBarcos] = useState<BarcoConStats[]>([]);
  const [historico, setHistorico] = useState<{ label: string; value: number; billetes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { mes, anio } = mesActual();

      const [barcosRes, billetesRes, histRes] = await Promise.all([
        supabase.from('monetizacion_barcos').select('*').order('activo', { ascending: false }),
        supabase
          .from('monetizacion_billetes')
          .select('barco_id, monto_total, comision_monto')
          .eq('mes', mes)
          .eq('anio', anio),
        supabase
          .from('monetizacion_resumen_mensual')
          .select('mes, anio, total_ingresos, num_transacciones')
          .eq('categoria', 'barcos')
          .order('anio', { ascending: false })
          .order('mes', { ascending: false })
          .limit(6),
      ]);

      if (barcosRes.error) throw barcosRes.error;

      // Build stats map per barco
      type BilRow = { barco_id: string; monto_total: number };
      const statsMap: Record<string, { recaudacion: number; billetes: number }> = {};
      for (const b of (billetesRes.data ?? []) as BilRow[]) {
        if (!statsMap[b.barco_id]) statsMap[b.barco_id] = { recaudacion: 0, billetes: 0 };
        statsMap[b.barco_id].recaudacion += b.monto_total;
        statsMap[b.barco_id].billetes += 1;
      }

      type BarcoRow = {
        id: string;
        capacidad_pasajeros: number;
        precio_billete_base: number;
        [key: string]: unknown;
      };

      const barcosConStats: BarcoConStats[] = (barcosRes.data ?? []).map((b: BarcoRow) => {
        const s = statsMap[b.id] ?? { recaudacion: 0, billetes: 0 };
        return {
          ...(b as unknown as BarcoConStats),
          billetes_mes: s.billetes,
          recaudacion_mes: s.recaudacion,
          // aliases for UI
          capacidad: b.capacidad_pasajeros,
          precio_base: b.precio_billete_base,
        };
      });

      setBarcos(barcosConStats);

      // Build historico (reversed = oldest first)
      const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      type HistRow = { mes: number; anio: number; total_ingresos: number; num_transacciones: number };
      const hist = ((histRes.data ?? []) as HistRow[])
        .reverse()
        .map(h => ({
          label: MONTH_NAMES[h.mes - 1] ?? `${h.mes}`,
          value: h.total_ingresos,
          billetes: h.num_transacciones,
        }));

      setHistorico(hist);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar barcos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { barcos, historico, loading, error, refresh: fetch };
}

// ── 5. useMonedero ─────────────────────────────────────────────────────────

export interface MonederoHook {
  movimientos: MovimientoConNombre[];
  topUsuarios: TopUsuario[];
  historico: { label: string; value: number }[];
  bancos: { banco: string; movimientos: number; volumen: number }[];
  totales: { movimientos: number; volumen: number; comisiones: number };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMonedero(): MonederoHook {
  const [movimientos, setMovimientos] = useState<MovimientoConNombre[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<TopUsuario[]>([]);
  const [historico, setHistorico] = useState<{ label: string; value: number }[]>([]);
  const [bancos, setBancos] = useState<{ banco: string; movimientos: number; volumen: number }[]>([]);
  const [totales, setTotales] = useState({ movimientos: 0, volumen: 0, comisiones: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { mes, anio } = mesActual();
      const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      const [movsRes, resumenRes, histRes, topRawRes] = await Promise.all([
        supabase
          .from('monetizacion_wallet_movimientos')
          .select('*')
          .eq('mes', mes)
          .eq('anio', anio)
          .order('fecha', { ascending: false })
          .limit(20),
        supabase
          .from('monetizacion_resumen_mensual')
          .select('total_ingresos, num_transacciones')
          .eq('categoria', 'wallet')
          .eq('mes', mes)
          .eq('anio', anio)
          .maybeSingle(),
        supabase
          .from('monetizacion_resumen_mensual')
          .select('mes, anio, total_ingresos')
          .eq('categoria', 'wallet')
          .order('anio', { ascending: false })
          .order('mes', { ascending: false })
          .limit(6),
        supabase
          .from('monetizacion_wallet_movimientos')
          .select('user_id, monto, comision_monto')
          .eq('mes', mes)
          .eq('anio', anio),
      ]);

      if (movsRes.error) throw movsRes.error;

      type MovRow = {
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
      };

      const rawMovs = (movsRes.data ?? []) as MovRow[];

      // Get unique user_ids to fetch profiles for names
      const userIds = [...new Set(rawMovs.map(m => m.user_id))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: perfiles } = await supabase
          .from('perfiles_financieros_usuarios')
          .select('user_id, nombre_completo')
          .in('user_id', userIds);
        for (const p of perfiles ?? []) {
          nameMap[p.user_id] = p.nombre_completo ?? p.user_id.slice(0, 8);
        }
      }

      const movsConNombre: MovimientoConNombre[] = rawMovs.map(m => ({
        ...m,
        usuario: nameMap[m.user_id] ?? m.user_id.slice(0, 8),
        comision: m.comision_monto, // alias for UI
      }));

      setMovimientos(movsConNombre);

      // Totales del mes
      type ResumenRow = { total_ingresos: number; num_transacciones: number } | null;
      const resRow = resumenRes.data as ResumenRow;
      const volumenTotal = rawMovs.reduce((s, m) => s + m.monto, 0);
      setTotales({
        movimientos: resRow?.num_transacciones ?? rawMovs.length,
        volumen: volumenTotal,
        comisiones: resRow?.total_ingresos ?? rawMovs.reduce((s, m) => s + m.comision_monto, 0),
      });

      // Historico comisiones (oldest first)
      type HistRow2 = { mes: number; anio: number; total_ingresos: number };
      const hist = ((histRes.data ?? []) as HistRow2[]).reverse().map(h => ({
        label: MONTH_NAMES[h.mes - 1] ?? `${h.mes}`,
        value: h.total_ingresos,
      }));
      setHistorico(hist);

      // Top usuarios aggregated from all movs this month
      type TopRow = { user_id: string; monto: number; comision_monto: number };
      const topAgg: Record<string, { monto: number; comision: number; count: number }> = {};
      for (const r of (topRawRes.data ?? []) as TopRow[]) {
        if (!topAgg[r.user_id]) topAgg[r.user_id] = { monto: 0, comision: 0, count: 0 };
        topAgg[r.user_id].monto += r.monto;
        topAgg[r.user_id].comision += r.comision_monto;
        topAgg[r.user_id].count += 1;
      }

      // Fetch names for top users not already in nameMap
      const topUserIds = Object.keys(topAgg).filter(id => !nameMap[id]);
      if (topUserIds.length > 0) {
        const { data: morePerfiles } = await supabase
          .from('perfiles_financieros_usuarios')
          .select('user_id, nombre_completo')
          .in('user_id', topUserIds);
        for (const p of morePerfiles ?? []) {
          nameMap[p.user_id] = p.nombre_completo ?? p.user_id.slice(0, 8);
        }
      }

      const top: TopUsuario[] = Object.entries(topAgg)
        .map(([uid, v]) => ({
          user_id: uid,
          nombre: nameMap[uid] ?? uid.slice(0, 8),
          numMovimientos: v.count,
          totalMovido: v.monto,
          comisionesTotales: v.comision,
        }))
        .sort((a, b) => b.totalMovido - a.totalMovido)
        .slice(0, 5);
      setTopUsuarios(top);

      // Bancos aggregated from raw movs this month
      const bancosMap: Record<string, { movimientos: number; volumen: number }> = {};
      for (const m of rawMovs) {
        const banco = m.banco ?? 'Desconocido';
        if (!bancosMap[banco]) bancosMap[banco] = { movimientos: 0, volumen: 0 };
        bancosMap[banco].movimientos += 1;
        bancosMap[banco].volumen += m.monto;
      }
      const bancosArr = Object.entries(bancosMap)
        .map(([banco, v]) => ({ banco, ...v }))
        .sort((a, b) => b.volumen - a.volumen);
      setBancos(bancosArr);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar monedero';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { movimientos, topUsuarios, historico, bancos, totales, loading, error, refresh: fetch };
}

// ── 6. usePerfilFinanciero ─────────────────────────────────────────────────

export type PerfilConHistorial = PerfilFinancieroUsuario & {
  historial: HistorialTxUsuario[];
};

export interface PerfilFinancieroHook {
  perfiles: PerfilConHistorial[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchHistorial: (userId: string) => Promise<HistorialTxUsuario[]>;
}

export function usePerfilFinanciero(): PerfilFinancieroHook {
  const [perfiles, setPerfiles] = useState<PerfilConHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('perfiles_financieros_usuarios')
        .select('*')
        .order('score_financiero', { ascending: false });

      if (err) throw err;
      setPerfiles((data ?? []).map((p: PerfilFinancieroUsuario) => ({ ...p, historial: [] })));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar perfiles';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const fetchHistorial = useCallback(async (userId: string): Promise<HistorialTxUsuario[]> => {
    const { data, error: err } = await supabase
      .from('historial_transacciones_usuarios')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(10);
    if (err) throw err;
    return (data ?? []) as HistorialTxUsuario[];
  }, []);

  return { perfiles, loading, error, refresh: fetch, fetchHistorial };
}

// ── 7. usePerfilNegocio ────────────────────────────────────────────────────

export type PerfilNegocioConHistorial = PerfilFinancieroNegocio & {
  historial: HistorialTxNegocio[];
  // join from monetizacion_empresas
  empresa?: { nombre: string; responsable: string; email: string; estado_pago: string } | null;
};

export interface PerfilNegocioHook {
  perfiles: PerfilNegocioConHistorial[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchHistorial: (empresaId: string) => Promise<HistorialTxNegocio[]>;
  fetchFacturacionMensual: (empresaId: string) => Promise<number[]>;
}

export function usePerfilNegocio(): PerfilNegocioHook {
  const [perfiles, setPerfiles] = useState<PerfilNegocioConHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('perfiles_financieros_negocios')
        .select(`
          *,
          empresa:empresa_id (
            nombre, responsable, email, estado_pago
          )
        `)
        .order('score_financiero', { ascending: false });

      if (err) throw err;
      setPerfiles(
        (data ?? []).map((p: Record<string, unknown>) => ({
          ...(p as PerfilNegocioConHistorial),
          historial: [],
        })),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar perfiles de negocio';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const fetchHistorial = useCallback(async (empresaId: string): Promise<HistorialTxNegocio[]> => {
    const { data, error: err } = await supabase
      .from('historial_transacciones_negocios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .limit(10);
    if (err) throw err;
    return (data ?? []) as HistorialTxNegocio[];
  }, []);

  /**
   * Returns an array of 6 monthly totals (oldest → newest) for the bar chart.
   * If no data, returns an array of 6 zeros.
   */
  const fetchFacturacionMensual = useCallback(async (empresaId: string): Promise<number[]> => {
    const { data, error: err } = await supabase
      .from('historial_transacciones_negocios')
      .select('monto, mes, anio')
      .eq('empresa_id', empresaId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })
      .limit(300);

    if (err) throw err;

    type Row = { monto: number; mes: number; anio: number };
    const rows = (data ?? []) as Row[];

    // Build per-month totals
    const monthMap: Record<string, number> = {};
    for (const r of rows) {
      const key = `${r.anio}-${r.mes}`;
      monthMap[key] = (monthMap[key] ?? 0) + r.monto;
    }

    // Last 6 months (oldest first)
    const now = new Date();
    const result: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      result.push(monthMap[key] ?? 0);
    }
    return result;
  }, []);

  return { perfiles, loading, error, refresh: fetch, fetchHistorial, fetchFacturacionMensual };
}
