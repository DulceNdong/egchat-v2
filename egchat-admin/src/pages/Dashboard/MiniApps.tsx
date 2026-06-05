import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type AppStatus = 'active' | 'degraded' | 'maintenance' | 'inactive';

interface MiniApp {
  id: string; name: string; icon: string; category: string; color: string;
  status: AppStatus; version: string;
  dau: number; mau: number; sessions: number;
  avgSessionMin: number; retentionPct: number;
  errorsToday: number; errorRate: number;
  revenueToday: number; revenueMonth: number;
  countries: string[];
  hourlyUsers: { hour: string; users: number }[];
  weeklyRevenue: { day: string; revenue: number }[];
  errorTrend: { hour: string; errors: number }[];
}

interface MiniAppsData {
  totalActive: number; totalDau: number; totalRevenue: number;
  totalErrors: number; avgUptime: number;
  apps: MiniApp[];
  categoryBreakdown: { category: string; apps: number; users: number; color: string }[];
  revenueRanking: { name: string; revenue: number; color: string; icon: string }[];
  usageTrend: { day: string; [key: string]: number | string }[];
  lastUpdate: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const APP_STATUS: Record<AppStatus, { color: string; bg: string; label: string; dot: string }> = {
  active:      { color: theme.l3, bg: 'rgba(0,200,160,0.1)',   label: 'Activa',       dot: theme.l3 },
  degraded:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Degradada',    dot: '#f59e0b' },
  maintenance: { color: theme.l2, bg: 'rgba(59,130,246,0.1)', label: 'Mantenimiento',dot: theme.l2 },
  inactive:    { color: theme.textMuted, bg: 'rgba(100,116,139,0.1)', label: 'Inactiva',     dot: '#64748b' },
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtXAF = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M XAF` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K XAF` : `${n} XAF`;
const fmtK   = (n: number) => n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n);

// ── Mock ──────────────────────────────────────────────────────────────────────
const APPS_CONFIG = [
  { id:'apuestas',  name:'Apuestas GQ',      icon:'🎲', category:'Entretenimiento', color:'#ec4899', countries:['🇬🇶'] },
  { id:'mitaxi',    name:'Mi Taxi',           icon:'🚕', category:'Transporte',      color:'#f97316', countries:['🇬🇶'] },
  { id:'cemac',     name:'CEMAC Tasas',       icon:'💱', category:'Finanzas',        color:theme.l2, countries:['🇬🇶','🇨🇲','🇬🇦','🇨🇬'] },
  { id:'educacion', name:'Educación',         icon:'🎓', category:'Educación',       color:'#22c55e', countries:['🇬🇶'] },
  { id:'hoteles',   name:'Hoteles GQ',        icon:'🏨', category:'Turismo',         color:theme.l2, countries:['🇬🇶'] },
  { id:'estados',   name:'Estados',           icon:'📸', category:'Social',          color:theme.l1, countries:['🇬🇶','🇨🇲'] },
  { id:'noticias',  name:'Noticias GQ',       icon:'📰', category:'Información',     color:'#64748b', countries:['🇬🇶'] },
  { id:'salud',     name:'Salud+',            icon:'🏥', category:'Salud',           color:'#ef4444', countries:['🇬🇶'] },
];

function makeApp(cfg: typeof APPS_CONFIG[0]): MiniApp {
  const dau = Math.floor(50 + Math.random() * 500);
  const errRate = parseFloat((Math.random() * 3).toFixed(2));
  const rev = Math.floor(Math.random() * 180_000);
  const statuses: AppStatus[] = ['active','active','active','active','degraded','maintenance'];
  return {
    ...cfg,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    version: `v${Math.floor(1 + Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    dau, mau: Math.floor(dau * 4.2),
    sessions: Math.floor(dau * 2.8),
    avgSessionMin: parseFloat((2 + Math.random() * 12).toFixed(1)),
    retentionPct: Math.floor(20 + Math.random() * 55),
    errorsToday: Math.floor(dau * errRate / 100),
    errorRate: errRate,
    revenueToday: rev,
    revenueMonth: Math.floor(rev * 22),
    hourlyUsers: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      users: Math.floor(dau / 24 * (0.5 + Math.sin((i - 8) / 24 * Math.PI * 2) * 1.5 + Math.random() * 0.3)),
    })),
    weeklyRevenue: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day, revenue: Math.floor(rev * (0.7 + Math.random() * 0.6)),
    })),
    errorTrend: Array.from({ length: 12 }, (_, i) => ({
      hour: `${(new Date().getHours() - 11 + i + 24) % 24}:00`,
      errors: Math.floor(Math.random() * 5),
    })),
  };
}

function generateMock(): MiniAppsData {
  const apps = APPS_CONFIG.map(makeApp);
  const totalDau = apps.reduce((s, a) => s + a.dau, 0);
  const totalRev = apps.reduce((s, a) => s + a.revenueToday, 0);
  const totalErr = apps.reduce((s, a) => s + a.errorsToday, 0);

  const usageTrend = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => {
    const obj: Record<string, number | string> = { day };
    apps.slice(0,5).forEach(a => { obj[a.name] = Math.floor(a.dau * (0.6 + Math.random() * 0.8)); });
    return obj;
  });

  return {
    totalActive: apps.filter(a => a.status === 'active').length,
    totalDau, totalRevenue: totalRev, totalErrors: totalErr,
    avgUptime: parseFloat((97 + Math.random() * 2.8).toFixed(1)),
    apps,
    categoryBreakdown: [
      { category: 'Entretenimiento', apps: 1, users: apps[0].mau, color: '#ec4899' },
      { category: 'Transporte',      apps: 1, users: apps[1].mau, color: '#f97316' },
      { category: 'Finanzas',        apps: 1, users: apps[2].mau, color: theme.l2 },
      { category: 'Educación',       apps: 1, users: apps[3].mau, color: '#22c55e' },
      { category: 'Otros',           apps: 4, users: apps.slice(4).reduce((s,a)=>s+a.mau,0), color: theme.textMuted },
    ],
    revenueRanking: apps
      .sort((a,b) => b.revenueToday - a.revenueToday)
      .slice(0,6)
      .map(a => ({ name: a.name, revenue: a.revenueToday, color: a.color, icon: a.icon })),
    usageTrend,
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 5000 ? fmtXAF(p.value) : p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function StatusDot({ status }: { status: AppStatus }) {
  const cfg = APP_STATUS[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot, boxShadow: status === 'active' ? `0 0 5px ${cfg.dot}` : 'none' }} />
      <span style={{ fontSize: '10px', fontWeight: '800', color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

// ── App Card ──────────────────────────────────────────────────────────────────
function AppCard({ app, selected, onClick }: { app: MiniApp; selected: boolean; onClick: () => void }) {
  const s = APP_STATUS[app.status];
  return (
    <div onClick={onClick} style={{
      background: selected ? `linear-gradient(135deg,${app.color}15,#0f172a)` : 'linear-gradient(135deg,#1e293b,#0f172a)',
      border: `${selected ? 2 : 1}px solid ${selected ? app.color : '#334155'}`,
      borderRadius: '14px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${app.color}20`, border: `1px solid ${app.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{app.icon}</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: theme.text }}>{app.name}</div>
            <div style={{ fontSize: '10px', color: theme.textMuted }}>{app.category} · {app.version}</div>
          </div>
        </div>
        <StatusDot status={app.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        <div style={{ background: theme.bg, borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: app.color }}>{fmtK(app.dau)}</div>
          <div style={{ fontSize: '9px', color: theme.textMuted }}>DAU</div>
        </div>
        <div style={{ background: theme.bg, borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: theme.text }}>{app.avgSessionMin}m</div>
          <div style={{ fontSize: '9px', color: theme.textMuted }}>sesión media</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span style={{ color: '#22c55e', fontWeight: '700' }}>💰 {fmtXAF(app.revenueToday)}</span>
        <span style={{ color: app.errorsToday > 10 ? '#ef4444' : '#64748b' }}>
          {app.errorsToday > 0 ? `🐛 ${app.errorsToday} errores` : '✅ sin errores'}
        </span>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function AppDetail({ app }: { app: MiniApp }) {
  const s = APP_STATUS[app.status];
  return (
    <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${app.color}30` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${app.color}20`, border: `1px solid ${app.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{app.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: theme.text }}>{app.name}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
            <StatusDot status={app.status} />
            <span style={{ fontSize: '10px', color: theme.textMuted }}>{app.version} · {app.category}</span>
            <span style={{ fontSize: '10px', color: theme.textMuted }}>{app.countries.join(' ')}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'DAU',       value: fmtK(app.dau),            color: app.color },
          { label: 'MAU',       value: fmtK(app.mau),            color: theme.l2 },
          { label: 'Sesiones',  value: fmtK(app.sessions),       color: theme.l1 },
          { label: 'Retención', value: `${app.retentionPct}%`,   color: '#f59e0b' },
          { label: 'Tiempo',    value: `${app.avgSessionMin}m`,  color: theme.l2 },
          { label: 'Errores',   value: String(app.errorsToday),  color: app.errorsToday > 10 ? '#ef4444' : theme.l3 },
          { label: 'Error %',   value: `${app.errorRate}%`,      color: app.errorRate > 1 ? '#ef4444' : theme.l3 },
          { label: 'Ingresos',  value: fmtXAF(app.revenueToday), color: '#22c55e' },
        ].map(item => (
          <div key={item.label} style={{ background: theme.bg, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '900', color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginTop: '3px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

        <div>
          <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Usuarios por Hora</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={app.hourlyUsers}>
              <defs>
                <linearGradient id={`g${app.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={app.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={app.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={app.color} strokeWidth={2} fill={`url(#g${app.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Ingresos Semanales</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={app.weeklyRevenue}>
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip formatter={(v: any) => fmtXAF(v)} contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="revenue" name="Ingresos" fill={app.color} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Errores (12h)</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={app.errorTrend}>
              <XAxis dataKey="hour" tick={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="errors" name="Errores" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const MiniAppsDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]       = useState<MiniAppsData>(generateMock());
  const [tick, setTick]       = useState(0);
  const [pulse, setPulse]     = useState(false);
  const [selected, setSelected] = useState<string>('apuestas');

  const refresh = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    setData(generateMock());
  }, []);

  useEffect(() => {
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t + 1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const selectedApp = d.apps.find(a => a.id === selected) || d.apps[0];
  const COLORS = d.apps.slice(0,5).map(a => a.color);

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>📱 Dashboard Mini Apps</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>FASE B — Operaciones · {d.totalActive} apps activas · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#a855f7 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: theme.l1, fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Global KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {[
          { icon:'📱', label:'Apps Activas',    value:d.totalActive,           sub:`de ${d.apps.length} total`, color:theme.l3 },
          { icon:'👥', label:'DAU Total',       value:fmtK(d.totalDau),        sub:'usuarios activos hoy',      color:theme.l2 },
          { icon:'💰', label:'Ingresos Hoy',    value:fmtXAF(d.totalRevenue),  sub:'todas las apps',            color:'#f59e0b' },
          { icon:'🐛', label:'Errores Hoy',     value:d.totalErrors,           sub:'total registrados',         color:d.totalErrors>50?'#ef4444':'#22c55e' },
          { icon:'⚡', label:'Uptime Promedio', value:`${d.avgUptime}%`,       sub:'todas las apps',            color:theme.l1 },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1px solid ${item.color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', borderRadius:'50%', background:`radial-gradient(circle,${item.color}20 0%,transparent 70%)` }} />
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize:'22px', fontWeight:'900', color:'#f1f5f9', lineHeight:1.1 }}>{item.value}</div>
            <div style={{ fontSize:'10px', color:'#64748b', marginTop:'3px' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: App grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {d.apps.map(app => (
          <AppCard key={app.id} app={app} selected={selected === app.id} onClick={() => setSelected(app.id)} />
        ))}
      </div>

      {/* ── Row 3: Selected app detail ── */}
      {selectedApp && <AppDetail app={selectedApp} />}

      {/* ── Row 4: Revenue ranking + Usage trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginTop: '18px', marginBottom: '18px' }}>

        {/* Revenue ranking */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🏆 Ranking por Ingresos Hoy
          </div>
          {d.revenueRanking.map((app, i) => (
            <div key={app.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: theme.bg, marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', color: i < 3 ? ['#f59e0b','#94a3b8','#f97316'][i] : '#475569', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}.`}
              </span>
              <span style={{ fontSize: '16px' }}>{app.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
                <div style={{ height: '3px', background: theme.bgCard, borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${app.revenue / d.revenueRanking[0].revenue * 100}%`, background: app.color, borderRadius: '2px' }} />
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: app.color, flexShrink: 0 }}>{fmtXAF(app.revenue)}</span>
            </div>
          ))}
        </div>

        {/* Usage trend */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📈 Uso Semanal por App — Top 5 (DAU)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.usageTrend}>
              <defs>
                {d.apps.slice(0,5).map((app, i) => (
                  <linearGradient key={app.id} id={`gTrend${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={app.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={app.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              {d.apps.slice(0,5).map((app, i) => (
                <Area key={app.id} type="monotone" dataKey={app.name} stroke={app.color} strokeWidth={2} fill={`url(#gTrend${i})`} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {d.apps.slice(0,5).map(app => (
              <span key={app.id} style={{ fontSize: '11px', color: app.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.color, display: 'inline-block' }} />
                {app.icon} {app.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 5: Error summary table ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
          🐛 Resumen de Errores por App
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['App','Estado','DAU','Sesiones','Sesión Media','Errores Hoy','Tasa Error','Ingresos Hoy','Ingresos Mes'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: theme.textMuted, fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.apps.map(app => {
                const s = APP_STATUS[app.status];
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid #0f172a', cursor: 'pointer' }}
                    onClick={() => setSelected(app.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{app.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{app.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot }} />
                        <span style={{ fontSize: '10px', color: s.color, fontWeight: '700' }}>{s.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: app.color, fontWeight: '800' }}>{fmtK(app.dau)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted }}>{fmtK(app.sessions)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted }}>{app.avgSessionMin}m</td>
                    <td style={{ padding: '8px 10px', color: app.errorsToday > 10 ? '#ef4444' : '#64748b', fontWeight: app.errorsToday > 10 ? '800' : '400' }}>{app.errorsToday}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: app.errorRate > 1 ? '#ef4444' : theme.l3, background: app.errorRate > 1 ? 'rgba(239,68,68,0.1)' : 'rgba(0,200,160,0.1)', padding: '2px 7px', borderRadius: '6px' }}>
                        {app.errorRate}%
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#22c55e', fontWeight: '700' }}>{fmtXAF(app.revenueToday)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted }}>{fmtXAF(app.revenueMonth)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>📱 Dashboard Mini Apps · Click en una app para ver detalle · Auto-refresh 30s</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['active','degraded','maintenance'] as AppStatus[]).map(s => (
            <span key={s} style={{ fontSize: '11px', color: APP_STATUS[s].color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: APP_STATUS[s].color, display: 'inline-block' }} />
              {APP_STATUS[s].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
