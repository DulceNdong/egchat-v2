// CasesPage — Página principal con lista, búsqueda, filtros y detalle
import React, { useState, useCallback } from 'react';
import { CasesTable } from '../components/CasesTable';
import { CaseDetail } from '../components/CaseDetail';
import { StatusBadge } from '../components/StatusBadge';
import { useKycCases, type StatusFilter, type RiskFilter } from '../hooks/useKycCases';
import type { KycCase } from '../api/kycApi';
import { kycApi } from '../api/kycApi';

const STATUS_TABS: { val: StatusFilter; label: string }[] = [
  { val: 'all',           label: 'Todos' },
  { val: 'submitted',     label: 'Enviados' },
  { val: 'MANUAL_REVIEW', label: 'Revisión manual' },
  { val: 'approved',      label: 'Aprobados' },
  { val: 'rejected',      label: 'Rechazados' },
];

export function CasesPage() {
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

  const handleSort = useCallback((col: string) => {
    if (col === sortBy) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col as any);
      setSortDir('desc');
    }
  }, [sortBy, setSortBy, setSortDir]);

  const handleExport = () => {
    const url = kycApi.exportCsv({ status, risk });
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-full">
      {/* Panel principal */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all ${selectedCase ? 'pr-0' : ''}`}>
        {/* Header de la página */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Casos KYC</h1>
              <p className="text-sm text-gray-500 mt-0.5">{total} casos en total</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm border-2 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl font-semibold text-gray-600 transition"
              aria-label="Exportar casos a CSV"
            >
              ⬇️ Exportar CSV
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              id="search-input"
              type="search"
              placeholder="Buscar por nombre, número de documento, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none"
              aria-label="Buscar casos"
            />
          </div>

          {/* Tabs de estado */}
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.val}
                onClick={() => setStatus(tab.val)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  status === tab.val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-pressed={status === tab.val}
              >
                {tab.label}
              </button>
            ))}

            {/* Filtro riesgo */}
            <select
              value={risk}
              onChange={e => setRisk(e.target.value as RiskFilter)}
              className="ml-2 px-3 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white focus:border-blue-400 outline-none"
              aria-label="Filtrar por nivel de riesgo"
            >
              <option value="all">Todos los riesgos</option>
              <option value="high">🔴 Alto riesgo</option>
              <option value="medium">🟡 Riesgo medio</option>
              <option value="low">🟢 Riesgo bajo</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
            <button onClick={reload} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {/* Tabla */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <CasesTable
            cases={cases}
            loading={loading}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onSelect={setSelectedCase}
          />
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gray-300"
                aria-label="Página anterior"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gray-300"
                aria-label="Página siguiente"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral de detalle */}
      {selectedCase && (
        <div className="w-96 border-l border-gray-100 bg-white flex-shrink-0 h-full overflow-hidden">
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
