/**
 * Badges de estado reutilizables — accesibles con role="status" y aria-label.
 */
import clsx from 'clsx';
import type { KycStatus, RiskLevel } from '@/types';

// ── Status badge ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; classes: string; }> = {
  draft:          { label: 'Borrador',       classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'       },
  IN_PROGRESS:    { label: 'En progreso',    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'        },
  PENDING_SUBMIT: { label: 'Listo enviar',   classes: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'            },
  submitted:      { label: 'Enviado',        classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  PENDING_REVIEW: { label: 'Pdte. revisión', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'    },
  under_review:   { label: 'En revisión',    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'    },
  MANUAL_REVIEW:  { label: 'Revisión manual',classes: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'},
  AUTO_APPROVED:  { label: 'Auto-aprobado',  classes: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'   },
  APPROVED:       { label: 'Aprobado',       classes: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'   },
  approved:       { label: 'Aprobado',       classes: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'   },
  REJECTED:       { label: 'Rechazado',      classes: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'           },
  rejected:       { label: 'Rechazado',      classes: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'           },
  BLOCKED:        { label: 'Bloqueado',      classes: 'bg-gray-900 text-gray-100 dark:bg-gray-100 dark:text-gray-900'       },
  PENDING_INFO:   { label: 'Pdte. info',     classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'},
};

export function StatusBadge({ status }: { status: KycStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span
      role="status"
      aria-label={`Estado: ${cfg.label}`}
      className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', cfg.classes)}
    >
      {cfg.label}
    </span>
  );
}

// ── Risk badge ────────────────────────────────────────────────────
const RISK_CONFIG: Record<string, { label: string; emoji: string; classes: string }> = {
  low:    { label: 'Bajo',  emoji: '🟢', classes: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'  },
  medium: { label: 'Medio', emoji: '🟡', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  high:   { label: 'Alto',  emoji: '🔴', classes: 'bg-red-100   text-red-700   dark:bg-red-950   dark:text-red-300'   },
};

interface RiskBadgeProps {
  level:      RiskLevel | string;
  score?:     number;
  showScore?: boolean;
}

export function RiskBadge({ level, score, showScore = false }: RiskBadgeProps) {
  const key = level.toLowerCase();
  const cfg = RISK_CONFIG[key] ?? RISK_CONFIG.medium;
  return (
    <span
      role="status"
      aria-label={`Riesgo: ${cfg.label}${score != null ? ` (${score})` : ''}`}
      className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.classes)}
    >
      <span aria-hidden="true">{cfg.emoji}</span>
      {cfg.label}
      {showScore && score != null && (
        <span className="opacity-75 ml-0.5">({score})</span>
      )}
    </span>
  );
}
