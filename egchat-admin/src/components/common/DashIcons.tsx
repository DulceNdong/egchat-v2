/**
 * Professional SVG icons for all dashboards — 18px stroke-based
 */
import React from 'react';

type P = { size?: number; strokeWidth?: number };
const I = (d: string, extra?: string) => ({ size = 18, strokeWidth = 1.8 }: P = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'inline-block' }} {...(extra ? { dangerouslySetInnerHTML: undefined } : {})}>
    {/* paths inserted per icon */}
  </svg>
);

// Generic SVG wrapper
export const SvgIcon: React.FC<{ d?: string; children?: React.ReactNode; size?: number; strokeWidth?: number }> =
  ({ children, size = 18, strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'inline-block' }}>
      {children}
    </svg>
  );

export const Icons = {
  // Nivel 1 — Dirección
  LayoutDashboard: ({ size=18 }) => <SvgIcon size={size}><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/></SvgIcon>,
  TrendingUp:      ({ size=18 }) => <SvgIcon size={size}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></SvgIcon>,
  Target:          ({ size=18 }) => <SvgIcon size={size}><circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={6}/><circle cx={12} cy={12} r={2}/></SvgIcon>,
  ShieldAlert:     ({ size=18 }) => <SvgIcon size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></SvgIcon>,
  // Nivel 2 — Operaciones
  Users:           ({ size=18 }) => <SvgIcon size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>,
  MessageSquare:   ({ size=18 }) => <SvgIcon size={size}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon>,
  CreditCard:      ({ size=18 }) => <SvgIcon size={size}><rect x={1} y={4} width={22} height={16} rx={2} ry={2}/><line x1={1} y1={10} x2={23} y2={10}/></SvgIcon>,
  Headphones:      ({ size=18 }) => <SvgIcon size={size}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></SvgIcon>,
  AppWindow:       ({ size=18 }) => <SvgIcon size={size}><rect x={3} y={3} width={18} height={18} rx={2}/><line x1={3} y1={9} x2={21} y2={9}/><line x1={9} y1={21} x2={9} y2={9}/></SvgIcon>,
  // Nivel 3 — Tecnología
  Server:          ({ size=18 }) => <SvgIcon size={size}><rect x={2} y={2} width={20} height={8} rx={2} ry={2}/><rect x={2} y={14} width={20} height={8} rx={2} ry={2}/><line x1={6} y1={6} x2={6.01} y2={6}/><line x1={6} y1={18} x2={6.01} y2={18}/></SvgIcon>,
  GitBranch:       ({ size=18 }) => <SvgIcon size={size}><line x1={6} y1={3} x2={6} y2={15}/><circle cx={18} cy={6} r={3}/><circle cx={6} cy={18} r={3}/><path d="M18 9a9 9 0 0 1-9 9"/></SvgIcon>,
  ShieldCheck:     ({ size=18 }) => <SvgIcon size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></SvgIcon>,
  ClipboardList:   ({ size=18 }) => <SvgIcon size={size}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x={8} y={2} width={8} height={4} rx={1} ry={1}/><line x1={9} y1={12} x2={15} y2={12}/><line x1={9} y1={16} x2={15} y2={16}/></SvgIcon>,
  RefreshCw:       ({ size=18 }) => <SvgIcon size={size}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></SvgIcon>,
  // KPI icons
  Activity:        ({ size=18 }) => <SvgIcon size={size}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgIcon>,
  Calendar:        ({ size=18 }) => <SvgIcon size={size}><rect x={3} y={4} width={18} height={18} rx={2} ry={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></SvgIcon>,
  Star:            ({ size=18 }) => <SvgIcon size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>,
  Plus:            ({ size=18 }) => <SvgIcon size={size}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></SvgIcon>,
  Zap:             ({ size=18 }) => <SvgIcon size={size}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></SvgIcon>,
  Shield:          ({ size=18 }) => <SvgIcon size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SvgIcon>,
  TrendUp:         ({ size=18 }) => <SvgIcon size={size}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></SvgIcon>,
  BarChart2:       ({ size=18 }) => <SvgIcon size={size}><line x1={18} y1={20} x2={18} y2={10}/><line x1={12} y1={20} x2={12} y2={4}/><line x1={6} y1={20} x2={6} y2={14}/></SvgIcon>,
  PieChart:        ({ size=18 }) => <SvgIcon size={size}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></SvgIcon>,
  DollarSign:      ({ size=18 }) => <SvgIcon size={size}><line x1={12} y1={1} x2={12} y2={23}/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></SvgIcon>,
  ArrowUpRight:    ({ size=18 }) => <SvgIcon size={size}><line x1={7} y1={17} x2={17} y2={7}/><polyline points="7 7 17 7 17 17"/></SvgIcon>,
  Clock:           ({ size=18 }) => <SvgIcon size={size}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></SvgIcon>,
  AlertTriangle:   ({ size=18 }) => <SvgIcon size={size}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></SvgIcon>,
  CheckCircle:     ({ size=18 }) => <SvgIcon size={size}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>,
  XCircle:         ({ size=18 }) => <SvgIcon size={size}><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></SvgIcon>,
  Bell:            ({ size=18 }) => <SvgIcon size={size}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></SvgIcon>,
  Lock:            ({ size=18 }) => <SvgIcon size={size}><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>,
  Unlock:          ({ size=18 }) => <SvgIcon size={size}><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></SvgIcon>,
  Globe:           ({ size=18 }) => <SvgIcon size={size}><circle cx={12} cy={12} r={10}/><line x1={2} y1={12} x2={22} y2={12}/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></SvgIcon>,
  Cpu:             ({ size=18 }) => <SvgIcon size={size}><rect x={4} y={4} width={16} height={16} rx={2} ry={2}/><rect x={9} y={9} width={6} height={6}/><line x1={9} y1={1} x2={9} y2={4}/><line x1={15} y1={1} x2={15} y2={4}/><line x1={9} y1={20} x2={9} y2={23}/><line x1={15} y1={20} x2={15} y2={23}/><line x1={20} y1={9} x2={23} y2={9}/><line x1={20} y1={14} x2={23} y2={14}/><line x1={1} y1={9} x2={4} y2={9}/><line x1={1} y1={14} x2={4} y2={14}/></SvgIcon>,
  Database:        ({ size=18 }) => <SvgIcon size={size}><ellipse cx={12} cy={5} rx={9} ry={3}/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></SvgIcon>,
  Package:         ({ size=18 }) => <SvgIcon size={size}><line x1={16.5} y1={9.4} x2={7.5} y2={4.21}/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1={12} y1={22.08} x2={12} y2={12}/></SvgIcon>,
  Ticket:          ({ size=18 }) => <SvgIcon size={size}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1={9} y1={12} x2={15} y2={12}/></SvgIcon>,
  Smartphone:      ({ size=18 }) => <SvgIcon size={size}><rect x={5} y={2} width={14} height={20} rx={2} ry={2}/><line x1={12} y1={18} x2={12.01} y2={18}/></SvgIcon>,
  Map:             ({ size=18 }) => <SvgIcon size={size}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1={8} y1={2} x2={8} y2={18}/><line x1={16} y1={6} x2={16} y2={22}/></SvgIcon>,
  WifiOff:         ({ size=18 }) => <SvgIcon size={size}><line x1={1} y1={1} x2={23} y2={23}/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1={12} y1={20} x2={12.01} y2={20}/></SvgIcon>,
};

// Shared KPI Card component that uses theme colors
export const KpiCard: React.FC<{
  Icon: React.FC<{ size?: number }>;
  label: string; value: string | number; sub?: string;
  color: string; bgCard: string; border: string; text: string; textMuted: string;
  trend?: number; alert?: boolean;
}> = ({ Icon, label, value, sub, color, bgCard, border, text, textMuted, trend, alert }) => (
  <div style={{
    background: bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color + '60' : border}`,
    borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden',
  }}>
    {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
    <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
      <div style={{ color, opacity: 0.9 }}><Icon size={18} /></div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: alert ? color : text, lineHeight: 1.1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    {sub && <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ marginTop: 8, fontSize: 11, color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs anterior
      </div>
    )}
  </div>
);

// Section title
export const SectionTitle: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#94a3b8' }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
    {children}
  </div>
);
