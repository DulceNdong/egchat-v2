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
  chat:           '/dashboard/chat',
  wallet:         '/dashboard/wallet',
  support:        '/dashboard/support',
  mini_apps:      '/dashboard/mini-apps',
  infrastructure: '/dashboard/infrastructure',
  devops:         '/dashboard/devops',
  security:       '/dashboard/security',
  audit:          '/dashboard/audit',
  sqlite_sync:    '/dashboard/sqlite-sync',
  operational:    '/dashboard/operational',
  admin_users:    '/admin/users',
};

// Level colors matching the 3-level structure
const LEVEL_COLORS: Record<string, { header: string; headerBg: string; border: string; dot: string }> = {
  '1': { header: '#a855f7', headerBg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', dot: '#a855f7' },
  '2': { header: '#3b82f6', headerBg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  dot: '#3b82f6' },
  '3': { header: '#00c8a0', headerBg: 'rgba(0,200,160,0.12)',   border: 'rgba(0,200,160,0.25)',   dot: '#00c8a0' },
};

export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  if (!admin) return null;

  const allowedModules = new Set((MODULES_FOR_ROLE[admin.role] || []).map(m => m.id));
  const roleColor = ROLE_COLORS[admin.role];

  return (
    <div style={{
      width: collapsed ? '52px' : '224px',
      minHeight: '100vh',
      background: '#080f1e',
      borderRight: '1px solid #1a2332',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.2s ease', overflow: 'hidden',
    }}>

      {/* ── Top: Logo + collapse ── */}
      <div style={{ padding: collapsed ? '12px 8px' : '14px 12px', borderBottom: '1px solid #1a2332', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#fff', flexShrink: 0 }}>E</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#f1f5f9', whiteSpace: 'nowrap' }}>EGCHAT</div>
              <div style={{ fontSize: '9px', color: '#334155', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Portal</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          background: 'transparent', border: '1px solid #1e293b', borderRadius: '6px',
          color: '#475569', cursor: 'pointer', padding: '4px 7px', fontSize: '12px', lineHeight: 1, flexShrink: 0,
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── Nav: 3 level boxes ── */}
      <nav style={{ flex: 1, padding: collapsed ? '8px 4px' : '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {PHASE_GROUPS.map(group => {
          const visible = group.modules.filter(m => allowedModules.has(m.id));
          if (visible.length === 0) return null;
          const lc = LEVEL_COLORS[group.phase] || LEVEL_COLORS['3'];

          return (
            <div key={group.phase} style={{
              marginBottom: '10px',
              borderRadius: '10px',
              border: collapsed ? 'none' : `1px solid ${lc.border}`,
              overflow: 'hidden',
            }}>
              {/* Level header */}
              {!collapsed && (
                <div style={{
                  background: lc.headerBg,
                  padding: '6px 10px',
                  borderBottom: `1px solid ${lc.border}`,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: lc.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: '9px', fontWeight: '900', color: lc.header, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    {group.label}
                  </span>
                </div>
              )}

              {/* Items */}
              <div style={{ padding: collapsed ? '4px 0' : '4px' }}>
                {collapsed && (
                  <div style={{ height: '2px', background: lc.headerBg, borderRadius: '1px', margin: '2px 4px 6px' }} />
                )}
                {visible.map(mod => (
                  <NavLink
                    key={mod.id}
                    to={ROUTE_MAP[mod.id] || '/'}
                    title={collapsed ? mod.label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : '9px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '7px 0' : '7px 8px',
                      borderRadius: '7px', marginBottom: '1px',
                      textDecoration: 'none',
                      fontSize: '12px', fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#f1f5f9' : '#64748b',
                      background: isActive ? `${lc.headerBg}` : 'transparent',
                      borderLeft: isActive && !collapsed ? `2px solid ${lc.dot}` : '2px solid transparent',
                      transition: 'all 0.12s',
                    })}
                  >
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{mod.icon}</span>
                    {!collapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mod.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: user info + logout ── */}
      {!collapsed ? (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #1a2332', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: '700', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</div>
          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', color: roleColor, background: `${roleColor}18`, padding: '2px 8px', borderRadius: '8px', marginBottom: '8px' }}>
            {ROLE_LABELS[admin.role]}
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '6px', background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
            color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
          }}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 4px', borderTop: '1px solid #1a2332', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={logout} title="Cerrar sesión" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', cursor: 'pointer', padding: '6px 8px' }}>⏻</button>
        </div>
      )}
    </div>
  );
};
