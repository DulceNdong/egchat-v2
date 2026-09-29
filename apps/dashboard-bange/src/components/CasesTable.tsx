import React from 'react';
import { StatusBadge, RiskBadge } from './StatusBadge';
import type { KycCase } from '../api/kycApi';

interface Props {
  cases: KycCase[]; loading: boolean;
  sortBy: string; sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onSelect: (c: KycCase) => void;
  dark?: boolean;
}

function SortIcon({ active, dir }: { active: boolean; dir: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`ml-1 inline transition ${active ? 'opacity-100' : 'opacity-30'}`}>
      {dir === 'asc' && active
        ? <path d="M6 2L10 8H2L6 2Z" fill="currentColor"/>
        : <path d="M6 10L2 4H10L6 10Z" fill="currentColor"/>
      }
    </svg>
  );
}

function Th({ col, label, current, dir, onSort, dark }: {
  col: string; label: string; current: string; dir: string; onSort: (c: string) => void; dark?: boolean;
}) {
  const active = col === current;
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition
        ${active
          ? dark ? 'text-blue-400' : 'text-blue-600'
          : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
        }`}
      onClick={() => onSort(col)}
    >
      {label}<SortIcon active={active} dir={dir} />
    </th>
  );
}

export function CasesTable({ cases, loading, sortBy, sortDir, onSort, onSelect, dark }: Props) {
  const th = dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200';
  const tr = dark ? 'border-slate-700/60 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-blue-50/40';
  const td = dark ? 'text-slate-300' : 'text-slate-700';
  const sub = dark ? 'text-slate-500' : 'text-slate-400';

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span className={`text-sm ${sub}`}>Cargando casos...</span>
    </div>
  );

  if (!cases.length) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 fade-in">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke={dark ? '#475569' : '#94a3b8'} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <span className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No hay casos con los filtros actuales</span>
    </div>
  );

  return (
    <div className={`overflow-x-auto rounded-xl border ${dark ? 'border-slate-700' : 'border-slate-200'} fade-in`}>
      <table className="w-full text-sm">
        <thead className={`border-b ${th}`}>
          <tr>
            <Th col="full_name"      label="Solicitante"  current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <Th col="submitted_at"   label="Fecha"        current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <Th col="status"         label="Estado"       current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <Th col="risk_score"     label="Riesgo"       current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <Th col="face_match_score" label="Face ID"    current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <Th col="screening_hits" label="Screening"    current={sortBy} dir={sortDir} onSort={onSort} dark={dark} />
            <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Acción</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${dark ? 'divide-slate-700/60' : 'divide-slate-100'}`}>
          {cases.map(c => (
            <tr
              key={c.application_id}
              className={`cursor-pointer transition-colors ${tr}`}
              onClick={() => onSelect(c)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(c)}
            >
              {/* Solicitante */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {(c.full_name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <div className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{c.full_name || '—'}</div>
                    <div className={`text-xs mt-0.5 ${sub}`}>{c.nationality} · {c.document_type}</div>
                  </div>
                </div>
              </td>
              {/* Fecha */}
              <td className={`px-4 py-3.5 whitespace-nowrap ${td}`}>
                {c.submitted_at ? (
                  <div>
                    <div>{new Date(c.submitted_at).toLocaleDateString('es-ES')}</div>
                    <div className={`text-xs ${sub}`}>{new Date(c.submitted_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ) : '—'}
              </td>
              {/* Estado */}
              <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
              {/* Riesgo */}
              <td className="px-4 py-3.5"><RiskBadge risk={c.risk_level} score={c.risk_score} /></td>
              {/* Face ID */}
              <td className="px-4 py-3.5">
                {c.face_match_score != null ? (
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className={`flex-1 rounded-full h-1.5 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className={`h-1.5 rounded-full transition-all ${c.face_match_score >= 0.8 ? 'bg-green-500' : c.face_match_score >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.round(c.face_match_score * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${td}`}>{Math.round(c.face_match_score * 100)}%</span>
                  </div>
                ) : <span className={`text-xs ${sub}`}>—</span>}
              </td>
              {/* Screening */}
              <td className="px-4 py-3.5">
                {c.screening_hits > 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {c.screening_hits} hits
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-500 text-xs font-medium">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Limpio
                  </span>
                )}
              </td>
              {/* Acción */}
              <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onSelect(c)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  Revisar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
