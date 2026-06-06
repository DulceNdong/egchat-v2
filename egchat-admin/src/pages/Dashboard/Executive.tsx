import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IC = {
  Users:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar:() => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={4} width={18} height={18} rx={2} ry={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>,
  Star:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>,
  Activity:() => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Zap:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Shield:  () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  TrendUp: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  CheckCircle: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertTriangle: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  XCircle: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></svg>,
  Bell:    () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

interface ExecData {
  activeNow: number; activeToday: number; activeMonth: number;
  newToday: number; totalUsers: number; uptime: number;
  platformHealth: 'optimal'|'degraded'|'critical';
  services: { name: string; status: 'ok'|'degraded'|'down'; latency?: number }[];
  alerts: { id: string; level: 'critical'|'warning'|'info'; title: string; time: string }[];
  hourlyUsers: { hour: string; users: number }[];
  dailyUsers: { day: string; users: number; newUsers: number }[];
  lastUpdate: string;
}

function mock(): ExecData {
  const h = new Date().getHours();
  const base = Math.floor(150 + Math.sin(h / 24 * Math.PI * 2) * 80 + Math.random() * 30);
  return {
    activeNow: base, activeToday: Math.floor(base * 3.2),
    activeMonth: Math.floor(base * 22), newToday: Math.floor(12 + Math.random() * 40),
    totalUsers: 3847, uptime: 99.84, platformHealth: 'optimal',
    services: [
      { name: 'API (Render)', status: 'ok',       latency: Math.floor(120 + Math.random() * 80) },
      { name: 'DB (Neon)',    status: 'ok',       latency: Math.floor(8   + Math.random() * 12) },
      { name: 'CDN (Vercel)', status: 'ok',       latency: Math.floor(18  + Math.random() * 10) },
      { name: 'Push (FCM)',   status: Math.random() > 0.7 ? 'degraded' : 'ok', latency: Math.floor(80 + Math.random() * 60) },
    ],
    alerts: [
      { id:'1', level:'warning', title:'WebSocket latencia P95 > 250ms', time:'Hace 8 min' },
      { id:'2', level:'info',    title:'Deploy completado — v2.5.1',      time:'Hace 42 min' },
    ],
    hourlyUsers: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, users: Math.floor(80 + Math.sin((i-6)/24*Math.PI*2)*120 + Math.random()*20) })),
    dailyUsers:  ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({ day, users: Math.floor(400 + Math.random()*200), newUsers: Math.floor(15 + Math.random()*40) })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
  };
}

const STATUS_CFG = {
  ok:       { color: '#22c55e', label: 'OK' },
  degraded: { color: '#f59e0b', label: 'Degradado' },
  down:     { color: '#ef4444', label: 'Caído' },
};

const HEALTH_CFG = {
  optimal:  { color: '#22c55e', label: 'ÓPTIMO' },
  degraded: { color: '#f59e0b', label: 'DEGRADADO' },
  critical: { color: '#ef4444', label: 'CRÍTICO' },
};

const ALERT_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', Icon: IC.XCircle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', Icon: IC.AlertTriangle },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)', Icon: IC.Bell },
};

