/**
 * Monitorización AML — transacciones flaggeadas.
 * Tabla con filtros + drawer de detalle + acciones.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFlaggedTransactions } from '@/shared/hooks/useKycAdmin';
import { amlApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CompanyLayout from '../components/CompanyLayout';
import type { FlaggedTransaction } from '@/types';

const FLAG_TYPE_COLORS: Record<string, string> = {
  STRUCTURING:      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  SANCTIONS_HIT:    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  THRESHOLD_BREACH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  VELOCITY:         'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PEP_INVOLVED:     'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  UNUSUAL_PATTERN:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  HIGH_RISK_COUNTRY:'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  MANUAL:           'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function CompanyAML() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page,        setPage]       = useState(1);
  const [flagFilter,  setFlagFilter] = useState('');
  const [revFilter,   setRevFilter]  = useState<'' | 'true' | 'false'>('');
  const [selected,    setSelected]   = useState<FlaggedTransaction | null>(null);
  const [reviewNotes, setReviewNotes]= useState('');

  const { data, isLoading } = useFlaggedTransactions({
    page, page_size: 20,
    reviewed:  revFilter !== '' ? revFilter === 'true' : undefined,
    flag_type: flagFilter || undefined,
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      amlApi.reviewTransaction(id, notes, false),
    onSuccess: () => {
      toast.success(t('aml.reviewedOk'));
      qc.invalidateQueries({ queryKey: ['aml', 'flagged'] });
      setSelected(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const rows = data?.items ?? [];

  return (
    <CompanyLayout title={t('aml.title')}>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />

        <select value={flagFilter} onChange={e => { setFlagFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm" aria-label={t('aml.filterType')}>
          <option value="">{t('aml.allTypes')}</option>
          {Object.keys(FLAG_TYPE_COLORS).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <select value={revFilter} onChange={e => { setRevFilter(e.target.value as '' | 'true' | 'false'); setPage(1); }}
          className="input w-auto text-sm" aria-label={t('aml.filterReviewed')}>
          <option value="">{t('aml.allReviewed')}</option>
          <option value="false">{t('aml.pendingReview')}</option>
          <option value="true">{t('aml.reviewed')}</option>
        </select>

        {data && (
          <span className="text-sm text-gray-500 ml-auto" aria-live="polite">
            {data.total} {t('aml.transactions')}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label={t('aml.tableLabel')}>
            <thead>
              <tr role="row">
                <th className="table-th">{t('aml.colUser')}</th>
                <th className="table-th">{t('aml.colAmount')}</th>
                <th className="table-th">{t('aml.colType')}</th>
                <th className="table-th">{t('aml.colFlag')}</th>
                <th className="table-th">{t('aml.colFlaggedAt')}</th>
                <th className="table-th text-center">{t('aml.colReviewed')}</th>
                <th className="table-th text-right">{t('aml.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
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
                    ✅ {t('aml.noFlagged')}
                  </td>
                </tr>
              ) : (
                rows.map(tx => (
                  <tr key={tx.id} role="row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="table-td font-mono text-xs text-gray-500">{tx.user_id.slice(0, 8)}…</td>
                    <td className="table-td font-semibold">
                      {Number(tx.amount).toLocaleString('es-ES')} {tx.currency}
                    </td>
                    <td className="table-td text-sm text-gray-500">{tx.type}</td>
                    <td className="table-td">
                      {tx.flag_type && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FLAG_TYPE_COLORS[tx.flag_type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {tx.flag_type}
                        </span>
                      )}
                    </td>
                    <td className="table-td text-gray-500 text-sm whitespace-nowrap">
                      {tx.flagged_at ? format(new Date(tx.flagged_at), 'dd/MM/yyyy HH:mm') : '—'}
                    </td>
                    <td className="table-td text-center">
                      <span aria-label={tx.aml_reviewed ? t('aml.reviewed') : t('aml.pendingReview')}>
                        {tx.aml_reviewed ? '✅' : '⏳'}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelected(tx); setReviewNotes(''); }}
                          className="btn-secondary text-xs px-3 py-1.5"
                          aria-label={`${t('aml.detail')} ${tx.id.slice(0,8)}`}
                        >
                          {t('aml.detail')}
                        </button>
                        <button
                          onClick={() => navigate(`/company/sar?tx=${tx.id}`)}
                          className="btn-warning text-xs px-3 py-1.5"
                          aria-label={t('aml.createSAR')}
                        >
                          {t('aml.createSAR')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(data?.total ?? 0) > 20 && (
          <div className="flex justify-center gap-2 p-3 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">←</button>
            <span className="px-3 py-1.5 text-sm">{page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={(data?.total ?? 0) <= page * 20} className="btn-secondary px-3 py-1.5 text-sm">→</button>
          </div>
        )}
      </div>

      {/* Drawer de detalle */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="aml-drawer-title"
          onClick={() => setSelected(null)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 id="aml-drawer-title" className="font-semibold">{t('aml.txDetail')}</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('common.close')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <dl className="space-y-3">
                {[
                  [t('aml.txId'),     selected.id],
                  [t('aml.userId'),   selected.user_id],
                  [t('aml.amount'),   `${Number(selected.amount).toLocaleString('es-ES')} ${selected.currency}`],
                  [t('aml.txType'),   selected.type],
                  [t('aml.flagType'), selected.flag_type],
                  [t('aml.reason'),   selected.flag_reason],
                  [t('aml.flaggedAt'),selected.flagged_at ? format(new Date(selected.flagged_at), 'dd/MM/yyyy HH:mm') : '—'],
                  [t('aml.reviewed'), selected.aml_reviewed ? '✅ Sí' : '⏳ No'],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-sm font-medium mt-0.5 break-all">{value ?? '—'}</dd>
                  </div>
                ))}
              </dl>

              {!selected.aml_reviewed && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="label">{t('aml.reviewNotes')}</label>
                  <textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="input resize-none h-20 text-sm"
                    placeholder={t('aml.reviewNotesPlaceholder')}
                  />
                  <button
                    onClick={() => reviewMut.mutate({ id: selected.id, notes: reviewNotes })}
                    disabled={reviewMut.isPending}
                    className="btn-primary w-full justify-center mt-3"
                  >
                    {reviewMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('aml.markReviewed')}
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate(`/company/sar?tx=${selected.id}`)}
                className="btn-warning w-full justify-center"
              >
                {t('aml.createSARFromTx')}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  );
}
