/**
 * Lista de usuarios con KYC — filtros, búsqueda, paginación.
 * Solo lectura desde el dashboard empresa.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKycPending } from '@/shared/hooks/useKycAdmin';
import { RiskBadge, StatusBadge } from '@/shared/components/ui/Badges';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import CompanyLayout from '../components/CompanyLayout';

const PAGE_SIZE = 20;

const ALL_STATUSES = [
  '',  'draft', 'IN_PROGRESS', 'submitted', 'PENDING_REVIEW',
  'MANUAL_REVIEW', 'AUTO_APPROVED', 'APPROVED', 'approved',
  'REJECTED', 'rejected', 'BLOCKED', 'PENDING_INFO',
];

export default function CompanyUsers() {
  const { t }     = useTranslation();
  const navigate  = useNavigate();

  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter,   setRiskFilter]   = useState('');

  const { data, isLoading } = useKycPending({
    page,
    page_size: PAGE_SIZE,
    status:     statusFilter || undefined,
    risk_level: riskFilter   || undefined,
  });

  const rows = data?.items ?? [];
  // Filtro cliente por búsqueda (nombre o teléfono)
  const filtered = search.trim()
    ? rows.filter(r =>
        r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user_phone?.includes(search)
      )
    : rows;

  const totalPages = data?.pages ?? 1;

  return (
    <CompanyLayout title={t('users.title')}>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="input pl-9"
            aria-label={t('users.searchPlaceholder')}
          />
        </div>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm" aria-label={t('users.filterStatus')}>
          <option value="">{t('users.allStatuses')}</option>
          {['MANUAL_REVIEW','AUTO_APPROVED','APPROVED','REJECTED','BLOCKED','PENDING_INFO'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm" aria-label={t('users.filterRisk')}>
          <option value="">{t('users.allRisks')}</option>
          <option value="high">🔴 {t('risk.high')}</option>
          <option value="medium">🟡 {t('risk.medium')}</option>
          <option value="low">🟢 {t('risk.low')}</option>
        </select>

        {data && (
          <span className="text-sm text-gray-500 ml-auto" aria-live="polite">
            {data.total} {t('users.total')}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label={t('users.tableLabel')}>
            <thead>
              <tr role="row">
                <th className="table-th">{t('users.colName')}</th>
                <th className="table-th">{t('users.colPhone')}</th>
                <th className="table-th">{t('users.colNationality')}</th>
                <th className="table-th">{t('users.colDate')}</th>
                <th className="table-th">{t('users.colRisk')}</th>
                <th className="table-th">{t('users.colStatus')}</th>
                <th className="table-th">{t('users.colBangeDecision')}</th>
                <th className="table-th text-right">{t('users.colDetail')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} role="row">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr role="row">
                  <td colSpan={8} className="table-td text-center py-12 text-gray-400">
                    {t('users.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.application_id} role="row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/company/users/${row.application_id}`)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/company/users/${row.application_id}`)}
                  >
                    <td className="table-td font-medium">
                      {row.full_name ?? <span className="text-gray-400 italic">{t('users.noName')}</span>}
                    </td>
                    <td className="table-td text-gray-500 font-mono text-xs">{row.user_phone ?? '—'}</td>
                    <td className="table-td text-sm">{row.nationality ?? '—'}</td>
                    <td className="table-td text-gray-500 text-sm whitespace-nowrap">
                      {row.submitted_at
                        ? formatDistanceToNow(new Date(row.submitted_at), { addSuffix: true, locale: es })
                        : '—'}
                    </td>
                    <td className="table-td"><RiskBadge level={row.risk_level} score={row.risk_score} /></td>
                    <td className="table-td"><StatusBadge status={row.status} /></td>
                    <td className="table-td">
                      {row.bank_decision ? (
                        <span className={`text-xs font-semibold ${
                          row.bank_decision === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {row.bank_decision}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-right">
                      <button
                        className="btn-secondary text-xs px-3 py-1.5"
                        onClick={e => { e.stopPropagation(); navigate(`/company/users/${row.application_id}`); }}
                        aria-label={`Ver detalle de ${row.full_name ?? row.user_phone}`}
                      >
                        {t('users.view')} →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              {t('queue.page')} {page} {t('queue.of')} {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary px-2 py-1.5" aria-label={t('queue.prevPage')}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary px-2 py-1.5" aria-label={t('queue.nextPage')}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
