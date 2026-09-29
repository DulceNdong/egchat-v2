import React from 'react';

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  draft:          { label: 'Borrador',        dot: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-700',   text: 'text-slate-600 dark:text-slate-300' },
  IN_PROGRESS:    { label: 'En progreso',     dot: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300' },
  submitted:      { label: 'Enviado',         dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  PENDING_REVIEW: { label: 'Pendiente',       dot: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  MANUAL_REVIEW:  { label: 'Revisión manual', dot: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  under_review:   { label: 'En revisión',     dot: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  AUTO_APPROVED:  { label: 'Auto-aprobado',   dot: '#14b8a6', bg: 'bg-teal-50 dark:bg-teal-900/30',  text: 'text-teal-700 dark:text-teal-300' },
  approved:       { label: 'Aprobado',        dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  APPROVED:       { label: 'Aprobado',        dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  rejected:       { label: 'Rechazado',       dot: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-300' },
  REJECTED:       { label: 'Rechazado',       dot: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-300' },
  BLOCKED:        { label: 'Bloqueado',       dot: '#0f172a', bg: 'bg-slate-900',                    text: 'text-white' },
};

const RISK_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  low:    { label: 'Bajo',  dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300' },
  medium: { label: 'Medio', dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  high:   { label: 'Alto',  dot: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-300' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, dot: '#94a3b8', bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function RiskBadge({ risk, score }: { risk: string; score?: number }) {
  const cfg = RISK_MAP[risk?.toLowerCase()] ?? { label: risk, dot: '#94a3b8', bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}{score != null ? ` · ${score}` : ''}
    </span>
  );
}
