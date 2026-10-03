/**
 * Módulo Empresas — cuotas mensuales + comisiones 1.5% sobre ventas.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { empresasApi } from '@/api/monetizacion';
import type { Empresa, EstadoPago } from '@/types/monetizacion';

const fmtXAF = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const ESTADO_CONFIG: Record<EstadoPago, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pagado:   { label: 'Pagado',   icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
  pendiente:{ label: 'Pendiente',icon: Clock,        color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'         },
  vencido:  { label: 'Vencido',  icon: XCircle,      color: 'text-red-700 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'                 },
};

function EstadoBadge({ estado }: { estado: EstadoPago }) {
  const cfg = ESTADO_CONFIG[estado];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function MonetizacionEmpresas() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [filtro, setFiltro]     = useState<'todas' | EstadoPago>('todas');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form nueva empresa
  const [form, setForm] = useState({
    nombre: '', responsable: '', email: '', telefono: '',
    tipo_servicio: 'general', cuota_mensual: '50000', comision_pct: '1.5',
  });

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'empresas'],
    queryFn:  empresasApi.getAll,
    staleTime: 2 * 60_000,
  });

  const marcarPago = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPago }) =>
      empresasApi.marcarPago(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monetizacion', 'empresas'] }),
  });

  const crearEmpresa = useMutation({
    mutationFn: (data: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fecha_registro'>) =>
      empresasApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monetizacion', 'empresas'] });
      setShowForm(false);
      setForm({ nombre: '', responsable: '', email: '', telefono: '', tipo_servicio: 'general', cuota_mensual: '50000', comision_pct: '1.5' });
    },
  });

  const filtered = empresas
    .filter(e => filtro === 'todas' || e.estado_pago === filtro)
    .filter(e => !search || e.nombre.toLowerCase().includes(search.toLowerCase()) || e.responsable.toLowerCase().includes(search.toLowerCase()));

  const totalCuotas     = empresas.reduce((s, e) => s + e.cuota_mensual, 0);
  const totalComisiones = empresas.reduce((s, e) => s + (e.total_ventas_mes * e.comision_pct / 100), 0);
  const totalIngresos   = totalCuotas + totalComisiones;
  const vencidas        = empresas.filter(e => e.estado_pago === 'vencido').length;
  const pendientes      = empresas.filter(e => e.estado_pago === 'pendiente').length;

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    crearEmpresa.mutate({
      nombre:          form.nombre,
      responsable:     form.responsable,
      email:           form.email || null,
      telefono:        form.telefono || null,
      tipo_servicio:   form.tipo_servicio,
      cuota_mensual:   parseFloat(form.cuota_mensual) || 0,
      comision_pct:    parseFloat(form.comision_pct) || 1.5,
      total_ventas_mes: 0,
      estado_pago:     'pendiente',
      activa:          true,
    });
  }

  return (
    <MonetizacionLayout title="Empresas de Servicios">

      {/* Resumen top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cuotas del mes',     value: fmtXAF(totalCuotas),     color: 'text-emerald-600' },
          { label: 'Comisiones (1.5%)',  value: fmtXAF(totalComisiones), color: 'text-blue-600'    },
          { label: 'Total ingresos',     value: fmtXAF(totalIngresos),   color: 'text-gray-900 dark:text-white font-black' },
          { label: `${vencidas} venc. · ${pendientes} pend.`, value: `${empresas.length} empresas`, color: vencidas > 0 ? 'text-red-600' : 'text-gray-500' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9" placeholder="Buscar empresa o responsable…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todas', 'pagado', 'pendiente', 'vencido'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtro === f
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Añadir empresa
        </button>
      </div>

      {/* Formulario nueva empresa */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <h3 className="font-semibold text-sm mb-4 text-emerald-800 dark:text-emerald-300">Nueva Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'nombre',        label: 'Nombre *',          type: 'text',   ph: 'Supermercados Bioko' },
              { key: 'responsable',   label: 'Responsable *',     type: 'text',   ph: 'Nombre y apellido'   },
              { key: 'email',         label: 'Email',             type: 'email',  ph: 'contacto@empresa.gq' },
              { key: 'telefono',      label: 'Teléfono',          type: 'text',   ph: '+240 222…'           },
              { key: 'tipo_servicio', label: 'Tipo de servicio',  type: 'text',   ph: 'supermercado, hotel…'},
              { key: 'cuota_mensual', label: 'Cuota mensual (XAF)', type: 'number', ph: '50000'             },
              { key: 'comision_pct',  label: 'Comisión (%)',      type: 'number', ph: '1.5'                 },
            ].map(f => (
              <div key={f.key}>
                <label className="label text-xs">{f.label}</label>
                <input
                  type={f.type} className="input text-sm" placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.key === 'nombre' || f.key === 'responsable'}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={crearEmpresa.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
              {crearEmpresa.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Guardar empresa
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
          </div>
          {crearEmpresa.isError && (
            <p className="mt-2 text-xs text-red-600">{(crearEmpresa.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Tabla / lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando empresas…
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No hay empresas que coincidan.</div>
          )}
          {filtered.map(empresa => {
            const comision    = empresa.total_ventas_mes * empresa.comision_pct / 100;
            const ingresos    = empresa.cuota_mensual + comision;
            const isExpanded  = expanded === empresa.id;

            return (
              <div key={empresa.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Cabecera fila */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded(isExpanded ? null : empresa.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0 text-lg">
                    {empresa.tipo_servicio === 'supermercado' ? '🛒'
                     : empresa.tipo_servicio === 'farmacia'   ? '💊'
                     : empresa.tipo_servicio === 'hotel'      ? '🏨'
                     : empresa.tipo_servicio === 'salud'      ? '🏥'
                     : empresa.tipo_servicio === 'telecomunicaciones' ? '📡'
                     : empresa.tipo_servicio === 'restaurante' ? '🍽️'
                     : empresa.tipo_servicio === 'viajes'     ? '✈️'
                     : '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{empresa.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">👤 {empresa.responsable} · {empresa.email ?? '—'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right mx-4">
                    <div>
                      <p className="text-xs text-gray-400">Cuota</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmtXAF(empresa.cuota_mensual)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Comisión</p>
                      <p className="text-sm font-semibold text-emerald-600">{fmtXAF(comision)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtXAF(ingresos)}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={empresa.estado_pago} />
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
                </button>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                      <div><p className="text-xs text-gray-400">Tipo</p><p className="font-medium">{empresa.tipo_servicio}</p></div>
                      <div><p className="text-xs text-gray-400">Ventas del mes</p><p className="font-medium">{fmtXAF(empresa.total_ventas_mes)}</p></div>
                      <div><p className="text-xs text-gray-400">Comisión %</p><p className="font-medium">{empresa.comision_pct}%</p></div>
                      <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium">{empresa.telefono ?? '—'}</p></div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {empresa.estado_pago !== 'pagado' && (
                        <button
                          disabled={marcarPago.isPending}
                          onClick={() => marcarPago.mutate({ id: empresa.id, estado: 'pagado' })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          ✓ Marcar como pagado
                        </button>
                      )}
                      {empresa.estado_pago !== 'pendiente' && (
                        <button
                          disabled={marcarPago.isPending}
                          onClick={() => marcarPago.mutate({ id: empresa.id, estado: 'pendiente' })}
                          className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-50"
                        >
                          Marcar pendiente
                        </button>
                      )}
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
