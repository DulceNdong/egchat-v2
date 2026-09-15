/**
 * Detalle / edición SAR + envío a ANIF.
 * Si id==='new', muestra formulario de creación.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2, AlertTriangle } from 'lucide-react';
import { useSAR, useCreateSAR, useSendSAR } from '@/shared/hooks/useKycAdmin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { amlApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import CompanyLayout from '../components/CompanyLayout';

const INDICATORS = [
  'structuring', 'pep_involved', 'sanctions_hit', 'unusual_pattern',
  'high_risk_country', 'velocity', 'threshold_breach', 'multiple_accounts',
];

export default function CompanySARDetail() {
  const { id }        = useParams<{ id: string }>();
  const [searchParams]= useSearchParams();
  const navigate      = useNavigate();
  const { t }         = useTranslation();
  const qc            = useQueryClient();
  const isNew         = id === 'new';
  const txId          = searchParams.get('tx');

  const { data: sar }  = useSAR(id!);
  const createMut      = useCreateSAR();
  const sendMut        = useSendSAR();

  const [form, setForm] = useState({
    report_type:  'SAR' as 'SAR' | 'CTR' | 'STR',
    description:  '',
    indicators:   [] as string[],
    subject_name: '',
    amount_involved: '',
    currency:     'XAF',
    transaction_ids: txId ? [txId] : [] as string[],
  });
  const [confirmSend, setConfirmSend] = useState(false);

  // Rellenar formulario con datos existentes
  useEffect(() => {
    if (sar && !isNew) {
      setForm({
        report_type:    sar.report_type,
        description:    sar.description,
        indicators:     sar.indicators as string[],
        subject_name:   sar.description, // simplificado
        amount_involved:sar.amount_involved ?? '',
        currency:       sar.currency,
        transaction_ids:sar.transaction_ids,
      });
    }
  }, [sar, isNew]);

  const updateMut = useMutation({
    mutationFn: (data: typeof form) =>
      amlApi.updateSAR(id!, {
        description: data.description,
        indicators:  data.indicators,
        status:      'PENDING_REVIEW',
      }),
    onSuccess: () => {
      toast.success(t('sar.savedOk'));
      qc.invalidateQueries({ queryKey: ['aml', 'sars'] });
      qc.invalidateQueries({ queryKey: ['aml', 'sar', id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  async function handleSave() {
    if (isNew) {
      await createMut.mutateAsync({
        report_type:     form.report_type,
        description:     form.description,
        indicators:      form.indicators,
        subject_name:    form.subject_name || undefined,
        amount_involved: form.amount_involved ? Number(form.amount_involved) : undefined,
        currency:        form.currency,
        transaction_ids: form.transaction_ids,
      });
      navigate('/company/sar');
    } else {
      updateMut.mutate(form);
    }
  }

  async function handleSend() {
    if (!id || isNew) return;
    await sendMut.mutateAsync(id);
    navigate('/company/sar');
  }

  const canSend = !isNew && sar && ['DRAFT', 'APPROVED', 'PENDING_REVIEW'].includes(sar.status);
  const alreadySent = sar && ['SENT_TO_ANIF', 'ACKNOWLEDGED'].includes(sar.status);

  return (
    <CompanyLayout title={isNew ? t('sar.createTitle') : `SAR — ${id?.slice(0, 8)}…`}>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/company/sar')} className="btn-secondary gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          ← {t('sar.backToList')}
        </button>
        {!isNew && sar && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {t('sar.detectedAt')} {format(new Date(sar.detected_at), 'dd/MM/yyyy HH:mm')}
            </span>
            {sar.overdue && (
              <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-1 rounded-full font-medium">
                <AlertTriangle className="w-3 h-3" />
                {t('sar.overdue72h')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-6 space-y-4">

            <div>
              <label className="label">{t('sar.reportType')} <span className="text-red-500">*</span></label>
              <select value={form.report_type}
                onChange={e => setForm(f => ({ ...f, report_type: e.target.value as 'SAR' | 'CTR' | 'STR' }))}
                className="input" disabled={alreadySent}>
                <option value="SAR">SAR — Suspicious Activity Report</option>
                <option value="CTR">CTR — Currency Transaction Report (≥5M XAF)</option>
                <option value="STR">STR — Suspicious Transaction Report</option>
              </select>
            </div>

            <div>
              <label className="label">{t('sar.description')} <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input resize-none h-32 text-sm"
                placeholder={t('sar.descriptionPlaceholder')}
                minLength={20}
                disabled={alreadySent}
                aria-required="true"
              />
            </div>

            <div>
              <label className="label">{t('sar.indicators')}</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {INDICATORS.map(ind => (
                  <label key={ind} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox"
                      checked={form.indicators.includes(ind)}
                      onChange={e => setForm(f => ({
                        ...f,
                        indicators: e.target.checked
                          ? [...f.indicators, ind]
                          : f.indicators.filter(i => i !== ind),
                      }))}
                      disabled={alreadySent}
                      className="rounded border-gray-300"
                    />
                    {ind}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('sar.subjectName')}</label>
                <input type="text" value={form.subject_name}
                  onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))}
                  className="input text-sm" disabled={alreadySent} />
              </div>
              <div>
                <label className="label">{t('sar.amount')}</label>
                <div className="flex gap-2">
                  <input type="number" value={form.amount_involved}
                    onChange={e => setForm(f => ({ ...f, amount_involved: e.target.value }))}
                    className="input text-sm flex-1" disabled={alreadySent} />
                  <select value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="input w-20 text-sm" disabled={alreadySent}>
                    <option>XAF</option><option>EUR</option><option>USD</option>
                  </select>
                </div>
              </div>
            </div>

            {txId && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  📎 {t('sar.linkedTx')}: <span className="font-mono">{txId.slice(0, 16)}…</span>
                </p>
              </div>
            )}
          </div>

          {/* Acciones */}
          {!alreadySent && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending || !form.description}
                className="btn-primary gap-2"
              >
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isNew ? t('sar.create') : t('sar.save')}
              </button>

              {canSend && !confirmSend && (
                <button onClick={() => setConfirmSend(true)} className="btn-secondary gap-2">
                  <Send className="w-4 h-4" />
                  {t('sar.sendToANIF')}
                </button>
              )}

              {confirmSend && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{t('sar.confirmSend')}</p>
                  <button onClick={handleSend} disabled={sendMut.isPending}
                    className="btn-danger gap-2 text-xs">
                    {sendMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    {t('sar.confirmSendBtn')}
                  </button>
                  <button onClick={() => setConfirmSend(false)} className="btn-secondary text-xs">
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info lateral */}
        <div className="space-y-5">
          {!isNew && sar && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-sm">{t('sar.info')}</h3>
              <dl className="space-y-2 text-sm">
                {[
                  [t('sar.status'),    sar.status],
                  [t('sar.anifRef'),   sar.anif_reference ?? '—'],
                  [t('sar.sentAt'),    sar.sent_at ? format(new Date(sar.sent_at), 'dd/MM/yyyy HH:mm') : '—'],
                  [t('sar.reporter'),  sar.reported_by_email ?? '—'],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3">{t('sar.legalNote')}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('sar.legalText')}
            </p>
            <p className="text-xs text-gray-400 mt-2 font-medium">
              ⏰ {t('sar.deadline72h')}
            </p>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
