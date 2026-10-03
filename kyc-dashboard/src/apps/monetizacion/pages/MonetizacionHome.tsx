/**
 * Dashboard principal de Monetización.
 * KPI cards + gráficos Recharts + alertas + tabla top fuentes.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from 'recharts';
import {
  TrendingUp, Building2, Car, Ship, Wallet,
  AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { resumenApi } from '@/api/monetizacion';
import type { ResumenMensual, ResumenMensualAgrupado } from '@/types/monetizacion';

// ── Helpers ───────────────────────────────────────────────────────
const MESES_ES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const fmtXAF = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)}K`
    : `${n}`;

const fmtXAFFull = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {fmtXAF(p.value)} XAF
        </p>
      ))}
    </div>
  );
};

// ── Derivar stats de los resúmenes ────────────────────────────────
function deriveStats(data: ResumenMensual[]) {
  const now   = new Date();
  const mes   = now.getMonth() + 1;
  const anio  = now.getFullYear();
  const prev  = mes === 1 ? { mes: 12, anio: anio - 1 } : { mes: mes - 1, anio };

  const filtra = (m: number, a: number) => data.filter(r => r.mes === m && r.anio === a);
  const sum    = (arr: ResumenMensual[]) => arr.reduce((s, r) => s + r.total_ingresos, 0);
  const sumCat = (arr: ResumenMensual[], cat: string) =>
    arr.filter(r => r.categoria === cat).reduce((s, r) => s + r.total_ingresos, 0);

  const actual   = filtra(mes, anio);
  const anterior = filtra(prev.mes, prev.anio);
  const total    = sum(actual);
  const totalPrev = sum(anterior);
  const trend    = totalPrev ? ((total - totalPrev) / totalPrev) * 100 : 0;

  return {
    total, trend,
    empresas: sumCat(actual, 'empresas'),
    taxis:    sumCat(actual, 'taxis'),
    barcos:   sumCat(actual, 'barcos'),
    wallet:   sumCat(actual, 'wallet'),
    empresasPrev: sumCat(anterior, 'empresas'),
    taxisPrev:    sumCat(anterior, 'taxis'),
    barcosPrev:   sumCat(anterior, 'barcos'),
    walletPrev:   sumCat(anterior, 'wallet'),
  };
}

// ── Transformar resúmenes para el gráfico de barras apiladas ──────
function buildChartData(agrupado: ResumenMensualAgrupado[]) {
  return [...agrupado].reverse().map(r => ({
    name: MESES_ES[r.mes],
    Empresas: Math.round(r.ingresos_empresas),
    Taxis:    Math.round(r.ingresos_taxis),
    Barcos:   Math.round(r.ingresos_barcos),
    Wallet:   Math.round(r.ingresos_wallet),
  }));
}

// ── Componente KPI card ───────────────────────────────────────────
function KpiCard({
  label, value, prev, icon: Icon, color, route,
}: {
  label: string; value: number; prev: number;
  icon: React.ElementType; color: string; route: string;
}) {
  const navigate = useNavigate();
  const trend = prev ? ((value - prev) / prev) * 100 : 0;
  const up    = trend >= 0;
  return (
    <button
      onClick={() => navigate(route)}
      className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all text-left group w-full"
    >
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.06] ${color}`} />
      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{fmtXAF(value)} XAF</p>
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}% vs mes anterior
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${color} bg-opacity-10`}>
          <Icon className="w-5 h-5" style={{ color: 'inherit' }} aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────
export default function MonetizacionHome() {
  const navigate = useNavigate();

  const { data: resumenes = [], isLoading: loadingRes } = useQuery({
    queryKey: ['monetizacion', 'resumenes'],
    queryFn:  () => resumenApi.getResumenes(6),
    staleTime: 5 * 60_000,
  });

  const { data: agrupado = [], isLoading: loadingAgr } = useQuery({
    queryKey: ['monetizacion', 'agrupado'],
    queryFn:  () => resumenApi.getResumenAgrupado(),
    staleTime: 5 * 60_000,
  });

  const stats     = deriveStats(resumenes);
  const chartData = buildChartData(agrupado as ResumenMensualAgrupado[]);
  const loading   = loadingRes || loadingAgr;

  const now   = new Date();
  const mes   = now.getMonth() + 1;
  const anio  = now.getFullYear();

  // Alertas locales derivadas de los datos
  const resumenesMes = resumenes.filter(r => r.mes === mes && r.anio === anio);
  const alertas: { tipo: 'warning' | 'error'; msg: string }[] = [];
  if (resumenesMes.length === 0) alertas.push({ tipo: 'warning', msg: 'No hay datos de resumen para el mes actual. Ejecuta el SQL de demo.' });

  const totalMes = stats.total;
  const topFuentes = [
    { label: 'Cuotas Empresas',       value: stats.empresas * 0.83, pct: stats.total ? Math.round((stats.empresas * 0.83) / stats.total * 100) : 0, color: '#10b981' },
    { label: 'Comis. Taxis (5%)',      value: stats.taxis,           pct: stats.total ? Math.round(stats.taxis  / stats.total * 100) : 0, color: '#f59e0b' },
    { label: 'Comis. Empresas (1.5%)', value: stats.empresas * 0.17, pct: stats.total ? Math.round((stats.empresas * 0.17) / stats.total * 100) : 0, color: '#3b82f6' },
    { label: 'Comis. Barcos (1%)',     value: stats.barcos,          pct: stats.total ? Math.round(stats.barcos / stats.total * 100) : 0, color: '#f97316' },
    { label: 'Comis. Monedero (0.5%)', value: stats.wallet,          pct: stats.total ? Math.round(stats.wallet / stats.total * 100) : 0, color: '#8b5cf6' },
  ].sort((a, b) => b.value - a.value);

  return (
    <MonetizacionLayout title="Dashboard de Monetización">

      {/* ── Alertas ───────────────────────────────────────────── */}
      {alertas.map((a, i) => (
        <div key={i} className={`mb-4 flex items-center gap-2 p-3 rounded-lg text-sm border ${
          a.tipo === 'error'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {a.msg}
        </div>
      ))}

      {/* ── Hero total ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 mb-6 shadow-lg">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm font-medium text-emerald-100 uppercase tracking-widest mb-1">
            Ingresos Totales — {MESES_ES[mes]} {anio}
          </p>
          <p className="text-4xl font-black">
            {loading ? '…' : fmtXAFFull(totalMes)}
          </p>
          <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${stats.trend >= 0 ? 'text-emerald-200' : 'text-red-300'}`}>
            {stats.trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(stats.trend).toFixed(1)}% respecto al mes anterior
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            {[
              { label: 'Empresas', value: stats.empresas, color: 'text-emerald-200' },
              { label: 'Taxis',    value: stats.taxis,    color: 'text-yellow-300'  },
              { label: 'Barcos',   value: stats.barcos,   color: 'text-orange-300'  },
              { label: 'Wallet',   value: stats.wallet,   color: 'text-purple-300'  },
            ].map(item => (
              <div key={item.label}>
                <p className="text-emerald-200/70 text-xs">{item.label}</p>
                <p className={`font-bold ${item.color}`}>{fmtXAF(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Empresas" value={stats.empresas} prev={stats.empresasPrev} icon={Building2} color="bg-emerald-500 text-emerald-500" route="/monetizacion/empresas" />
        <KpiCard label="Taxis"    value={stats.taxis}    prev={stats.taxisPrev}    icon={Car}       color="bg-yellow-500 text-yellow-500"   route="/monetizacion/taxis"    />
        <KpiCard label="Barcos"   value={stats.barcos}   prev={stats.barcosPrev}   icon={Ship}      color="bg-orange-500 text-orange-500"   route="/monetizacion/barcos"   />
        <KpiCard label="Monedero" value={stats.wallet}   prev={stats.walletPrev}   icon={Wallet}    color="bg-purple-500 text-purple-500"   route="/monetizacion/monedero" />
      </div>

      {/* ── Gráficos ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Barras apiladas — evolución mensual */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Ingresos por categoría</h2>
              <p className="text-xs text-gray-400">Últimos 6 meses (XAF)</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Cargando…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtXAF} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Empresas" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="Taxis"    stackId="a" fill="#f59e0b" />
                <Bar dataKey="Barcos"   stackId="a" fill="#f97316" />
                <Bar dataKey="Wallet"   stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: 'Empresas', color: '#10b981' },
              { label: 'Taxis',    color: '#f59e0b' },
              { label: 'Barcos',   color: '#f97316' },
              { label: 'Wallet',   color: '#8b5cf6' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Línea — evolución total */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Tendencia total</h2>
              <p className="text-xs text-gray-400">Ingresos mensuales acumulados</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Cargando…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={chartData.map(d => ({
                  name: d.name,
                  total: d.Empresas + d.Taxis + d.Barcos + d.Wallet,
                }))}
                margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtXAF} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="total" name="Total"
                  stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top fuentes + accesos rápidos ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top fuentes */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">🏆 Top Fuentes de Ingresos</h2>
          <div className="space-y-3">
            {topFuentes.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{f.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white ml-2">{fmtXAF(f.value)} XAF</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">⚡ Acceso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Empresas',       icon: Building2, route: '/monetizacion/empresas', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', desc: 'Cuotas y comisiones' },
              { label: 'Taxis',          icon: Car,       route: '/monetizacion/taxis',    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',    desc: '5% por viaje'       },
              { label: 'Barcos',         icon: Ship,      route: '/monetizacion/barcos',   color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',   desc: '1% billetes'        },
              { label: 'Monedero',       icon: Wallet,    route: '/monetizacion/monedero', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',   desc: '0.5% movimientos'   },
              { label: 'Perfiles',       icon: Building2, route: '/monetizacion/perfiles', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',         desc: 'Historial usuarios' },
              { label: 'Negocios',       icon: Building2, route: '/monetizacion/negocios', color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30',         desc: 'Informes bancarios' },
            ].map(({ label, icon: Icon, route, color, desc }) => (
              <button
                key={route}
                onClick={() => navigate(route)}
                className="flex flex-col items-start gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-sm transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/monetizacion/perfiles')}
            className="flex items-center gap-1 mt-4 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            Ver informes bancarios <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

    </MonetizacionLayout>
  );
}