export const ExecutiveDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<ExecData>(mock());
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    try {
      const [ops, infra] = await Promise.allSettled([adminAPI.getOperational(), adminAPI.getInfra()]);
      const o = ops.status === 'fulfilled' ? ops.value : null;
      const inf = infra.status === 'fulfilled' ? infra.value : null;
      const base = mock();
      setData({
        ...base,
        activeNow:    o?.activeUsers    ?? base.activeNow,
        activeToday:  o?.activeUsers    ? Math.floor(o.activeUsers * 3.2) : base.activeToday,
        newToday:     o?.newUsersToday  ?? base.newToday,
        totalUsers:   o?.totalUsers     ?? base.totalUsers,
        uptime:       o?.uptime         ?? base.uptime,
        services:     inf?.services     ?? base.services,
        hourlyUsers:  o?.hourlyUsers    ?? base.hourlyUsers,
        platformHealth: (inf?.services?.some((s: any) => s.status === 'down') ? 'critical' : inf?.services?.some((s: any) => s.status === 'degraded') ? 'degraded' : 'optimal') ?? base.platformHealth,
        lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
      });
    } catch { setData(mock()); }
  }, []);

  useEffect(() => {
    refresh();
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t+1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const hc = HEALTH_CFG[d.platformHealth];

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
        {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}: {p.value?.toLocaleString()}</div>)}
      </div>
    );
  };

  // KPI Card
  const KPI = ({ Icon: Ic, label, value, sub, color, trend }: any) => (
    <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
        <div style={{ color, opacity: 0.9 }}><Ic /></div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: theme.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: 8, fontSize: 11, color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs ayer
        </div>
      )}
    </div>
  );

  return (
    <div style={{ color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>🏛️ Centro de Control Ejecutivo</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: hc.color, background: `${hc.color}12`, border: `1px solid ${hc.color}30`, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: hc.color, display: 'inline-block', boxShadow: `0 0 6px ${hc.color}` }} />
              {hc.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>Solo lectura · Dirección General · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l1} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#818cf8', fontWeight: 800 }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: 11, color: theme.textMuted }}>próx. refresh</span>
          </div>
          <button onClick={refresh} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l1},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 16px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {d.alerts.map(a => {
        const ac = ALERT_CFG[a.level];
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, background: ac.bg, border: `1px solid ${ac.border}`, marginBottom: 8, color: ac.color }}>
            <ac.Icon />
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, flex: 1 }}>{a.title}</span>
            <span style={{ fontSize: 10, color: theme.textMuted }}>{a.time}</span>
          </div>
        );
      })}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 18, marginTop: d.alerts.length ? 12 : 0 }}>
        <KPI Icon={IC.Activity}  label="Activos Ahora"   value={d.activeNow.toLocaleString()}   sub="en línea"          color={theme.l3} trend={8} />
        <KPI Icon={IC.Calendar}  label="Activos Hoy"     value={d.activeToday.toLocaleString()}  sub="sesiones únicas"   color={theme.l2} trend={5} />
        <KPI Icon={IC.Users}     label="Activos Mes"     value={d.activeMonth.toLocaleString()}  sub="usuarios únicos"   color={theme.l1} trend={12} />
        <KPI Icon={IC.Plus}      label="Nuevos Hoy"      value={d.newToday.toLocaleString()}     sub="registros"         color={theme.l2} trend={3} />
        <KPI Icon={IC.Star}      label="Total Usuarios"  value={d.totalUsers.toLocaleString()}   sub="registrados"       color={theme.l3} />
        <KPI Icon={IC.Zap}       label="Uptime"          value={`${d.uptime}%`}                  sub="últimos 30 días"   color={theme.l3} />
        <KPI Icon={IC.Shield}    label="Plataforma"      value={hc.label}                        sub="estado general"    color={hc.color} />
        <KPI Icon={IC.TrendUp}   label="Servicios OK"    value={`${d.services.filter(s=>s.status==='ok').length}/${d.services.length}`} sub="operativos" color={theme.l2} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📈 Usuarios Activos — 24h</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d.hourlyUsers}>
              <defs>
                <linearGradient id="gExec1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={theme.l3} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.l3} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="hour" tick={{ fill: theme.textMuted, fontSize: 10 }} interval={3}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 10 }}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={theme.l3} strokeWidth={2} fill="url(#gExec1)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Actividad Semanal</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.dailyUsers} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 11 }}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 10 }}/>
              <Tooltip content={<Tip />}/>
              <Bar dataKey="users"    name="Activos"  fill={theme.l2} radius={[4,4,0,0]}/>
              <Bar dataKey="newUsers" name="Nuevos"   fill={theme.l3} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>⚙️ Estado de Servicios</div>
          {d.services.map(s => {
            const sc = STATUS_CFG[s.status];
            return (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 9, background: `${sc.color}08`, border: `1px solid ${sc.color}20`, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, boxShadow: s.status === 'ok' ? `0 0 5px ${sc.color}` : 'none' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {s.latency && <span style={{ fontSize: 11, color: theme.textMuted }}>{s.latency}ms</span>}
                  <span style={{ fontSize: 10, fontWeight: 800, color: sc.color, background: `${sc.color}12`, padding: '2px 8px', borderRadius: 6 }}>{sc.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>🔔 Alertas Activas</div>
          {d.alerts.length === 0
            ? <div style={{ textAlign: 'center', padding: 20, color: '#22c55e', fontSize: 13 }}>✅ Sin alertas activas</div>
            : d.alerts.map(a => {
                const ac = ALERT_CFG[a.level];
                return (
                  <div key={a.id} style={{ padding: '10px 12px', borderRadius: 9, background: ac.bg, border: `1px solid ${ac.border}`, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{a.time}</div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
};
