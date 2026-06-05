import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable } from '../../components/common/DataTable';
import { adminAPI } from '../../api/adminClient';
import { fmtDate } from '../../utils/formatters';

export const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(MOCK_DATA);
  const [blockIp, setBlockIp] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminAPI.getSecurity().then(setMetrics).catch(() => setMetrics(MOCK_DATA));
  }, []);

  const handleBlock = async () => {
    if (!blockIp) return;
    setBlocking(true);
    try {
      await adminAPI.blockIp(blockIp, '24h', blockReason || 'Bloqueo manual');
      setMsg(`✅ IP ${blockIp} bloqueada 24h`);
      setBlockIp(''); setBlockReason('');
    } catch (e: any) {
      setMsg(`❌ Error: ${e.message}`);
    } finally { setBlocking(false); }
  };

  const d = metrics;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '20px' }}>🔒 Dashboard Seguridad</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="Logins Fallidos" value={d.failedLoginsHour} subtitle="última hora" icon="🚫" color="#ef4444" />
        <MetricCard title="IPs Bloqueadas" value={d.blockedIps} subtitle="activas" icon="🛡️" color="#f59e0b" />
        <MetricCard title="Usuarios Bloqueados" value={d.blockedUsers} subtitle="activos" icon="👤" color="#a855f7" />
        <MetricCard title="Tokens Activos" value={d.activeTokens} subtitle="sesiones válidas" icon="🔑" color="#3b82f6" />
      </div>

      {/* Bloquear IP */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', marginBottom: '24px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚫 Bloquear IP</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input value={blockIp} onChange={e => setBlockIp(e.target.value)} placeholder="IP (ej: 192.168.1.1)"
            style={{ flex: 1, minWidth: '180px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }} />
          <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Motivo (opcional)"
            style={{ flex: 2, minWidth: '200px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }} />
          <button onClick={handleBlock} disabled={!blockIp || blocking}
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '9px 18px', color: '#ef4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: (!blockIp || blocking) ? 0.5 : 1 }}>
            {blocking ? 'Bloqueando...' : 'Bloquear 24h'}
          </button>
        </div>
        {msg && <div style={{ marginTop: '10px', fontSize: '13px', color: msg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>{msg}</div>}
      </div>

      {/* Logins fallidos */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intentos fallidos recientes</div>
        <DataTable
          columns={[
            { key: 'ip', label: 'IP', width: '160px' },
            { key: 'attempts', label: 'Intentos', width: '100px' },
            { key: 'target', label: 'Cuenta objetivo' },
            { key: 'last_at', label: 'Último intento', render: (r) => fmtDate(r.last_at) },
          ]}
          data={d.failedLogins || []}
          emptyMessage="Sin intentos fallidos recientes"
        />
      </div>
    </div>
  );
};

const MOCK_DATA = {
  failedLoginsHour: 23, blockedIps: 7, blockedUsers: 2, activeTokens: 318,
  failedLogins: [
    { ip: '41.223.45.12', attempts: 15, target: '+240555570323', last_at: new Date().toISOString() },
    { ip: '197.255.12.8', attempts: 8, target: '+240222334455', last_at: new Date(Date.now() - 300000).toISOString() },
  ],
};
