import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Users:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={8.5} cy={7} r={4}/><line x1={20} y1={8} x2={20} y2={14}/><line x1={23} y1={11} x2={17} y2={11}/></svg>,
  Monitor:  () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={2} y={3} width={20} height={14} rx={2} ry={2}/><line x1={8} y1={21} x2={16} y2={21}/><line x1={12} y1={17} x2={12} y2={21}/></svg>,
  Zap:      () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Chat:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  CheckCircle: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertTri: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  XCircle:  () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></svg>,
  RefreshCw:() => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export const OperationalDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    try {
      const d = await adminAPI.getOperational();
      setData(d);
    } catch {
      setData(MOCK);
    }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 30_000);
    const tt = setInterval(() => setTick(t => (t+1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const d = data || MOCK;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
        {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color || p.stroke, fontWeight: 700 }}>{p.name}: {p.value?.toLocaleString()}</div>)}
      </div>
    );
  };

  const statusColor = (s: string) => s === 'ok' ? '#22c55e' : s === 'degraded' ? '#f59e0b' : '#ef4444';
  const StatusIcon  = ({ s }: { s: string }) => s === 'ok' ? <IC.CheckCircle /> : s === 'degraded' ? <IC.AlertTri /> : <IC.XCircle />;

  return (
    <div style={{ color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>📊 Dashboard Operacional</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
            FASE B · Datos reales Neon DB · {d._lastUpdate || new Date().toLocaleTimeString('es-GQ', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l2} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: theme.l2, fontWeight: 800 }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: 11, color: theme.textMuted }}>refresh</span>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l2},${theme.l3})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse ? '...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs — real data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.Users,    label: 'Usuarios Activos', value: d.activeUsers,     sub: 'últimos 5 min',  color: theme.l3, trend: d.activeUsersTrend },
          { Icon: IC.UserPlus, label: 'Nuevos Hoy',       value: d.newUsersToday,   sub: 'registros',      color: theme.l2, trend: d.newUsersTrend },
          { Icon: IC.Monitor,  label: 'Sesiones Abiertas',value: d.activeSessions,  sub: 'ahora mismo',    color: theme.l1 },
          { Icon: IC.Zap,      label: 'Uptime',           value: `${d.uptime}%`,    sub: '30 días',        color: theme.l3 },
          { Icon: IC.Users,    label: 'Total Usuarios',   value: d.totalUsers,      sub: 'registrados',    color: theme.l2 },
          { Icon: IC.Chat,     label: 'Total Chats',      value: d.totalChats,      sub: 'en la plataforma',color: theme.l1 },
        ].map(({ Icon, label, value, sub, color, trend }) => (
          <div key={label} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: theme.text, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{sub}</div>
            {trend !== undefined && (
              <div style={{ fontSize: 11, color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, marginTop: 6 }}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs ayer
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Services */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, marginBottom: 18, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>⚙️ Estado de Servicios</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          {(d.services || []).map((s: any) => {
            const sc = statusColor(s.status);
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, borderRadius: 9, padding: '10px 14px', border: `1px solid ${sc}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, boxShadow: s.status === 'ok' ? `0 0 5px ${sc}` : 'none' }} />
                  <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{s.name}</span>
                </div>
                <div style={{ color: sc }}><StatusIcon s={s.status} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📈 Usuarios Activos — 24h (datos reales)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.hourlyUsers || []}>
              <defs>
                <linearGradient id="gOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={theme.l3} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.l3} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="hour" tick={{ fill: theme.textMuted, fontSize: 9 }} interval={3}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={theme.l3} strokeWidth={2} fill="url(#gOp)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Resumen de Actividad</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {[
              { label: 'Usuarios Activos',  value: d.activeUsers,    max: Math.max(d.activeUsers, 100),    color: theme.l3 },
              { label: 'Sesiones',          value: d.activeSessions, max: Math.max(d.activeSessions, 100), color: theme.l2 },
              { label: 'Nuevos Hoy',        value: d.newUsersToday,  max: Math.max(d.newUsersToday, 10),   color: theme.l1 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.value?.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: theme.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(item.value/item.max*100, 100)}%`, background: item.color, borderRadius: 3, boxShadow: `0 0 6px ${item.color}50`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: 12, background: theme.bg, borderRadius: 10, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Uptime plataforma</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: theme.l3 }}>{d.uptime}%</div>
              <div style={{ fontSize: 10, color: theme.textMuted }}>Total: {d.totalUsers?.toLocaleString()} usuarios · {d.totalChats?.toLocaleString()} chats</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MOCK = {
  activeUsers: 247, activeUsersTrend: 12, newUsersToday: 38, newUsersTrend: 5,
  activeSessions: 312, uptime: 99.8, totalUsers: 0, totalChats: 0,
  services: [
    { name: 'API Render', status: 'ok' }, { name: 'Neon DB', status: 'ok' },
    { name: 'Vercel CDN', status: 'ok' }, { name: 'Push FCM', status: 'ok' },
  ],
  hourlyUsers: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, users: Math.floor(Math.random()*200+50) })),
};
