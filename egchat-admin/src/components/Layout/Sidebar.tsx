import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { MODULES_FOR_ROLE, PHASE_GROUPS, ROLE_LABELS, ROLE_COLORS } from '../../utils/rbac';
import {
  LayoutDashboard, TrendingUp, Target, ShieldAlert,
  Users, MessageSquare, Wallet, HeadphonesIcon, AppWindow,
  Server, GitBranch, ShieldCheck, ClipboardList, RefreshCw,
  ChevronLeft, ChevronRight, LogOut, Activity,
} from 'lucide-react';

// ── Icon map — Lucide professional icons ─────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  executive:      LayoutDashboard,
  financial:      TrendingUp,
  strategic:      Target,
  risk:           ShieldAlert,
  users:          Users,
  chat:           MessageSquare,
  wallet:         Wallet,
  support:        HeadphonesIcon,
  mini_apps:      AppWindow,
  infrastructure: Server,
  devops:         GitBranch,
  security:       ShieldCheck,
  audit:          ClipboardList,
  sqlite_sync:    RefreshCw,
  operational:    Activity,
};

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

// ── Professional muted palette ────────────────────────────────────────────────
const LEVEL_STYLE: Record<string, {
  headerText: string; headerBg: string; border: string;
  activeBg: string; activeText: string; activeBorder: string;
}> = {
  '1': {
    headerText:   '#7c6fcd',
    headerBg:     'rgba(124,111,205,0.08)',
    border:       'rgba(124,111,205,0.18)',
    activeBg:     'rgba(124,111,205,0.12)',
    activeText:   '#a89ee0',
    activeBorder: '#7c6fcd',
  },
  '2': {
    headerText:   '#4a90d9',
    headerBg:     'rgba(74,144,217,0.08)',
    border:       'rgba(74,144,217,0.18)',
    activeBg:     'rgba(74,144,217,0.12)',
    activeText:   '#79b4e8',
    activeBorder: '#4a90d9',
  },
  '3': {
    headerText:   '#3aaa8a',
    headerBg:     'rgba(58,170,138,0.08)',
    border:       'rgba(58,170,138,0.18)',
    activeBg:     'rgba(58,170,138,0.12)',
    activeText:   '#5ec9a8',
    activeBorder: '#3aaa8a',
  },
};

