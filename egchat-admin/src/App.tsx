import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';

import { ExecutiveDashboard }      from './pages/Dashboard/Executive';
import { FinancialDashboard }      from './pages/Dashboard/Financial';
import { StrategicDashboard }      from './pages/Dashboard/Strategic';
import { RiskDashboard }           from './pages/Dashboard/Risk';
import { UsersDashboard }          from './pages/Dashboard/Users';
import { SupportDashboard }        from './pages/Dashboard/Support';
import { MiniAppsDashboard }       from './pages/Dashboard/MiniApps';
import { DevOpsDashboard }         from './pages/Dashboard/DevOps';
import { OperationalDashboard }    from './pages/Dashboard/Operational';
import { ChatDashboard }           from './pages/Dashboard/Chat';
import { WalletDashboard }         from './pages/Dashboard/Wallet';
import { SecurityDashboard }       from './pages/Dashboard/Security';
import { InfrastructureDashboard } from './pages/Dashboard/Infrastructure';
import { ThemeContext } from './context/ThemeContext';
import { SQLiteSyncDashboard }     from './pages/Dashboard/SQLiteSync';
import { AuditDashboard }          from './pages/Dashboard/Audit';
import { UserManagement }          from './pages/Admin/UserManagement';

// ── Theme system ──────────────────────────────────────────────────────────────
interface Theme {
  id: string; name: string; preview: string;
  bg: string; bgSide: string; bgCard: string;
  border: string; text: string; textMuted: string;
  l1: string; l2: string; l3: string;
}

const THEMES: Theme[] = [
  // ── Dark themes ──────────────────────────────────────────────────────────────
  {
    id: 'navy', name: 'Navy', preview: '#07111e',
    bg: '#050d18', bgSide: '#07111e', bgCard: '#0a1628',
    border: '#0d1e2e', text: '#c8dcea', textMuted: '#2e5070',
    l1: '#7c6fcd', l2: '#4a8fc4', l3: '#3aaa8a',
  },
  {
    id: 'slate', name: 'Slate', preview: '#1a1f2e',
    bg: '#111827', bgSide: '#1a1f2e', bgCard: '#1e2538',
    border: '#252d3f', text: '#d4dce8', textMuted: '#4a5568',
    l1: '#818cf8', l2: '#60a5fa', l3: '#34d399',
  },
  {
    id: 'midnight', name: 'Midnight', preview: '#0d0d1a',
    bg: '#080810', bgSide: '#0d0d1a', bgCard: '#111120',
    border: '#1a1a2e', text: '#c8c8e8', textMuted: '#2e2e50',
    l1: '#a78bfa', l2: '#6ea8fe', l3: '#4ade80',
  },
  {
    id: 'charcoal', name: 'Carbón', preview: '#1c1c1e',
    bg: '#141414', bgSide: '#1c1c1e', bgCard: '#222224',
    border: '#2c2c2e', text: '#e0e0e6', textMuted: '#48484a',
    l1: '#bf8fee', l2: '#5eb8f0', l3: '#52c89a',
  },
  // ── Light/bright themes ───────────────────────────────────────────────────────
  {
    id: 'light', name: 'Claro', preview: '#f0f4f8',
    bg: '#f0f4f8', bgSide: '#e8eef4', bgCard: '#ffffff',
    border: '#d0dce8', text: '#1a2e3a', textMuted: '#6b8aa8',
    l1: '#6050b8', l2: '#2a70b8', l3: '#1a9a7a',
  },
  {
    id: 'light-warm', name: 'Cálido', preview: '#f5f0ea',
    bg: '#f5f0ea', bgSide: '#ece5dc', bgCard: '#ffffff',
    border: '#d8cebe', text: '#2a1e10', textMuted: '#8a7060',
    l1: '#9060c0', l2: '#d07030', l3: '#1a9a6a',
  },
  {
    id: 'teal-light', name: 'Aguamarina', preview: '#e8f6f4',
    bg: '#edf8f6', bgSide: '#ddf0ec', bgCard: '#ffffff',
    border: '#b8e0d8', text: '#0a2822', textMuted: '#3a7870',
    l1: '#6040b0', l2: '#0890a0', l3: '#00c8a0',
  },
  {
    id: 'purple-light', name: 'Lavanda', preview: '#f0ecf8',
    bg: '#f2eef8', bgSide: '#e8e0f4', bgCard: '#ffffff',
    border: '#d0c4e8', text: '#1a0e30', textMuted: '#7060a0',
    l1: '#8060d8', l2: '#6080e0', l3: '#40b890',
  },
];

