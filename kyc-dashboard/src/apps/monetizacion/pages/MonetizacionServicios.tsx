/**
 * Página maestra de Servicios — todos los servicios registrados en EGChat
 * Revenue, tendencia, estado, histórico diario. Comisión 1.5% universal.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Search, Plus, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Loader2, Filter,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
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

const CAT_COLORS: Record<string, string> = {
  restaurantes:'#f97316', vuelos:'#3b82f6',     hoteles:'#8b5cf6',
  supermercados:'#10b981',gasolineras:'#f59e0b', seguros:'#ec4899',
  apuestas:'#ef4444',     barcos:'#06b6d4',      taxis:'#eab308',
  farmacias:'#84cc16',    salud:'#14b8a6',        bancos:'#6366f1',
  djangue:'#a855f7',      correos:'#78716c',      ocio:'#f43f5e',
};
const CAT_ICONS: Record<string, string> = {
  restaurantes:'🍽️', vuelos:'✈️',   hoteles:'🏨',  supermercados:'🛒',
  gasolineras:'⛽',  seguros:'🛡️',  apuestas:'🎰', barcos:'⛵',
  taxis:'🚖',        farmacias:'💊', salud:'🏥',    bancos:'🏦',
  djangue:'🤝',      correos:'📮',  ocio:'🎬',
};

const CATEGORIAS = Object.keys(CAT_COLORS);

// ── Tipos ─────────────────────────────────────────────────────────
interface Servicio {
  id: string;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  comision_pct: number;
  activo: boolean;
  icono: string;
  ciudad: string;
  created_at: string;
}

interface ResumenCategoria {
  categoria: string;
  total_comision: number;
  total_bruto: number;
  num_tx: number;
  comision_mes_actual: number;
  comision_semana: number;
  comision_hoy: number;
}

interface DiaResumen {
  fecha: string;
  categoria: string;
  total_comisiones: number;
  num_transacciones: number;
}

// ── API calls ─────────────────────────────────────────────────────
async function fetchServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from('revenue_servicios')
    .select('*')
    .order('categoria')
    .order('nombre');
  if (error) throw error;
  return data ?? [];
}

async function fetchResumenCategorias(): Promise<ResumenCategoria[]> {
  const { data, error } = await supabase
    .from('v_revenue_por_categoria')
    .select('*');
  if (error) throw error;
  return (data ?? []) as ResumenCategoria[];
}

async function fetchHistorico30(): Promise<DiaResumen[]> {
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('revenue_resumen_diario')
    .select('fecha, categoria, total_comisiones, num_transacciones')
    .gte('fecha', cutoff)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function toggleServicio(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from('revenue_servicios')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function crearServicio(s: Omit<Servicio, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('revenue_servicios').insert(s);
  if (error) throw error;
}

// ── Custom Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="font-bold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {XAF(p.value, true)} XAF
        </p>
      ))}
    </div>
  );
};

// ── Card de categoría ─────────────────────────────────────────────
function CategoriaCard({
  resumen, historico, expanded, onToggle,
  servicios,
}: {
  resumen: ResumenCategoria;
  historico: DiaResumen[];
  expanded: boolean;
  onToggle: () => void;
  servicios: Servicio[];
}) {
  const qc = useQueryClient();
  const color  = CAT_COLORS[resumen.categoria] ?? '#6b7280';
  const icon   = CAT_ICONS[resumen.categoria]  ?? '🏪';
  const trend  = resumen.comision_semana > 0
    ? ((resumen.comision_hoy * 7 - resumen.comision_semana) / resumen.comision_semana) * 100
    : 0;
  const up = trend >= 0;

  const chartData = historico.map(d => ({
    name:  new Date(d.fecha).toLocaleDateString('es-GQ', { day: '2-digit', month: 'short' }),
    value: Math.round(d.total_comisiones),
  }));

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => toggleServicio(id, activo),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['rev-servicios'] }),
  });

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Cabecera — siempre visible */}
      <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-800/40 transition-colors" onClick={onToggle}>
        {/* Icono */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: color + '18', border: `1px solid ${color}30` }}>
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-white capitalize">{resumen.categoria}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: color + '20', color }}>
              {servicios.length} servicios
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{resumen.num_tx?.toLocaleString() ?? 0} transacciones</span>
            <span>·</span>
            <span className={`flex items-center gap-0.5 font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Métricas */}
        <div className="hidden sm:flex items-center gap-6 text-right mx-2">
          <div>
            <p className="text-xs text-gray-600">Hoy</p>
            <p className="text-sm font-bold" style={{ color }}>{XAF(resumen.comision_hoy ?? 0, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Semana</p>
            <p className="text-sm font-bold text-gray-300">{XAF(resumen.comision_semana ?? 0, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Mes</p>
            <p className="text-sm font-bold text-white">{XAF(resumen.comision_mes_actual ?? 0, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-sm font-black" style={{ color }}>{XAF(resumen.total_comision ?? 0, true)}</p>
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />}
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-gray-800">
          {/* Métricas móvil */}
          <div className="sm:hidden grid grid-cols-2 gap-3 px-5 py-3 border-b border-gray-800">
            {[
              { label: 'Hoy',    val: resumen.comision_hoy        ?? 0, color },
              { label: 'Semana', val: resumen.comision_semana     ?? 0, color: '#9ca3af' },
              { label: 'Mes',    val: resumen.comision_mes_actual ?? 0, color: '#ffffff' },
              { label: 'Total',  val: resumen.total_comision      ?? 0, color },
            ].map(m => (
              <div key={m.label} className="rounded-lg px-3 py-2"
                style={{ backgroundColor: color + '10' }}>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>
                  {XAF(m.val, true)} XAF
                </p>
              </div>
            ))}
          </div>

          {/* Gráfico histórico 30 días */}
          {chartData.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Comisiones diarias — últimos 30 días
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -20 }} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4b5563' }}
                    axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 8, fill: '#4b5563' }}
                    axisLine={false} tickLine={false} tickFormatter={v => XAF(v, true)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[3,3,0,0]} name="Comisión">
                    {chartData.map((_, i) => (
                      <Cell key={i}
                        fill={i === chartData.length - 1 ? color : color + '55'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lista de servicios */}
          <div className="px-5 py-3">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">
              Servicios registrados ({servicios.length})
            </p>
            <div className="space-y-2">
              {servicios.map(s => (
                <div key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                  <span className="text-lg w-7">{s.icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.nombre}</p>
                    <p className="text-xs text-gray-500">{s.ciudad} · {s.comision_pct}% comisión</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      s.activo
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800'
                        : 'text-gray-500 bg-gray-800 border-gray-700'
                    }`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => toggleMut.mutate({ id: s.id, activo: !s.activo })}
                      disabled={toggleMut.isPending}
                      className="w-7 h-7 rounded-lg border border-gray-700 hover:border-gray-500 flex items-center justify-center transition-colors"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function MonetizacionServicios() {
  const qc = useQueryClient();
  const [search,    setSearch]    = useState('');
  const [catFiltro, setCatFiltro] = useState<string>('todas');
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm] = useState({
    categoria: 'restaurantes', nombre: '', descripcion: '',
    icono: '🏪', ciudad: 'Malabo', comision_pct: '1.5', activo: true,
  });

  const { data: servicios  = [], isLoading: loadS } = useQuery({ queryKey: ['rev-servicios'],   queryFn: fetchServicios,          staleTime: 5 * 60_000 });
  const { data: resumenes  = [], isLoading: loadR } = useQuery({ queryKey: ['rev-resumenes'],   queryFn: fetchResumenCategorias,  staleTime: 5 * 60_000 });
  const { data: historico  = []                    } = useQuery({ queryKey: ['rev-historico30'], queryFn: fetchHistorico30,        staleTime: 5 * 60_000 });

  const crear = useMutation({
    mutationFn: crearServicio,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['rev-servicios'] });
      setShowForm(false);
      setForm({ categoria: 'restaurantes', nombre: '', descripcion: '', icono: '🏪', ciudad: 'Malabo', comision_pct: '1.5', activo: true });
    },
  });

  // Categorías presentes en los servicios
  const categoriasUsadas = useMemo(() =>
    [...new Set((servicios as Servicio[]).map(s => s.categoria))].sort(),
  [servicios]);

  // Filtrar servicios
  const serviciosFiltrados = useMemo(() => {
    return (servicios as Servicio[]).filter(s =>
      (catFiltro === 'todas' || s.categoria === catFiltro) &&
      (!search || s.nombre.toLowerCase().includes(search.toLowerCase()) || s.ciudad.toLowerCase().includes(search.toLowerCase()))
    );
  }, [servicios, catFiltro, search]);

  // Agrupar por categoría para las cards
  const porCategoria = useMemo(() => {
    const map = new Map<string, Servicio[]>();
    for (const s of serviciosFiltrados) {
      map.set(s.categoria, [...(map.get(s.categoria) ?? []), s]);
    }
    return map;
  }, [serviciosFiltrados]);

  // Totales globales desde resúmenes
  const totalHoy    = (resumenes as ResumenCategoria[]).reduce((s, r) => s + (r.comision_hoy        ?? 0), 0);
  const totalSemana = (resumenes as ResumenCategoria[]).reduce((s, r) => s + (r.comision_semana     ?? 0), 0);
  const totalMes    = (resumenes as ResumenCategoria[]).reduce((s, r) => s + (r.comision_mes_actual ?? 0), 0);
  const totalGlobal = (resumenes as ResumenCategoria[]).reduce((s, r) => s + (r.total_comision      ?? 0), 0);

  const loading = loadS || loadR;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crear.mutate({
      categoria:    form.categoria,
      nombre:       form.nombre,
      descripcion:  form.descripcion || null,
      icono:        form.icono,
      ciudad:       form.ciudad,
      comision_pct: parseFloat(form.comision_pct) || 1.5,
      activo:       form.activo,
    });
  }

  return (
    <MonetizacionLayout title="Servicios — Revenue 1.5%">

      {/* ── Resumen global ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Hoy',         value: totalHoy,    color: '#10b981' },
          { label: 'Esta semana', value: totalSemana, color: '#3b82f6' },
          { label: 'Este mes',    value: totalMes,    color: '#8b5cf6' },
          { label: 'Acumulado',   value: totalGlobal, color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{k.label}</p>
            <p className="text-xl font-black" style={{ color: k.color }}>
              {loading ? '…' : XAF(k.value, true)}
              <span className="text-xs font-normal text-gray-600 ml-1">XAF</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-700 transition-colors"
            placeholder="Buscar servicio o ciudad…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {/* Filtros por categoría */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setCatFiltro('todas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            catFiltro === 'todas'
              ? 'bg-white text-gray-900 border-white'
              : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
          }`}>
          Todas ({servicios.length})
        </button>
        {categoriasUsadas.map(cat => (
          <button key={cat} onClick={() => setCatFiltro(cat)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              catFiltro === cat
                ? 'text-black border-transparent'
                : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
            }`}
            style={catFiltro === cat ? { backgroundColor: CAT_COLORS[cat] ?? '#10b981', borderColor: CAT_COLORS[cat] } : {}}>
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* ── Formulario nuevo servicio ──────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="mb-5 rounded-2xl border border-emerald-900 bg-emerald-950/20 p-5">
          <h3 className="text-sm font-bold text-emerald-400 mb-4">➕ Registrar nuevo servicio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'nombre',       label: 'Nombre *',          ph: 'Nombre del negocio',   type: 'text'   },
              { key: 'ciudad',       label: 'Ciudad',            ph: 'Malabo, Bata…',         type: 'text'   },
              { key: 'icono',        label: 'Emoji icono',       ph: '🏪',                    type: 'text'   },
              { key: 'descripcion',  label: 'Descripción',       ph: 'Descripción breve',    type: 'text'   },
              { key: 'comision_pct', label: 'Comisión (%)',      ph: '1.5',                   type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 font-semibold block mb-1">{f.label}</label>
                <input type={f.type}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-emerald-700"
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.key === 'nombre'}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Categoría</label>
              <select
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-700"
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
              >
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={crear.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-bold disabled:opacity-50">
              {crear.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar servicio
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-800 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600">
              Cancelar
            </button>
          </div>
          {crear.isError && (
            <p className="mt-2 text-xs text-red-400">{(crear.error as Error).message}</p>
          )}
        </form>
      )}

      {/* ── Lista de categorías ────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando servicios…</span>
        </div>
      ) : porCategoria.size === 0 ? (
        <div className="text-center py-24 text-gray-600 text-sm">
          <p className="text-3xl mb-3">🔍</p>
          Sin servicios. Ejecuta el SQL de demo o añade uno manualmente.
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(porCategoria.entries()).map(([cat, svcs]) => {
            const res = (resumenes as ResumenCategoria[]).find(r => r.categoria === cat) ?? {
              categoria: cat, total_comision: 0, total_bruto: 0, num_tx: 0,
              comision_mes_actual: 0, comision_semana: 0, comision_hoy: 0,
            };
            const hist = (historico as DiaResumen[]).filter(d => d.categoria === cat);
            return (
              <CategoriaCard
                key={cat}
                resumen={res as ResumenCategoria}
                historico={hist}
                servicios={svcs}
                expanded={expanded === cat}
                onToggle={() => setExpanded(expanded === cat ? null : cat)}
              />
            );
          })}
        </div>
      )}
    </MonetizacionLayout>
  );
}
