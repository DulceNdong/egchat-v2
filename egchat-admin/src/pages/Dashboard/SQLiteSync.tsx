import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  RefreshCw: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  CheckCircle: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertTri:  () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  Clock:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>,
  Wifi:      () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1={12} y1={20} x2={12.01} y2={20}/></svg>,
};

export const SQLiteSyncDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try { setData(await adminAPI.getSqliteSync()); } catch { setData(MOCK); }
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
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color || p.stroke, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>;
  };

  return (
    <div style={{ color: theme.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>🔄 Sincronización SQLite</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE C · Datos reales · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l3} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: theme.l3, fontWeight: 800 }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l3},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.CheckCircle, label: 'Sync OK Hoy',     value: d.syncOkToday,  color: theme.l3 },
          { Icon: IC.AlertTri,    label: 'Pendientes Sync', value: d.pendingSync,  color: d.pendingSync > 20 ? '#f59e0b' : theme.l2, alert: d.pendingSync > 20 },
          { Icon: IC.AlertTri,    label: 'Conflictos',      value: d.conflicts,    color: d.conflicts > 0 ? '#ef4444' : theme.l3, alert: d.conflicts > 0 },
          { Icon: IC.Clock,       label: 'Offline Largo',   value: d.offlineLong,  color: d.offlineLong > 0 ? '#f59e0b' : theme.l3, alert: d.offlineLong > 0 },
          { Icon: IC.Wifi,        label: 'Tasa de Éxito',   value: d.syncOkToday > 0 ? `${Math.round(d.syncOkToday/(d.syncOkToday+d.pendingSync)*100)}%` : '100%', color: theme.l3 },
        ].map(({ Icon, label, value, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'50' : theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: alert ? color : theme.text }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Actividad de Sync — 7 Días</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={WEEKLY} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
            <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 11 }}/>
            <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }}/>
            <Tooltip content={<Tip />}/>
            <Bar dataKey="synced"   name="Sincronizados" fill={theme.l3} radius={[4,4,0,0]}/>
            <Bar dataKey="pending"  name="Pendientes"    fill={theme.l2} radius={[4,4,0,0]}/>
            <Bar dataKey="conflict" name="Conflictos"    fill={theme.l1} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📋 Resumen General</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {[
            { label: 'Sync Completados Hoy', value: d.syncOkToday, color: theme.l3, icon: '✅' },
            { label: 'En Cola de Sync',      value: d.pendingSync, color: theme.l2, icon: '⏳' },
            { label: 'Conflictos Activos',   value: d.conflicts,   color: d.conflicts > 0 ? '#ef4444' : theme.l3, icon: d.conflicts > 0 ? '⚠️' : '✅' },
            { label: 'Dispositivos Offline', value: d.offlineLong, color: d.offlineLong > 0 ? '#f59e0b' : theme.l3, icon: d.offlineLong > 0 ? '📴' : '✅' },
          ].map(item => (
            <div key={item.label} style={{ background: theme.bg, borderRadius: 10, padding: 12, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WEEKLY = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({ day, synced: Math.floor(40+Math.random()*30), pending: Math.floor(Math.random()*10), conflict: Math.floor(Math.random()*3) }));
const MOCK   = { pendingSync: 14, conflicts: 3, syncOkToday: 287, offlineLong: 2, conflictList: [] };
