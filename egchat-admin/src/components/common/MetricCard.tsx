import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // positivo = bueno, negativo = malo
  icon?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, icon, color = '#00c8a0' }) => (
  <div style={{
    background: '#1e293b', borderRadius: '14px', padding: '18px',
    border: '1px solid #334155', position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      {icon && <div style={{ fontSize: '20px' }}>{icon}</div>}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {subtitle && <div style={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: '12px', fontWeight: '700', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);
