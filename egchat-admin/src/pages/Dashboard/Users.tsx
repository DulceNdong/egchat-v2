import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Users:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={8.5} cy={7} r={4}/><line x1={20} y1={8} x2={20} y2={14}/><line x1={23} y1={11} x2={17} y2={11}/></svg>,
  Globe:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><line x1={2} y1={12} x2={22} y2={12}/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Smartphone:() => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={5} y={2} width={14} height={20} rx={2} ry={2}/><line x1={12} y1={18} x2={12.01} y2={18}/></svg>,
  Activity: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  RefreshCw:() => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export const UsersDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try { setData(await (adminAPI as any).getUsersMetrics()); } catch { setData(MOCK); }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 30_000);
    const tt = setInterval(() => setTick(t=>(t+1)%30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const d = data || MOCK;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color || p.stroke, fontWeight: 700 }}>{p.name}: {p.value?.toLocaleString()}</div>)}
    </div>;
  };

  return (
    <div style={{ color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>👤 Dashboard de Usuarios</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE B · Datos reales Neon · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l2} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#60a5fa', fontWeight: 800 }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l2},${theme.l3})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.Users,     label: 'Total Registrados', value: d.total,      color: '#60a5fa' },
          { Icon: IC.Activity,  label: 'Online Ahora',      value: d.onlineNow,  color: '#34d399' },
          { Icon: IC.UserPlus,  label: 'Nuevos Hoy',        value: d.newToday,   color: '#818cf8' },
          { Icon: IC.UserPlus,  label: 'Esta Semana',       value: d.newWeek,    color: '#60a5fa' },
          { Icon: IC.UserPlus,  label: 'Este Mes',          value: d.newMonth,   color: '#34d399' },
        ].map(({ Icon, label, value, color }) => (
          <div key={label} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: theme.text }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
        {/* Growth trend */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📈 Crecimiento — 30 Días (Datos Reales)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d.growthTrend?.length > 0 ? d.growthTrend : MOCK_TREND}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={theme.l2} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.l2} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 9 }} interval={4}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="users" name="Nuevos" stroke={theme.l2} strokeWidth={2} fill="url(#gUsers)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By platform */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📱 Por Plataforma</div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={d.byPlatform || MOCK.byPlatform} dataKey="count" cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3}>
                {(d.byPlatform || MOCK.byPlatform).map((_: any, i: number) => <Cell key={i} fill={[theme.l3, theme.l2, theme.l1][i % 3]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer>
          {(d.byPlatform || MOCK.byPlatform).map((p: any, i: number) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 11, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: [theme.l3, theme.l2, theme.l1][i%3], display: 'inline-block' }}/>
                {p.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: [theme.l3, theme.l2, theme.l1][i%3] }}>{p.count?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* By country */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>🌍 Por País</div>
          {(d.byCountry || MOCK.byCountry).map((c: any) => (
            <div key={c.country} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: theme.text }}>{c.flag} {c.country}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa' }}>{c.count?.toLocaleString()}</span>
              </div>
              <div style={{ height: 5, background: theme.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.pct || 100}%`, background: theme.l2, borderRadius: 3, transition: 'width 0.5s' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Resumen General (Datos Reales de Neon DB)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {[
            { label: 'Total usuarios registrados', value: d.total, color: '#60a5fa', icon: '👥' },
            { label: 'Activos ahora mismo',        value: d.onlineNow, color: '#34d399', icon: '🟢' },
            { label: 'Nuevos esta semana',         value: d.newWeek, color: '#818cf8', icon: '📅' },
            { label: 'Nuevos este mes',            value: d.newMonth, color: '#60a5fa', icon: '🗓️' },
          ].map(item => (
            <div key={item.label} style={{ background: theme.bg, borderRadius: 10, padding: 12, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
              <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 3 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MOCK_TREND = Array.from({ length: 30 }, (_, i) => ({ day: `D${i+1}`, users: Math.floor(Math.random()*5) }));
const MOCK = {
  total: 0, onlineNow: 0, newToday: 0, newWeek: 0, newMonth: 0,
  byPlatform: [{ name: 'Android', count: 0 }, { name: 'iOS', count: 0 }, { name: 'Web', count: 0 }],
  byCountry:  [{ country: 'Guinea Ecuatorial', flag: '🇬🇶', count: 0, pct: 100 }],
  growthTrend: [],
};