// ── EGChat SVG Logo ───────────────────────────────────────────────────────────
const EGChatLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00c8a0" />
        <stop offset="1" stopColor="#00b4e6" />
      </linearGradient>
    </defs>
    {/* Chat bubble */}
    <path d="M8 12C8 10.3 9.3 9 11 9h18c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3h-8l-5 4v-4h-5c-1.7 0-3-1.3-3-3V12z" fill="white" fillOpacity="0.95" />
    {/* E letter */}
    <text x="14" y="23" fontFamily="Arial" fontWeight="900" fontSize="12" fill="#00b4a0">E</text>
    {/* Signal dots */}
    <circle cx="26" cy="17" r="1.5" fill="#00c8a0" />
    <circle cx="21" cy="17" r="1.5" fill="#00c8a0" />
    <circle cx="16" cy="17" r="1.5" fill="#00c8a0" opacity="0.6" />
  </svg>
);

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  if (!admin) return null;

  const allowedModules = new Set((MODULES_FOR_ROLE[admin.role] || []).map(m => m.id));
  const roleColor = ROLE_COLORS[admin.role];

  return (
    <div style={{
      width: collapsed ? '52px' : '220px',
      minHeight: '100vh',
      background: '#06101f',
      borderRight: '1px solid #0f1e30',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* ── Header: Logo + collapse ── */}
      <div style={{
        padding: collapsed ? '13px 10px' : '14px 14px',
        borderBottom: '1px solid #0f1e30',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px', flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <EGChatLogo size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#e8edf4', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
                egchat
              </div>
              <div style={{ fontSize: '9px', color: '#2d4a6a', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                Admin Portal
              </div>
            </div>
          </div>
        )}
        {collapsed && <EGChatLogo size={26} />}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'transparent', border: '1px solid #132030',
            borderRadius: '6px', color: '#2d4a6a', cursor: 'pointer',
            padding: '3px 6px', display: 'flex', alignItems: 'center',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e3a54'; e.currentTarget.style.color = '#4a7fa5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#132030'; e.currentTarget.style.color = '#2d4a6a'; }}
        >
          {collapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft  size={13} />
          }
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 5px' : '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {PHASE_GROUPS.map(group => {
          const visible = group.modules.filter(m => allowedModules.has(m.id));
          if (visible.length === 0) return null;
          const ls = LEVEL_STYLE[group.phase] || LEVEL_STYLE['3'];

          return (
            <div key={group.phase} style={{
              marginBottom: '8px',
              borderRadius: '9px',
              border: collapsed ? 'none' : `1px solid ${ls.border}`,
              background: collapsed ? 'transparent' : ls.headerBg,
              overflow: 'hidden',
            }}>
              {/* Level label */}
              {!collapsed && (
                <div style={{
                  padding: '7px 10px 6px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: ls.headerText, flexShrink: 0, opacity: 0.9 }} />
                  <span style={{
                    fontSize: '9px', fontWeight: '700', color: ls.headerText,
                    textTransform: 'uppercase', letterSpacing: '1.2px', whiteSpace: 'nowrap',
                  }}>
                    {group.label}
                  </span>
                </div>
              )}
              {collapsed && (
                <div style={{ height: '2px', background: ls.headerBg, borderRadius: '1px', margin: '2px 4px 6px' }} />
              )}

              {/* Nav items */}
              <div style={{ padding: collapsed ? '0' : '2px 4px 5px' }}>
                {visible.map(mod => {
                  const IconComp = ICON_MAP[mod.id] || Activity;
                  return (
                    <NavLink
                      key={mod.id}
                      to={ROUTE_MAP[mod.id] || '/'}
                      title={collapsed ? mod.label : undefined}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : '9px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '8px 0' : '7px 9px',
                        borderRadius: '7px',
                        marginBottom: '1px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? ls.activeText : '#3a5570',
                        background: isActive ? ls.activeBg : 'transparent',
                        borderLeft: !collapsed && isActive ? `2px solid ${ls.activeBorder}` : '2px solid transparent',
                        transition: 'all 0.12s',
                      })}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.classList.contains('active')) {
                          el.style.color = '#6b8fae';
                          el.style.background = 'rgba(255,255,255,0.03)';
                        }
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.classList.contains('active')) {
                          el.style.color = '';
                          el.style.background = '';
                        }
                      }}
                    >
                      <IconComp
                        size={14}
                        strokeWidth={isActive ? 2 : 1.5}
                        style={{ flexShrink: 0 }}
                      />
                      {!collapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mod.label}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer: user + logout ── */}
      {!collapsed ? (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #0f1e30', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${roleColor}20`, border: `1px solid ${roleColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: roleColor, flexShrink: 0 }}>
              {admin.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#8aadcb', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin.email.split('@')[0]}
              </div>
              <div style={{ fontSize: '10px', color: roleColor, fontWeight: '700', opacity: 0.8 }}>
                {ROLE_LABELS[admin.role]}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '6px 10px',
              background: 'transparent',
              border: '1px solid #132030', borderRadius: '7px',
              color: '#2d4a6a', fontSize: '11px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#132030'; e.currentTarget.style.color = '#2d4a6a'; }}
          >
            <LogOut size={12} />
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 5px', borderTop: '1px solid #0f1e30', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{ background: 'transparent', border: '1px solid #132030', borderRadius: '7px', color: '#2d4a6a', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#2d4a6a'; e.currentTarget.style.borderColor = '#132030'; }}
          >
            <LogOut size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
