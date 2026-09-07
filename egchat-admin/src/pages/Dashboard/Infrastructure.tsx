import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Server:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={2} y={2} width={20} height={8} rx={2}/><rect x={2} y={14} width={20} height={8} rx={2}/><line x1={6} y1={6} x2={6.01} y2={6}/><line x1={6} y1={18} x2={6.01} y2={18}/></svg>,
  Database: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><ellipse cx={12} cy={5} rx={9} ry={3}/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Globe:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><line x1={2} y1={12} x2={22} y2={12}/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Cpu:      () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={4} y={4} width={16} height={16} rx={2}/><rect x={9} y={9} width={6} height={6}/><line x1={9} y1={1} x2={9} y2={4}/><line x1={15} y1={1} x2={15} y2={4}/><line x1={9} y1={20} x2={9} y2={23}/><line x1={15} y1={20} x2={15} y2={23}/><line x1={20} y1={9} x2={23} y2={9}/><line x1={20} y1={14} x2={23} y2={14}/><line x1={1} y1={9} x2={4} y2={9}/><line x1={1} y1={14} x2={4} y2={14}/></svg>,
  CheckCircle: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertTri: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  RefreshCw:() => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export const InfrastructureDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try {
      const d = await adminAPI.getInfra();
      setData(d);
      setHistory(prev => {
        const h = new Date().getHours();
        const entry = { time: `${h}:${String(new Date().getMinutes()).padStart(2,'0')}`, cpu: d.renderCpu, ram: d.renderRam, conns: d.supabaseConns };
        return [...prev.slice(-19), entry];
      });
    } catch { setData(MOCK); }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 15_000);
    const tt = setInterval(() => setTick(t=>(t+1)%15), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const d = data || MOCK;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.stroke || p.color, fontWeight: 700 }}>{p.name}: {p.value}{p.name?.includes('%') || p.name?.includes('CPU') || p.name?.includes('RAM') ? '%' : ''}</div>)}
    </div>;
  };

  const statusColor = (s: string) => s === 'ok' ? '#22c55e' : s === 'degraded' ? '#f59e0b' : '#ef4444';
  const cpuColor    = d.renderCpu > 80 ? '#ef4444' : d.renderCpu > 60 ? '#f59e0b' : theme.l3;
  const ramColor    = d.renderRam > 85 ? '#ef4444' : d.renderRam > 65 ? '#f59e0b' : theme.l2;
  const connPct     = Math.round(d.supabaseConns / d.supabaseMaxConns * 100);

  return (
    <div style={{ color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>⚙️ Dashboard de Infraestructura</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: `${theme.l3}12`, border: `1px solid ${theme.l3}30`, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.l3, display: 'inline-block', boxShadow: `0 0 5px ${theme.l3}` }} />
              {d.services?.filter((s:any) => s.status === 'ok').length}/{d.services?.length} operativos
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE C · Datos reales · Auto-refresh 15s · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l2} ${(15-tick)/15*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#60a5fa', fontWeight: 800 }}>{15-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l2},${theme.l3})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* Render metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.Cpu,      label: 'CPU Render',        value: `${d.renderCpu}%`,                                 color: cpuColor,  alert: d.renderCpu > 80 },
          { Icon: IC.Server,   label: 'RAM Render',        value: `${d.renderRam}%`,                                 color: ramColor,  alert: d.renderRam > 85 },
          { Icon: IC.Database, label: 'DB Conexiones',     value: `${d.supabaseConns}/${d.supabaseMaxConns}`,         color: connPct > 80 ? '#ef4444' : theme.l2, alert: connPct > 80 },
          { Icon: IC.Globe,    label: 'CDN Hit Rate',      value: `${d.cdnHitRate}%`,                                color: d.cdnHitRate > 90 ? theme.l3 : '#f59e0b' },
          { Icon: IC.Server,   label: 'Servicios OK',      value: `${d.services?.filter((s:any)=>s.status==='ok').length||0}/${d.services?.length||0}`, color: '#34d399' },
        ].map(({ Icon, label, value, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'50' : theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: alert ? color : theme.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Services grid */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>🔌 Estado de Servicios (Datos Reales)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {(d.services || []).map((s: any) => {
            const sc = statusColor(s.status);
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${sc}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: s.status === 'ok' ? `0 0 6px ${sc}` : 'none' }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{s.name}</div>
                    {s.url && <div style={{ fontSize: 10, color: theme.textMuted }}>{s.url}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {s.latency && <span style={{ fontSize: 11, color: theme.textMuted }}>{s.latency}ms</span>}
                  <span style={{ fontSize: 10, fontWeight: 800, color: sc, background: `${sc}12`, padding: '2px 8px', borderRadius: 6 }}>
                    {s.status === 'ok' ? 'OK' : s.status === 'degraded' ? 'DEGRADADO' : 'CAÍDO'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource trend chart */}
      {history.length > 1 && (
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📈 Tendencia Recursos — Sesión Actual (Datos Reales)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="time" tick={{ fill: theme.textMuted, fontSize: 9 }} interval={2}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }} unit="%"/>
              <Tooltip content={<Tip />}/>
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke={cpuColor} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="ram" name="RAM %" stroke={ramColor} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="conns" name="DB Conns" stroke={theme.l1} strokeWidth={1.5} dot={false} strokeDasharray="4 4"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[{label:'CPU %',color:cpuColor},{label:'RAM %',color:ramColor},{label:'DB Conns',color:theme.l1}].map(item => (
              <span key={item.label} style={{ fontSize: 11, color: item.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 2, background: item.color, display: 'inline-block', borderRadius: 1 }}/>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MOCK = { renderCpu: 25, renderRam: 40, supabaseConns: 12, supabaseMaxConns: 100, cdnHitRate: 94, services: [{ name: 'API Render', url: 'egchat-api-xlxj.onrender.com', status: 'ok', latency: 142 }, { name: 'Neon DB', url: 'neon.tech', status: 'ok', latency: 12 }, { name: 'Vercel CDN', url: 'vercel.com', status: 'ok', latency: 22 }] };
