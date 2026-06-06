import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
type TicketCategory = 'login' | 'wallet' | 'chat' | 'app_bug' | 'account' | 'other';

interface Ticket {
  id: string; user: string; subject: string;
  category: TicketCategory; priority: TicketPriority;
  status: TicketStatus; created: string; updated: string;
  resolutionMin?: number; agent?: string; country: string;
}

interface SupportData {
  // KPIs
  open: number; inProgress: number; resolved24h: number;
  closed: number; escalated: number; total: number;
  avgResolutionMin: number; avgFirstResponseMin: number;
  satisfactionScore: number; // 0-5
  slaCompliance: number; // %
  // Metrics
  openByPriority: Record<TicketPriority, number>;
  byCategory: { name: string; count: number; color: string; icon: string }[];
  byAgent: { name: string; open: number; resolved: number; avgMin: number; score: number }[];
  hourlyTickets: { hour: string; opened: number; resolved: number }[];
  weeklyTrend: { day: string; opened: number; resolved: number; backlog: number }[];
  resolutionDist: { range: string; count: number; color: string }[];
  topIssues: { issue: string; count: number; pct: number; trend: 'up'|'down'|'same'; category: TicketCategory }[];
  recentTickets: Ticket[];
  lastUpdate: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const PRIORITY: Record<TicketPriority, { color: string; bg: string; label: string; icon: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Crítico', icon: '🚨' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: 'Alto',    icon: '⚠️' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Medio',   icon: '🔶' },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Bajo',    icon: '✅' },
};

