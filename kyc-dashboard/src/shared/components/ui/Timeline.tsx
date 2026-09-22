/**
 * Timeline de auditoría — renderiza el historial de acciones KYC.
 * Accesible: lista ordenada con role="list".
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditEntry } from '@/types';

const ACTION_COLORS: Record<string, string> = {
  KYC_INIT:              'bg-blue-400',
  KYC_STEP_PERSONAL:     'bg-blue-400',
  KYC_STEP_DOCUMENT:     'bg-blue-400',
  KYC_STEP_SELFIE:       'bg-blue-400',
  KYC_CONSENT_SIGNED:    'bg-blue-500',
  KYC_PIPELINE_AUTO_APPROVED: 'bg-green-500',
  KYC_PIPELINE_MANUAL_REVIEW: 'bg-amber-500',
  KYC_PIPELINE_REJECTED: 'bg-red-500',
  KYC_APPROVED:          'bg-green-500',
  KYC_REJECTED:          'bg-red-500',
  KYC_BLOCKED:           'bg-gray-800',
  KYC_REQUEST_INFO:      'bg-amber-400',
  BANK_DECISION_APPROVED:'bg-green-600',
  BANK_DECISION_REJECTED:'bg-red-600',
  WEBHOOK_BANGE_APPROVED:'bg-green-600',
  WEBHOOK_BANGE_REJECTED:'bg-red-600',
  TX_FLAGGED:            'bg-orange-500',
  TX_AUTO_FLAGGED:       'bg-orange-500',
  SAR_CREATED:           'bg-purple-500',
  SAR_SENT_ANIF:         'bg-purple-600',
};

const ACTION_LABELS: Record<string, string> = {
  KYC_INIT:              'Sesión iniciada',
  KYC_STEP_PERSONAL:     'Datos personales guardados',
  KYC_STEP_DOCUMENT:     'Documento subido',
  KYC_STEP_SELFIE:       'Selfie guardada',
  KYC_CONSENT_SIGNED:    'Consentimiento firmado',
  KYC_DRAFT_SAVED:       'Borrador guardado',
  KYC_PIPELINE_AUTO_APPROVED: 'Aprobado automáticamente',
  KYC_PIPELINE_MANUAL_REVIEW: 'Enviado a revisión manual',
  KYC_PIPELINE_REJECTED: 'Rechazado por pipeline',
  KYC_STATUS_CHANGED:    'Estado actualizado',
  KYC_APPROVED:          'Aprobado por revisor',
  KYC_REJECTED:          'Rechazado por revisor',
  KYC_BLOCKED:           'Bloqueado',
  KYC_REQUEST_INFO:      'Información solicitada',
  BANK_DECISION_APPROVED:'BANGE: Aprobado',
  BANK_DECISION_REJECTED:'BANGE: Rechazado',
  WEBHOOK_BANGE_APPROVED:'Webhook BANGE: Aprobado',
  WEBHOOK_BANGE_REJECTED:'Webhook BANGE: Rechazado',
  KYC_AML_ESCALATION:    'Escalado por AML',
  TX_FLAGGED:            'Transacción flaggeada',
  TX_AUTO_FLAGGED:       'TX flaggeada automáticamente',
  SAR_CREATED:           'SAR creado',
  SAR_SENT_ANIF:         'SAR enviado a ANIF',
};

interface TimelineProps {
  entries: AuditEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Sin actividad registrada
      </p>
    );
  }

  return (
    <ol role="list" className="space-y-3" aria-label="Historial de auditoría">
      {entries.map((entry, idx) => {
        const dotColor = ACTION_COLORS[entry.action] ?? 'bg-gray-400';
        const label    = ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ');
        const isLast   = idx === entries.length - 1;
        const details = (entry.details ?? {}) as Record<string, unknown>;
        const rejectedReason = entry.action.includes('REJECTED') && details.reason
          ? String(details.reason)
          : '';

        return (
          <li key={entry.id} className="relative flex gap-3" role="listitem">
            {/* Línea vertical */}
            {!isLast && (
              <div
                className="absolute left-2.5 top-5 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
                aria-hidden="true"
              />
            )}

            {/* Dot */}
            <div
              className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${dotColor} z-10 ring-2 ring-white dark:ring-gray-900`}
              aria-hidden="true"
            />

            {/* Contenido */}
            <div className="flex-1 min-w-0 pb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(entry.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                {entry.performed_role && (
                  <span className="ml-2 text-gray-300 dark:text-gray-600">·</span>
                )}
                {entry.performed_role && (
                  <span className="ml-1 text-gray-400">{entry.performed_role}</span>
                )}
              </p>
              {/* Detalles relevantes */}
              {rejectedReason && (
                <p className="text-xs text-red-500 mt-0.5">
                  Motivo: {rejectedReason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
