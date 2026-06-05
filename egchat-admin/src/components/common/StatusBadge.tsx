import React from 'react';

type Status = 'ok' | 'degraded' | 'down' | 'warning' | 'critical' | 'info';

const CFG: Record<Status, { bg: string; color: string; label: string; dot: string }> = {
  ok:       { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', label: 'OK',         dot: '#22c55e' },
  degraded: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: 'Degradado',  dot: '#f59e0b' },
  down:     { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: 'Caído',      dot: '#ef4444' },
  warning:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: 'Aviso',      dot: '#f59e0b' },
  critical: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: 'Crítico',    dot: '#ef4444' },
  info:     { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'Info',       dot: '#3b82f6' },
};

export const StatusBadge: React.FC<{ status: Status; label?: string }> = ({ status, label }) => {
  const c = CFG[status] || CFG.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, color: c.color, borderRadius: '20px',
      padding: '3px 10px', fontSize: '11px', fontWeight: '700'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {label || c.label}
    </span>
  );
};
