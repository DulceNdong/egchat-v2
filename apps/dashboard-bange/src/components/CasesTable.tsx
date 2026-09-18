// CasesTable — Tabla principal de casos KYC con ordenación
import React from 'react';
import { StatusBadge, RiskBadge } from './StatusBadge';
import type { KycCase } from '../api/kycApi';

interface Props {
  cases:    KycCase[];
  loading:  boolean;
  sortBy:   string;
  sortDir:  'asc' | 'desc';
  onSort:   (col: string) => void;
  onSelect: (c: KycCase) => void;
}

function Th({ col, label, current, dir, onSort }: {
  col: string; label: string; current: string; dir: string; onSort: (c: string) => void;
}) {
  const active = col === current;
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none
        ${active ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
      onClick={() => onSort(col)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label} {active ? (dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

export function CasesTable({ cases, loading, sortBy, sortDir, onSort, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Cargando casos...
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <span className="text-4xl">📋</span>
        <span className="text-sm">No hay casos con los filtros actuales</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm" role="table" aria-label="Lista de casos KYC">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th col="full_name"     label="Solicitante"   current={sortBy} dir={sortDir} onSort={onSort} />
            <Th col="submitted_at"  label="Fecha envío"   current={sortBy} dir={sortDir} onSort={onSort} />
            <Th col="status"        label="Estado"        current={sortBy} dir={sortDir} onSort={onSort} />
            <Th col="risk_score"    label="Riesgo"        current={sortBy} dir={sortDir} onSort={onSort} />
            <Th col="face_match_score" label="Face match" current={sortBy} dir={sortDir} onSort={onSort} />
            <Th col="screening_hits" label="Screening"    current={sortBy} dir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {cases.map(c => (
            <tr
              key={c.application_id}
              className="hover:bg-blue-50/50 transition cursor-pointer"
              onClick={() => onSelect(c)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(c)}
              aria-label={`Caso de ${c.full_name}`}
            >
              <td className="px-4 py-3">
                <div className="font-semibold text-gray-900">{c.full_name || '—'}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.nationality} · {c.document_type}</div>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('es-ES') : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3">
                <RiskBadge risk={c.risk_level} score={c.risk_score} />
              </td>
              <td className="px-4 py-3">
                {c.face_match_score != null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${c.face_match_score >= 0.8 ? 'bg-green-500' : c.face_match_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.round(c.face_match_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{Math.round(c.face_match_score * 100)}%</span>
                  </div>
                ) : <span className="text-gray-400 text-xs">—</span>}
              </td>
              <td className="px-4 py-3 text-center">
                {c.screening_hits > 0
                  ? <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs">⚠️ {c.screening_hits} hits</span>
                  : <span className="text-green-600 text-xs">✓ Limpio</span>
                }
              </td>
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                <button
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                  onClick={() => onSelect(c)}
                  aria-label={`Revisar caso de ${c.full_name}`}
                >
                  Revisar →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
