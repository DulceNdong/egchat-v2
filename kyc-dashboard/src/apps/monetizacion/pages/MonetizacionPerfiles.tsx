/**
 * Módulo Perfiles Financieros — usuarios + negocios, score, historial, informe bancario.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Briefcase, FileText, ChevronDown, ChevronUp, Loader2, Download } from 'lucide-react';
import MonetizacionLayout from '../components/MonetizacionLayout';
import { perfilesApi } from '@/api/monetizacion';
import type { PerfilFinancieroUsuario, PerfilFinancieroNegocio } from '@/types/monetizacion';

const fmtXAF = (n: number) =>
  new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const text  = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const label = score >= 70 ? 'Excelente' : score >= 40 ? 'Moderado' : 'En desarrollo';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${text} min-w-[24px]`}>{score}</span>
      <span className={`text-xs ${text}`}>{label}</span>
    </div>
  );
}

/** Genera el texto del informe y lo descarga como .txt */
function descargarInforme(tipo: 'usuario' | 'negocio', data: PerfilFinancieroUsuario | PerfilFinancieroNegocio) {
  const fecha = new Date().toLocaleDateString('es-GQ', { day: '2-digit', month: 'long', year: 'numeric' });
  let texto = '';

  if (tipo === 'usuario') {
    const u = data as PerfilFinancieroUsuario;
    texto = `INFORME FINANCIERO — USUARIO
════════════════════════════════════════
Generado por: EGChat Platform
Fecha:        ${fecha}
Período:      Últimos ${u.meses_activo} meses
────────────────────────────────────────
DATOS DEL TITULAR
Nombre:              ${u.nombre_completo ?? 'Usuario ' + u.user_id.slice(0,8)}
ID usuario:          ${u.user_id}
────────────────────────────────────────
SCORE FINANCIERO
Score:               ${u.score_financiero}/100
Interpretación:      ${u.score_financiero >= 70 ? 'Perfil excelente. Recomendado para crédito.' : u.score_financiero >= 40 ? 'Perfil moderado. Evaluar condiciones.' : 'Historial en desarrollo. Más tiempo necesario.'}
────────────────────────────────────────
ACTIVIDAD EN PLATAFORMA
Total transacciones: ${u.num_transacciones}
Total movido:        ${fmtXAF(u.total_movido)}
Promedio mensual:    ${fmtXAF(u.monto_promedio_mensual)}
Meses activo:        ${u.meses_activo}
Primera transacción: ${u.primera_transaccion ? new Date(u.primera_transaccion).toLocaleDateString('es-GQ') : '—'}
Última transacción:  ${u.ultima_transaccion  ? new Date(u.ultima_transaccion).toLocaleDateString('es-GQ')  : '—'}
────────────────────────────────────────
SERVICIOS UTILIZADOS
Taxi:      ${u.usa_taxi      ? 'Sí' : 'No'}
Barcos:    ${u.usa_barcos    ? 'Sí' : 'No'}
Servicios: ${u.usa_servicios ? 'Sí' : 'No'}
Monedero:  ${u.usa_wallet    ? 'Sí' : 'No'}
════════════════════════════════════════
Este informe ha sido generado automáticamente
por EGChat y refleja datos reales de actividad
en la plataforma. Válido como referencia
financiera ante entidades bancarias.
`;
  } else {
    const n = data as PerfilFinancieroNegocio;
    texto = `INFORME FINANCIERO — NEGOCIO
════════════════════════════════════════
Generado por: EGChat Platform
Fecha:        ${fecha}
────────────────────────────────────────
DATOS DE LA EMPRESA
Razón social:        ${n.razon_social}
NIF:                 ${n.nif ?? '—'}
Sector:              ${n.sector ?? '—'}
────────────────────────────────────────
SCORE FINANCIERO
Score:               ${n.score_financiero}/100
Interpretación:      ${n.score_financiero >= 70 ? 'Negocio apto para crédito empresarial.' : n.score_financiero >= 40 ? 'Evaluar condiciones según volumen.' : 'Historial insuficiente.'}
────────────────────────────────────────
ACTIVIDAD FINANCIERA
Meses en operación:  ${n.meses_operacion}
Total transacciones: ${n.num_transacciones_total}
Facturación promedio:${fmtXAF(n.facturacion_mensual_promedio)}
Facturación total:   ${fmtXAF(n.facturacion_total)}
Servicios activos:   ${n.servicios_activos?.join(', ') || '—'}
════════════════════════════════════════
Este informe ha sido generado automáticamente
por EGChat. Válido como referencia financiera
ante entidades bancarias y de crédito.
`;
  }

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `informe-${tipo}-${data.id.slice(0,8)}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-tab Usuarios ──────────────────────────────────────────────
function TabUsuarios() {
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: perfiles = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'perfiles-usuarios'],
    queryFn:  perfilesApi.getUsuarios,
    staleTime: 5 * 60_000,
  });

  const filtered = perfiles.filter(p =>
    !search ||
    (p.nombre_completo ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.user_id.includes(search)
  );

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por nombre o ID de usuario…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando perfiles…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Sin perfiles registrados aún.</div>
      ) : (
        <div className="space-y-2">
          {(filtered as PerfilFinancieroUsuario[]).map(p => {
            const isExp = expanded === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExp ? null : p.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${p.score_financiero >= 70 ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700' : p.score_financiero >= 40 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700' : 'bg-red-100 dark:bg-red-950/30 text-red-700'}`}>
                    {p.score_financiero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{p.nombre_completo ?? `Usuario ${p.user_id.slice(0, 10)}…`}</p>
                    <div className="mt-1.5 max-w-xs">
                      <ScoreBar score={p.score_financiero} />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right mx-4">
                    <div><p className="text-xs text-gray-400">Transacciones</p><p className="text-sm font-semibold">{p.num_transacciones}</p></div>
                    <div><p className="text-xs text-gray-400">Total movido</p><p className="text-sm font-semibold text-blue-600">{fmtXAF(p.total_movido)}</p></div>
                    <div><p className="text-xs text-gray-400">Meses activo</p><p className="text-sm font-semibold">{p.meses_activo}</p></div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />}
                </button>

                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div><p className="text-xs text-gray-400">Promedio mensual</p><p className="font-semibold">{fmtXAF(p.monto_promedio_mensual)}</p></div>
                      <div><p className="text-xs text-gray-400">Primera transacción</p><p className="font-semibold">{p.primera_transaccion ? new Date(p.primera_transaccion).toLocaleDateString('es-GQ') : '—'}</p></div>
                      <div><p className="text-xs text-gray-400">Última transacción</p><p className="font-semibold">{p.ultima_transaccion ? new Date(p.ultima_transaccion).toLocaleDateString('es-GQ') : '—'}</p></div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Servicios</p>
                        <div className="flex flex-wrap gap-1">
                          {p.usa_taxi      && <span className="text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">🚖 Taxi</span>}
                          {p.usa_barcos    && <span className="text-xs bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">⛵ Barco</span>}
                          {p.usa_servicios && <span className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">🛒 Servicios</span>}
                          {p.usa_wallet    && <span className="text-xs bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">💳 Wallet</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => descargarInforme('usuario', p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Informe Bancario
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Sub-tab Negocios ──────────────────────────────────────────────
function TabNegocios() {
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: perfiles = [], isLoading } = useQuery({
    queryKey: ['monetizacion', 'perfiles-negocios'],
    queryFn:  perfilesApi.getNegocios,
    staleTime: 5 * 60_000,
  });

  const filtered = perfiles.filter(p =>
    !search || p.razon_social.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por razón social…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando perfiles…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Sin perfiles de negocios registrados aún.</div>
      ) : (
        <div className="space-y-2">
          {(filtered as PerfilFinancieroNegocio[]).map(p => {
            const isExp = expanded === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExp ? null : p.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${p.score_financiero >= 70 ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700' : p.score_financiero >= 40 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700' : 'bg-red-100 dark:bg-red-950/30 text-red-700'}`}>
                    {p.score_financiero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{p.razon_social}</p>
                    <p className="text-xs text-gray-400">{p.sector ?? '—'} · NIF: {p.nif ?? '—'}</p>
                    <div className="mt-1.5 max-w-xs">
                      <ScoreBar score={p.score_financiero} />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right mx-4">
                    <div><p className="text-xs text-gray-400">Fact. mensual</p><p className="text-sm font-semibold text-pink-600">{fmtXAF(p.facturacion_mensual_promedio)}</p></div>
                    <div><p className="text-xs text-gray-400">Meses operando</p><p className="text-sm font-semibold">{p.meses_operacion}</p></div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />}
                </button>

                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div><p className="text-xs text-gray-400">Facturación total</p><p className="font-semibold">{fmtXAF(p.facturacion_total)}</p></div>
                      <div><p className="text-xs text-gray-400">Transacciones totales</p><p className="font-semibold">{p.num_transacciones_total}</p></div>
                      <div><p className="text-xs text-gray-400">Servicios activos</p><p className="font-semibold">{p.servicios_activos?.join(', ') || '—'}</p></div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Veredicto bancario</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.score_financiero >= 70 ? 'bg-emerald-100 text-emerald-700' : p.score_financiero >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {p.score_financiero >= 70 ? '✓ Apto crédito' : p.score_financiero >= 40 ? '⚠ Evaluar' : '✗ No recomendado'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => descargarInforme('negocio', p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Informe Bancario
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function MonetizacionPerfiles() {
  const [tab, setTab] = useState<'usuarios' | 'negocios'>('usuarios');

  return (
    <MonetizacionLayout title="Perfiles Financieros">

      <div className="mb-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm flex items-start gap-2">
        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Los perfiles financieros se generan automáticamente a partir de la actividad real en EGChat.
          El botón <strong>"Descargar Informe Bancario"</strong> genera un documento .txt estructurado
          listo para presentar ante bancos o entidades de crédito.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 mt-4">
        <button
          onClick={() => setTab('usuarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
            tab === 'usuarios'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios
        </button>
        <button
          onClick={() => setTab('negocios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
            tab === 'negocios'
              ? 'bg-pink-500 text-white border-pink-500'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Negocios / Empresas
        </button>
      </div>

      {tab === 'usuarios' ? <TabUsuarios /> : <TabNegocios />}
    </MonetizacionLayout>
  );
}
