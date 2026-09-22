/**
 * Lista de SAR — tabs por estado, acciones crear/ver/enviar.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, AlertTriangle } from 'lucide-react';
import { useSARs } from '@/shared/hooks/useKycAdmin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import CompanyLayout from '../components/CompanyLayout';

const SAR_TABS = [
  { key: '',             label: 'Todos'           },
  { key: 'DRAFT',        label: 'Borrador'        },
  { key: 'PENDING_REVIEW', label: 'En revisión'   },
  { key: 'APPROVED',     label: 'Aprobados'       },
  { key: 'SENT_TO_ANIF', label: 'Enviados ANIF'   },
  { key: 'ACKNOWLEDGED', label: 'Acuse recibo'    },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  APPROVED:       'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  SENT_TO_ANIF:   'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  ACKNOWLEDGED:   'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  CLOSED:         'bg-gray-100 text-gray-400',
};

export default function CompanySAR() {
  const { t }     = useTranslation();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const txId      = searchParams.get('tx');

  const [activeTab, setActiveTab] = useState('');
  const [page,      setPage]      = useState(1);

  const { data, isLoading } = useSARs({
    page,
    page_size: 20,
    status: activeTab || undefined,
  });

  const rows = data?.items ?? [];
  const overdueCount = rows.filter(s => s.overdue).length;

  return (
    <CompanyLayout title={t('sar.title')}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">{t('sar.subtitle')}</h2>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-1 rounded-full font-medium">
              <Clock className="w-3 h-3" />
              {overdueCount} {t('sar.overdue')}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/company/sar/new' + (txId ? `?tx=${txId}` : ''))}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('sar.create')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" role="tablist">
        {SAR_TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === '' && data && (
              <span className="ml-1.5 text-xs opacity-75">({data.total})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label={t('sar.tableLabel')}>
            <thead>
              <tr role="row">
                <th className="table-th">{t('sar.colType')}</th>
                <th className="table-th">{t('sar.colDescription')}</th>
                <th className="table-th">{t('sar.colAmount')}</th>
                <th className="table-th">{t('sar.colStatus')}</th>
                <th className="table-th">{t('sar.colDeadline')}</th>
                <th className="table-th">{t('sar.colANIF')}</th>
                <th className="table-th text-right">{t('sar.colActions')}</th>
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
                    {t('sar.empty')}
                  </td>
                </tr>
              ) : (
                rows.map(sar => (
                  <tr key={sar.id} role="row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/company/sar/${sar.id}`)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/company/sar/${sar.id}`)}
                  >
                    <td className="table-td">
                      <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {sar.report_type}
                      </span>
                    </td>
                    <td className="table-td max-w-[200px]">
                      <p className="truncate text-sm">{sar.description}</p>
                    </td>
                    <td className="table-td text-sm font-medium whitespace-nowrap">
                      {sar.amount_involved
                        ? `${Number(sar.amount_involved).toLocaleString('es-ES')} ${sar.currency}`
                        : '—'}
                    </td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[sar.status] ?? ''}`}>
                        {sar.status}
                      </span>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {sar.deadline_at ? (
                        <span className={`text-sm flex items-center gap-1 ${sar.overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {sar.overdue && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
                          {formatDistanceToNow(new Date(sar.deadline_at), { addSuffix: true, locale: es })}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td text-sm text-gray-500">
                      {sar.anif_reference ?? '—'}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/company/sar/${sar.id}`); }}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        {t('sar.view')} →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CompanyLayout>
  );
}
