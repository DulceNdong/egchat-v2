/**
 * Cola de casos pendientes — vista principal BANGE.
 * Tabla paginada con filtros, ordenamiento y contador en tiempo real.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKycPending, useKycStats } from '@/shared/hooks/useKycAdmin';
import { RiskBadge, StatusBadge } from '@/shared/components/ui/Badges';
import { formatDistanceToNow } from 'date-fns';
import { es, fr } from 'date-fns/locale';
import BangeLayout from '../components/BangeLayout';

const PAGE_SIZE = 20;

const RISK_FILTERS  = [
  { value: '', label: 'Todos' },
  { value: 'high',   label: '🔴 Alto' },
  { value: 'medium', label: '🟡 Medio' },
  { value: 'low',    label: '🟢 Bajo' },
];

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'MANUAL_REVIEW',  label: 'Revisión manual' },
  { value: 'PENDING_REVIEW', label: 'Pendiente revisión' },
  { value: 'under_review',   label: 'En revisión' },
];

export default function BangeQueue() {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const locale      = i18n.language === 'fr' ? fr : es;

  const [page,       setPage]       = useState(1);
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching, refetch } = useKycPending({
    page,
    page_size: PAGE_SIZE,
    risk_level: riskFilter || undefined,
    status:     statusFilter || undefined,
  });

  const { data: stats } = useKycStats();

  const rows = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <BangeLayout title={t('queue.title')}>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {[
          { label: t('queue.pending'),  value: stats?.pending_review   ?? '—', color: 'text-amber-600' },
          { label: t('queue.approved'), value: stats?.approved_today   ?? '—', color: 'text-green-600' },
          { label: t('queue.rejected'), value: stats?.rejected_today   ?? '—', color: 'text-red-600'   },
          { label: t('queue.highRisk'), value: stats?.high_risk_count  ?? '—', color: 'text-red-700'   },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3 flex flex-col items-center min-w-[90px]">
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</span>
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary gap-1.5"
            aria-label={t('queue.refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {t('queue.refresh')}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />

        <select
          value={riskFilter}
          onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm"
          aria-label={t('queue.filterRisk')}
        >
          {RISK_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm"
          aria-label={t('queue.filterStatus')}
        >
          {STATUS_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {(riskFilter || statusFilter) && (
          <button
            onClick={() => { setRiskFilter(''); setStatusFilter(''); setPage(1); }}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            {t('queue.clearFilters')}
          </button>
        )}

        {data && (
          <span className="text-sm text-gray-500 ml-auto" aria-live="polite">
            {data.total} {t('queue.cases')}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label={t('queue.tableLabel')}>
            <thead>
              <tr role="row">
                <th className="table-th w-8">#</th>
                <th className="table-th">{t('queue.colUser')}</th>
                <th className="table-th">{t('queue.colName')}</th>
                <th className="table-th">{t('queue.colDate')}</th>
                <th className="table-th">{t('queue.colRisk')}</th>
                <th className="table-th">{t('queue.colStatus')}</th>
                <th className="table-th text-right">{t('queue.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} role="row">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr role="row">
                  <td colSpan={7} className="table-td text-center py-12 text-gray-400">
                    <div className="text-3xl mb-2">✅</div>
                    {t('queue.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={row.application_id}
                    role="row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/bange/case/${row.application_id}`)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/bange/case/${row.application_id}`)}
                    aria-label={`${t('queue.caseRow')} ${row.full_name ?? row.user_phone}`}
                  >
                    <td className="table-td text-gray-400 text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="table-td font-mono text-xs text-gray-500">
                      {row.user_phone ?? '—'}
                    </td>
                    <td className="table-td font-medium">
                      {row.full_name
                        ? <span>{row.full_name}</span>
                        : <span className="text-gray-400 font-mono text-xs">{row.user_phone ?? t('queue.noName')}</span>
                      }
                    </td>
                    <td className="table-td text-gray-500 text-sm whitespace-nowrap">
                      {row.submitted_at
                        ? formatDistanceToNow(new Date(row.submitted_at), { addSuffix: true, locale })
                        : '—'}
                    </td>
                    <td className="table-td">
                      <RiskBadge level={row.risk_level} score={row.risk_score} />
                    </td>
                    <td className="table-td">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="table-td text-right">
                      <button
                        className="btn-secondary text-xs px-3 py-1.5"
                        onClick={e => { e.stopPropagation(); navigate(`/bange/case/${row.application_id}`); }}
                        aria-label={`${t('queue.view')} ${row.full_name ?? row.user_phone}`}
                      >
                        {t('queue.view')} →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              {t('queue.page')} {page} {t('queue.of')} {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-2 py-1.5"
                aria-label={t('queue.prevPage')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-red-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    aria-label={`${t('queue.goToPage')} ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-2 py-1.5"
                aria-label={t('queue.nextPage')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </BangeLayout>
  );
}