// Save theme to localStorage
const THEME_KEY = 'egchat-admin-theme';
function loadTheme(): Theme {
  try {
    const id = localStorage.getItem(THEME_KEY);
    return THEMES.find(t => t.id === id) ?? THEMES[0];
  } catch { return THEMES[0]; }
}
function saveTheme(t: Theme) {
  try { localStorage.setItem(THEME_KEY, t.id); } catch {}
}

// Apply theme CSS vars to document root
function applyTheme(t: Theme) {
  const r = document.documentElement.style;
  r.setProperty('--bg',        t.bg);
  r.setProperty('--bg-side',   t.bgSide);
  r.setProperty('--bg-card',   t.bgCard);
  r.setProperty('--border',    t.border);
  r.setProperty('--text',      t.text);
  r.setProperty('--text-muted',t.textMuted);
  r.setProperty('--l1',        t.l1);
  r.setProperty('--l2',        t.l2);
  r.setProperty('--l3',        t.l3);
}

// Theme context — also exported via ThemeContext.ts for dashboards to consume
const ThemeCtx = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: THEMES[0], setTheme: () => {},
});

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminRole = 'super_admin' | 'operations' | 'support' | 'finance' | 'security' | 'auditor';

// ── Role permissions per level ────────────────────────────────────────────────
// Level 1 (Dirección): super_admin + auditor
// Level 2 (Operaciones): super_admin + operations + support + finance
// Level 3 (Tecnología): super_admin + security + operations
const LEVEL_ACCESS: Record<number, AdminRole[]> = {
  1: ['super_admin', 'auditor'],
  2: ['super_admin', 'operations', 'support', 'finance'],
  3: ['super_admin', 'security', 'operations'],
};

// ── Error boundary ────────────────────────────────────────────────────────────
class EB extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  constructor(p: any) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 32, color: '#c8d8e8' }}>
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: 12, padding: 20 }}>
          <div style={{ color: '#e06c75', fontWeight: 700, marginBottom: 8 }}>Error en dashboard</div>
          <pre style={{ color: '#6b8aaa', fontSize: 11, overflow: 'auto', margin: 0 }}>{this.state.err}</pre>
          <button onClick={() => this.setState({ err: null })} style={{ marginTop: 12, padding: '6px 14px', background: '#0d1f33', border: '1px solid #1e3a54', borderRadius: 7, color: '#6b8aaa', cursor: 'pointer', fontSize: 12 }}>Reintentar</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Inline SVG icons (Heroicons style, 16px) ──────────────────────────────────
const Icon = {
  Dashboard:       () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/></svg>,
  TrendingUp:      () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Target:          () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={6}/><circle cx={12} cy={12} r={2}/></svg>,
  Shield:          () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Users:           () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  MessageSquare:   () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Wallet:          () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={1} y={4} width={22} height={16} rx={2} ry={2}/><line x1={1} y1={10} x2={23} y2={10}/></svg>,
  Headphones:      () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  Grid:            () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/></svg>,
  Server:          () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={2} width={20} height={8} rx={2} ry={2}/><rect x={2} y={14} width={20} height={8} rx={2} ry={2}/><line x1={6} y1={6} x2={6.01} y2={6}/><line x1={6} y1={18} x2={6.01} y2={18}/></svg>,
  GitBranch:       () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1={6} y1={3} x2={6} y2={15}/><circle cx={18} cy={6} r={3}/><circle cx={6} cy={18} r={3}/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  Lock:            () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Clipboard:       () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x={8} y={2} width={8} height={4} rx={1} ry={1}/></svg>,
  RefreshCw:       () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  LogOut:          () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1={21} y1={12} x2={9} y2={12}/></svg>,
};

