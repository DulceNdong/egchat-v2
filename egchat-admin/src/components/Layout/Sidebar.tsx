import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { MODULES_FOR_ROLE, PHASE_GROUPS, ROLE_LABELS, ROLE_COLORS } from '../../utils/rbac';

const ROUTE_MAP: Record<string, string> = {
  executive:      '/dashboard/executive',
  financial:      '/dashboard/financial',
  strategic:      '/dashboard/strategic',
  risk:           '/dashboard/risk',
  users:          '/dashboard/users',
  support:        '/dashboard/support',
  mini_apps:      '/dashboard/mini-apps',
  operational:    '/dashboard/operational',
  chat:           '/dashboard/chat',
  wallet:         '/dashboard/wallet',
  security:       '/dashboard/security',
  infrastructure: '/dashboard/infrastructure',
  sqlite_sync:    '/dashboard/sqlite-sync',
  audit:          '/dashboard/audit',
  admin_users:    '/admin/users',
};

// Phase badge colors
const PHASE_COLORS: Record<string, { color: string; bg: string }> = {
  A: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  B: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  C: { color: '#475569', bg: 'rgba(71,85,105,0.1)'  },
};

export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  if (!admin) return null;

  const allowedModules = new Set(
    (MODULES_FOR_ROLE[admin.role] || []).map(m => m.id)
  );
  const roleColor = ROLE_COLORS[admin.role];

  return (
    <div style={{
      width: collapsed ? '56px' : '220px',
      minHeight: '100vh',
      background: '#0b1120',
      borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.2s ease', overflow: 'hidden',
    }}>

      {/* Logo + collapse button */}
      <div style={{ padding: collapsed ? '14px 12px' : '16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#fff', flexShrink: 0 }}>E</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f1f5f9', whiteSpace: 'nowrap' }}>EGCHAT</div>
              <div style={{ fontSize: '9px', color: '#475569', whiteSpace: 'nowrap' }}>Admin Portal</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          background: 'transparent', border: '1px solid #1e293b', borderRadius: '6px',
          color: '#475569', cursor: 'pointer', padding: '4px 6px', fontSize: '12px',
          flexShrink: 0, lineHeight: 1,
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav with phase groups */}
      <nav style={{ flex: 1, padding: collapsed ? '8px 4px' : '10px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
        {PHASE_GROUPS.map(group => {
          const visible = group.modules.filter(m => allowedModules.has(m.id));
          if (visible.length === 0) return null;
          const pc = PHASE_COLORS[group.phase] || PHASE_COLORS.C;
          return (
            <div key={group.phase} style={{ marginBottom: '8px' }}>
              {/* Phase label */}
              {!collapsed && (
                <div style={{
                  fontSize: '9px', fontWeight: '800', letterSpacing: '1px',
                  color: pc.color, background: pc.bg,
                  padding: '3px 8px', borderRadius: '6px', marginBottom: '4px',
                  marginLeft: '4px', display: 'inline-block',
                }}>
                  {group.label}
                </div>
              )}
              {collapsed && (
                <div style={{ height: '1px', background: '#1e293b', margin: '6px 4px' }} />
              )}
              {visible.map(mod => (
                <NavLink
                  key={mod.id}
                  to={ROUTE_MAP[mod.id] || '/'}
                  title={collapsed ? mod.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '8px 0' : '8px 10px',
                    borderRadius: '8px', marginBottom: '1px',
                    textDecoration: 'none', fontSize: '12px', fontWeight: '600',
                    color: isActive ? '#f1f5f9' : '#64748b',
                    background: isActive ? '#1e293b' : 'transparent',
                    transition: 'all 0.15s',
                  })}
                >
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>{mod.icon}</span>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: '700', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</div>
          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', color: roleColor, background: `${roleColor}18`, padding: '2px 8px', borderRadius: '8px', marginBottom: '8px' }}>
            {ROLE_LABELS[admin.role]}
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '6px', background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px',
            color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
          }}>
            Cerrar sesión
          </button>
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '10px 4px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'center' }}>
          <button onClick={logout} title="Cerrar sesión" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', cursor: 'pointer', padding: '6px 8px' }}>
            ⏻
          </button>
        </div>
      )}
    </div>
  );
};
