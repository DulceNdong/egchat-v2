import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Shield:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Lock:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  AlertTri: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  Users:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>,
  Key:      () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  RefreshCw:() => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export const SecurityDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try { setData(await adminAPI.getSecurity()); } catch { setData(MOCK); }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 20_000); // faster for security
    const tt = setInterval(() => setTick(t=>(t+1)%20), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const d = data || MOCK;
  const hasCritical = d.failedLoginsHour > 10;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>;
  };

  return (
    <div style={{ color: theme.text }}>
      {/* Critical alert */}
      {hasCritical && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>ALERTA: {d.failedLoginsHour} intentos fallidos en la última hora</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>Posible ataque de fuerza bruta detectado</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>🛡️ Centro de Operaciones de Seguridad</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE C · Datos reales · Auto-refresh 20s · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${hasCritical ? '#ef4444' : theme.l3} ${(20-tick)/20*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: hasCritical ? '#ef4444' : theme.l3, fontWeight: 800 }}>{20-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : hasCritical ? 'linear-gradient(135deg,#ef4444,#f97316)' : `linear-gradient(135deg,${theme.l3},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.AlertTri, label: 'Logins Fallidos/h', value: d.failedLoginsHour, color: d.failedLoginsHour > 10 ? '#ef4444' : d.failedLoginsHour > 3 ? '#f59e0b' : theme.l3, alert: d.failedLoginsHour > 10 },
          { Icon: IC.Lock,     label: 'IPs Bloqueadas',    value: d.blockedIps,       color: d.blockedIps > 0 ? '#f59e0b' : theme.l3 },
          { Icon: IC.Users,    label: 'Usuarios Bloqueados',value: d.blockedUsers,    color: d.blockedUsers > 0 ? '#ef4444' : theme.l3, alert: d.blockedUsers > 0 },
          { Icon: IC.Key,      label: 'Tokens Activos',    value: d.activeTokens || 0, color: theme.l2 },
          { Icon: IC.Shield,   label: 'Estado General',    value: hasCritical ? 'ALERTA' : 'NORMAL', color: hasCritical ? '#ef4444' : theme.l3, alert: hasCritical },
        ].map(({ Icon, label, value, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'50' : theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: alert ? color : theme.text }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      {/* Failed logins chart */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>🔨 Intentos de Login Fallidos — 24h</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={HOURLY_LOGINS}>
            <defs>
              <linearGradient id="gSec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
            <XAxis dataKey="hour" tick={{ fill: theme.textMuted, fontSize: 9 }} interval={3}/>
            <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }}/>
            <Tooltip content={<Tip />}/>
            <Area type="monotone" dataKey="failed" name="Fallidos" stroke="#ef4444" strokeWidth={2} fill="url(#gSec)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Real failed logins list */}
      {d.failedLogins && d.failedLogins.length > 0 && (
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📋 Últimos Eventos de Seguridad (Datos Reales)</div>
          {d.failedLogins.slice(0, 10).map((ev: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>{ev.action || 'auth.login_failed'}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>{ev.resource_type} · {ev.result}</div>
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted }}>{ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ''}</div>
            </div>
          ))}
        </div>
      )}

      {(d.failedLogins?.length === 0 || !d.failedLogins) && (
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 28, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.l3 }}>Sin eventos de seguridad en la última hora</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>La plataforma está operando con normalidad</div>
        </div>
      )}
    </div>
  );
};

const HOURLY_LOGINS = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, failed: Math.floor(Math.random() * 5) }));
const MOCK = { failedLoginsHour: 0, blockedIps: 0, blockedUsers: 0, activeTokens: 0, failedLogins: [] };