const STATUS: Record<TicketStatus, { color: string; bg: string; label: string; icon: string }> = {
  open:        { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Abierto',      icon: '🔴' },
  in_progress: { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', label: 'En Proceso',   icon: '🔵' },
  resolved:    { color: '#34d399', bg: 'rgba(0,200,160,0.1)',  label: 'Resuelto',     icon: '✅' },
  closed:      { color: '#64748b', bg: 'rgba(100,116,139,0.1)',label: 'Cerrado',      icon: '⚫' },
  escalated:   { color: '#818cf8', bg: 'rgba(168,85,247,0.1)', label: 'Escalado',     icon: '🆙' },
};

const CATEGORY_CFG: Record<TicketCategory, { label: string; icon: string; color: string }> = {
  login:    { label: 'Login / Acceso',    icon: '🔐', color: '#ef4444' },
  wallet:   { label: 'Wallet / Pagos',    icon: '💰', color: '#f59e0b' },
  chat:     { label: 'Chat / Mensajes',   icon: '💬', color: '#34d399' },
  app_bug:  { label: 'Error de la App',   icon: '🐛', color: '#f97316' },
  account:  { label: 'Cuenta / Perfil',   icon: '👤', color: '#60a5fa' },
  other:    { label: 'Otros',             icon: '📋', color: '#64748b' },
};

// ── Mock ──────────────────────────────────────────────────────────────────────
const AGENTS = ['Sofia R.','Carlos M.','Ana P.','Miguel O.','Rosa E.'];
const USERS  = ['Carlos Nguema','María Obiang','Pedro Esono','Ana Mba','Luis Eyene','Rosa Nchama','David Ondo','Jean Ateba','Fatima Mbongo'];
const COUNTRIES = ['🇬🇶 GQ','🇨🇲 CM','🇬🇦 GA','🇨🇬 CG'];
const SUBJECTS = [
  'No puedo iniciar sesión','Error al enviar dinero','Mensajes no llegan',
  'App se cierra sola','Cambiar número de teléfono','Código de verificación no llega',
  'Transferencia bloqueada','Fotos no se envían','Saldo incorrecto','Cuenta suspendida',
];

function generateMock(): SupportData {
  const open = 47; const inProg = 23; const resolved = 128; const closed = 842; const esc = 6;
  const recentTickets: Ticket[] = Array.from({ length: 40 }, (_, i) => {
    const statuses: TicketStatus[] = ['open','open','in_progress','resolved','closed','escalated'];
    const priorities: TicketPriority[] = ['critical','high','high','medium','medium','medium','low','low'];
    const categories: TicketCategory[] = ['login','wallet','chat','app_bug','account','other'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const resMin = status === 'resolved' || status === 'closed' ? Math.floor(15 + Math.random() * 180) : undefined;
    return {
      id: `TK-${String(2000 + i)}`,
      user: USERS[Math.floor(Math.random() * USERS.length)],
      subject: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status, resolutionMin: resMin,
      created: `Hace ${Math.floor(Math.random() * 72)}h`,
      updated: `Hace ${Math.floor(Math.random() * 8)}h`,
      agent: status !== 'open' ? AGENTS[Math.floor(Math.random() * AGENTS.length)] : undefined,
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    };
  });

  return {
    open, inProgress: inProg, resolved24h: resolved, closed, escalated: esc,
    total: open + inProg + resolved + closed + esc,
    avgResolutionMin: 68,
    avgFirstResponseMin: 14,
    satisfactionScore: 4.2,
    slaCompliance: 87.4,
    openByPriority: { critical: 3, high: 12, medium: 22, low: 10 },
    byCategory: [
      { name: 'Login / Acceso',   count: 142, color: '#ef4444', icon: '🔐' },
      { name: 'Wallet / Pagos',   count: 118, color: '#f59e0b', icon: '💰' },
      { name: 'Chat / Mensajes',  count:  94, color: '#34d399', icon: '💬' },
      { name: 'Error App',        count:  87, color: '#f97316', icon: '🐛' },
      { name: 'Cuenta / Perfil',  count:  72, color: '#60a5fa', icon: '👤' },
      { name: 'Otros',            count:  46, color: '#64748b', icon: '📋' },
    ],
    byAgent: AGENTS.map(name => ({
      name, open: Math.floor(3 + Math.random() * 8),
      resolved: Math.floor(18 + Math.random() * 30),
      avgMin: Math.floor(40 + Math.random() * 60),
      score: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
    })),
    hourlyTickets: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      opened:   Math.floor(1 + Math.sin((i - 6) / 24 * Math.PI * 2) * 4 + Math.random() * 2),
      resolved: Math.floor(1 + Math.sin((i - 8) / 24 * Math.PI * 2) * 3 + Math.random() * 2),
    })),
    weeklyTrend: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day, i) => ({
      day,
      opened:   Math.floor(18 + Math.random() * 15),
      resolved: Math.floor(15 + Math.random() * 18),
      backlog:  Math.floor(40 + i * 3 + Math.random() * 10),
    })),
    resolutionDist: [
      { range: '<15 min',   count: 38, color: '#34d399' },
      { range: '15-60 min', count: 52, color: '#60a5fa' },
      { range: '1-4 h',     count: 24, color: '#f59e0b' },
      { range: '4-24 h',    count: 10, color: '#f97316' },
      { range: '>24 h',     count:  4, color: '#ef4444' },
    ],
    topIssues: [
      { issue: 'No recibe código SMS',          count: 48, pct: 18, trend: 'up',   category: 'login'   },
      { issue: 'Transferencia no procesada',    count: 42, pct: 16, trend: 'same', category: 'wallet'  },
      { issue: 'App crashea al abrir chat',     count: 34, pct: 13, trend: 'down', category: 'app_bug' },
      { issue: 'Mensajes no se entregan',       count: 28, pct: 11, trend: 'up',   category: 'chat'    },
      { issue: 'Contraseña no se resetea',      count: 22, pct:  8, trend: 'same', category: 'login'   },
      { issue: 'Saldo no se actualiza',         count: 18, pct:  7, trend: 'down', category: 'wallet'  },
      { issue: 'No puedo cambiar foto perfil',  count: 14, pct:  5, trend: 'same', category: 'account' },
    ],
    recentTickets,
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: `1px solid ${'#334155'}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

function fmtMin(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function Stars({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: '12px', color: s <= Math.round(score) ? '#f59e0b' : '#334155' }}>★</span>
      ))}
      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '800', marginLeft: '4px' }}>{score}</span>
    </div>
  );
}

function KPI({ icon, label, value, sub, color, alert }: { icon: string; label: string; value: string|number; sub?: string; color: string; alert?: boolean }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${alert ? '#ef4444' : color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>{icon} {label}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: alert ? '#ef4444' : '#f1f5f9', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const SupportDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]       = useState<SupportData>(generateMock());
  const [tick, setTick]       = useState(0);
  const [pulse, setPulse]     = useState(false);
  const [statusFilter, setStatus] = useState<TicketStatus | 'all'>('all');
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 8;

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
  const filtered = statusFilter === 'all' ? d.recentTickets : d.recentTickets.filter(t => t.status === statusFilter);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // SLA color
  const slaColor = d.slaCompliance >= 90 ? theme.l3 : d.slaCompliance >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>🎧 Dashboard de Soporte</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>FASE B — Operaciones · Tickets · Calidad · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#3b82f6 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#60a5fa', fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Ticket KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: '12px', marginBottom: '18px' }}>
        <KPI icon="🔴" label="Abiertos"         value={d.open}          sub="sin asignar"            color="#ef4444" alert={d.open > 40} />
        <KPI icon="🔵" label="En Proceso"       value={d.inProgress}    sub="asignados a agente"     color="#3b82f6" />
        <KPI icon="✅" label="Resueltos (24h)"  value={d.resolved24h}   sub="últimas 24 horas"       color="#00c8a0" />
        <KPI icon="⚫" label="Cerrados"         value={d.closed}        sub="total histórico"        color="#64748b" />
        <KPI icon="🆙" label="Escalados"        value={d.escalated}     sub="a nivel superior"       color="#a855f7" alert={d.escalated > 5} />
        <KPI icon="⏱️" label="Tiempo Resolución" value={fmtMin(d.avgResolutionMin)} sub="promedio"   color="#f59e0b" />
        <KPI icon="⚡" label="Primera Respuesta" value={fmtMin(d.avgFirstResponseMin)} sub="promedio" color="#00b4e6" />
      </div>

      {/* ── Row 2: Quality metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>

        {/* Satisfaction score */}
        <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>😊 Satisfacción</div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>{d.satisfactionScore}</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px' }}>/ 5.0</div>
          <Stars score={d.satisfactionScore} />
        </div>

        {/* SLA compliance gauge */}
        <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>📋 Cumplimiento SLA</div>
          <div style={{ position: 'relative', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width={70} height={70}>
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: d.slaCompliance, fill: slaColor },{ value: 100 - d.slaCompliance, fill: '#1e293b' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: slaColor, lineHeight: 1 }}>{d.slaCompliance}%</div>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: theme.textMuted }}>objetivo: 90%</div>
        </div>

        {/* Open by priority */}
        <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>🎯 Abiertos por Prioridad</div>
          {(['critical','high','medium','low'] as TicketPriority[]).map(p => {
            const cfg = PRIORITY[p];
            const v = d.openByPriority[p];
            const pct = Math.round(v / d.open * 100);
            return (
              <div key={p} style={{ marginBottom: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>{cfg.icon} {cfg.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: cfg.color }}>{v}</span>
                </div>
                <div style={{ height: '4px', background: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Resolution distribution */}
        <div style={{ background: theme.bgCard, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>⏱️ Tiempo de Resolución</div>
          {d.resolutionDist.map(r => {
            const total = d.resolutionDist.reduce((s, x) => s + x.count, 0);
            return (
              <div key={r.range} style={{ marginBottom: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '10px', color: theme.textMuted }}>{r.range}</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: r.color }}>{r.count}</span>
                </div>
                <div style={{ height: '4px', background: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.count/total*100}%`, background: r.color, borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Hourly + Weekly trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📊 Tickets por Hora — Hoy
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.hourlyTickets} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="opened"   name="Abiertos"   fill="#ef4444" radius={[3,3,0,0]} />
              <Bar dataKey="resolved" name="Resueltos"  fill="#00c8a0" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📈 Tendencia Semanal + Backlog
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d.weeklyTrend}>
              <defs>
                <linearGradient id="gBacklog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="backlog"  name="Backlog"   stroke="#f59e0b" strokeWidth={1.5} fill="url(#gBacklog)" dot={false} />
              <Line type="monotone" dataKey="opened"   name="Abiertos"  stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
              <Line type="monotone" dataKey="resolved" name="Resueltos" stroke="#00c8a0" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Categories + Top issues + Agents ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* By category */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🗂️ Problemas por Categoría
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={d.byCategory} dataKey="count" cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={3}>
                {d.byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v} contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          {d.byCategory.map(c => {
            const total = d.byCategory.reduce((s, x) => s + x.count, 0);
            return (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #0f172a' }}>
                <span style={{ fontSize: '11px', color: theme.textMuted }}>{c.icon} {c.name}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: theme.textMuted }}>{Math.round(c.count/total*100)}%</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: c.color }}>{c.count}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top issues */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🔥 Problemas Frecuentes
          </div>
          {d.topIssues.map((issue, i) => {
            const catCfg = CATEGORY_CFG[issue.category];
            const trendIcon = issue.trend === 'up' ? '▲' : issue.trend === 'down' ? '▼' : '─';
            const trendColor = issue.trend === 'up' ? '#ef4444' : issue.trend === 'down' ? theme.l3 : '#64748b';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid #0f172a' }}>
                <span style={{ fontSize: '11px', color: theme.textMuted, width: '16px', flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: '12px' }}>{catCfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.issue}</div>
                  <div style={{ height: '3px', background: theme.bg, borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${issue.pct}%`, background: catCfg.color, borderRadius: '2px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: catCfg.color }}>{issue.count}</span>
                  <span style={{ fontSize: '10px', color: trendColor, fontWeight: '700' }}>{trendIcon}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent performance */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            👨‍💼 Agentes de Soporte
          </div>
          {d.byAgent.map(agent => (
            <div key={agent.name} style={{ padding: '8px', background: theme.bg, borderRadius: '10px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '700' }}>👤 {agent.name}</span>
                <Stars score={agent.score} />
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: theme.textMuted }}>
                <span style={{ color: '#ef4444' }}>Abiertos: <b>{agent.open}</b></span>
                <span style={{ color: '#34d399' }}>Resueltos: <b>{agent.resolved}</b></span>
                <span>⏱️ {fmtMin(agent.avgMin)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: Ticket list ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            🎫 Tickets Recientes ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => { setStatus('all'); setPage(0); }} style={{ padding: '4px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: statusFilter === 'all' ? '#334155' : 'transparent', color: statusFilter === 'all' ? '#f1f5f9' : '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              Todos
            </button>
            {(['open','in_progress','resolved','escalated'] as TicketStatus[]).map(s => {
              const cfg = STATUS[s];
              return (
                <button key={s} onClick={() => { setStatus(s); setPage(0); }}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${cfg.color}30`, background: statusFilter === s ? cfg.bg : 'transparent', color: cfg.color, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['ID','Usuario','Asunto','Cat.','Prioridad','Estado','Agente','Creado','Resolución'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: theme.textMuted, fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(t => {
                const s = STATUS[t.status];
                const p = PRIORITY[t.priority];
                const cat = CATEGORY_CFG[t.category];
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>{t.id}</td>
                    <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: '600', whiteSpace: 'nowrap' }}><span style={{ marginRight: '4px' }}>{t.country.split(' ')[0]}</span>{t.user}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span title={cat.label} style={{ fontSize: '14px' }}>{cat.icon}</span>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: p.color, background: p.bg, padding: '2px 7px', borderRadius: '6px' }}>{p.icon} {p.label}</span>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 7px', borderRadius: '6px' }}>{s.icon} {s.label}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{t.agent || '—'}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{t.created}</td>
                    <td style={{ padding: '8px 10px', color: t.resolutionMin ? theme.l3 : '#475569', whiteSpace: 'nowrap', fontWeight: t.resolutionMin ? '700' : '400' }}>
                      {t.resolutionMin ? fmtMin(t.resolutionMin) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>{Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} tickets</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { l:'«', a:() => setPage(0),            d: page === 0 },
              { l:'‹', a:() => setPage(p => p - 1),  d: page === 0 },
              { l:'›', a:() => setPage(p => p + 1),  d: page >= totalPages - 1 },
              { l:'»', a:() => setPage(totalPages-1), d: page >= totalPages - 1 },
            ].map(btn => (
              <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding: '5px 10px', borderRadius: '7px', background: theme.bg, border: `1px solid ${theme.border}`, color: btn.d ? '#334155' : '#94a3b8', fontSize: '11px', cursor: btn.d ? 'default' : 'pointer' }}>{btn.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>🎧 Dashboard Soporte · Métricas de calidad · Actualización cada 30s</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#34d399' }}>SLA objetivo: 90%</span>
          <span style={{ fontSize: '11px', color: '#f59e0b' }}>Satisfacción objetivo: ≥4.0/5</span>
        </div>
      </div>
    </div>
  );
};
