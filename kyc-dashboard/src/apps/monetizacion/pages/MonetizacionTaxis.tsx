/**
 * Módulo Taxis — taxistas, documentación, horas activas, comisiones 5%.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { taxistasApi } from '@/api/monetizacion';
import type { Taxista, DocStatus } from '@/types/monetizacion';

const fmtXAF = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

function docColor(s?: DocStatus) {
  if (s === 'vencido') return 'text-red-600 dark:text-red-400';
  if (s === 'proximo') return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}
function docBg(s?: DocStatus) {
  if (s === 'vencido') return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  if (s === 'proximo') return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
}
function docLabel(s?: DocStatus) {
  if (s === 'vencido') return 'Vencido';
  if (s === 'proximo') return 'Por vencer';
  return 'Vigente';
}
function daysLeft(fecha?: string | null) {
  if (!fecha) return 'Sin fecha';
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return `Venció hace ${Math.abs(diff)}d`;
  if (diff === 0) return 'Vence hoy';
  return `${diff} días`;
}

function DocBadge({ label, status, fecha }: { label: string; status?: DocStatus; fecha?: string | null }) {
  return (
    <div className={`flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs ${docBg(status)}`}>
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className={`font-bold ${docColor(status)}`}>{docLabel(status)} · {daysLeft(fecha)}</span>
    </div>
  );
}

export default function MonetizacionTaxis() {
  const [search,   setSearch]   = useState('');
  const [filtro,   setFiltro]   = useState<'todos' | 'activos' | 'alertas'>('todos');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: taxistas = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'taxistas'],
    queryFn:  taxistasApi.getAll,
    staleTime: 2 * 60_000,
  });

  const filtered = taxistas
    .filter(t => {
      if (filtro === 'activos') return t.activo && t.verificado;
      if (filtro === 'alertas') return (
        t.estado_carnet !== 'vigente' ||
        t.estado_seguro !== 'vigente' ||
        t.estado_revision !== 'vigente'
      );
      return true;
    })
    .filter(t => !search || `${t.nombre} ${t.apellido}`.toLowerCase().includes(search.toLowerCase()) || t.num_licencia.includes(search));

  const totalViajes    = taxistas.reduce((s, t) => s + t.total_viajes_mes, 0);
  const totalHoras     = taxistas.reduce((s, t) => s + t.horas_activo_mes, 0);
  const totalComision  = taxistas.reduce((s, t) => s + (t.comisiones_mes_actual ?? 0), 0);
  const alertasDocs    = taxistas.filter(t => t.estado_carnet !== 'vigente' || t.estado_seguro !== 'vigente' || t.estado_revision !== 'vigente').length;

  return (
    <MonetizacionLayout title="Gestión de Taxis">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Viajes del mes',     value: totalViajes.toLocaleString(),              color: 'text-yellow-600' },
          { label: 'Horas activas',      value: `${totalHoras.toFixed(0)}h`,               color: 'text-blue-600'   },
          { label: 'Comisiones (5%)',    value: fmtXAF(totalComision),                     color: 'text-emerald-600'},
          { label: 'Alertas docs.',      value: `${alertasDocs} taxistas`,                 color: alertasDocs > 0 ? 'text-red-600' : 'text-gray-500' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {alertasDocs > 0 && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><strong>{alertasDocs} taxista{alertasDocs > 1 ? 's' : ''}</strong> {alertasDocs > 1 ? 'tienen' : 'tiene'} documentación vencida o próxima a vencer. Revisa y notifica.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Nombre, licencia…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['todos', 'activos', 'alertas'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtro === f
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando taxistas…
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">Sin resultados.</div>}
          {filtered.map((t: Taxista) => {
            const isExp    = expanded === t.id;
            const tieneAlerta = t.estado_carnet !== 'vigente' || t.estado_seguro !== 'vigente' || t.estado_revision !== 'vigente';

            return (
              <div key={t.id} className={`rounded-xl border bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${tieneAlerta ? 'border-amber-300 dark:border-amber-800' : 'border-gray-200 dark:border-gray-800'}`}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExp ? null : t.id)}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${t.activo ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {t.nombre[0]}{t.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{t.nombre} {t.apellido}</p>
                      {t.verificado && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      {tieneAlerta  && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">🪪 {t.num_licencia} · {t.marca_vehiculo} {t.modelo_vehiculo} {t.color_vehiculo}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right mx-4">
                    <div><p className="text-xs text-gray-400">Viajes</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.total_viajes_mes}</p></div>
                    <div><p className="text-xs text-gray-400">Horas</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.horas_activo_mes}h</p></div>
                    <div><p className="text-xs text-gray-400">Comisión</p><p className="text-sm font-bold text-emerald-600">{fmtXAF(t.comisiones_mes_actual ?? 0)}</p></div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${t.activo ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200'}`}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
                </button>

                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium">{t.telefono ?? '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Matrícula</p><p className="font-medium">{t.num_matricula ?? '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Año vehículo</p><p className="font-medium">{t.anio_vehiculo ?? '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Comisión EGChat</p><p className="font-bold text-emerald-600">{fmtXAF(t.comisiones_mes_actual ?? 0)}</p></div>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documentación</h4>
                    <div className="flex flex-wrap gap-2">
                      <DocBadge label="🪪 Carnet conducir"  status={t.estado_carnet}   fecha={t.fecha_venc_carnet} />
                      <DocBadge label="🛡 Seguro vehículo"   status={t.estado_seguro}   fecha={t.fecha_venc_seguro} />
                      <DocBadge label="🔧 Revisión técnica"  status={t.estado_revision} fecha={t.fecha_venc_revision_tecnica} />
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
