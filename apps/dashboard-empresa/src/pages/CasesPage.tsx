import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type KycCase } from '../api/adminApi';

const STATUS_COLORS: Record<string, string> = {
  submitted:      'bg-yellow-100 text-yellow-800',
  PENDING_REVIEW: 'bg-orange-100 text-orange-800',
  MANUAL_REVIEW:  'bg-purple-100 text-purple-800',
  AUTO_APPROVED:  'bg-teal-100 text-teal-800',
  approved:       'bg-green-100 text-green-800',
  APPROVED:       'bg-green-100 text-green-800',
  rejected:       'bg-red-100 text-red-800',
  REJECTED:       'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  submitted:      'Enviado',
  PENDING_REVIEW: 'Pendiente',
  MANUAL_REVIEW:  'Revisión manual',
  AUTO_APPROVED:  'Auto-aprobado',
  approved:       'Aprobado', APPROVED: 'Aprobado',
  rejected:       'Rechazado', REJECTED: 'Rechazado',
};

export function CasesPage() {
  const [cases,    setCases]    = useState<KycCase[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('all');
  const [page,     setPage]     = useState(1);
  const [deciding, setDeciding] = useState<KycCase | null>(null);
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), pageSize: String(PAGE_SIZE),
        sortBy: 'submitted_at', sortDir: 'desc',
      };
      if (search)          params.search = search;
      if (status !== 'all') params.status = status;
      const data = await adminApi.cases(params);
      setCases(data.cases);
      setTotal(data.total);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleDecide = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!deciding) return;
    setSaving(true);
    try {
      await adminApi.decide(deciding.application_id, decision, notes);
      setDeciding(null);
      setNotes('');
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Casos KYC <span className="text-gray-400 font-normal text-base">({total})</span></h1>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, documento, ID..."
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:border-indigo-400 outline-none"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:border-indigo-400 outline-none"
          >
            <option value="all">Todos</option>
            <option value="submitted">Enviados</option>
            <option value="MANUAL_REVIEW">Revisión manual</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-400">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Cargando...
          </div>
        ) : !cases.length ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl block mb-2">📋</span>
            Sin casos con los filtros actuales
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Solicitante','Fecha','Estado','Riesgo','Face match','Screening','Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map(c => (
                  <tr key={c.application_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{c.full_name || '—'}</div>
                      <div className="text-xs text-gray-400">{c.nationality} · {c.document_type}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${c.risk_level === 'high' ? 'text-red-600' : c.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {c.risk_level?.toUpperCase() ?? '—'} ({c.risk_score ?? 0})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.face_match_score != null
                        ? <span className={c.face_match_score >= 0.8 ? 'text-green-600' : 'text-red-600'}>
                            {Math.round(c.face_match_score * 100)}%
                          </span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      {c.screening_hits > 0
                        ? <span className="text-red-600 font-bold">⚠️ {c.screening_hits}</span>
                        : <span className="text-green-600">✓</span>}
                    </td>
                    <td className="px-4 py-3">
                      {['submitted','PENDING_REVIEW','MANUAL_REVIEW'].includes(c.status) && (
                        <button
                          onClick={() => setDeciding(c)}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                        >
                          Decidir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-3 border-t bg-white text-sm">
          <span className="text-gray-500">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40">← Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal decisión */}
      {deciding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Decisión sobre el caso</h2>
            <p className="text-sm text-gray-500 mb-4">{deciding.full_name}</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas internas (opcional)..."
              rows={3}
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none mb-4 focus:border-indigo-400 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleDecide('APPROVED')}
                disabled={saving}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {saving ? '...' : '✅ Aprobar'}
              </button>
              <button
                onClick={() => handleDecide('REJECTED')}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {saving ? '...' : '❌ Rechazar'}
              </button>
              <button
                onClick={() => { setDeciding(null); setNotes(''); }}
                className="px-4 py-3 border rounded-xl text-sm text-gray-600"
              >✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
