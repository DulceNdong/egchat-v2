import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminAPI } from '../../api/adminClient';
import { useSSE } from '../../hooks/useSSE';
import { useTheme } from '../../context/ThemeContext';

export const OperationalDashboard: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await adminAPI.getOperational();
      setMetrics(data);
    } catch (e) {
      // usar datos mock si el endpoint aún no existe
      setMetrics(MOCK_DATA);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  useSSE((data) => { if (data.operational) setMetrics((p: any) => ({ ...p, ...data.operational })); });

  const d = metrics || MOCK_DATA;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: theme.text, marginBottom: '20px' }}>📊 Dashboard Operacional</h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="Usuarios Activos" value={d.activeUsers} subtitle="últimos 5 min" trend={d.activeUsersTrend} icon="👥" color="#00c8a0" />
        <MetricCard title="Nuevos Hoy" value={d.newUsersToday} subtitle="registros" trend={d.newUsersTrend} icon="✨" color="#3b82f6" />
        <MetricCard title="Sesiones" value={d.activeSessions} subtitle="abiertas ahora" icon="📱" color="#a855f7" />
        <MetricCard title="Uptime" value={`${d.uptime}%`} subtitle="últimos 30 días" icon="⚡" color="#22c55e" />
      </div>

      {/* Servicios */}
      <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', marginBottom: '24px', border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado de Servicios</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {(d.services || []).map((s: any) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, borderRadius: '8px', padding: '10px 14px' }}>
              <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{s.name}</span>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica tendencia */}
      <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios Activos — Últimas 24h</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={d.hourlyUsers || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text }} />
            <Line type="monotone" dataKey="users" stroke="#00c8a0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MOCK_DATA = {
  activeUsers: 247, activeUsersTrend: 12,
  newUsersToday: 38, newUsersTrend: 5,
  activeSessions: 312, uptime: 99.8,
  services: [
    { name: 'API Render', status: 'ok' }, { name: 'Supabase DB', status: 'ok' },
    { name: 'Vercel CDN', status: 'ok' }, { name: 'Push Service', status: 'degraded' },
  ],
  hourlyUsers: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`, users: Math.floor(Math.random() * 200 + 50),
  })),
};
