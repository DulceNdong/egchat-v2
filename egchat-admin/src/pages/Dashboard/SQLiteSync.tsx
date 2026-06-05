import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminAPI } from '../../api/adminClient';
import { fmtDate } from '../../utils/formatters';

export const SQLiteSyncDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(MOCK);
  useEffect(() => {
    adminAPI.getSqliteSync().then(setMetrics).catch(() => setMetrics(MOCK));
  }, []);
  const d = metrics;
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '20px' }}>🔄 Sincronización SQLite</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <MetricCard title="Sync Pendiente" value={d.pendingSync} subtitle="dispositivos" icon="⏳" color="#f59e0b" />
        <MetricCard title="Conflictos" value={d.conflicts} subtitle="sin resolver" icon="⚠️" color="#ef4444" />
        <MetricCard title="Sync OK Hoy" value={d.syncOkToday} subtitle="exitosos" icon="✅" color="#22c55e" />
        <MetricCard title="Offline >24h" value={d.offlineLong} subtitle="dispositivos" icon="📴" color="#a855f7" />
      </div>
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase' }}>Conflictos activos</div>
        <DataTable
          columns={[
            { key: 'user', label: 'Usuario' },
            { key: 'table', label: 'Tabla', width: '120px' },
            { key: 'type', label: 'Tipo', width: '140px', render: r => <StatusBadge status="warning" label={r.type} /> },
            { key: 'detected_at', label: 'Detectado', render: r => fmtDate(r.detected_at) },
          ]}
          data={d.conflictList || []}
          emptyMessage="Sin conflictos activos 🎉"
        />
      </div>
    </div>
  );
};
const MOCK = {
  pendingSync: 14, conflicts: 3, syncOkToday: 287, offlineLong: 2,
  conflictList: [
    { user: '+240555570323', table: 'messages', type: 'write-write', detected_at: new Date().toISOString() },
    { user: '+240222334455', table: 'contacts', type: 'delete-update', detected_at: new Date(Date.now() - 600000).toISOString() },
  ],
};
