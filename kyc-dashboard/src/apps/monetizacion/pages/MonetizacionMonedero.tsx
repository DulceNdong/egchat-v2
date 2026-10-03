/**
 * Módulo Monedero — movimientos banco↔app, comisión 0.5%.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Filter, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { monederoApi, resumenApi } from '@/api/monetizacion';
import type { WalletMovimiento, ResumenMensual } from '@/types/monetizacion';

const fmtXAF = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
const fmtK = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : `${n}`;
const MESES_ES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmtK(p.value)} XAF</p>
      ))}
    </div>
  );
};

function TipoBadge({ tipo }: { tipo: string }) {
  const isRecarga = tipo === 'recarga_banco';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
      isRecarga
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
        : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
    }`}>
      {isRecarga ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
      {isRecarga ? 'Recarga' : 'Retiro'}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = {
    completado: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200',
    pendiente:  'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200',
    fallido:    'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200',
  }[estado] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg}`}>{estado}</span>;
}

export default function MonetizacionMonedero() {
  const [filtroTipo,   setFiltroTipo]   = useState<'todos' | 'recarga_banco' | 'retiro_banco'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'completado' | 'pendiente' | 'fallido'>('todos');

  const now  = new Date();
  const mes  = now.getMonth() + 1;
  const anio = now.getFullYear();

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'wallet', filtroTipo, filtroEstado],
    queryFn:  () => monederoApi.getMovimientos({
      mes, anio,
      tipo:   filtroTipo   !== 'todos' ? filtroTipo   : undefined,
      estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
      limit: 50,
    }),
    staleTime: 2 * 60_000,
  });

  const { data: resumenes = [] } = useQuery({
    queryKey: ['monetizacion', 'resumenes'],
    queryFn:  () => resumenApi.getResumenes(6),
    staleTime: 5 * 60_000,
  });

  const walletResumen = (resumenes as ResumenMensual[])
    .filter(r => r.categoria === 'wallet')
    .sort((a, b) => (a.anio * 12 + a.mes) - (b.anio * 12 + b.mes));

  const chartData = walletResumen.map(r => ({
    name:      MESES_ES[r.mes],
    Comisión:  Math.round(r.total_ingresos),
    Volumen:   Math.round(r.total_ingresos / 0.005), // estimar volumen desde comisión 0.5%
  }));

  const mesActual = walletResumen[walletResumen.length - 1];
  const mesPrev   = walletResumen[walletResumen.length - 2];
  const trend     = mesPrev ? ((mesActual?.total_ingresos ?? 0) - mesPrev.total_ingresos) / mesPrev.total_ingresos * 100 : 0;

  const totalComisiones = movimientos.reduce((s, m) => s + m.comision_monto, 0);
  const totalVolumen    = movimientos.reduce((s, m) => s + m.monto, 0);
  const completados     = movimientos.filter(m => m.estado === 'completado').length;

  return (
    <MonetizacionLayout title="Revenue Monedero">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Comisiones mes (0.5%)', value: fmtXAF(mesActual?.total_ingresos ?? totalComisiones), color: 'text-emerald-600' },
          { label: 'Tendencia',             value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`,                                  color: trend >= 0 ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Movimientos cargados',  value: `${movimientos.length} (${completados} ok)`,                                     color: 'text-purple-600' },
          { label: 'Volumen en vista',      value: fmtXAF(totalVolumen),                                                            color: 'text-blue-600'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico evolución comisiones */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">📈 Evolución comisiones monedero (0.5%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Comisión" fill="#8b5cf6" radius={[6,6,0,0]} name="Comisión (0.5%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'recarga_banco', 'retiro_banco'] as const).map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtroTipo === f ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {f === 'todos' ? 'Todos' : f === 'recarga_banco' ? '↓ Recargas' : '↑ Retiros'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'completado', 'pendiente', 'fallido'] as const).map(f => (
            <button key={f} onClick={() => setFiltroEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtroEstado === f ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla movimientos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando movimientos…
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comisión (0.5%)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Banco</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {movimientos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      Sin movimientos para el período / filtro seleccionado.
                    </td>
                  </tr>
                )}
                {(movimientos as WalletMovimiento[]).map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.user_id.slice(0, 12)}…</td>
                    <td className="px-4 py-3"><TipoBadge tipo={m.tipo} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmtXAF(m.monto)}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-600">{fmtXAF(m.comision_monto)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{m.banco ?? '—'}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={m.estado} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                      {new Date(m.fecha).toLocaleDateString('es-GQ', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {movimientos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>{movimientos.length} movimientos</span>
              <span className="font-semibold text-purple-600">Total comisiones: {fmtXAF(totalComisiones)}</span>
            </div>
          )}
        </div>
      )}
    </MonetizacionLayout>
  );
}
