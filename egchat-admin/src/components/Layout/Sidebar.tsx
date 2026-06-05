import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { MODULES_FOR_ROLE, ROLE_LABELS, ROLE_COLORS } from '../../utils/rbac';

const ROUTE_MAP: Record<string, string> = {
  executive:      '/dashboard/executive',
  financial:      '/dashboard/financial',
  strategic:      '/dashboard/strategic',
  operational:    '/dashboard/operational',
  chat:           '/dashboard/chat',
  wallet:         '/dashboard/wallet',
  security:       '/dashboard/security',
  infrastructure: '/dashboard/infrastructure',
  sqlite_sync:    '/dashboard/sqlite-sync',
  audit:          '/dashboard/audit',
  admin_users:    '/admin/users',
};

export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuthStore();
  if (!admin) return null;

  const modules = MODULES_FOR_ROLE[admin.role] || [];
  const roleColor = ROLE_COLORS[admin.role];

  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: '#0f172a',
      borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#fff' }}>E</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#f1f5f9' }}>EGCHAT</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {modules.map((mod) => (
          <NavLink
            key={mod.id}
            to={ROUTE_MAP[mod.id] || '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '10px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '13px', fontWeight: '600',
              color: isActive ? '#f1f5f9' : '#94a3b8',
              background: isActive ? '#1e293b' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: '16px' }}>{mod.icon}</span>
            {mod.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: '700', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</div>
        <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', color: roleColor, background: `${roleColor}20`, padding: '2px 8px', borderRadius: '10px', marginBottom: '10px' }}>
          {ROLE_LABELS[admin.role]}
        </div>
        <button onClick={logout} style={{
          width: '100%', padding: '7px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
          color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
