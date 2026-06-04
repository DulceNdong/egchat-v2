/**
 * NotificationsPanel.tsx
 * Panel de notificaciones extraído de App.tsx.
 * ~150 líneas menos en App.tsx.
 */

import React from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  chatId?: string;
  action?: () => void;
}

interface NotificationsPanelProps {
  notifications:      Notification[];
  onClose:            () => void;
  onMarkAllRead:      () => void;
  onClearAll:         () => void;
  onClickNotif:       (n: Notification) => void;
}

const iconForType = (type: string) => {
  if (type === 'message')  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (type === 'payment')  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
  if (type === 'taxi')     return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
  if (type === 'security') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
};

const colorForType = (type: string): string => {
  if (type === 'message')  return '#00b4e6';
  if (type === 'payment')  return '#00c8a0';
  if (type === 'taxi')     return '#f59e0b';
  if (type === 'security') return '#ef4444';
  if (type === 'bet')      return '#a855f7';
  return '#6b7280';
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = React.memo(({
  notifications, onClose, onMarkAllRead, onClearAll, onClickNotif,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1001 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: '58px', right: '8px',
        width: '320px', maxWidth: 'calc(100vw - 16px)',
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 10px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d0d0d' }}>Notificaciones</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '11px', fontWeight: '700', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 7px' }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {notifications.length > 0 && (
              <button onClick={onMarkAllRead}
                style={{ background: 'none', border: 'none', color: '#00c8a0', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                Marcar todas
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', outline: 'none', padding: '0', fontSize: '18px', lineHeight: 1 }}>&#x2715;</button>
          </div>
        </div>

        {/* Lista */}
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Sin notificaciones</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Las notificaciones aparecerán aquí</div>
            </div>
          ) : notifications.map((n, i) => {
            const color = colorForType(n.type);
            return (
              <div key={n.id}
                onClick={() => onClickNotif(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px',
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(0,180,230,0.04)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0,180,230,0.04)'; }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: color + '18', border: `1.5px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}>
                  {iconForType(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#111827', marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>{n.time}</span>
                  {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'center' }}>
            <button onClick={onClearAll}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              Limpiar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

NotificationsPanel.displayName = 'NotificationsPanel';
