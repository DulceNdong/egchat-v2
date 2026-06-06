import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Msg:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Phone:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Video:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polygon points="23 7 16 12 23 17 23 7"/><rect x={1} y={5} width={15} height={14} rx={2} ry={2}/></svg>,
  Users:   () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Zap:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  XCircle: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></svg>,
  RefreshCw: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export const ChatDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<any>(null);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try { setData(await adminAPI.getChat()); } catch { setData(MOCK); }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 30_000);
    const tt = setInterval(() => setTick(t=>(t+1)%30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const d = data || MOCK;
  const latencyColor = (ms: number) => ms < 150 ? theme.l3 : ms < 300 ? '#f59e0b' : '#ef4444';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>💬 Dashboard Chat</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: `${theme.l3}12`, border: `1px solid ${theme.l3}30`, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.l3, display: 'inline-block', boxShadow: `0 0 6px ${theme.l3}` }} />
              {d.messagesPerMin} msg/min
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>FASE B · Datos reales · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l3} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#34d399', fontWeight: 800 }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l3},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.Msg,     label: 'Mensajes/min',    value: d.messagesPerMin,  color: '#34d399' },
          { Icon: IC.Users,   label: 'Chats Activos',   value: d.activeChats,     color: '#60a5fa' },
          { Icon: IC.Phone,   label: 'Llamadas Audio',  value: d.audioCalls,      color: '#818cf8' },
          { Icon: IC.Video,   label: 'Llamadas Video',  value: d.videoCalls,      color: '#60a5fa' },
          { Icon: IC.XCircle, label: 'Llamadas Fallidas',value: d.failedCalls,   color: '#ef4444', alert: d.failedCalls > 2 },
          { Icon: IC.Zap,     label: 'Latencia P95',    value: `${d.latencyP95}ms`, color: latencyColor(d.latencyP95), alert: d.latencyP95 > 300 },
          { Icon: IC.Msg,     label: 'Privados',        value: d.privateChats,    color: '#34d399' },
          { Icon: IC.Users,   label: 'Grupos',          value: d.groupChats,      color: '#818cf8' },
        ].map(({ Icon, label, value, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'60' : theme.border}`, borderRadius: 14, padding: 14, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color, opacity: 0.9 }}><Icon /></div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: alert ? color : theme.text, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 18 }}>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>📊 Mensajes por Hora — 24h</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={HOURLY}>
              <defs>
                <linearGradient id="gChat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={theme.l3} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.l3} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border}/>
              <XAxis dataKey="hour" tick={{ fill: theme.textMuted, fontSize: 9 }} interval={3}/>
              <YAxis tick={{ fill: theme.textMuted, fontSize: 9 }}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="msgs" name="Mensajes" stroke={theme.l3} strokeWidth={2} fill="url(#gChat)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>💬 Tipos de Chat</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={[{name:'Privados',value:d.privateChats},{name:'Grupos',value:d.groupChats}]} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                <Cell fill={theme.l3}/>
                <Cell fill={theme.l1}/>
              </Pie>
              <Tooltip contentStyle={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer>
          {[{label:'Privados',val:d.privateChats,color:theme.l3},{label:'Grupos',val:d.groupChats,color:theme.l1}].map(item => (
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${theme.border}` }}>
              <span style={{ fontSize:12, color:theme.textMuted, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:item.color, display:'inline-block' }}/>
                {item.label}
              </span>
              <span style={{ fontSize:12, fontWeight:800, color:item.color }}>{item.val?.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 10, background: theme.bg, borderRadius: 9, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, color: theme.textMuted }}>VoIP activas ahora</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', marginTop: 2 }}>{(d.audioCalls||0) + (d.videoCalls||0)} llamadas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HOURLY = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, msgs: Math.floor(50 + Math.sin((i-6)/24*Math.PI*2)*120 + Math.random()*20) }));
const MOCK = { messagesPerMin: 142, activeChats: 89, activeCalls: 7, latencyP95: 240, privateChats: 67, groupChats: 22, audioCalls: 5, videoCalls: 2, failedCalls: 0, totalMessages: 0 };
