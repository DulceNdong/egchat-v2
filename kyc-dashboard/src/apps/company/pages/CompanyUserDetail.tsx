/**
 * Detalle de usuario — solo lectura para el dashboard empresa.
 * Reutiliza la misma estructura que BangeCaseDetail pero sin botones de acción.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useKycDetail, useKycAudit } from '@/shared/hooks/useKycAdmin';
import { RiskBadge, StatusBadge } from '@/shared/components/ui/Badges';
import { Timeline } from '@/shared/components/ui/Timeline';
import { DocumentViewer } from '@/shared/components/ui/DocumentViewer';
import { ScoreBar } from '@/shared/components/ui/ScoreBar';
import { format } from 'date-fns';
import CompanyLayout from '../components/CompanyLayout';

export default function CompanyUserDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const { data: kyc, isLoading } = useKycDetail(id!);
  const { data: audit }          = useKycAudit(id!);

  if (isLoading) {
    return (
      <CompanyLayout title="Cargando…">
        <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </CompanyLayout>
    );
  }

  if (!kyc) {
    return (
      <CompanyLayout title="No encontrado">
        <div className="text-center py-16">
          <p className="text-gray-400">{t('case.notFound')}</p>
          <button onClick={() => navigate('/company/users')} className="btn-primary mt-4">
            ← {t('users.backToList')}
          </button>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title={`${t('case.title')} — ${kyc.full_name ?? kyc.user_phone ?? id}`}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/company/users')} className="btn-secondary gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          ← {t('users.backToList')}
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <StatusBadge status={kyc.status} />
          <RiskBadge level={kyc.risk_level} score={kyc.risk_score} />
        </div>
      </div>

      {/* Banner solo lectura */}
      <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        👁️ {t('users.readOnlyNote')}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">

          {/* Datos personales */}
          <section className="card p-6" aria-labelledby="user-personal">
            <h2 id="user-personal" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.personal')}
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                [t('case.fullName'),     kyc.full_name],
                [t('case.birthDate'),    kyc.birth_date ? format(new Date(kyc.birth_date), 'dd/MM/yyyy') : '—'],
                [t('case.nationality'),  kyc.nationality],
                [t('case.phone'),        kyc.user_phone],
                [t('case.profession'),   kyc.profession],
                [t('case.sourceOfFunds'),kyc.source_of_funds],
                [t('case.pep'),          kyc.politically_exposed ? '⚠️ Sí' : '✅ No'],
                [t('case.docType'),      kyc.doc_type],
                [t('case.docNumber'),    kyc.doc_number],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Documentos */}
          <section className="card p-6" aria-labelledby="user-docs">
            <h2 id="user-docs" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.documents')}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
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
                <span className="text-lg">
                  {kyc.liveness_passed === true ? '✅' : kyc.liveness_passed === false ? '❌' : '—'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <DocumentViewer applicationId={kyc.id} docType="front"  label={t('case.docFront')} />
              <DocumentViewer applicationId={kyc.id} docType="back"   label={t('case.docBack')}  />
              <DocumentViewer applicationId={kyc.id} docType="selfie" label={t('case.selfie')}   />
            </div>
          </section>

          {/* Screening */}
          <section className="card p-6" aria-labelledby="user-screening">
            <h2 id="user-screening" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.screening')}
            </h2>
            {kyc.screening_results.length === 0 ? (
              <p className="text-sm text-gray-400">{t('case.noScreening')}</p>
            ) : (
              <div className="space-y-2">
                {kyc.screening_results.map(sr => (
                  <div key={sr.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-lg">{sr.match_found ? '🚨' : '✅'}</span>
                    <span className="font-medium text-sm flex-1">{sr.screening_type}</span>
                    <span className="text-xs text-gray-400">{sr.provider}</span>
                    {sr.match_found && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">MATCH</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Timeline */}
        <div className="card p-6">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
            {t('case.history')}
          </h2>
          <Timeline entries={audit?.audit_trail ?? []} />
        </div>
      </div>
    </CompanyLayout>
  );
}
