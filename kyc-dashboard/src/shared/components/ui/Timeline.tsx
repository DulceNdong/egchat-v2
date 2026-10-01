/**
 * Timeline de auditoría — renderiza el historial de acciones KYC.
 * Iconos Lucide por categoría de acción + colores semánticos.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserPlus, FileText, Camera, CheckCircle2, XCircle,
  AlertTriangle, Shield, Clock, RotateCcw, Bot,
  Building2, AlertOctagon, FileWarning, Send, Zap,
} from 'lucide-react';
import type { AuditEntry } from '@/types';

const ACTION_COLORS: Record<string, string> = {
  KYC_INIT:                    'bg-blue-500',
  KYC_STEP_PERSONAL:           'bg-blue-400',
  KYC_STEP_DOCUMENT:           'bg-indigo-500',
  KYC_STEP_SELFIE:             'bg-indigo-400',
  KYC_CONSENT_SIGNED:          'bg-blue-600',
  KYC_DRAFT_SAVED:             'bg-slate-400',
  KYC_STATUS_CHANGED:          'bg-sky-500',
  KYC_AUTO_SCORED:             'bg-cyan-500',
  KYC_PIPELINE_AUTO_APPROVED:  'bg-emerald-500',
  KYC_PIPELINE_MANUAL_REVIEW:  'bg-amber-500',
  KYC_PIPELINE_REJECTED:       'bg-red-500',
  KYC_APPROVED:                'bg-emerald-600',
  KYC_REJECTED:                'bg-red-600',
  KYC_BLOCKED:                 'bg-gray-900',
  KYC_REQUEST_INFO:            'bg-amber-500',
  KYC_RESUBMIT:                'bg-sky-500',
  BANK_DECISION_APPROVED:      'bg-emerald-700',
  BANK_DECISION_REJECTED:      'bg-red-700',
  WEBHOOK_BANGE_APPROVED:      'bg-emerald-600',
  WEBHOOK_BANGE_REJECTED:      'bg-red-600',
  KYC_AML_ESCALATION:          'bg-orange-600',
  TX_FLAGGED:                  'bg-orange-500',
  TX_AUTO_FLAGGED:             'bg-orange-500',
  SAR_CREATED:                 'bg-purple-500',
  SAR_SENT_ANIF:               'bg-purple-700',
};

const ACTION_LABELS: Record<string, string> = {
  KYC_INIT:              '🆕 Sesión KYC iniciada',
  KYC_STEP_PERSONAL:     '📝 Datos personales guardados',
  KYC_STEP_DOCUMENT:     '📄 Documento de identidad subido',
  KYC_STEP_SELFIE:       '🤳 Selfie de verificación guardada',
  KYC_CONSENT_SIGNED:    '✍️ Consentimiento firmado',
  KYC_DRAFT_SAVED:       '💾 Borrador guardado',
  KYC_PIPELINE_AUTO_APPROVED:  '✅ Aprobado automáticamente por el sistema',
  KYC_PIPELINE_MANUAL_REVIEW:  '👀 Enviado a revisión manual',
  KYC_PIPELINE_REJECTED:       '❌ Rechazado por el sistema',
  KYC_STATUS_CHANGED:          '🔄 Estado actualizado',
  KYC_APPROVED:                '✅ Aprobado por el revisor',
  KYC_REJECTED:                '❌ Rechazado por el revisor',
  KYC_BLOCKED:                 '🚫 Solicitud bloqueada',
  KYC_REQUEST_INFO:            '📋 Información adicional solicitada al usuario',
  KYC_RESUBMIT:                '🔄 Nueva solicitud iniciada',
  KYC_AUTO_SCORED:             '🤖 Puntuación de riesgo calculada',
  BANK_DECISION_APPROVED:      '🏦 BANGE: Decisión APROBADO',
  BANK_DECISION_REJECTED:      '🏦 BANGE: Decisión RECHAZADO',
  WEBHOOK_BANGE_APPROVED:      '🏦 BANGE confirmó aprobación',
  WEBHOOK_BANGE_REJECTED:      '🏦 BANGE confirmó rechazo',
  KYC_AML_ESCALATION:          '⚠️ Escalado por alerta AML',
  TX_FLAGGED:                  '🚨 Transacción flaggeada',
  TX_AUTO_FLAGGED:             '🚨 TX flaggeada automáticamente',
  SAR_CREATED:                 '📋 SAR creado',
  SAR_SENT_ANIF:               '📤 SAR enviado a la ANIF',
  // Entradas de la app móvil (rutas API → nombre legible)
  'POST /api/kyc/application/:id/document':  '📄 Documento subido desde la app',
  'POST /api/kyc/application/:id/biometric': '🤳 Selfie de verificación enviada',
  'PUT /api/kyc/application/:id/personal':   '📝 Datos personales actualizados',
  'PUT /api/kyc/application/:id/financial':  '💰 Datos financieros actualizados',
  'POST /api/kyc/application/:id/screening': '🔍 Screening completado',
  'POST /api/kyc/application/:id/submit':    '📤 Solicitud enviada para revisión',
};

interface TimelineProps {
  entries: AuditEntry[];
}

// Icono por categoría de acción
function getActionIcon(action: string): React.ReactNode {
  if (action.includes('INIT') || action.includes('personal'))             return <UserPlus className="w-3 h-3"    />;
  if (action.includes('document') || action.includes('DOCUMENT'))        return <FileText className="w-3 h-3"    />;
  if (action.includes('selfie') || action.includes('biometric') || action.includes('SELFIE')) return <Camera className="w-3 h-3" />;
  if (action.includes('APPROVED') || action.includes('AUTO_APPROV'))     return <CheckCircle2 className="w-3 h-3" />;
  if (action.includes('REJECTED') || action.includes('BLOCKED'))         return <XCircle className="w-3 h-3"     />;
  if (action.includes('REQUEST_INFO') || action.includes('financial'))   return <AlertTriangle className="w-3 h-3"/>;
  if (action.includes('screening') || action.includes('SCORED'))         return <Shield className="w-3 h-3"      />;
  if (action.includes('MANUAL_REVIEW') || action.includes('STATUS'))     return <Clock className="w-3 h-3"       />;
  if (action.includes('RESUBMIT') || action.includes('RESET'))           return <RotateCcw className="w-3 h-3"   />;
  if (action.includes('AUTO') || action.includes('system'))              return <Bot className="w-3 h-3"         />;
  if (action.includes('BANGE') || action.includes('BANK'))               return <Building2 className="w-3 h-3"   />;
  if (action.includes('AML') || action.includes('FLAGGED'))              return <AlertOctagon className="w-3 h-3"/>;
  if (action.includes('SAR'))                                            return <FileWarning className="w-3 h-3" />;
  if (action.includes('submit') || action.includes('SUBMIT'))            return <Send className="w-3 h-3"        />;
  return <Zap className="w-3 h-3" />;
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
        // Resolución del label: exacto → por prefijo de ruta API → formato humanizado
        let label = ACTION_LABELS[entry.action];
        if (!label) {
          // Rutas tipo "POST /api/kyc/application/.../document"
          const routeKey = Object.keys(ACTION_LABELS).find(k =>
            entry.action.includes(k.split('/').pop() ?? '')
          );
          label = routeKey ? ACTION_LABELS[routeKey] : entry.action.replace(/_/g, ' ').replace(/\/api\/kyc\/application\/[^/]+\//g, '').replace(/\//g, ' › ');
        }
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