// ── Nav structure with icons and role requirements ─────────────────────────────
const NAV_GROUPS = [
  {
    level: 1,
    label: 'NIVEL 1 — DIRECCIÓN',
    color: '#7c6fcd',
    borderColor: 'rgba(124,111,205,0.35)',
    bgColor: 'rgba(124,111,205,0.07)',
    activeBg: 'rgba(124,111,205,0.18)',
    items: [
      { to: '/dashboard/executive', label: 'Ejecutivo',   Icon: Icon.Dashboard },
      { to: '/dashboard/financial', label: 'Financiero',  Icon: Icon.TrendingUp },
      { to: '/dashboard/strategic', label: 'Estratégico', Icon: Icon.Target },
      { to: '/dashboard/risk',      label: 'Riesgo',      Icon: Icon.Shield },
    ],
  },
  {
    level: 2,
    label: 'NIVEL 2 — OPERACIONES',
    color: '#4a8fc4',
    borderColor: 'rgba(74,143,196,0.35)',
    bgColor: 'rgba(74,143,196,0.07)',
    activeBg: 'rgba(74,143,196,0.18)',
    items: [
      { to: '/dashboard/users',     label: 'Usuarios',  Icon: Icon.Users },
      { to: '/dashboard/chat',      label: 'Chat',      Icon: Icon.MessageSquare },
      { to: '/dashboard/wallet',    label: 'Wallet',    Icon: Icon.Wallet },
      { to: '/dashboard/support',   label: 'Soporte',   Icon: Icon.Headphones },
      { to: '/dashboard/mini-apps', label: 'Mini Apps', Icon: Icon.Grid },
    ],
  },
  {
    level: 3,
    label: 'NIVEL 3 — TECNOLOGÍA',
    color: '#2aaa7a',
    borderColor: 'rgba(42,170,122,0.35)',
    bgColor: 'rgba(42,170,122,0.07)',
    activeBg: 'rgba(42,170,122,0.18)',
    items: [
      { to: '/dashboard/infrastructure', label: 'Infraestructura', Icon: Icon.Server },
      { to: '/dashboard/devops',         label: 'DevOps',          Icon: Icon.GitBranch },
      { to: '/dashboard/security',       label: 'Seguridad',       Icon: Icon.Lock },
      { to: '/dashboard/audit',          label: 'Auditoría',       Icon: Icon.Clipboard },
      { to: '/dashboard/sqlite-sync',    label: 'Sincronización',  Icon: Icon.RefreshCw },
    ],
  },
];

// ── First accessible route per role ──────────────────────────────────────────
function getFirstRoute(role: AdminRole): string {
  for (const group of NAV_GROUPS) {
    const allowed = LEVEL_ACCESS[group.level];
    if (allowed.includes(role)) return group.items[0].to;
  }
  return '/dashboard/executive';
}

