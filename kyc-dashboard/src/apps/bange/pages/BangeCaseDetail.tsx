/**
 * Detalle completo de un caso KYC — vista BANGE.
 * 6 secciones: datos personales, documentos, screening, historial, acciones, notas.
 * + Banner de estado del monedero + alerta de expiración de documento.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useKycDetail, useKycAudit } from '@/shared/hooks/useKycAdmin';
import { useCanDo } from '@/core/auth/RoleGuard';
import { RiskBadge, StatusBadge } from '@/shared/components/ui/Badges';
import { Timeline } from '@/shared/components/ui/Timeline';
import { DocumentViewer } from '@/shared/components/ui/DocumentViewer';
import { ScoreBar } from '@/shared/components/ui/ScoreBar';
import { ActionModal } from '../components/ActionModal';
import BangeLayout from '../components/BangeLayout';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

type ActionType = 'approve' | 'reject' | 'request-info' | 'block' | null;

// ── Qué datos mínimos se necesitan para activar el monedero ──────
function getMissingFields(kyc: any): string[] {
  const missing: string[] = [];
  if (!kyc.full_name)        missing.push('Nombre completo');
  if (!kyc.birth_date)       missing.push('Fecha de nacimiento');
  if (!kyc.nationality)      missing.push('Nacionalidad');
  if (!kyc.doc_type)         missing.push('Tipo de documento');
  if (!kyc.doc_number)       missing.push('Número de documento');
  if (!kyc.has_front_doc)    missing.push('Foto frontal del documento');
  if (!kyc.has_selfie)       missing.push('Selfie biométrica');
  return missing;
}

// ── Banner de estado del monedero ────────────────────────────────
function WalletStatusBanner({ kyc }: { kyc: any }) {
  const walletStatus  = kyc.wallet_kyc_status;
  const kycApproved   = ['approved', 'APPROVED', 'AUTO_APPROVED'].includes(kyc.status);
  const missingFields = getMissingFields(kyc);

  // Monedero ya activo
  if (walletStatus === 'approved' || kycApproved) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3" role="status">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            ✅ Monedero activo
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
            El monedero de este usuario ha sido dado de alta correctamente.
          </p>
        </div>
      </div>
    );
  }

  // Rechazado / bloqueado
  if (['rejected', 'REJECTED', 'BLOCKED'].includes(kyc.status)) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3" role="status">
        <XCircle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            ❌ Monedero no activado
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            Solicitud {kyc.status === 'BLOCKED' ? 'bloqueada' : 'rechazada'}.
            {kyc.rejection_reason ? ` Motivo: ${kyc.rejection_reason}` : ''}
          </p>
        </div>
      </div>
    );
  }

  // Datos incompletos
  if (missingFields.length > 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3" role="status">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            ⚠️ Faltan datos para activar el monedero
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            El usuario debe completar los siguientes campos antes de poder dar de alta el monedero:
          </p>
          <ul className="mt-1 space-y-0.5">
            {missingFields.map(f => (
              <li key={f} className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <span aria-hidden="true">•</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Pendiente de revisión
  return (
    <div className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-4 py-3" role="status">
      <Clock className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          🔵 Pendiente de activación
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
          Todos los datos están completos. Revisa y aprueba para dar de alta el monedero.
        </p>
      </div>
    </div>
  );
}

// ── Alerta de expiración de documento ───────────────────────────
function DocExpiryAlert({ expiryDate, daysLeft }: { expiryDate: string | null; daysLeft: number | null }) {
  if (!expiryDate || daysLeft === null) return null;

  const isExpired  = daysLeft <= 0;
  const isCritical = daysLeft > 0 && daysLeft <= 30;
  const isWarning  = daysLeft > 30 && daysLeft <= 90;

  if (!isExpired && !isCritical && !isWarning) return null;

  const formatted = format(new Date(expiryDate), 'dd/MM/yyyy', { locale: es });

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
        isExpired
          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
          : isCritical
          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
      }`}
      role="alert"
    >
      <AlertTriangle
        className={`w-5 h-5 shrink-0 mt-0.5 ${isExpired ? 'text-red-600' : isCritical ? 'text-orange-600' : 'text-amber-600'}`}
        aria-hidden="true"
      />
      <div>
        <p className={`text-sm font-semibold ${isExpired ? 'text-red-800 dark:text-red-200' : isCritical ? 'text-orange-800 dark:text-orange-200' : 'text-amber-800 dark:text-amber-200'}`}>
          {isExpired
            ? `⛔ Documento expirado el ${formatted}`
            : `📅 Documento expira el ${formatted} (${daysLeft} días)`}
        </p>
        <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-600 dark:text-red-400' : isCritical ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {isExpired
            ? 'El usuario debe renovar su documento para seguir usando el monedero.'
            : isCritical
            ? 'Se notificará al usuario que debe renovar su documento pronto.'
            : 'El documento expira en menos de 90 días. Se recomienda avisar al usuario.'}
        </p>
      </div>
    </div>
  );
}

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

  const isFinalState = ['approved', 'APPROVED', 'AUTO_APPROVED', 'BLOCKED', 'rejected', 'REJECTED'].includes(kyc.status);

  // Días hasta expiración calculado en el cliente como fallback
  const expiryDate = kyc.doc_expiry_date ?? null;
  const daysLeft   = expiryDate
    ? differenceInDays(new Date(expiryDate), new Date())
    : (kyc.days_to_expiry ?? null);

  return (
    <BangeLayout title={`${t('case.title')} — ${kyc.full_name ?? kyc.user_phone ?? id}`}>

      {/* Back + header */}
      <div className="flex items-center gap-4 mb-4">
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

      {/* ── Banners de estado (monedero + expiración) ── */}
      <div className="space-y-3 mb-6">
        <WalletStatusBanner kyc={kyc} />
        <DocExpiryAlert expiryDate={expiryDate} daysLeft={daysLeft} />
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
                { label: t('case.fullName'),       value: kyc.full_name },
                { label: t('case.birthDate'),      value: kyc.birth_date ? format(new Date(kyc.birth_date), 'dd/MM/yyyy') : null },
                { label: t('case.nationality'),    value: kyc.nationality },
                { label: t('case.phone'),          value: kyc.user_phone },
                { label: t('case.profession'),     value: kyc.profession },
                { label: t('case.employer'),       value: kyc.employer },
                { label: t('case.income'),         value: kyc.monthly_income_range },
                { label: t('case.sourceOfFunds'),  value: kyc.source_of_funds },
                { label: t('case.pep'),            value: kyc.politically_exposed ? '⚠️ Sí' : '✅ No' },
                { label: t('case.docType'),        value: kyc.doc_type },
                { label: t('case.docNumber'),      value: kyc.doc_number },
                {
                  label: t('case.docExpiry'),
                  value: expiryDate
                    ? (
                      <span className={daysLeft !== null && daysLeft <= 30 ? 'text-red-600 font-bold' : daysLeft !== null && daysLeft <= 90 ? 'text-amber-600 font-semibold' : undefined}>
                        {format(new Date(expiryDate), 'dd/MM/yyyy')}
                        {daysLeft !== null && daysLeft <= 90 && ` (${daysLeft}d)`}
                      </span>
                    )
                    : null,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5">{value ?? <span className="text-gray-300">—</span>}</dd>
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
                    {kyc.liveness_passed === true  ? t('case.passed')
                     : kyc.liveness_passed === false ? t('case.failed')
                     : t('case.notRun')}
                  </span>
                </div>
              </div>
            </div>

            {/* Disponibilidad de imágenes */}
            <div className="flex gap-3 mb-4 text-xs text-gray-500">
              <span className={kyc.has_front_doc ? 'text-green-600' : 'text-red-400'}>
                {kyc.has_front_doc ? '✅' : '❌'} Foto frontal
              </span>
              <span className={kyc.has_back_doc ? 'text-green-600' : 'text-gray-400'}>
                {kyc.has_back_doc ? '✅' : '—'} Foto trasera
              </span>
              <span className={kyc.has_selfie ? 'text-green-600' : 'text-red-400'}>
                {kyc.has_selfie ? '✅' : '❌'} Selfie
              </span>
            </div>

            {/* Visor de documentos (sin descarga) */}
            <div className="grid grid-cols-3 gap-4">
              <DocumentViewer applicationId={kyc.id} docType="front"  label={t('case.docFront')} />
              <DocumentViewer applicationId={kyc.id} docType="back"   label={t('case.docBack')}  />
              <DocumentViewer applicationId={kyc.id} docType="selfie" label={t('case.selfie')}   />
            </div>
          </section>

          {/* 3. Screening */}
          <section className="card p-6" aria-labelledby="screening-section">
            <h2 id="screening-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
              {t('case.screening')}
            </h2>

            {(kyc.screening_results ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">{t('case.noScreening')}</p>
            ) : (
              <div className="space-y-3">
                {kyc.screening_results.map((sr: any) => (
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
                <ScoreBar value={kyc.risk_score / 100} threshold={0.4} showPercent={false} />
                <span className="text-sm font-mono text-gray-500">{kyc.risk_score}/100</span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Columna derecha (1/3) ── */}
        <div className="space-y-6">

          {/* 4. Acciones — dar de alta el monedero */}
          {canAct && !isFinalState && (
            <section className="card p-6" aria-labelledby="actions-section">
              <h2 id="actions-section" className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
                {t('case.actions')}
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setAction('approve')}
                  className="btn-primary w-full justify-center"
                  title="Dar de alta el monedero del usuario"
                >
                  ✅ {t('case.approve')} — Activar monedero
                </button>
                <button onClick={() => setAction('reject')}       className="btn-danger  w-full justify-center">❌ {t('case.reject')}</button>
                <button onClick={() => setAction('request-info')} className="btn-warning w-full justify-center">⚠️ {t('case.requestInfo')}</button>
                <button
                  onClick={() => setAction('block')}
                  className="inline-flex w-full justify-center items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-medium transition-colors"
                >
                  🚫 {t('case.block')}
                </button>
              </div>
            </section>
          )}

          {isFinalState && (
            <div className="card p-4 text-center space-y-2">
              <StatusBadge status={kyc.status} />
              <p className="text-xs text-gray-400">{t('case.finalState')}</p>
              {kyc.rejection_reason && (
                <p className="text-xs text-red-500">{kyc.rejection_reason}</p>
              )}
              {/* Estado del monedero tras decisión final */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 mb-1">Estado del monedero</p>
                <p className={`text-sm font-bold ${
                  kyc.wallet_kyc_status === 'approved' ? 'text-green-600'
                  : kyc.wallet_kyc_status === 'rejected' ? 'text-red-500'
                  : kyc.wallet_kyc_status === 'suspended' ? 'text-orange-500'
                  : 'text-gray-400'
                }`}>
                  {kyc.wallet_kyc_status === 'approved'  ? '✅ Activo'
                   : kyc.wallet_kyc_status === 'rejected' ? '❌ Rechazado'
                   : kyc.wallet_kyc_status === 'suspended'? '⏸ Suspendido'
                   : '— Sin estado'}
                </p>
              </div>
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
