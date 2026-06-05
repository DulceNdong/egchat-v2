import React, { useState } from 'react';
import { useAlertsStore } from '../../stores/alertsStore';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { alerts, unreadCount, markAllRead } = useAlertsStore();
  const [open, setOpen] = useState(false);
  const criticals = alerts.filter(a => !a.is_resolved).slice(0, 10);

  return (
    <div style={{
      height: '56px', background: '#0f172a', borderBottom: '1px solid #1e293b',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
    }}>
      <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>{title}</h1>

      <div style={{ position: 'relative' }}>
        <button onClick={() => { setOpen(!open); markAllRead(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', position: 'relative', color: '#94a3b8' }}>
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '2px', right: '2px', minWidth: '16px', height: '16px',
              background: '#ef4444', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>{unreadCount}</span>
          )}
        </button>

        {open && (
          <div style={{
            position: 'absolute', right: 0, top: '40px', width: '320px',
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>
              Alertas recientes
            </div>
            {criticals.length === 0 ? (
              <div style={{ padding: '16px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>Sin alertas activas</div>
            ) : criticals.map(a => (
              <div key={a.id} style={{ padding: '10px 16px', borderBottom: '1px solid #0f172a' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: a.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>{a.title}</div>
                {a.description && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{a.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
