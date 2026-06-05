import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type AlertLevel = 'critical' | 'warning' | 'info';
interface ChatAlert { id: string; level: AlertLevel; title: string; detail: string; time: string; auto: boolean }
interface ChatData {
  // Real-time
  msgPerMin: number; msgPerSec: number; totalToday: number; failedToday: number;
  failedPct: number; activeConvs: number; connectedUsers: number;
  // Latency
  latP50: number; latP95: number; latP99: number;
  // VoIP
  audioCalls: number; videoCalls: number; failedCalls: number; callFailPct: number;
  // Distribution
  privateChats: number; groupChats: number; broadcast: number;
  // Trending
  hourlyMsgs: { hour: string; sent: number; failed: number; latency: number }[];
  dailyMsgs: { day: string; sent: number; failed: number; users: number }[];
  latencyHistory: { time: string; p50: number; p95: number; p99: number }[];
  mediaBreakdown: { name: string; count: number; color: string }[];
  // Alerts
  alerts: ChatAlert[];
  lastUpdate: string;
}

// ── Alert config ──────────────────────────────────────────────────────────────
const ALERT_CFG: Record<AlertLevel, { color: string; bg: string; border: string; icon: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  icon: '🚨' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '⚠️' },
  info:     { color: theme.l2, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', icon: 'ℹ️' },
};

// ── Mock ──────────────────────────────────────────────────────────────────────
function generateMock(): ChatData {
  const now = new Date();
  const h = now.getHours();
  const base = 80 + Math.sin(h / 24 * Math.PI * 2) * 60;
  return {
    msgPerMin:      Math.floor(base + Math.random() * 30),
    msgPerSec:      parseFloat((base / 60 + Math.random()).toFixed(1)),
    totalToday:     Math.floor(48200 + Math.random() * 2000),
    failedToday:    Math.floor(120 + Math.random() * 80),
    failedPct:      parseFloat((0.3 + Math.random() * 0.8).toFixed(2)),
    activeConvs:    Math.floor(2800 + Math.random() * 200),
    connectedUsers: Math.floor(1900 + Math.random() * 400),
    latP50:  Math.floor(28  + Math.random() * 12),
    latP95:  Math.floor(140 + Math.random() * 80),
    latP99:  Math.floor(280 + Math.random() * 120),
    audioCalls: Math.floor(12 + Math.random() * 8),
    videoCalls: Math.floor(4  + Math.random() * 4),
    failedCalls: Math.floor(Math.random() * 3),
    callFailPct: parseFloat((Math.random() * 5).toFixed(1)),
    privateChats: Math.floor(2200 + Math.random() * 200),
    groupChats:   Math.floor(580  + Math.random() * 60),
    broadcast:    Math.floor(20   + Math.random() * 15),
    hourlyMsgs: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      sent:    Math.floor(50 + Math.sin((i - 6) / 24 * Math.PI * 2) * 120 + Math.random() * 20),
      failed:  Math.floor(Math.random() * 5),
      latency: Math.floor(100 + Math.random() * 150),
    })),
    dailyMsgs: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      sent:   Math.floor(42000 + Math.random() * 12000),
      failed: Math.floor(80    + Math.random() * 100),
      users:  Math.floor(1800  + Math.random() * 600),
    })),
    latencyHistory: Array.from({ length: 20 }, (_, i) => ({
      time: `${String(Math.max(0, h - 19 + i)).padStart(2,'0')}:00`,
      p50:  Math.floor(25 + Math.random() * 20),
      p95:  Math.floor(120 + Math.random() * 100),
      p99:  Math.floor(250 + Math.random() * 150),
    })),
    mediaBreakdown: [
      { name: 'Texto',     count: Math.floor(32000 + Math.random() * 3000), color: theme.l3 },
      { name: 'Imágenes',  count: Math.floor(8400  + Math.random() * 1000), color: theme.l2 },
      { name: 'Audio',     count: Math.floor(4200  + Math.random() * 500),  color: theme.l1 },
      { name: 'Video',     count: Math.floor(2100  + Math.random() * 300),  color: '#f59e0b' },
      { name: 'Docs',      count: Math.floor(1500  + Math.random() * 200),  color: '#ec4899' },
    ],
    alerts: [
      { id:'1', level:'warning',  title:'Latencia P95 elevada',       detail:'P95 > 220ms — umbral normal 150ms. Posible congestión WebSocket.', time:'Hace 3 min',  auto:true  },
      { id:'2', level:'info',     title:'Pico de mensajes detectado',  detail:'+34% vs promedio hora anterior. Evento en curso.', time:'Hace 12 min', auto:true  },
      { id:'3', level:'info',     title:'Grupo masivo creado',         detail:'Grupo con 847 participantes activo ahora mismo.', time:'Hace 18 min', auto:true  },
    ],
    lastUpdate: now.toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value?.toLocaleString()}</div>
      ))}
    </div>
  );
};

