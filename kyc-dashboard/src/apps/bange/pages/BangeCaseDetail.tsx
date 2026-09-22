/**
 * Detalle completo de un caso KYC — vista BANGE.
 * 6 secciones: datos personales, documentos, screening, historial, acciones, notas.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useKycDetail, useKycAudit } from '@/shared/hooks/useKycAdmin';
import { useCanDo } from '@/core/auth/RoleGuard';
import { RiskBadge, StatusBadge } from '@/shared/components/ui/Badges';
import { Timeline } from '@/shared/components/ui/Timeline';
import { DocumentViewer } from '@/shared/components/ui/DocumentViewer';
import { ScoreBar } from '@/shared/components/ui/ScoreBar';
import { ActionModal } from '../components/ActionModal';
import BangeLayout from '../components/BangeLayout';
import { format } from 'date-fns';

type ActionType = 'approve' | 'reject' | 'request-info' | 'block' | null;

export default function BangeCaseDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const canAct    = useCanDo(['COMPLIANCE_OFFICER', 'SUPER_ADMIN']);

  const { data: kyc,   isLoading }  = useKycDetail(id!);
  const { data: audit }             = useKycAudit(id!);
  const [activeAction, setAction]   = useState<ActionType>(null);

  if (isLoading) {
    return (
      <BangeLayout title="Cargando…">
        <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="sr-only">Cargando caso…</span>
        </div>
      </BangeLayout>
    );
  }

  if (!kyc) {
    return (
      <BangeLayout title="Caso no encontrado">
        <div className="text-center py-16">
          <p className="text-gray-400">{t('case.notFound')}</p>
          <button onClick={() => navigate('/bange/queue')} className="btn-primary mt-4">
            {t('queue.backToQueue')}
          </button>
        </div>
      </BangeLayout>
    );
  }

  const isFinalState = ['approved', 'APPROVED', 'BLOCKED', 'rejected', 'REJECTED'].includes(kyc.status);

  return (
    <BangeLayout title={`${t('case.title')} — ${kyc.full_name ?? kyc.user_phone ?? id}`}>

      {/* Back + header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/bange/queue')}
          className="btn-secondary gap-1.5"
          aria-label={t('queue.backToQueue')}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('queue.backToQueue')}
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <StatusBadge status={kyc.status} />
          <RiskBadge level={kyc.risk_level} score={kyc.risk_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Columna izquierda (2/3) ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* 1. Datos personales */}
          <section className="card p-6" aria-labelledby="personal-section">
            <h2 id="personal-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.personal')}
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: t('case.fullName'),    value: kyc.full_name },
                { label: t('case.birthDate'),   value: kyc.birth_date ? format(new Date(kyc.birth_date), 'dd/MM/yyyy') : '—' },
                { label: t('case.nationality'), value: kyc.nationality },
                { label: t('case.phone'),       value: kyc.user_phone },
                { label: t('case.profession'),  value: kyc.profession },
                { label: t('case.sourceOfFunds'), value: kyc.source_of_funds },
                { label: t('case.pep'),         value: kyc.politically_exposed ? '⚠️ Sí' : '✅ No' },
                { label: t('case.docType'),     value: kyc.doc_type },
                { label: t('case.docNumber'),   value: kyc.doc_number },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 2. Documentos */}
          <section className="card p-6" aria-labelledby="docs-section">
            <h2 id="docs-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.documents')}
            </h2>

            {/* Métricas biométricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('case.ocrConfidence')}</p>
                <ScoreBar value={kyc.ocr_confidence} threshold={0.70} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('case.faceMatch')}</p>
                <ScoreBar value={kyc.face_match_score} threshold={0.80} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('case.liveness')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg" aria-hidden="true">
                    {kyc.liveness_passed === true ? '✅' : kyc.liveness_passed === false ? '❌' : '—'}
                  </span>
                  <span className="text-sm font-medium">
                    {kyc.liveness_passed === true ? t('case.passed')
                     : kyc.liveness_passed === false ? t('case.failed')
                     : t('case.notRun')}
                  </span>
                </div>
              </div>
            </div>

            {/* Visor de documentos (sin descarga) */}
            <div className="grid grid-cols-3 gap-4">
              <DocumentViewer applicationId={kyc.id} docType="front" label={t('case.docFront')} />
              <DocumentViewer applicationId={kyc.id} docType="back"  label={t('case.docBack')}  />
              <DocumentViewer applicationId={kyc.id} docType="selfie" label={t('case.selfie')}  />
            </div>
          </section>

          {/* 3. Screening */}
          <section className="card p-6" aria-labelledby="screening-section">
            <h2 id="screening-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.screening')}
            </h2>

            {kyc.screening_results.length === 0 ? (
              <p className="text-sm text-gray-400">{t('case.noScreening')}</p>
            ) : (
              <div className="space-y-3">
                {kyc.screening_results.map(sr => (
                  <div key={sr.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-lg mt-0.5" aria-hidden="true">
                      {sr.match_found ? '🚨' : '✅'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{sr.screening_type}</span>
                        {sr.match_found && (
                          <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                            MATCH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{sr.provider}</p>
                      {sr.match_found && sr.match_details && (
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(sr.match_details, null, 2)}
                        </pre>
                      )}
                    </div>
                    {sr.match_score != null && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {(sr.match_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Factores de riesgo */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-500 mb-2">{t('case.riskFactors')}</p>
              <div className="flex items-center gap-3">
                <RiskBadge level={kyc.risk_level} score={kyc.risk_score} showScore />
                <ScoreBar value={kyc.risk_score / 18} threshold={8 / 18} showPercent={false} />
                <span className="text-sm font-mono text-gray-500">{kyc.risk_score}/18</span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Columna derecha (1/3) ── */}
        <div className="space-y-6">

          {/* 4. Acciones */}
          {canAct && !isFinalState && (
            <section className="card p-6" aria-labelledby="actions-section">
              <h2 id="actions-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
                {t('case.actions')}
              </h2>
              <div className="space-y-2">
                <button onClick={() => setAction('approve')}      className="btn-primary  w-full justify-center">✅ {t('case.approve')}</button>
                <button onClick={() => setAction('reject')}       className="btn-danger   w-full justify-center">❌ {t('case.reject')}</button>
                <button onClick={() => setAction('request-info')} className="btn-warning  w-full justify-center">⚠️ {t('case.requestInfo')}</button>
                <button onClick={() => setAction('block')}
                  className="inline-flex w-full justify-center items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-medium transition-colors">
                  🚫 {t('case.block')}
                </button>
              </div>
            </section>
          )}

          {isFinalState && (
            <div className="card p-4 text-center">
              <StatusBadge status={kyc.status} />
              <p className="text-xs text-gray-400 mt-2">{t('case.finalState')}</p>
              {kyc.rejection_reason && (
                <p className="text-xs text-red-500 mt-1">{kyc.rejection_reason}</p>
              )}
            </div>
          )}

          {/* 5. Timeline */}
          <section className="card p-6" aria-labelledby="timeline-section">
            <h2 id="timeline-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.history')}
            </h2>
            <Timeline entries={audit?.audit_trail ?? []} />
          </section>

          {/* 6. Notas internas */}
          <section className="card p-6" aria-labelledby="notes-section">
            <h2 id="notes-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">
              {t('case.internalNotes')}
            </h2>
            <textarea
              className="input resize-none h-24 text-sm"
              placeholder={t('case.notesPlaceholder')}
              defaultValue={kyc.reviewer_notes ?? ''}
              readOnly={!canAct}
              aria-label={t('case.internalNotes')}
            />
            {canAct && (
              <button className="btn-secondary text-xs mt-2">{t('case.saveNotes')}</button>
            )}
          </section>
        </div>
      </div>

      {/* Modal de acción */}
      {activeAction && (
        <ActionModal
          applicationId={kyc.id}
          action={activeAction}
          fullName={kyc.full_name}
          onClose={() => setAction(null)}
          onSuccess={() => { setAction(null); navigate('/bange/queue'); }}
        />
      )}
    </BangeLayout>
  );
}
