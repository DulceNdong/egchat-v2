// StatusBadge — Chip de estado KYC con colores
import React from 'react';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft:          { label: 'Borrador',        cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS:    { label: 'En progreso',     cls: 'bg-blue-100 text-blue-700' },
  submitted:      { label: 'Enviado',         cls: 'bg-yellow-100 text-yellow-700' },
  PENDING_REVIEW: { label: 'Pendiente',       cls: 'bg-orange-100 text-orange-700' },
  MANUAL_REVIEW:  { label: 'Revisión manual', cls: 'bg-purple-100 text-purple-700' },
  under_review:   { label: 'En revisión',     cls: 'bg-indigo-100 text-indigo-700' },
  AUTO_APPROVED:  { label: 'Auto-aprobado',   cls: 'bg-teal-100 text-teal-700' },
  approved:       { label: 'Aprobado',        cls: 'bg-green-100 text-green-700' },
  APPROVED:       { label: 'Aprobado',        cls: 'bg-green-100 text-green-700' },
  rejected:       { label: 'Rechazado',       cls: 'bg-red-100 text-red-700' },
  REJECTED:       { label: 'Rechazado',       cls: 'bg-red-100 text-red-700' },
  BLOCKED:        { label: 'Bloqueado',       cls: 'bg-gray-900 text-white' },
};

const RISK_MAP: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Bajo',  cls: 'bg-green-100 text-green-700' },
  medium: { label: 'Medio', cls: 'bg-yellow-100 text-yellow-700' },
  high:   { label: 'Alto',  cls: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function RiskBadge({ risk, score }: { risk: string; score?: number }) {
  const cfg = RISK_MAP[risk] ?? { label: risk, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}{score != null ? ` (${score})` : ''}
    </span>
  );
}
