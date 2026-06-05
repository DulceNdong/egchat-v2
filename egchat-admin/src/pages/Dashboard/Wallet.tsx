import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { adminAPI } from '../../api/adminClient';
import { fmtXAF, fmtDate } from '../../utils/formatters';

export const WalletDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(MOCK_DATA);

  useEffect(() => {
    adminAPI.getWallet().then(setMetrics).catch(() => setMetrics(MOCK_DATA));
    const t = setInterval(() => adminAPI.getWallet().then(setMetrics).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  const d = metrics;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>💰 Dashboard Wallet</h2>
        <button onClick={() => adminAPI.exportAudit('csv')}
          style={{ background: 'rgba(0,200,160,0.15)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#00c8a0', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
          ⬇ Exportar CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="Volumen Hoy" value={fmtXAF(d.volumeToday)} subtitle="XAF transferidos" icon="💸" color="#f59e0b" />
        <MetricCard title="Transacciones" value={d.txCount} subtitle="completadas hoy" trend={d.txTrend} icon="✅" color="#22c55e" />
        <MetricCard title="Fallidas" value={d.txFailed} subtitle="hoy" icon="❌" color="#ef4444" />
        <MetricCard title="Tasa Éxito" value={`${d.successRate}%`} subtitle="completadas/total" trend={d.successTrend} icon="📈" color="#3b82f6" />
      </div>

      {/* Gráfica volumen 7 días */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', marginBottom: '24px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volumen últimos 7 días (XAF)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={d.dailyVolume || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v: any) => [fmtXAF(v), 'Volumen']} />
            <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transacciones sospechosas */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 Transacciones Sospechosas</div>
        <DataTable
          columns={[
            { key: 'user', label: 'Usuario' },
            { key: 'amount', label: 'Monto', render: (r) => fmtXAF(r.amount) },
            { key: 'type', label: 'Motivo' },
            { key: 'created_at', label: 'Fecha', render: (r) => fmtDate(r.created_at) },
            { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} label={r.status} /> },
          ]}
          data={d.suspicious || []}
          emptyMessage="Sin transacciones sospechosas"
        />
      </div>
    </div>
  );
};

const MOCK_DATA = {
  volumeToday: 4_850_000, txCount: 423, txFailed: 12, successRate: 97.2,
  txTrend: 8, successTrend: 1,
  dailyVolume: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(day => ({ day, volume: Math.floor(Math.random() * 5_000_000 + 1_000_000) })),
  suspicious: [
    { user: '+240555123456', amount: 950000, type: '>3σ monto', created_at: new Date().toISOString(), status: 'warning' },
    { user: '+240555789012', amount: 50000, type: '8 tx/min', created_at: new Date().toISOString(), status: 'critical' },
  ],
};
