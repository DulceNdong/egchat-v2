import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type DeployStatus = 'success' | 'failed' | 'in_progress' | 'cancelled' | 'queued';
type BuildEnv     = 'production' | 'preview' | 'development';

interface Deployment {
  id: string; project: string; platform: string; platformIcon: string;
  version: string; branch: string; commit: string; commitMsg: string;
  author: string; status: DeployStatus; env: BuildEnv;
  startedAt: string; duration: string; url?: string;
  errorSummary?: string;
}

interface BuildLog {
  ts: string; level: 'info' | 'warn' | 'error' | 'success'; message: string; source: string;
}

interface DevOpsData {
  totalDeploys: number; successRate: number; avgBuildMin: number;
  failedToday: number; deployingNow: number;
  projects: {
    name: string; platform: string; platformIcon: string; color: string;
    currentVersion: string; lastDeploy: string; status: DeployStatus;
    deploysThisWeek: number; successRate: number;
  }[];
  deployHistory: Deployment[];
  buildTrend: { day: string; success: number; failed: number; duration: number }[];
  durationTrend: { deploy: string; duration: number }[];
  recentLogs: BuildLog[];
  platformStats: { platform: string; deploys: number; color: string; icon: string }[];
  lastUpdate: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const DEPLOY_STATUS: Record<DeployStatus, { color: string; bg: string; label: string; icon: string }> = {
  success:     { color: theme.l3, bg: 'rgba(0,200,160,0.1)',   label: 'Exitoso',      icon: '✅' },
  failed:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Fallido',      icon: '❌' },
  in_progress: { color: theme.l2, bg: 'rgba(59,130,246,0.1)', label: 'En Proceso',   icon: '🔄' },
  cancelled:   { color: theme.textMuted, bg: 'rgba(100,116,139,0.1)', label: 'Cancelado',    icon: '⛔' },
  queued:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'En Cola',      icon: '⏳' },
};

const ENV_CFG: Record<BuildEnv, { color: string; label: string }> = {
  production:  { color: '#ef4444', label: 'PROD'  },
  preview:     { color: '#f59e0b', label: 'PREV'  },
  development: { color: theme.l2, label: 'DEV'   },
};

