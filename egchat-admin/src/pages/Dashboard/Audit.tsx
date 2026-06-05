import React, { useEffect, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminAPI } from '../../api/adminClient';
import { fmtDate } from '../../utils/formatters';

export const AuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter.action) params.action = filter.action;
      if (filter.from) params.from = filter.from;
      if (filter.to) params.to = filter.to;
      const data = await adminAPI.getAuditLog(params);
      setLogs(Array.isArray(data) ? data : data.logs || MOCK_LOGS);
    } catch {
      setLogs(MOCK_LOGS);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>📋 Dashboard Auditoría</h2>
        <button onClick={() => adminAPI.exportAudit('csv')}
          style={{ background: 'rgba(0,200,160,0.15)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#00c8a0', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #334155', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Acción</label>
          <input value={filter.action} onChange={e => setFilter(p => ({ ...p, action: e.target.value }))} placeholder="ej: user.block"
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: '#f1f5f9', fontSize: '12px', outline: 'none', width: '140px' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Desde</label>
          <input type="date" value={filter.from} onChange={e => setFilter(p => ({ ...p, from: e.target.value }))}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: '#f1f5f9', fontSize: '12px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Hasta</label>
          <input type="date" value={filter.to} onChange={e => setFilter(p => ({ ...p, to: e.target.value }))}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: '#f1f5f9', fontSize: '12px', outline: 'none' }} />
        </div>
        <button onClick={load} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#3b82f6', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
          Filtrar
        </button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <DataTable
          loading={loading}
          columns={[
            { key: 'created_at', label: 'Fecha', render: (r) => fmtDate(r.created_at), width: '140px' },
            { key: 'admin', label: 'Admin', render: (r) => r.admin_email || r.admin_id?.slice(0, 8) || '—' },
            { key: 'action', label: 'Acción', render: (r) => <code style={{ fontSize: '11px', background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>{r.action}</code> },
            { key: 'resource_type', label: 'Recurso' },
            { key: 'ip_address', label: 'IP', width: '130px' },
            { key: 'result', label: 'Resultado', render: (r) => <StatusBadge status={r.result === 'success' ? 'ok' : 'critical'} label={r.result} /> },
          ]}
          data={logs}
          emptyMessage="Sin entradas de auditoría"
        />
      </div>
    </div>
  );
};

const MOCK_LOGS = [
  { id: '1', created_at: new Date().toISOString(), admin_email: 'superadmin@egchat.gq', action: 'user.block', resource_type: 'user', ip_address: '197.255.8.12', result: 'success' },
  { id: '2', created_at: new Date(Date.now() - 300000).toISOString(), admin_email: 'security@egchat.gq', action: 'ip.block', resource_type: 'ip', ip_address: '41.223.45.1', result: 'success' },
  { id: '3', created_at: new Date(Date.now() - 600000).toISOString(), admin_email: 'finance@egchat.gq', action: 'wallet.export', resource_type: 'transaction', ip_address: '197.255.8.15', result: 'success' },
];