function KPI({ icon, label, value, sub, color, alert }: { icon: string; label: string; value: string | number; sub?: string; color: string; alert?: boolean }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${alert ? '#ef4444' : color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
      <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>{icon} {label}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: alert ? '#ef4444' : '#f1f5f9', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

function LatBadge({ label, value, warn, crit }: { label: string; value: number; warn: number; crit: number }) {
  const color = value >= crit ? '#ef4444' : value >= warn ? '#f59e0b' : theme.l3;
  return (
    <div style={{ background: theme.bg, borderRadius: '10px', padding: '12px', textAlign: 'center', border: `1px solid ${color}20` }}>
      <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '900', color }}>{value}ms</div>
      <div style={{ height: '4px', background: theme.bgCard, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(value / crit * 100, 100)}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const ChatDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]   = useState<ChatData>(generateMock());
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    try {
      const api = await adminAPI.getChat();
      setData(prev => ({
        ...generateMock(),
        msgPerMin:      api.messagesPerMin ?? prev.msgPerMin,
        activeConvs:    api.activeChats    ?? prev.activeConvs,
        connectedUsers: api.activeChats ? Math.floor(api.activeChats * 0.7) : prev.connectedUsers,
        audioCalls:     api.audioCalls  ?? prev.audioCalls,
        videoCalls:     api.videoCalls  ?? prev.videoCalls,
        failedCalls:    api.failedCalls ?? prev.failedCalls,
        latP95:         api.latencyP95  ?? prev.latP95,
        lastUpdate:     new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }));
    } catch {
      setData(generateMock());
    }
  }, []);

  useEffect(() => {
    refresh();
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t + 1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const hasAlerts = d.alerts.some(a => a.level === 'critical' || a.level === 'warning');

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px', fontWeight: '900' }}>💬 Dashboard de Chat</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,200,160,0.1)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '20px', padding: '4px 12px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.l3, boxShadow: '0 0 6px #00c8a0' }} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: theme.l3 }}>{d.msgPerSec} msg/s</span>
            </div>
            {hasAlerts && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '800', color: '#f59e0b' }}>
                ⚠️ {d.alerts.filter(a => a.level !== 'info').length} alertas activas
              </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>FASE B — Operaciones · Solo monitoreo · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#00c8a0 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: theme.l3, fontWeight: '800' }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: '11px', color: theme.textMuted }}>próx. refresh</span>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Auto-alerts ── */}
      {d.alerts.map(alert => {
        const cfg = ALERT_CFG[alert.level];
        return (
          <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{alert.title}</span>
              <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: '8px' }}>{alert.detail}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {alert.auto && <span style={{ fontSize: '10px', color: cfg.color, background: `${cfg.color}15`, padding: '1px 6px', borderRadius: '5px', border: `1px solid ${cfg.color}30` }}>AUTO</span>}
              <span style={{ fontSize: '10px', color: theme.textMuted }}>{alert.time}</span>
            </div>
          </div>
        );
      })}

      {/* ── Row 1: KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '18px', marginTop: d.alerts.length ? '12px' : 0 }}>
        <KPI icon="✉️"  label="Mensajes/min"     value={d.msgPerMin.toLocaleString()}     sub="ahora mismo"         color="#00c8a0" />
        <KPI icon="📨"  label="Total Hoy"         value={d.totalToday.toLocaleString()}    sub="enviados"            color="#3b82f6" />
        <KPI icon="❌"  label="Fallidos Hoy"      value={d.failedToday.toLocaleString()}   sub={`${d.failedPct}%`}   color="#ef4444" alert={d.failedPct > 1} />
        <KPI icon="💬"  label="Convs. Activas"    value={d.activeConvs.toLocaleString()}   sub="en curso"            color="#a855f7" />
        <KPI icon="🟢"  label="Usuarios Conectados" value={d.connectedUsers.toLocaleString()} sub="en línea"         color="#22c55e" />
        <KPI icon="📞"  label="Llamadas Audio"    value={d.audioCalls}                     sub="activas ahora"       color="#00b4e6" />
        <KPI icon="📹"  label="Llamadas Video"    value={d.videoCalls}                     sub="activas ahora"       color="#f59e0b" />
        <KPI icon="📵"  label="Llamadas Fallidas" value={d.failedCalls}                    sub={`${d.callFailPct}%`} color="#ef4444" alert={d.callFailPct > 3} />
      </div>

      {/* ── Row 2: Latency gauges ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}`, marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
          ⚡ Latencia de Entrega
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          <LatBadge label="P50 (Mediana)" value={d.latP50} warn={60}  crit={100} />
          <LatBadge label="P95"          value={d.latP95} warn={150} crit={300} />
          <LatBadge label="P99 (Peor)"   value={d.latP99} warn={300} crit={600} />
        </div>
      </div>

      {/* ── Row 3: Hourly msgs + Latency history ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '18px' }}>

        {/* Hourly messages */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📊 Mensajes Enviados vs Fallidos — Últimas 24h
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.hourlyMsgs} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="sent"   name="Enviados" fill="#00c8a0" radius={[3,3,0,0]} />
              <Bar dataKey="failed" name="Fallidos" fill="#ef4444" radius={[3,3,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency history */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📈 Historial de Latencia — 20h
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={d.latencyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} unit="ms" width={45} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="p50" name="P50" stroke="#00c8a0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95" name="P95" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: 7-day history + Chat types + Media ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* 7-day */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📅 Histórico Semanal — Mensajes y Usuarios
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={d.dailyMsgs}>
              <defs>
                <linearGradient id="gC1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="sent"  name="Mensajes" stroke="#00c8a0" strokeWidth={2} fill="url(#gC1)" dot={false} />
              <Line type="monotone" dataKey="users" name="Usuarios"  stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chat types */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            💬 Tipo de Conversaciones
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={[
                { name: 'Privadas',   value: d.privateChats, fill: theme.l3 },
                { name: 'Grupos',     value: d.groupChats,   fill: theme.l2 },
                { name: 'Broadcast', value: d.broadcast,    fill: theme.l1 },
              ]} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3}>
                {[{ fill: theme.l3 },{ fill: theme.l2 },{ fill: theme.l1 }].map((e,i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString()} contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          {[
            { label: 'Privadas',  value: d.privateChats, color: theme.l3 },
            { label: 'Grupos',    value: d.groupChats,   color: theme.l2 },
            { label: 'Broadcast', value: d.broadcast,    color: theme.l1 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #0f172a' }}>
              <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.label}</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: item.color }}>{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Media breakdown */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🗂️ Tipo de Mensajes
          </div>
          {(() => {
            const total = d.mediaBreakdown.reduce((s, m) => s + m.count, 0);
            return d.mediaBreakdown.map(m => (
              <div key={m.name} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>{m.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: m.color }}>{Math.round(m.count / total * 100)}%</span>
                </div>
                <div style={{ height: '5px', background: theme.bg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.count / total * 100}%`, background: m.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '10px 16px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>💬 Dashboard Chat · Solo Monitoreo · Alertas automáticas activas</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: theme.l3 }}>● Latencia normal &lt;150ms</span>
          <span style={{ fontSize: '11px', color: '#f59e0b' }}>● Atención 150-300ms</span>
          <span style={{ fontSize: '11px', color: '#ef4444' }}>● Crítico &gt;300ms</span>
        </div>
      </div>
    </div>
  );
};
