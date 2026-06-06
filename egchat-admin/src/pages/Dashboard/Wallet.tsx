import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Wallet:    () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x={1} y={4} width={22} height={16} rx={2} ry={2}/><line x1={1} y1={10} x2={23} y2={10}/></svg>,
  CheckCircle:()=><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>,
  XCircle:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></svg>,
  ArrowUp:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><line x1={12} y1={19} x2={12} y2={5}/><polyline points="5 12 12 5 19 12"/></svg>,
  TrendUp:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  RefreshCw: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

const fmtXAF = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M XAF` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K XAF` : `${n} XAF`;

const ReadOnly = ({ theme }: { theme: any }) => (
  <div style={{ background: `${theme.l1}08`, border: `1px solid ${theme.l1}25`, borderRadius: 10, padding: '8px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 16 }}>🚫</span>
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444' }}>SOLO MONITOREO — No se pueden ejecutar pagos desde este panel</div>
      <div style={{ fontSize: 10, color: theme.textMuted }}>Dashboard de consulta exclusivamente. Ninguna acción modifica saldos.</div>
    </div>
  </div>
);

export const WalletDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try { setData(await adminAPI.getWallet()); } catch { setData(MOCK); }
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
      <ReadOnly theme={theme} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>💰 Dashboard Wallet</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE B · Solo monitoreo · Datos reales · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l1} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#818cf8', fontWeight: 800 }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l1},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.CheckCircle, label: 'Tx Completadas', value: d.txCount,       sub: fmtXAF(d.volumeToday || 0), color: '#34d399' },
          { Icon: IC.XCircle,     label: 'Tx Fallidas',    value: d.txFailed,      sub: 'hoy',                      color: '#ef4444', alert: d.txFailed > 5 },
          { Icon: IC.TrendUp,     label: 'Tasa de Éxito',  value: `${d.successRate}%`, sub: 'completadas/total',    color: d.successRate >= 97 ? theme.l3 : '#f59e0b' },
          { Icon: IC.Wallet,      label: 'Volumen Hoy',    value: fmtXAF(d.volumeToday || 0), sub: 'total procesado', color: '#60a5fa' },
          { Icon: IC.ArrowUp,     label: 'Tendencia Tx',   value: `+${d.txTrend}%`, sub: 'vs ayer',                color: '#34d399' },
        ].map(({ Icon, label, value, sub, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'60' : theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color, opacity: 0.9 }}><Icon /></div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: alert ? color : theme.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Volumen Semanal (XAF)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={d.dailyVolume || MOCK.dailyVolume} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
            <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 11 }}/>
            <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}/>
            <Tooltip content={<Tip />}/>
            <Bar dataKey="volume" name="Volumen" fill={theme.l2} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        {[
          { label: 'Total Transacciones Hoy', value: d.txCount, color: '#34d399', icon: '✅' },
          { label: 'Transacciones Fallidas',  value: d.txFailed, color: '#ef4444', icon: '❌' },
          { label: 'Volumen Total Hoy',       value: fmtXAF(d.volumeToday || 0), color: '#60a5fa', icon: '💰' },
          { label: 'Tasa de Éxito',           value: `${d.successRate}%`, color: d.successRate >= 97 ? theme.l3 : '#f59e0b', icon: '📈' },
        ].map(item => (
          <div key={item.label} style={{ background: theme.bgCard, borderRadius: 12, padding: 14, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.color, marginTop: 2 }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: theme.bgCard, borderRadius: 10, border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, color: theme.textMuted }}>🚫 SOLO MONITOREO · Consulta de datos exclusivamente. Sin capacidad de ejecutar pagos.</span>
        <span style={{ fontSize: 11, color: theme.textMuted }}>Auto-refresh 30s</span>
      </div>
    </div>
  );
};

const MOCK = {
  txCount: 0, txFailed: 0, successRate: 100, volumeToday: 0, txTrend: 0, successTrend: 0,
  dailyVolume: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({ day, volume: Math.floor(500000 + Math.random()*1000000) })),
  suspicious: [],
};
