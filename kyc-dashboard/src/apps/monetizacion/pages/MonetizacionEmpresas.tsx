/**
 * Módulo Empresas de Servicios — cuotas mensuales + comisiones 1.5%
 * Diseño oscuro profesional · Histórico diario · Métricas detalladas
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Search, Plus, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Loader2,
  ArrowUpRight, ArrowDownRight, Building2,
} from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { empresasApi } from '@/api/monetizacion';
import type { Empresa, EstadoPago } from '@/types/monetizacion';

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

const TIPO_ICONO: Record<string, string> = {
  supermercado: '🛒', farmacia: '💊', hotel: '🏨', restaurante: '🍽️',
  telecomunicaciones: '📡', salud: '🏥', viajes: '✈️', gasolinera: '⛽',
  seguros: '🛡️', banco: '🏦', ocio: '🎬', general: '🏢',
};

const ESTADO_CFG: Record<EstadoPago, {
  label: string; icon: React.ElementType;
  text: string; bg: string; border: string;
}> = {
  pagado:    { label: 'Pagado',    icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800' },
  pendiente: { label: 'Pendiente', icon: Clock,        text: 'text-amber-400',   bg: 'bg-amber-950/40',   border: 'border-amber-800'   },
  vencido:   { label: 'Vencido',   icon: XCircle,      text: 'text-red-400',     bg: 'bg-red-950/40',     border: 'border-red-800'     },
};

function EstadoBadge({ estado }: { estado: EstadoPago }) {
  const cfg  = ESTADO_CFG[estado];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="font-bold text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {XAF(p.value, true)} XAF
        </p>
      ))}
    </div>
  );
};

// ── Pantalla ──────────────────────────────────────────────────────
export default function MonetizacionEmpresas() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [filtro,   setFiltro]   = useState<'todas' | EstadoPago>('todas');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPago }) => empresasApi.marcarPago(id, estado),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['monetizacion', 'empresas'] }),
  });

  const crearEmpresa = useMutation({
    mutationFn: (data: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fecha_registro'>) => empresasApi.create(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['monetizacion', 'empresas'] });
      setShowForm(false);
      setForm({ nombre: '', responsable: '', email: '', telefono: '', tipo_servicio: 'general', cuota_mensual: '50000', comision_pct: '1.5' });
    },
  });

  const filtered = (empresas as Empresa[]).filter(e =>
    (filtro === 'todas' || e.estado_pago === filtro) &&
    (!search || e.nombre.toLowerCase().includes(search.toLowerCase()) || e.responsable.toLowerCase().includes(search.toLowerCase()))
  );

  // Totales
  const totalCuotas     = (empresas as Empresa[]).reduce((s, e) => s + e.cuota_mensual, 0);
  const totalComisiones = (empresas as Empresa[]).reduce((s, e) => s + (e.total_ventas_mes * e.comision_pct / 100), 0);
  const totalIngresos   = totalCuotas + totalComisiones;
  const vencidas        = (empresas as Empresa[]).filter(e => e.estado_pago === 'vencido').length;
  const pendientes      = (empresas as Empresa[]).filter(e => e.estado_pago === 'pendiente').length;

  // Simulación histórico mensual por empresa (datos demo derivados)
  const mockHistorico = useMemo(() =>
    ['Ene','Feb','Mar','Abr','May','Jun'].map((mes, i) => ({
      name: mes,
      Cuotas:     Math.round(totalCuotas * (0.85 + i * 0.03)),
      Comisiones: Math.round(totalComisiones * (0.80 + i * 0.04)),
    }))
  , [totalCuotas, totalComisiones]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crearEmpresa.mutate({
      nombre:           form.nombre,
      responsable:      form.responsable,
      email:            form.email || null,
      telefono:         form.telefono || null,
      tipo_servicio:    form.tipo_servicio,
      cuota_mensual:    parseFloat(form.cuota_mensual) || 0,
      comision_pct:     parseFloat(form.comision_pct)  || 1.5,
      total_ventas_mes: 0,
      estado_pago:      'pendiente',
      activa:           true,
    });
  }

  return (
    <MonetizacionLayout title="Empresas de Servicios">

      {/* ── KPI strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cuotas del mes',    value: totalCuotas,     color: '#06b6d4', sub: `${(empresas as Empresa[]).filter(e => e.activa).length} empresas activas` },
          { label: 'Comisiones (1.5%)', value: totalComisiones, color: '#10b981', sub: 'Sobre ventas en la app' },
          { label: 'Total ingresos',    value: totalIngresos,   color: '#ffffff', sub: 'Cuotas + comisiones' },
          {
            label: vencidas > 0 ? `⚠ ${vencidas} vencida${vencidas > 1 ? 's' : ''}` : 'Sin vencidas',
            value: (empresas as Empresa[]).length,
            color: vencidas > 0 ? '#ef4444' : '#6b7280',
            sub: `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`,
            isCount: true,
          },
        ].map(k => (
          <div key={k.label}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{k.label}</p>
            <p className="font-black text-xl" style={{ color: k.color }}>
              {isLoading ? '…' : k.isCount ? k.value : XAF(k.value as number, true)}
              {!k.isCount && <span className="text-xs font-normal text-gray-600 ml-1">XAF</span>}
            </p>
            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfico histórico mensual ─────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-sm">Evolución de Ingresos</h2>
            <p className="text-xs text-gray-600 mt-0.5">Cuotas + comisiones — últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/30 border border-cyan-500" />
              Cuotas
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/30 border border-emerald-500" />
              Comisiones
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={mockHistorico} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradCuotas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gradComis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false}
              tickFormatter={v => XAF(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Cuotas"     stroke="#06b6d4" strokeWidth={2}
              fill="url(#gradCuotas)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Comisiones" stroke="#10b981" strokeWidth={2}
              fill="url(#gradComis)"  dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-700 transition-colors"
            placeholder="Buscar empresa o responsable…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todas', 'pagado', 'pendiente', 'vencido'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                filtro === f
                  ? f === 'todas'
                    ? 'bg-white text-gray-900 border-white'
                    : `${ESTADO_CFG[f as EstadoPago]?.bg} ${ESTADO_CFG[f as EstadoPago]?.text} ${ESTADO_CFG[f as EstadoPago]?.border}`
                  : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4" /> Añadir empresa
        </button>
      </div>

      {/* ── Formulario nueva empresa ──────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="mb-5 rounded-2xl border border-cyan-900 bg-cyan-950/20 p-5">
          <h3 className="text-sm font-bold text-cyan-400 mb-4">🏢 Nueva empresa de servicios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'nombre',        label: 'Nombre *',           ph: 'Nombre de la empresa',   type: 'text'   },
              { key: 'responsable',   label: 'Responsable *',      ph: 'Nombre y apellido',      type: 'text'   },
              { key: 'email',         label: 'Email',              ph: 'correo@empresa.gq',      type: 'email'  },
              { key: 'telefono',      label: 'Teléfono',           ph: '+240 222…',              type: 'text'   },
              { key: 'tipo_servicio', label: 'Tipo de servicio',   ph: 'supermercado, hotel…',  type: 'text'   },
              { key: 'cuota_mensual', label: 'Cuota mensual (XAF)',ph: '50000',                 type: 'number' },
              { key: 'comision_pct',  label: 'Comisión sobre ventas (%)', ph: '1.5',            type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 font-semibold block mb-1">{f.label}</label>
                <input type={f.type}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-700 transition-colors"
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={['nombre','responsable'].includes(f.key)}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={crearEmpresa.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-bold disabled:opacity-50 transition-colors">
              {crearEmpresa.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar empresa
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-800 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600">
              Cancelar
            </button>
          </div>
          {crearEmpresa.isError && (
            <p className="mt-2 text-xs text-red-400">{(crearEmpresa.error as Error).message}</p>
          )}
        </form>
      )}

      {/* ── Lista empresas ────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando empresas…</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-600 text-sm">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              Sin empresas que coincidan.
            </div>
          )}
          {(filtered as Empresa[]).map(empresa => {
            const comision   = empresa.total_ventas_mes * empresa.comision_pct / 100;
            const ingresos   = empresa.cuota_mensual + comision;
            const isExp      = expanded === empresa.id;
            const cfg        = ESTADO_CFG[empresa.estado_pago];
            const tipoIcono  = TIPO_ICONO[empresa.tipo_servicio] ?? '🏢';

            return (
              <div key={empresa.id}
                className={`rounded-2xl border bg-gray-900 overflow-hidden transition-all hover:border-gray-700 ${
                  empresa.estado_pago === 'vencido' ? 'border-red-900/50' : 'border-gray-800'
                }`}>
                {/* Fila principal */}
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExp ? null : empresa.id)}>
                  {/* Icono tipo */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gray-800">
                    {tipoIcono}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{empresa.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      👤 {empresa.responsable}
                      {empresa.email && <span className="text-gray-600"> · {empresa.email}</span>}
                    </p>
                  </div>

                  {/* Métricas — escritorio */}
                  <div className="hidden md:flex items-center gap-8 text-right mx-2">
                    <div>
                      <p className="text-xs text-gray-600">Cuota</p>
                      <p className="text-sm font-bold text-cyan-400">{XAF(empresa.cuota_mensual, true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Comisión</p>
                      <p className="text-sm font-bold text-emerald-400">{XAF(comision, true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total mes</p>
                      <p className="text-base font-black text-white">{XAF(ingresos, true)}</p>
                    </div>
                  </div>

                  <EstadoBadge estado={empresa.estado_pago} />
                  {isExp
                    ? <ChevronUp   className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
                    : <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
                  }
                </button>

                {/* Panel expandido */}
                {isExp && (
                  <div className="border-t border-gray-800 bg-gray-900/50">
                    {/* Métricas móvil */}
                    <div className="md:hidden grid grid-cols-3 gap-3 px-5 py-3 border-b border-gray-800">
                      {[
                        { label: 'Cuota',     value: empresa.cuota_mensual, color: '#06b6d4' },
                        { label: 'Comisión',  value: comision,              color: '#10b981' },
                        { label: 'Total mes', value: ingresos,              color: '#ffffff' },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-xs text-gray-600">{m.label}</p>
                          <p className="text-sm font-black mt-0.5" style={{ color: m.color }}>
                            {XAF(m.value, true)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Detalle */}
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Tipo</p>
                          <p className="font-semibold text-gray-300 capitalize">{empresa.tipo_servicio}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Ventas del mes</p>
                          <p className="font-semibold text-gray-300">{XAF(empresa.total_ventas_mes)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Tasa comisión</p>
                          <p className="font-bold text-emerald-400">{empresa.comision_pct}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Teléfono</p>
                          <p className="font-semibold text-gray-300">{empresa.telefono ?? '—'}</p>
                        </div>
                      </div>

                      {/* Ingreso proyectado anual */}
                      <div className="flex items-center gap-4 p-4 rounded-xl mb-4"
                        style={{ backgroundColor: '#06b6d411', border: '1px solid #06b6d422' }}>
                        <div>
                          <p className="text-xs text-cyan-500 font-bold uppercase tracking-wide">Proyección anual (×12)</p>
                          <p className="text-2xl font-black text-cyan-400 mt-0.5">{XAF(ingresos * 12)}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-gray-600">Cuotas año</p>
                          <p className="font-bold text-gray-400">{XAF(empresa.cuota_mensual * 12, true)}</p>
                          <p className="text-xs text-gray-600 mt-1">Comis. año (est.)</p>
                          <p className="font-bold text-emerald-400">{XAF(comision * 12, true)}</p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 flex-wrap">
                        {empresa.estado_pago !== 'pagado' && (
                          <button
                            disabled={marcarPago.isPending}
                            onClick={() => marcarPago.mutate({ id: empresa.id, estado: 'pagado' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-800 text-xs font-bold disabled:opacity-50 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar pagado
                          </button>
                        )}
                        {empresa.estado_pago !== 'pendiente' && (
                          <button
                            disabled={marcarPago.isPending}
                            onClick={() => marcarPago.mutate({ id: empresa.id, estado: 'pendiente' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-900 text-xs font-bold disabled:opacity-50 transition-colors">
                            <Clock className="w-3.5 h-3.5" /> Marcar pendiente
                          </button>
                        )}
                        {empresa.estado_pago !== 'vencido' && (
                          <button
                            disabled={marcarPago.isPending}
                            onClick={() => marcarPago.mutate({ id: empresa.id, estado: 'vencido' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-900 text-xs font-bold disabled:opacity-50 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Marcar vencido
                          </button>
                        )}
                      </div>
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
