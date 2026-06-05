import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { adminAPI } from '../../api/adminClient';

export const ChatDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(MOCK_DATA);

  useEffect(() => {
    adminAPI.getChat().then(setMetrics).catch(() => setMetrics(MOCK_DATA));
    const t = setInterval(() => adminAPI.getChat().then(setMetrics).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  const d = metrics;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '20px' }}>💬 Dashboard Chat</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="Mensajes/min" value={d.messagesPerMin} subtitle="ahora mismo" icon="✉️" color="#00c8a0" />
        <MetricCard title="Chats Activos" value={d.activeChats} subtitle="en curso" icon="💬" color="#3b82f6" />
        <MetricCard title="Llamadas VoIP" value={d.activeCalls} subtitle="audio + video" icon="📞" color="#a855f7" />
        <MetricCard title="Latencia P95" value={`${d.latencyP95}ms`} subtitle="entrega mensajes" icon="⚡" color="#f59e0b" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px' }}>Distribución Chats</div>
          {[
            { label: 'Individuales', value: d.privateChats, color: '#00c8a0' },
            { label: 'Grupos', value: d.groupChats, color: '#3b82f6' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#f1f5f9' }}>{item.value}</span>
              </div>
              <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: `${(item.value / (d.privateChats + d.groupChats)) * 100}%`, background: item.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px' }}>Llamadas VoIP</div>
          {[
            { label: 'Audio', value: d.audioCalls, color: '#22c55e' },
            { label: 'Video', value: d.videoCalls, color: '#3b82f6' },
            { label: 'Fallidas', value: d.failedCalls, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MOCK_DATA = {
  messagesPerMin: 142, activeChats: 89, activeCalls: 7, latencyP95: 380,
  privateChats: 67, groupChats: 22,
  audioCalls: 5, videoCalls: 2, failedCalls: 1,
};