// ── EGChat Logo — matches the app design ─────────────────────────────────────
function Logo({ size = 32 }: { size?: number }) {
  const s = size;
  const r = Math.round(s * 0.22); // corner radius ~22%
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={40} height={40} rx={10} fill="white"/>
      {/* Inner colored rounded square */}
      <rect x={4} y={4} width={32} height={32} rx={8} fill="url(#egAppGrad)"/>
      <defs>
        <linearGradient id="egAppGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00c8a0"/>
          <stop offset="1" stopColor="#00b4e6"/>
        </linearGradient>
      </defs>
      {/* Chat bubble icon - same as app */}
      <path d="M28 15a2 2 0 0 0-2-2H14a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8l4 3v-3h2a0 0 0 0 0 0-2V15z" fill="white" fillOpacity={0.95}/>
      {/* Dots inside bubble */}
      <circle cx={15.5} cy={19} r={1.4} fill="#00c8a0"/>
      <circle cx={20} cy={19} r={1.4} fill="#00c8a0"/>
      <circle cx={24.5} cy={19} r={1.4} fill="#00c8a0"/>
    </svg>
  );
}

// ── Nav item with hover pop-out effect ───────────────────────────────────────
function NavItem({ to, label, Icon: IconComp, groupColor, groupActiveBg, collapsed, theme }: {
  to: string; label: string; Icon: React.FC;
  groupColor: string; groupActiveBg: string;
  collapsed: boolean; theme: Theme;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <NavLink to={to} title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '9px 0' : '8px 10px',
        borderRadius: 8, marginBottom: 2,
        textDecoration: 'none',
        fontSize: 12.5,
        fontWeight: isActive ? 700 : hovered ? 600 : 400,
        color: isActive ? groupColor : hovered ? groupColor : theme.textMuted,
        background: isActive
          ? groupActiveBg
          : hovered
            ? `${groupColor}12`
            : 'transparent',
        borderLeft: !collapsed && isActive
          ? `3px solid ${groupColor}`
          : !collapsed && hovered
            ? `3px solid ${groupColor}60`
            : '3px solid transparent',
        transform: hovered && !isActive ? 'translateX(3px)' : 'translateX(0)',
        boxShadow: hovered ? `2px 2px 8px ${groupColor}18` : 'none',
        transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flexShrink: 0, opacity: hovered ? 1 : 0.7, transition: 'opacity 0.15s', transform: hovered ? 'scale(1.1)' : 'scale(1)', display: 'inline-flex' }}>
        <IconComp />
      </span>
      {!collapsed && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      )}
    </NavLink>
  );
}
function AppSidebar({ collapsed, onToggle, theme, role }: { collapsed: boolean; onToggle: () => void; theme: Theme; role: AdminRole }) {
  const { admin, logout } = useAuthStore();
  if (!admin) return null;
  const initials = admin.email.charAt(0).toUpperCase();

  // Role label and color
  const ROLE_META: Record<AdminRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: '#c47070' },
    operations:  { label: 'Operaciones', color: '#5a8fc4' },
    support:     { label: 'Soporte',     color: '#4aaa7a' },
    finance:     { label: 'Finanzas',    color: '#c4a44a' },
    security:    { label: 'Seguridad',   color: '#9a70c4' },
    auditor:     { label: 'Auditor',     color: '#6b8aaa' },
  };
  const roleMeta = ROLE_META[role] ?? { label: role, color: '#6b8aaa' };

  return (
    <div style={{
      width: collapsed ? 52 : 220,
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${theme.bgSide} 0%, ${theme.bg} 100%)`,
      borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: collapsed ? '13px 8px' : '14px 14px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8, flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Logo size={32} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>egchat</div>
              <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginTop: 1 }}>Admin Portal</div>
            </div>
          </div>
        )}
        {collapsed && <Logo size={28} />}
        <button onClick={onToggle} style={{
          background: 'transparent', border: '1px solid #0d1e2e',
          borderRadius: 6, color: '#1e3a54', cursor: 'pointer',
          padding: '3px 7px', fontSize: 13, lineHeight: 1,
          transition: 'all 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4a7fa5'; (e.currentTarget as HTMLElement).style.borderColor = '#1e3a54'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#1e3a54'; (e.currentTarget as HTMLElement).style.borderColor = '#0d1e2e'; }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 5px' : '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map(group => {
          // Permission check
          const allowed = LEVEL_ACCESS[group.level];
          if (!allowed.includes(role)) return null;

          return (
            <div key={group.level} style={{
              marginBottom: 9,
              borderRadius: 9,
              border: collapsed ? 'none' : `1px solid ${group.borderColor}`,
              background: collapsed ? 'transparent' : group.bgColor,
              overflow: 'hidden',
            }}>
              {/* Level header */}
              {!collapsed && (
                <div style={{ padding: '8px 10px 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: group.color, flexShrink: 0, boxShadow: `0 0 6px ${group.color}80` }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: group.color, textTransform: 'uppercase', letterSpacing: '1.2px', whiteSpace: 'nowrap' }}>
                    {group.label}
                  </span>
                </div>
              )}
              {collapsed && <div style={{ height: 2, background: group.bgColor, borderRadius: 1, margin: '2px 4px 5px' }} />}

              {/* Items */}
              <div style={{ padding: collapsed ? '0 0 2px' : '2px 4px 6px' }}>
                {group.items.map(item => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    Icon={item.Icon}
                    groupColor={group.color}
                    groupActiveBg={group.activeBg}
                    collapsed={collapsed}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed ? (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #0d1e2e', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${roleMeta.color}18`, border: `1px solid ${roleMeta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: roleMeta.color, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#5a8aaa', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email.split('@')[0]}</div>
              <div style={{ fontSize: 10, color: roleMeta.color, fontWeight: 600, opacity: 0.75 }}>{roleMeta.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '6px 10px', background: 'transparent',
            border: '1px solid #0d1e2e', borderRadius: 7,
            color: '#1e3a54', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c47070'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,112,112,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#1e3a54'; (e.currentTarget as HTMLElement).style.borderColor = '#0d1e2e'; }}
          >
            <Icon.LogOut /> Cerrar sesión
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 5px', borderTop: '1px solid #0d1e2e', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={logout} title="Cerrar sesión" style={{ background: 'transparent', border: '1px solid #0d1e2e', borderRadius: 7, color: '#1e3a54', cursor: 'pointer', padding: '6px 7px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c47070'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#1e3a54'; }}>
            <Icon.LogOut />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page titles ───────────────────────────────────────────────────────────────
const TITLES: Record<string, string> = {
  '/dashboard/executive':      'Centro de Control Ejecutivo',
  '/dashboard/financial':      'Dashboard Financiero',
  '/dashboard/strategic':      'Dashboard Estratégico',
  '/dashboard/risk':           'Dashboard de Riesgo',
  '/dashboard/users':          'Dashboard de Usuarios',
  '/dashboard/support':        'Dashboard de Soporte',
  '/dashboard/mini-apps':      'Dashboard Mini Apps',
  '/dashboard/devops':         'Dashboard DevOps',
  '/dashboard/operational':    'Dashboard Operacional',
  '/dashboard/chat':           'Dashboard Chat',
  '/dashboard/wallet':         'Dashboard Wallet',
  '/dashboard/security':       'Centro de Operaciones de Seguridad',
  '/dashboard/infrastructure': 'Dashboard de Infraestructura',
  '/dashboard/sqlite-sync':    'Sincronización SQLite',
  '/dashboard/audit':          'Dashboard de Auditoría',
  '/admin/users':              'Gestión de Administradores',
};

// ── Protected layout ──────────────────────────────────────────────────────────
function ProtectedLayout() {
  const admin = useAuthStore(s => s.admin);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = loadTheme();
    applyTheme(t);
    return t;
  });
  const [showPalette, setShowPalette] = useState(false);

  const handleTheme = (t: Theme) => {
    applyTheme(t);
    saveTheme(t);
    setThemeState(t);
    setShowPalette(false);
  };

  if (!admin) return <Navigate to="/login" replace />;

  const role = admin.role as AdminRole;
  const title = TITLES[location.pathname] ?? 'Admin Portal';

  return (
    <ThemeCtx.Provider value={{ theme, setTheme: handleTheme }}>
    <ThemeContext.Provider value={theme}>
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} theme={theme} role={role} />
        <div style={{
          marginLeft: collapsed ? 52 : 220,
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
          transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Header */}
          <div style={{
            height: 52, background: theme.bgSide, borderBottom: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', position: 'sticky', top: 0, zIndex: 50,
          }}>
            <h1 style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, margin: 0, letterSpacing: '0.3px' }}>{title}</h1>

            {/* Theme palette picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPalette(s => !s)}
                title="Cambiar tema de color"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', border: `1px solid ${theme.border}`,
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  color: theme.textMuted, fontSize: 11, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.l2; (e.currentTarget as HTMLElement).style.color = theme.text; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.color = theme.textMuted; }}
              >
                {/* Current color swatch */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {[theme.l1, theme.l2, theme.l3].map((c, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span>{theme.name}</span>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown */}
              {showPalette && (
                <div style={{
                  position: 'absolute', right: 0, top: 42,
                  background: theme.bgCard, border: `1px solid ${theme.border}`,
                  borderRadius: 12, padding: 12, zIndex: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  minWidth: 220,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                    Tema de Color
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleTheme(t)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 8,
                          background: theme.id === t.id ? `${t.l2}18` : 'transparent',
                          border: theme.id === t.id ? `1px solid ${t.l2}40` : `1px solid transparent`,
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (theme.id !== t.id) (e.currentTarget as HTMLElement).style.background = `${t.l2}10`; }}
                        onMouseLeave={e => { if (theme.id !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {/* Preview swatch */}
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: t.preview, border: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          {[t.l1, t.l2, t.l3].map((c, i) => (
                            <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: c }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, color: theme.id === t.id ? t.l2 : theme.text, fontWeight: theme.id === t.id ? 700 : 400 }}>{t.name}</span>
                        {theme.id === t.id && (
                          <svg style={{ marginLeft: 'auto' }} width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={t.l2} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <main style={{ flex: 1, padding: 24, overflowY: 'auto', overflowX: 'hidden' }}>
            <Routes>
              <Route path="/dashboard/executive"      element={<EB><ExecutiveDashboard /></EB>} />
              <Route path="/dashboard/financial"      element={<EB><FinancialDashboard /></EB>} />
              <Route path="/dashboard/strategic"      element={<EB><StrategicDashboard /></EB>} />
              <Route path="/dashboard/risk"           element={<EB><RiskDashboard /></EB>} />
              <Route path="/dashboard/users"          element={<EB><UsersDashboard /></EB>} />
              <Route path="/dashboard/support"        element={<EB><SupportDashboard /></EB>} />
              <Route path="/dashboard/mini-apps"      element={<EB><MiniAppsDashboard /></EB>} />
              <Route path="/dashboard/devops"         element={<EB><DevOpsDashboard /></EB>} />
              <Route path="/dashboard/operational"    element={<EB><OperationalDashboard /></EB>} />
              <Route path="/dashboard/chat"           element={<EB><ChatDashboard /></EB>} />
              <Route path="/dashboard/wallet"         element={<EB><WalletDashboard /></EB>} />
              <Route path="/dashboard/security"       element={<EB><SecurityDashboard /></EB>} />
              <Route path="/dashboard/infrastructure" element={<EB><InfrastructureDashboard /></EB>} />
              <Route path="/dashboard/sqlite-sync"    element={<EB><SQLiteSyncDashboard /></EB>} />
              <Route path="/dashboard/audit"          element={<EB><AuditDashboard /></EB>} />
              <Route path="/admin/users"              element={<EB><UserManagement /></EB>} />
              <Route path="*" element={<Navigate to={getFirstRoute(role)} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
    </ThemeCtx.Provider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*"     element={<ProtectedLayout />} />
    </Routes>
  );
}
