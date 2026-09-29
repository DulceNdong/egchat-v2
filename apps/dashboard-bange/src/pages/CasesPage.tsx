import React, { useState, useCallback, useMemo } from 'react';
import { CasesTable } from '../components/CasesTable';
import { CaseDetail } from '../components/CaseDetail';
import { useKycCases, type StatusFilter, type RiskFilter } from '../hooks/useKycCases';
import type { KycCase } from '../api/kycApi';
import { kycApi } from '../api/kycApi';

interface Props { dark?: boolean; }

const STATUS_TABS: { val: StatusFilter; label: string; icon: string; color: string }[] = [
  { val: 'all',           label: 'Todos',          icon: '◈', color: 'blue' },
  { val: 'submitted',     label: 'Enviados',        icon: '↑', color: 'amber' },
  { val: 'MANUAL_REVIEW', label: 'Revisión manual', icon: '👁', color: 'violet' },
  { val: 'approved',      label: 'Aprobados',       icon: '✓', color: 'green' },
  { val: 'rejected',      label: 'Rechazados',      icon: '✕', color: 'red' },
];

// Tarjeta de estadística
function StatCard({ label, value, icon, color, dark }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; dark?: boolean;
}) {
  const colors: Record<string, string> = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-emerald-600',
    amber:  'from-amber-500 to-orange-500',
    violet: 'from-violet-500 to-purple-600',
    red:    'from-red-500 to-rose-600',
    teal:   'from-teal-500 to-cyan-600',
  };
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-4 ${dark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color] ?? colors.blue} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>{value}</div>
        <div className={`text-xs font-medium mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
      </div>
    </div>
  );
}

export function CasesPage({ dark }: Props) {
  const {
    cases, total, loading, error,
    search, setSearch,
    status, setStatus,
    risk, setRisk,
    page, setPage, totalPages,
    sortBy, setSortBy,
    sortDir, setSortDir,
    reload,
  } = useKycCases();

  const [selectedCase, setSelectedCase] = useState<KycCase | null>(null);

  // Contadores locales por estado
  const counts = useMemo(() => ({
    all:           cases.length,
    submitted:     cases.filter(c => c.status === 'submitted').length,
    manual:        cases.filter(c => c.status === 'MANUAL_REVIEW').length,
    approved:      cases.filter(c => ['approved','APPROVED','AUTO_APPROVED'].includes(c.status)).length,
    rejected:      cases.filter(c => ['rejected','REJECTED'].includes(c.status)).length,
    highRisk:      cases.filter(c => c.risk_level === 'high').length,
  }), [cases]);

  const handleSort = useCallback((col: string) => {
    if (col === sortBy) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col as any); setSortDir('desc'); }
  }, [sortBy, setSortBy, setSortDir]);

  const handleExport = () => window.open(kycApi.exportCsv({ status, risk }), '_blank');

  const bg   = dark ? 'bg-slate-900' : 'bg-slate-50';
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = dark ? 'text-slate-200' : 'text-slate-800';
  const sub  = dark ? 'text-slate-400' : 'text-slate-500';
  const inp  = dark ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-400';

  const tabActive = (color: string) => ({
    blue:   dark ? 'bg-blue-600 text-white'   : 'bg-blue-600 text-white',
    amber:  dark ? 'bg-amber-500 text-white'  : 'bg-amber-500 text-white',
    violet: dark ? 'bg-violet-600 text-white' : 'bg-violet-600 text-white',
    green:  dark ? 'bg-green-600 text-white'  : 'bg-green-600 text-white',
    red:    dark ? 'bg-red-600 text-white'    : 'bg-red-600 text-white',
  }[color] ?? 'bg-blue-600 text-white');

  const tabInactive = dark
    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className={`flex h-full ${bg}`}>
      {/* Panel principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-5 border-b ${dark ? 'border-slate-700' : 'border-slate-200'} ${dark ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className={`text-xl font-bold ${text}`}>Casos KYC</h1>
              <p className={`text-sm mt-0.5 ${sub}`}>
                {loading ? 'Cargando...' : `${total} casos en total`}
              </p>
            </div>
            <button
              onClick={handleExport}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold border transition ${dark ? 'border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <StatCard label="Total" value={total} dark={dark} color="blue" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            }/>
            <StatCard label="En revisión" value={counts.manual} dark={dark} color="violet" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            }/>
            <StatCard label="Aprobados" value={counts.approved} dark={dark} color="green" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            }/>
            <StatCard label="Rechazados" value={counts.rejected} dark={dark} color="red" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            }/>
            <StatCard label="Enviados" value={counts.submitted} dark={dark} color="amber" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            }/>
            <StatCard label="Alto riesgo" value={counts.highRisk} dark={dark} color="teal" icon={
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            }/>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-4">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              id="search-input"
              type="search"
              placeholder="Buscar por nombre, documento, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition ${inp}`}
            />
          </div>

          {/* Tabs + filtro riesgo */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.val}
                onClick={() => setStatus(tab.val)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${status === tab.val ? tabActive(tab.color) : tabInactive}`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={risk}
                onChange={e => setRisk(e.target.value as RiskFilter)}
                className={`px-3 py-1.5 border rounded-xl text-xs font-semibold outline-none transition ${dark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <option value="all">Todos los riesgos</option>
                <option value="high">Alto riesgo</option>
                <option value="medium">Riesgo medio</option>
                <option value="low">Riesgo bajo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={`mx-6 mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${dark ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
            <button onClick={reload} className="ml-auto underline font-semibold">Reintentar</button>
          </div>
        )}

        {/* Tabla */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <CasesTable
            cases={cases} loading={loading}
            sortBy={sortBy} sortDir={sortDir}
            onSort={handleSort} onSelect={setSelectedCase}
            dark={dark}
          />
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-6 py-3 border-t ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-white'}`}>
            <span className={`text-sm ${sub}`}>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition ${dark ? 'border border-slate-600 text-slate-300 hover:border-slate-500' : 'border border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >← Anterior</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition ${dark ? 'border border-slate-600 text-slate-300 hover:border-slate-500' : 'border border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >Siguiente →</button>
            </div>
          </div>
        )}
      </div>

      {/* Panel detalle lateral */}
      {selectedCase && (
        <div className={`w-96 border-l flex-shrink-0 h-full overflow-hidden ${dark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
          <CaseDetail
            caseId={selectedCase.application_id}
            onClose={() => setSelectedCase(null)}
            onDone={() => { setSelectedCase(null); reload(); }}
          />
        </div>
      )}
    </div>
  );
}
