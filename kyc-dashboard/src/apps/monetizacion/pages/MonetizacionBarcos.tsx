/**
 * Módulo Barcos — operadores marítimos, billetes, comisión 1%.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ship, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { barcosApi, resumenApi } from '@/api/monetizacion';
import type { Barco, ResumenMensual } from '@/types/monetizacion';

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

export default function MonetizacionBarcos() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: barcos = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'barcos'],
    queryFn:  barcosApi.getAll,
    staleTime: 2 * 60_000,
  });

  const { data: resumenes = [] } = useQuery({
    queryKey: ['monetizacion', 'resumenes'],
    queryFn:  () => resumenApi.getResumenes(6),
    staleTime: 5 * 60_000,
  });

  const barcosResumen = (resumenes as ResumenMensual[])
    .filter(r => r.categoria === 'barcos')
    .sort((a, b) => (a.anio * 12 + a.mes) - (b.anio * 12 + b.mes));

  const chartData = barcosResumen.map(r => ({
    name: MESES_ES[r.mes],
    Recaudación: Math.round(r.total_ingresos / 0.01), // revertir 1% para obtener recaudación bruta estimada
    Comisión:    Math.round(r.total_ingresos),
  }));

  const mesActual = barcosResumen[barcosResumen.length - 1];
  const mesPrev   = barcosResumen[barcosResumen.length - 2];
  const trend     = mesPrev ? ((mesActual?.total_ingresos ?? 0) - mesPrev.total_ingresos) / mesPrev.total_ingresos * 100 : 0;

  const activos   = barcos.filter(b => b.activo).length;
  const inactivos = barcos.filter(b => !b.activo).length;

  return (
    <MonetizacionLayout title="Transporte Marítimo — Barcos">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Comisión mes (1%)',  value: fmtXAF(mesActual?.total_ingresos ?? 0), color: 'text-emerald-600' },
          { label: 'Tendencia',          value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`,                    color: trend >= 0 ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Barcos activos',     value: `${activos} de ${barcos.length}`,                                   color: 'text-orange-600' },
          { label: 'Billetes est. mes',  value: `${mesActual?.num_transacciones ?? 0}`,                             color: 'text-blue-600'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico evolución */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Evolución comisiones barcos</h2>
              <p className="text-xs text-gray-400">1% sobre recaudación de billetes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Comisión" fill="#f97316" radius={[6,6,0,0]} name="Comisión (1%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista barcos */}
      <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Operadores registrados</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando barcos…
        </div>
      ) : (
        <div className="space-y-2">
          {barcos.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">Sin barcos registrados. Ejecuta el SQL de demo.</div>}
          {barcos.map((barco: Barco) => {
            const isExp = expanded === barco.id;
            return (
              <div key={barco.id} className={`rounded-xl border bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!barco.activo ? 'opacity-60' : 'border-gray-200 dark:border-gray-800'}`}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExp ? null : barco.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${barco.activo ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Ship className={`w-5 h-5 ${barco.activo ? 'text-orange-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{barco.nombre_barco}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${barco.activo ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {barco.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{barco.nombre_operador} · {barco.matricula ?? '—'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right mx-4">
                    <div>
                      <p className="text-xs text-gray-400">Ruta</p>
                      <p className="text-sm font-semibold text-orange-600">{barco.ruta}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Capacidad</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{barco.capacidad_pasajeros} pax</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Precio base</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmtXAF(barco.precio_billete_base)}</p>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />}
                </button>

                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400">Operador</p><p className="font-medium">{barco.nombre_operador}</p></div>
                      <div><p className="text-xs text-gray-400">Origen</p><p className="font-medium">{barco.origen ?? '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Destino</p><p className="font-medium">{barco.destino ?? '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Matrícula</p><p className="font-medium">{barco.matricula ?? '—'}</p></div>
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-xs text-orange-800 dark:text-orange-300">
                      💡 La comisión del <strong>1%</strong> se aplica sobre el total de billetes vendidos a través de EGChat.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MonetizacionLayout>
  );
}
