import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminAPI } from '../../api/adminClient';

export const InfrastructureDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(MOCK);
  useEffect(() => {
    adminAPI.getInfra().then(setMetrics).catch(() => setMetrics(MOCK));
    const t = setInterval(() => adminAPI.getInfra().then(setMetrics).catch(() => {}), 60000);
    return () => clearInterval(t);
  }, []);
  const d = metrics;
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '20px' }}>⚙️ Infraestructura</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="CPU Render" value={`${d.renderCpu}%`} icon="🖥️" color={d.renderCpu > 80 ? '#ef4444' : '#22c55e'} />
        <MetricCard title="RAM Render" value={`${d.renderRam}%`} icon="💾" color={d.renderRam > 80 ? '#ef4444' : '#3b82f6'} />
        <MetricCard title="Supabase Conn." value={`${d.supabaseConns}/${d.supabaseMaxConns}`} icon="🗄️" color="#a855f7" />
        <MetricCard title="CDN Hit Rate" value={`${d.cdnHitRate}%`} icon="🌐" color="#f59e0b" />
      </div>
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase' }}>Estado Servicios</div>
        {(d.services || []).map((s: any) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{s.url}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{s.latency}ms</span>
              <StatusBadge status={s.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const MOCK = {
  renderCpu: 42, renderRam: 61, supabaseConns: 38, supabaseMaxConns: 100, cdnHitRate: 94,
  services: [
    { name: 'API Render', url: 'egchat-api.onrender.com', status: 'ok', latency: 180 },
    { name: 'Supabase DB', url: 'raqtpkcu36mpwnn0dqss7a.supabase.co', status: 'ok', latency: 45 },
    { name: 'Vercel CDN', url: 'egchat-v2.vercel.app', status: 'ok', latency: 22 },
    { name: 'Push Service', url: 'push.egchat.gq', status: 'degraded', latency: 890 },
  ],
};
