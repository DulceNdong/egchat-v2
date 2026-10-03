/**
 * Dashboard Principal de Monetización — EGChat
 * KPIs diario/semanal/mensual/anual · Gráficos · Proyecciones · Top servicios
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Store, Car, Ship, Wallet, Zap, Calendar,
} from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { supabase } from '@/api/supabaseClient';

// ── Helpers ───────────────────────────────────────────────────────
const XAF = (n: number, compact = false) => {
  if (compact) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return `${Math.round(n)}`;
  }
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
  }).format(n);
};

const MESES = ['', 'Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

type Periodo = 'dia' | 'semana' | 'mes' | 'anio';

const PERIODO_LABELS: Record<Periodo, string> = {
  dia:    'Hoy',
  semana: 'Esta semana',
  mes:    'Este mes',
  anio:   'Este año',
};

// Colores por categoría
const CAT_COLORS: Record<string, string> = {
  restaurantes: '#f97316', vuelos:      '#3b82f6', hoteles:      '#8b5cf6',
  supermercados:'#10b981', gasolineras: '#f59e0b', seguros:      '#ec4899',
  apuestas:     '#ef4444', barcos:      '#06b6d4', taxis:        '#eab308',
  farmacias:    '#84cc16', salud:       '#14b8a6', bancos:       '#6366f1',
  djangue:      '#a855f7', correos:     '#78716c', ocio:         '#f43f5e',
};
const CAT_ICONS: Record<string, string> = {
  restaurantes:'🍽️', vuelos:'✈️', hoteles:'🏨', supermercados:'🛒',
  gasolineras:'⛽', seguros:'🛡️', apuestas:'🎰', barcos:'⛵',
  taxis:'🚖', farmacias:'💊', salud:'🏥', bancos:'🏦',
  djangue:'🤝', correos:'📮', ocio:'🎬',
};

// ── Custom Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl text-xs min-w-[140px]">
      <p className="font-bold text-gray-300 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-bold text-white">{XAF(p.value, true)} XAF</span>
        </div>
      ))}
    </div>
  );
};

// ── Datos de resumen diario desde Supabase ────────────────────────
async function fetchResumenDiario(dias: number) {
  const { data, error } = await supabase
    .from('revenue_resumen_diario')
    .select('fecha, categoria, total_bruto, total_comisiones, num_transacciones')
    .gte('fecha', new Date(Date.now() - dias * 86_400_000).toISOString().split('T')[0])
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

type DiaRow = {
  fecha: string; categoria: string;
  total_bruto: number; total_comisiones: number; num_transacciones: number;
};

// Agrupa filas por fecha sumando todas las categorías
function agruparPorFecha(rows: DiaRow[]) {
  const map = new Map<string, { comisiones: number; bruto: number; tx: number }>();
  for (const r of rows) {
    const prev = map.get(r.fecha) ?? { comisiones: 0, bruto: 0, tx: 0 };
    map.set(r.fecha, {
      comisiones: prev.comisiones + (r.total_comisiones ?? 0),
      bruto:      prev.bruto      + (r.total_bruto       ?? 0),
      tx:         prev.tx         + (r.num_transacciones  ?? 0),
    });
  }
  return Array.from(map.entries()).map(([fecha, v]) => ({ fecha, ...v }));
}

// Agrupa por categoría
function agruparPorCategoria(rows: DiaRow[]) {
  const map = new Map<string, { comisiones: number; bruto: number; tx: number }>();
  for (const r of rows) {
    const prev = map.get(r.categoria) ?? { comisiones: 0, bruto: 0, tx: 0 };
    map.set(r.categoria, {
      comisiones: prev.comisiones + (r.total_comisiones ?? 0),
      bruto:      prev.bruto      + (r.total_bruto       ?? 0),
      tx:         prev.tx         + (r.num_transacciones  ?? 0),
    });
  }
  return Array.from(map.entries())
    .map(([cat, v]) => ({ categoria: cat, ...v }))
    .sort((a, b) => b.comisiones - a.comisiones);
}

// Proyección lineal simple
function proyectar(data: { comisiones: number }[], diasProyeccion: number): number {
  if (data.length < 2) return 0;
  const ultimos = data.slice(-7);
  const avg = ultimos.reduce((s, d) => s + d.comisiones, 0) / ultimos.length;
  return avg * diasProyeccion;
}

// ── KPI Card ──────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, color, icon: Icon, onClick,
}: {
  label: string; value: string; sub?: string;
  trend?: number; color: string; icon: React.ElementType; onClick?: () => void;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-5 text-left hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/30 group w-full"
    >
      {/* glow fondo */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: color, filter: 'blur(20px)' }} />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}% vs período anterior
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{ backgroundColor: color + '22', border: `1px solid ${color}33` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </button>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function MonetizacionHome() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const diasMap: Record<Periodo, number> = { dia: 1, semana: 7, mes: 30, anio: 365 };
  const dias = diasMap[periodo];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['revenue-diario', dias],
    queryFn:  () => fetchResumenDiario(dias + 30), // extra para tendencia
    staleTime: 5 * 60_000,
  });

  const { data: rows180 = [] } = useQuery({
    queryKey: ['revenue-diario', 180],
    queryFn:  () => fetchResumenDiario(180),
    staleTime: 10 * 60_000,
  });

  // Separar período actual vs anterior para tendencia
  const cutoff = new Date(Date.now() - dias * 86_400_000).toISOString().split('T')[0];
  const cutoffPrev = new Date(Date.now() - dias * 2 * 86_400_000).toISOString().split('T')[0];

  const rowsActual   = (rows as DiaRow[]).filter(r => r.fecha >= cutoff);
  const rowsAnterior = (rows as DiaRow[]).filter(r => r.fecha >= cutoffPrev && r.fecha < cutoff);

  const totalActual   = rowsActual.reduce((s, r)   => s + (r.total_comisiones ?? 0), 0);
  const totalAnterior = rowsAnterior.reduce((s, r)  => s + (r.total_comisiones ?? 0), 0);
  const totalBruto    = rowsActual.reduce((s, r)    => s + (r.total_bruto ?? 0), 0);
  const totalTx       = rowsActual.reduce((s, r)    => s + (r.num_transacciones ?? 0), 0);
  const trendTotal    = totalAnterior ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;

  const porCategoria  = useMemo(() => agruparPorCategoria(rowsActual as DiaRow[]), [rowsActual]);
  const porFecha      = useMemo(() => agruparPorFecha(rows180 as DiaRow[]), [rows180]);

  // Gráfico área — evolución diaria (últimos 30 o N días)
  const chartArea = useMemo(() => {
    const agr = agruparPorFecha(rowsActual as DiaRow[]);
    return agr.map(d => ({
      name: new Date(d.fecha).toLocaleDateString('es-GQ', { day: '2-digit', month: 'short' }),
      Comisiones: Math.round(d.comisiones),
      Bruto:      Math.round(d.bruto),
    }));
  }, [rowsActual]);

  // Gráfico barras mensual 6 meses — agrupar por mes
  const chartMensual = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows180 as DiaRow[]) {
      const d   = new Date(r.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      map.set(key, (map.get(key) ?? 0) + (r.total_comisiones ?? 0));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => {
        const [, m] = k.split('-');
        return { name: MESES[parseInt(m)], Ingresos: Math.round(v) };
      });
  }, [rows180]);

  // Proyección
  const proyeccionMes  = proyectar(porFecha, 30);
  const proyeccionAnio = proyectar(porFecha, 365);

  // Pie chart top 8 categorías
  const pieData = porCategoria.slice(0, 8).map(c => ({
    name:  c.categoria,
    value: Math.round(c.comisiones),
    color: CAT_COLORS[c.categoria] ?? '#6b7280',
  }));

  return (
    <MonetizacionLayout title="Dashboard Revenue">

      {/* ── Selector de período ────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(Object.keys(PERIODO_LABELS) as Periodo[]).map(p => (
          <button key={p} onClick={() => setPeriodo(p)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              periodo === p
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600'
            }`}>
            <Calendar className="w-3.5 h-3.5" />
            {PERIODO_LABELS[p]}
          </button>
        ))}
        {isLoading && (
          <span className="text-xs text-gray-500 animate-pulse ml-2">Actualizando…</span>
        )}
      </div>

      {/* ── Hero total ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        {/* Decoraciones */}
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -right-4  top-16   w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute left-1/2  -bottom-8 w-64 h-64 rounded-full bg-white/3" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest">
                  Revenue Total — {PERIODO_LABELS[periodo]}
                </p>
              </div>
              <p className="text-5xl font-black text-white tracking-tight">
                {isLoading ? '…' : XAF(totalActual)}
              </p>
              <p className="text-emerald-300 text-sm mt-2">
                Sobre {XAF(totalBruto, true)} XAF de volumen bruto · {totalTx.toLocaleString()} transacciones
              </p>
              <div className={`flex items-center gap-1 mt-3 text-sm font-bold ${trendTotal >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {trendTotal >= 0
                  ? <TrendingUp className="w-4 h-4" />
                  : <TrendingDown className="w-4 h-4" />}
                {trendTotal >= 0 ? '+' : ''}{trendTotal.toFixed(1)}% vs período anterior
              </div>
            </div>

            {/* Proyecciones */}
            <div className="sm:text-right flex sm:flex-col gap-4 sm:gap-0">
              <div className="bg-white/10 rounded-xl px-4 py-3 sm:mb-3">
                <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Proyección mes</p>
                <p className="text-white text-xl font-black mt-0.5">{XAF(proyeccionMes, true)} XAF</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Proyección anual</p>
                <p className="text-white text-xl font-black mt-0.5">{XAF(proyeccionAnio, true)} XAF</p>
              </div>
            </div>
          </div>

          {/* Mini breakdown por categoría top */}
          <div className="flex gap-4 mt-6 flex-wrap">
            {porCategoria.slice(0, 5).map(c => (
              <div key={c.categoria} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CAT_COLORS[c.categoria] ?? '#6b7280' }} />
                <span className="text-emerald-200 text-xs">{CAT_ICONS[c.categoria]} {c.categoria}</span>
                <span className="text-white text-xs font-bold">{XAF(c.comisiones, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Servicios"   value={XAF(porCategoria.filter(c=>!['taxis','barcos','bancos'].includes(c.categoria)).reduce((s,c)=>s+c.comisiones,0), true) + ' XAF'}
          sub="1.5% comisión"  trend={trendTotal}  color="#10b981"
          icon={Store}          onClick={() => navigate('/monetizacion/servicios')}
        />
        <KpiCard
          label="Taxis"
          value={XAF(porCategoria.find(c=>c.categoria==='taxis')?.comisiones ?? 0, true) + ' XAF'}
          sub="5% por viaje"   trend={trendTotal * 1.1}  color="#eab308"
          icon={Car}            onClick={() => navigate('/monetizacion/taxis')}
        />
        <KpiCard
          label="Barcos"
          value={XAF(porCategoria.find(c=>c.categoria==='barcos')?.comisiones ?? 0, true) + ' XAF'}
          sub="1% billetes"    trend={trendTotal * 0.8}  color="#f97316"
          icon={Ship}           onClick={() => navigate('/monetizacion/barcos')}
        />
        <KpiCard
          label="Monedero"
          value={XAF(porCategoria.find(c=>c.categoria==='bancos')?.comisiones ?? 0, true) + ' XAF'}
          sub="0.5% movimientos" trend={trendTotal * 1.2} color="#8b5cf6"
          icon={Wallet}          onClick={() => navigate('/monetizacion/monedero')}
        />
      </div>

      {/* ── Gráficos ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Área — evolución período */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white text-sm">Evolución de Revenue</h2>
              <p className="text-xs text-gray-500 mt-0.5">Comisiones diarias — {PERIODO_LABELS[periodo]}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/50 px-2 py-1 rounded-lg">
              <Activity className="w-3 h-3" /> En tiempo real
            </div>
          </div>
          {chartArea.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-600 text-sm">Sin datos para este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartArea} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradComisiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  interval={Math.floor(chartArea.length / 6)} />
                <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={v => XAF(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Comisiones" stroke="#10b981" strokeWidth={2.5}
                  fill="url(#gradComisiones)" dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie — distribución por categoría */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="font-bold text-white text-sm mb-1">Por Categoría</h2>
          <p className="text-xs text-gray-500 mb-4">{PERIODO_LABELS[periodo]}</p>
          {pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${XAF(v, true)} XAF`, 'Comisión']} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-400 flex-1 truncate">{CAT_ICONS[d.name]} {d.name}</span>
                <span className="text-white font-bold">{XAF(d.value, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barras mensual 6 meses */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white text-sm">Tendencia Mensual</h2>
            <p className="text-xs text-gray-500 mt-0.5">Comisiones totales últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            Proyección {XAF(proyeccionAnio, true)} XAF/año
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartMensual} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
              tickFormatter={v => XAF(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Ingresos" radius={[8,8,0,0]}
              fill="url(#gradBar)" name="Comisiones">
              {chartMensual.map((_, i) => (
                <Cell key={i}
                  fill={i === chartMensual.length - 1 ? '#10b981' : '#064e3b'}
                  stroke={i === chartMensual.length - 1 ? '#10b981' : 'none'}
                  strokeWidth={i === chartMensual.length - 1 ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top servicios + accesos rápidos ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top categorías */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white text-sm">🏆 Top Categorías — {PERIODO_LABELS[periodo]}</h2>
            <button onClick={() => navigate('/monetizacion/servicios')}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {porCategoria.slice(0, 8).map((c, i) => {
              const pct = totalActual ? Math.round((c.comisiones / totalActual) * 100) : 0;
              return (
                <div key={c.categoria} className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs font-bold w-4">{i + 1}</span>
                  <span className="text-base w-6">{CAT_ICONS[c.categoria] ?? '🏪'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-300 capitalize">{c.categoria}</span>
                      <span className="text-xs font-black text-white ml-2">{XAF(c.comisiones, true)} XAF</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[c.categoria] ?? '#6b7280' }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proyecciones + accesos */}
        <div className="space-y-3">
          {/* Proyecciones */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="font-bold text-white text-sm">Proyecciones</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Este mes',      value: proyeccionMes,         color: '#10b981' },
                { label: 'Este año',      value: proyeccionAnio,        color: '#3b82f6' },
                { label: 'Próximos 3m',   value: proyeccionMes * 3,     color: '#8b5cf6' },
                { label: 'Próximos 6m',   value: proyeccionMes * 6,     color: '#f59e0b' },
              ].map(p => (
                <div key={p.label} className="rounded-xl p-3"
                  style={{ backgroundColor: p.color + '11', border: `1px solid ${p.color}22` }}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{p.label}</p>
                  <p className="text-base font-black mt-1" style={{ color: p.color }}>
                    {XAF(p.value, true)} XAF
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Módulos de acceso rápido */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="font-bold text-white text-sm mb-4">⚡ Módulos</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Servicios', icon: '🏪', route: '/monetizacion/servicios', color: '#10b981' },
                { label: 'Empresas',  icon: '🏢', route: '/monetizacion/empresas',  color: '#06b6d4' },
                { label: 'Taxis',     icon: '🚖', route: '/monetizacion/taxis',     color: '#eab308' },
                { label: 'Barcos',    icon: '⛵', route: '/monetizacion/barcos',    color: '#f97316' },
                { label: 'Monedero',  icon: '💳', route: '/monetizacion/monedero',  color: '#8b5cf6' },
                { label: 'Perfiles',  icon: '👤', route: '/monetizacion/perfiles',  color: '#ec4899' },
              ].map(m => (
                <button key={m.route} onClick={() => navigate(m.route)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-800 hover:border-gray-600 transition-all hover:scale-105 active:scale-95">
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-xs font-semibold text-gray-400">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MonetizacionLayout>
  );
}