const LOG_CFG = {
  info:    { color: theme.textMuted, bg: 'transparent',            icon: '·' },
  warn:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', icon: '⚠' },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  icon: '✖' },
  success: { color: theme.l3, bg: 'rgba(0,200,160,0.05)',  icon: '✔' },
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const COMMIT_MSGS = [
  'feat: add executive dashboard','fix: wallet read-only mode','chore: update dependencies',
  'feat: mini apps monitoring','fix: sidebar phase grouping','perf: code splitting vite config',
  'feat: infrastructure dashboard','fix: auth token expiry','chore: bump version to 2.5.1',
  'feat: risk dashboard alerts','fix: neon db connection pool','docs: update README',
];
const AUTHORS = ['dulcendong','carlos.ng','ana.mb','miguel.ondo','rosa.nch'];
const PROJECTS = [
  { name: 'egchat-v2',    platform: 'Vercel',  platformIcon: '▲', color: theme.text, currentVersion: 'v2.5.1', deploysThisWeek: 8  },
  { name: 'egchat-api',   platform: 'Render',  platformIcon: '🚀', color: theme.l2, currentVersion: 'v3.2.0', deploysThisWeek: 5  },
  { name: 'egchat-admin', platform: 'Vercel',  platformIcon: '▲', color: theme.l1, currentVersion: 'v1.4.0', deploysThisWeek: 12 },
];

function generateMock(): DevOpsData {
  const deploys: Deployment[] = Array.from({ length: 40 }, (_, i) => {
    const proj = PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
    const statuses: DeployStatus[] = ['success','success','success','success','failed','in_progress','cancelled'];
    const status = i === 0 ? 'in_progress' : statuses[Math.floor(Math.random() * statuses.length)];
    const minsAgo = i * 45 + Math.floor(Math.random() * 40);
    const dur = Math.floor(45 + Math.random() * 180);
    return {
      id: `dpl_${Math.random().toString(36).slice(2,10)}`,
      project: proj.name, platform: proj.platform, platformIcon: proj.platformIcon,
      version: `v${Math.floor(1+Math.random()*3)}.${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*20)}`,
      branch: Math.random() > 0.7 ? 'main' : Math.random() > 0.5 ? 'develop' : `feat/dash-${Math.floor(Math.random()*10)}`,
      commit: Math.random().toString(36).slice(2,9),
      commitMsg: COMMIT_MSGS[Math.floor(Math.random() * COMMIT_MSGS.length)],
      author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
      status,
      env: Math.random() > 0.6 ? 'production' : Math.random() > 0.5 ? 'preview' : 'development',
      startedAt: minsAgo < 60 ? `Hace ${minsAgo}m` : `Hace ${Math.floor(minsAgo/60)}h ${minsAgo%60}m`,
      duration: status === 'in_progress' ? '—' : `${dur}s`,
      url: status === 'success' ? `https://${proj.name}.vercel.app` : undefined,
      errorSummary: status === 'failed' ? ['Build timeout','npm install failed','TypeScript errors: 3','Memory limit exceeded'][Math.floor(Math.random()*4)] : undefined,
    };
  });

  const successCount = deploys.filter(d => d.status === 'success').length;
  const failedToday = deploys.filter(d => d.status === 'failed').slice(0,4).length;

  const logs: BuildLog[] = [
    { ts: '10:42:18', level: 'info',    source: 'vercel',  message: '▲ Starting build for egchat-admin...' },
    { ts: '10:42:19', level: 'info',    source: 'node',    message: 'Node.js v20.11.0 detected' },
    { ts: '10:42:21', level: 'info',    source: 'npm',     message: 'Installing 847 packages...' },
    { ts: '10:42:48', level: 'success', source: 'npm',     message: 'Dependencies installed (27s)' },
    { ts: '10:42:49', level: 'info',    source: 'vite',    message: 'vite v6.4.3 building for production...' },
    { ts: '10:42:50', level: 'info',    source: 'vite',    message: '✓ 690 modules transformed' },
    { ts: '10:42:52', level: 'warn',    source: 'vite',    message: 'Some chunks are larger than 500 kB after minification' },
    { ts: '10:42:52', level: 'success', source: 'vite',    message: '✓ built in 2.83s (dist: 937kB / gzip: 242kB)' },
    { ts: '10:42:53', level: 'info',    source: 'vercel',  message: 'Uploading build output (3 files)...' },
    { ts: '10:42:55', level: 'success', source: 'vercel',  message: '✅ Production deployed: egchat-admin.vercel.app' },
    { ts: '10:42:55', level: 'info',    source: 'vercel',  message: 'Assigning aliases...' },
    { ts: '10:42:56', level: 'success', source: 'vercel',  message: '🔗 Aliased: https://egchat-admin.vercel.app' },
    { ts: '10:38:02', level: 'info',    source: 'render',  message: '🚀 Deploy triggered: egchat-api@main 064f1e9' },
    { ts: '10:38:05', level: 'info',    source: 'render',  message: 'Pulling Docker image...' },
    { ts: '10:38:30', level: 'info',    source: 'npm',     message: 'npm ci running...' },
    { ts: '10:38:58', level: 'info',    source: 'render',  message: 'Starting server on port 5000' },
    { ts: '10:39:01', level: 'success', source: 'render',  message: '✅ Health check passed — service live' },
    { ts: '10:39:01', level: 'info',    source: 'render',  message: '[AdminRoutes] ✅ Rutas admin montadas en /api/admin/*' },
  ];

  return {
    totalDeploys: 156, successRate: Math.round(successCount / deploys.length * 100),
    avgBuildMin: 2.8, failedToday, deployingNow: 1,
    projects: PROJECTS.map(p => ({
      ...p, status: 'success' as DeployStatus, lastDeploy: 'Hace 14 min', successRate: Math.floor(88 + Math.random() * 12),
    })),
    deployHistory: deploys,
    buildTrend: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      success:  Math.floor(8 + Math.random() * 8),
      failed:   Math.floor(Math.random() * 3),
      duration: Math.floor(100 + Math.random() * 80),
    })),
    durationTrend: deploys.slice(0,15).reverse().map((d, i) => ({
      deploy: `#${i+1}`,
      duration: d.status === 'in_progress' ? 0 : Math.floor(45 + Math.random() * 180),
    })),
    recentLogs: logs,
    platformStats: [
      { platform: 'Vercel',  deploys: 84, color: theme.text, icon: '▲' },
      { platform: 'Render',  deploys: 52, color: theme.l2, icon: '🚀' },
      { platform: 'GitHub',  deploys: 20, color: theme.textMuted, icon: '🐙' },
    ],
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export const DevOpsDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]       = useState<DevOpsData>(generateMock());
  const [tick, setTick]       = useState(0);
  const [pulse, setPulse]     = useState(false);
  const [statusFilter, setStatusFilter] = useState<DeployStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [logFilter, setLogFilter] = useState<'all' | 'warn' | 'error'>('all');
  const [page, setPage]       = useState(0);
  const PAGE = 10;

  const refresh = useCallback(() => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    setData(generateMock());
  }, []);

  useEffect(() => {
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t + 1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const filtered = d.deployHistory.filter(dep => {
    if (statusFilter !== 'all' && dep.status !== statusFilter) return false;
    if (projectFilter !== 'all' && dep.project !== projectFilter) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  const filteredLogs = logFilter === 'all' ? d.recentLogs : d.recentLogs.filter(l => l.level === logFilter || (logFilter === 'warn' && l.level === 'success'));

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px', fontWeight: '900' }}>🛠️ Dashboard DevOps</span>
            {d.deployingNow > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '4px 12px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.l2, boxShadow: '0 0 6px #3b82f6' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: theme.l2 }}>{d.deployingNow} deploy en progreso</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>FASE C — Tecnología · Deployments · Builds · Logs · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#3b82f6 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: theme.l2, fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {[
          { icon:'🚀', label:'Total Deploys',     value:d.totalDeploys,                   color:theme.l2 },
          { icon:'✅', label:'Tasa de Éxito',     value:`${d.successRate}%`,               color:d.successRate>=90?theme.l3:'#f59e0b' },
          { icon:'❌', label:'Fallos Hoy',         value:d.failedToday,                    color:d.failedToday>2?'#ef4444':'#64748b', alert:d.failedToday>2 },
          { icon:'⏱️', label:'Tiempo Build',      value:`${d.avgBuildMin}min`,             color:theme.l1 },
          { icon:'🔄', label:'En Progreso',        value:d.deployingNow,                   color:theme.l2 },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${(item as any).alert ? '#ef4444' : item.color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {(item as any).alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />}
            <div style={{ position: 'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', borderRadius:'50%', background:`radial-gradient(circle,${item.color}20 0%,transparent 70%)` }} />
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize:'22px', fontWeight:'900', color: (item as any).alert ? '#ef4444' : '#f1f5f9' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Project cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {d.projects.map(proj => {
          const s = DEPLOY_STATUS[proj.status];
          return (
            <div key={proj.name} style={{ background: theme.bgCard, borderRadius: '14px', padding: '16px', border: `1px solid ${proj.color}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${proj.color}15`, border: `1px solid ${proj.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: proj.color }}>{proj.platformIcon}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: theme.text }}>{proj.name}</div>
                    <div style={{ fontSize: '10px', color: theme.textMuted }}>{proj.platform}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '6px' }}>{proj.currentVersion}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div style={{ background: theme.bg, borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: proj.color }}>{proj.deploysThisWeek}</div>
                  <div style={{ fontSize: '9px', color: theme.textMuted }}>deploys/sem</div>
                </div>
                <div style={{ background: theme.bg, borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: proj.successRate >= 90 ? theme.l3 : '#f59e0b' }}>{proj.successRate}%</div>
                  <div style={{ fontSize: '9px', color: theme.textMuted }}>éxito</div>
                </div>
                <div style={{ background: theme.bg, borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.lastDeploy}</div>
                  <div style={{ fontSize: '9px', color: theme.textMuted }}>último</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 3: Build trend + Duration trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '18px' }}>
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📊 Deploys por Día — Esta Semana
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.buildTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="success" name="Exitosos" fill="#00c8a0" radius={[3,3,0,0]} />
              <Bar dataKey="failed"  name="Fallidos" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            ⏱️ Duración de Builds — Últimos 15
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d.durationTrend}>
              <defs>
                <linearGradient id="gDur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="deploy" tick={{ fill: '#475569', fontSize: 9 }} interval={2} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} unit="s" />
              <Tooltip contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} formatter={(v: any) => [`${v}s`, 'Duración']} />
              <Area type="monotone" dataKey="duration" name="Duración" stroke="#a855f7" strokeWidth={2} fill="url(#gDur)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Platform stats ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}`, marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
          🌐 Deploys por Plataforma
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {d.platformStats.map(p => {
            const total = d.platformStats.reduce((s, x) => s + x.deploys, 0);
            const pct = Math.round(p.deploys / total * 100);
            return (
              <div key={p.platform} style={{ flex: 1, minWidth: '180px', background: theme.bg, borderRadius: '12px', padding: '14px', border: `1px solid ${p.color}15` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '700' }}>{p.icon} {p.platform}</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: p.color }}>{p.deploys}</span>
                </div>
                <div style={{ height: '6px', background: theme.bgCard, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', textAlign: 'right' }}>{pct}% del total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 5: Deploy history ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}`, marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            🚀 Historial de Deployments ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(0); }}
              style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '5px 8px', color: theme.textMuted, fontSize: '11px', outline: 'none' }}>
              <option value="all">Todos los proyectos</option>
              {PROJECTS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            {(['all','success','failed','in_progress','cancelled'] as const).map(s => {
              const cfg = s === 'all' ? { color: theme.textMuted, label: 'Todos', icon: '📋' } : DEPLOY_STATUS[s];
              return (
                <button key={s} onClick={() => { setStatusFilter(s as any); setPage(0); }}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${(cfg as any).color}30`, background: statusFilter === s ? (cfg as any).bg || '#334155' : 'transparent', color: (cfg as any).color, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  {(cfg as any).icon} {(cfg as any).label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Proyecto','Versión','Commit','Branch','Estado','Entorno','Autor','Iniciado','Duración'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: theme.textMuted, fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(dep => {
                const s = DEPLOY_STATUS[dep.status];
                const env = ENV_CFG[dep.env];
                return (
                  <tr key={dep.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', marginRight: '5px' }}>{dep.platformIcon}</span>
                      <span style={{ fontWeight: '700', color: '#e2e8f0' }}>{dep.project}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '11px' }}>{dep.version}</td>
                    <td style={{ padding: '8px 10px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>{dep.commit} </span>
                      <span style={{ color: theme.textMuted, fontSize: '11px' }}>{dep.commitMsg}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '11px' }}>{dep.branch}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 7px', borderRadius: '6px' }}>{s.icon} {s.label}</span>
                        {dep.errorSummary && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>{dep.errorSummary}</div>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: env.color, background: `${env.color}15`, padding: '2px 6px', borderRadius: '5px' }}>{env.label}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{dep.author}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap', fontSize: '11px' }}>{dep.startedAt}</td>
                    <td style={{ padding: '8px 10px', color: dep.status === 'success' ? theme.l3 : '#64748b', fontWeight: '700', whiteSpace: 'nowrap' }}>{dep.duration}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>{Math.min(page*PAGE+1,filtered.length)}–{Math.min((page+1)*PAGE,filtered.length)} de {filtered.length}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{l:'«',a:()=>setPage(0),d:page===0},{l:'‹',a:()=>setPage(p=>p-1),d:page===0},{l:'›',a:()=>setPage(p=>p+1),d:page>=totalPages-1},{l:'»',a:()=>setPage(totalPages-1),d:page>=totalPages-1}].map(btn => (
              <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding:'5px 10px', borderRadius:'7px', background:'#0f172a', border:'1px solid #334155', color:btn.d?'#334155':'#94a3b8', fontSize:'11px', cursor:btn.d?'default':'pointer' }}>{btn.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 6: Build logs ── */}
      <div style={{ background: '#0b1120', borderRadius: '16px', padding: '18px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📄 Logs de Build — Recientes
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all','warn','error'] as const).map(f => (
              <button key={f} onClick={() => setLogFilter(f)}
                style={{ padding:'4px 10px', borderRadius:'7px', border:'1px solid #334155', background: logFilter === f ? '#1e293b' : 'transparent', color: f==='error'?'#ef4444':f==='warn'?'#f59e0b':'#64748b', fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
                {f === 'all' ? 'Todos' : f === 'warn' ? '⚠ Advertencias' : '✖ Errores'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}>
          {(logFilter === 'all' ? d.recentLogs : d.recentLogs.filter(l => l.level === logFilter)).map((log, i) => {
            const cfg = LOG_CFG[log.level];
            return (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '3px 8px', borderRadius: '4px', background: cfg.bg, marginBottom: '1px' }}>
                <span style={{ color: '#334155', flexShrink: 0 }}>{log.ts}</span>
                <span style={{ color: cfg.color, flexShrink: 0, width: '12px' }}>{cfg.icon}</span>
                <span style={{ color: '#3b82f680', flexShrink: 0, minWidth: '50px' }}>[{log.source}]</span>
                <span style={{ color: cfg.color }}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>🛠️ DevOps · FASE C — Tecnología · Auto-refresh 30s</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['success','failed','in_progress'] as DeployStatus[]).map(s => (
            <span key={s} style={{ fontSize: '11px', color: DEPLOY_STATUS[s].color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DEPLOY_STATUS[s].color, display: 'inline-block' }} />
              {DEPLOY_STATUS[s].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
