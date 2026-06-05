import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type TxStatus = 'completed' | 'pending' | 'rejected' | 'refunded' | 'processing';
interface TxRow {
  id: string; user: string; type: string; amount: number;
  status: TxStatus; time: string; method: string; ref: string;
}
interface WalletData {
  // KPIs
  completedCount: number; completedVolume: number;
  pendingCount: number;   pendingVolume: number;
  rejectedCount: number;  rejectedVolume: number;
  transferCount: number;  transferVolume: number;
  totalVolume: number; successRate: number; avgTxValue: number;
  // Charts
  hourlyVolume: { hour: string; completed: number; pending: number; rejected: number }[];
  dailyVolume:  { day: string; volume: number; txCount: number; rejected: number }[];
  methodBreakdown: { name: string; count: number; volume: number; color: string }[];
  categoryBreakdown: { name: string; pct: number; color: string; icon: string }[];
  recentTx: TxRow[];
  // Alerts
  alerts: { id: string; level: 'critical'|'warning'|'info'; title: string; detail: string; time: string }[];
  lastUpdate: string;
}

// ── Configs ───────────────────────────────────────────────────────────────────
const TX_STATUS: Record<TxStatus, { color: string; bg: string; label: string; icon: string }> = {
  completed:  { color: theme.l3, bg: 'rgba(0,200,160,0.1)',   label: 'Completado',   icon: '✅' },
  pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Pendiente',    icon: '⏳' },
  rejected:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Rechazado',    icon: '❌' },
  refunded:   { color: theme.l1, bg: 'rgba(168,85,247,0.1)',  label: 'Reembolsado',  icon: '↩️' },
  processing: { color: theme.l2, bg: 'rgba(59,130,246,0.1)',  label: 'Procesando',   icon: '🔄' },
};

const ALERT_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  icon: '🚨' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '⚠️' },
  info:     { color: theme.l2, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', icon: 'ℹ️' },
};

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtXAF(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M XAF';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K XAF';
  return n.toFixed(0) + ' XAF';
}
function fmtShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

// ── Mock ──────────────────────────────────────────────────────────────────────
const USERS_MOCK = ['Carlos Nguema','María Obiang','Pedro Esono','Ana Mba','Luis Eyene','Rosa Nchama','David Ondo','Jean Ateba'];
const TX_TYPES = ['Transferencia','Recarga Móvil','Pago Servicio','Retiro','Compra Online','Envío Internacional'];
const METHODS = ['Wallet Saldo','Orange Money','MTN Mobile','Tarjeta BGFI','Efectivo'];

function generateMock(): WalletData {
  const completedVol = 2_480_000 + Math.random() * 500_000;
  const pendingVol   = 340_000 + Math.random() * 80_000;
  const rejectedVol  = 85_000  + Math.random() * 20_000;
  const transferVol  = 1_120_000 + Math.random() * 200_000;

  const recentTx: TxRow[] = Array.from({ length: 30 }, (_, i) => {
    const statuses: TxStatus[] = ['completed','completed','completed','pending','rejected','processing','refunded'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(5_000 + Math.random() * 495_000);
    const minAgo = Math.floor(Math.random() * 120);
    return {
      id: `TX${String(100000 + i).slice(1)}`,
      user: USERS_MOCK[Math.floor(Math.random() * USERS_MOCK.length)],
      type: TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)],
      amount, status,
      time: minAgo < 60 ? `Hace ${minAgo} min` : `Hace ${Math.floor(minAgo / 60)}h`,
      method: METHODS[Math.floor(Math.random() * METHODS.length)],
      ref: `REF-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
    };
  });

  return {
    completedCount: 1847, completedVolume: completedVol,
    pendingCount:   124,  pendingVolume:   pendingVol,
    rejectedCount:  38,   rejectedVolume:  rejectedVol,
    transferCount:  620,  transferVolume:  transferVol,
    totalVolume: completedVol + pendingVol,
    successRate: parseFloat((1847 / (1847 + 38) * 100).toFixed(1)),
    avgTxValue: Math.floor(completedVol / 1847),
    hourlyVolume: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      completed: Math.floor(50000 + Math.sin((i - 6) / 24 * Math.PI * 2) * 80000 + Math.random() * 20000),
      pending:   Math.floor(5000  + Math.random() * 15000),
      rejected:  Math.floor(Math.random() * 8000),
    })),
    dailyVolume: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      volume:  Math.floor(1_800_000 + Math.random() * 800_000),
      txCount: Math.floor(1200 + Math.random() * 600),
      rejected: Math.floor(20 + Math.random() * 30),
    })),
    methodBreakdown: [
      { name: 'Wallet Saldo',    count: 820,  volume: 980_000,   color: theme.l3 },
      { name: 'Orange Money',    count: 540,  volume: 720_000,   color: '#f97316' },
      { name: 'MTN Mobile',      count: 310,  volume: 420_000,   color: '#f59e0b' },
      { name: 'Tarjeta BGFI',    count: 140,  volume: 280_000,   color: theme.l2 },
      { name: 'Efectivo',        count:  37,  volume:  80_000,   color: theme.textMuted },
    ],
    categoryBreakdown: [
      { name: 'Transferencias',   pct: 42, color: theme.l3, icon: '💸' },
      { name: 'Recargas Móvil',   pct: 28, color: '#f97316', icon: '📱' },
      { name: 'Pagos Servicios',  pct: 18, color: theme.l2, icon: '🔌' },
      { name: 'Compras Online',   pct:  8, color: theme.l1, icon: '🛒' },
      { name: 'Internacional',    pct:  4, color: '#f59e0b', icon: '🌍' },
    ],
    recentTx,
    alerts: [
      { id:'1', level:'warning',  title:'Tasa de rechazo elevada',     detail:'3.8% de tx rechazadas en la última hora — umbral: 2%', time:'Hace 5 min' },
      { id:'2', level:'info',     title:'Volumen superior al promedio', detail:'+22% vs mismo tramo horario ayer', time:'Hace 14 min' },
    ],
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? fmtXAF(p.value) : p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function KPI({ icon, label, value, sub, color, alert }: { icon: string; label: string; value: string; sub?: string; color: string; alert?: boolean }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${alert ? '#ef4444' : color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
      <div style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>{icon} {label}</div>
      <div style={{ fontSize: '20px', fontWeight: '900', color: alert ? '#ef4444' : '#f1f5f9', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

// ── READONLY BANNER — prominent, can't be missed ──────────────────────────────
const ReadOnlyBanner = () => (
  <div style={{
    background: 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(249,115,22,0.08))',
    border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: '12px',
    padding: '10px 16px', marginBottom: '18px',
    display: 'flex', alignItems: 'center', gap: '12px',
  }}>
    <span style={{ fontSize: '20px' }}>🚫</span>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444' }}>SOLO MONITOREO — No se pueden ejecutar pagos desde este panel</div>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Este dashboard es de consulta. Ninguna acción modifica transacciones ni saldos.</div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export const WalletDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]     = useState<WalletData>(generateMock());
  const [tick, setTick]     = useState(0);
  const [pulse, setPulse]   = useState(false);
  const [statusFilter, setStatusFilter] = useState<TxStatus | 'all'>('all');
  const [page, setPage]     = useState(0);
  const PAGE_SIZE = 10;

  const refresh = useCallback(async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    try {
      const api = await adminAPI.getWallet();
      setData(prev => ({
        ...generateMock(),
        completedVolume: api.volumeToday   ?? prev.completedVolume,
        completedCount:  api.txCount       ?? prev.completedCount,
        rejectedCount:   api.txFailed      ?? prev.rejectedCount,
        successRate:     api.successRate   ?? prev.successRate,
        lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }));
    } catch { setData(generateMock()); }
  }, []);

  useEffect(() => {
    refresh();
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t + 1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const filtered = statusFilter === 'all' ? d.recentTx : d.recentTx.filter(t => t.status === statusFilter);
  const paged    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div style={{ color: theme.text }}>

      {/* ── Read-only banner ── */}
      <ReadOnlyBanner />

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>💰 Dashboard Wallet</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>FASE B — Operaciones · Solo monitoreo · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#f59e0b ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#f59e0b', fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Auto-alerts ── */}
      {d.alerts.map(a => {
        const cfg = ALERT_CFG[a.level];
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '10px', background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: '8px' }}>
            <span style={{ fontSize: '15px' }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{a.title}</span>
              <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: '8px' }}>{a.detail}</span>
            </div>
            <span style={{ fontSize: '10px', color: theme.textMuted, flexShrink: 0 }}>{a.time}</span>
          </div>
        );
      })}

      {/* ── Row 1: KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '18px', marginTop: '12px' }}>
        <KPI icon="✅" label="Pagos Completados"  value={d.completedCount.toLocaleString()}  sub={fmtXAF(d.completedVolume)}    color="#00c8a0" />
        <KPI icon="⏳" label="Pagos Pendientes"   value={d.pendingCount.toLocaleString()}    sub={fmtXAF(d.pendingVolume)}      color="#f59e0b" alert={d.pendingCount > 150} />
        <KPI icon="❌" label="Operaciones Rechazo" value={d.rejectedCount.toLocaleString()}  sub={fmtXAF(d.rejectedVolume)}     color="#ef4444" alert={d.rejectedCount > 30} />
        <KPI icon="💸" label="Transferencias"     value={d.transferCount.toLocaleString()}   sub={fmtXAF(d.transferVolume)}     color="#3b82f6" />
        <KPI icon="📊" label="Volumen Total Hoy"  value={fmtXAF(d.totalVolume)}              sub="completado + pendiente"       color="#a855f7" />
        <KPI icon="✔️" label="Tasa de Éxito"      value={`${d.successRate}%`}                sub="completadas / total"          color={d.successRate >= 97 ? theme.l3 : '#f59e0b'} />
        <KPI icon="📈" label="Valor Medio Tx"     value={fmtXAF(d.avgTxValue)}               sub="por transacción"              color="#00b4e6" />
      </div>

      {/* ── Row 2: Volume charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '18px' }}>

        {/* Hourly stacked area */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📊 Volumen por Hora — Hoy (XAF)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.hourlyVolume} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickFormatter={fmtShort} width={42} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="completed" name="Completado" stackId="a" fill="#00c8a0" radius={[0,0,0,0]} />
              <Bar dataKey="pending"   name="Pendiente"  stackId="a" fill="#f59e0b" />
              <Bar dataKey="rejected"  name="Rechazado"  stackId="a" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 7-day area */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📅 Volumen Semanal (XAF)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.dailyVolume}>
              <defs>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickFormatter={fmtShort} width={42} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="volume" name="Volumen" stroke="#f59e0b" strokeWidth={2} fill="url(#gW)" dot={false} />
              <Line type="monotone" dataKey="rejected" name="Rechazadas" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} yAxisId={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Methods + Categories + Success trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Payment methods */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            💳 Métodos de Pago
          </div>
          {d.methodBreakdown.map(m => {
            const total = d.methodBreakdown.reduce((s, x) => s + x.count, 0);
            const pct = Math.round(m.count / total * 100);
            return (
              <div key={m.name} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: theme.textMuted }}>{pct}%</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: m.color }}>{fmtXAF(m.volume)}</span>
                  </div>
                </div>
                <div style={{ height: '5px', background: theme.bg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Categories pie */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🗂️ Categorías de Pago
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={d.categoryBreakdown} dataKey="pct" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3}>
                {d.categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          {d.categoryBreakdown.map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #0f172a' }}>
              <span style={{ fontSize: '11px', color: theme.textMuted }}>{c.icon} {c.name}</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: c.color }}>{c.pct}%</span>
            </div>
          ))}
        </div>

        {/* Status summary */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📈 Resumen de Operaciones
          </div>
          {[
            { label: 'Completadas', value: d.completedCount, volume: d.completedVolume, status: 'completed' as TxStatus },
            { label: 'Pendientes',  value: d.pendingCount,   volume: d.pendingVolume,   status: 'pending'   as TxStatus },
            { label: 'Rechazadas',  value: d.rejectedCount,  volume: d.rejectedVolume,  status: 'rejected'  as TxStatus },
            { label: 'Transferencias', value: d.transferCount, volume: d.transferVolume, status: 'completed' as TxStatus },
          ].map(item => {
            const cfg = TX_STATUS[item.status];
            return (
              <div key={item.label} style={{ padding: '10px', background: theme.bg, borderRadius: '10px', marginBottom: '6px', border: `1px solid ${cfg.color}15` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>{cfg.icon} {item.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: cfg.color }}>{item.value.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', textAlign: 'right' }}>{fmtXAF(item.volume)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 4: Transaction log ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📋 Transacciones Recientes ({filtered.length})
            <span style={{ marginLeft: '8px', fontSize: '10px', color: '#ef4444', fontWeight: '600', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: '5px' }}>
              🚫 Solo lectura
            </span>
          </div>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => { setStatusFilter('all'); setPage(0); }} style={{ padding: '4px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: statusFilter === 'all' ? '#334155' : 'transparent', color: statusFilter === 'all' ? '#f1f5f9' : '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              Todos
            </button>
            {(['completed','pending','rejected','processing','refunded'] as TxStatus[]).map(s => {
              const cfg = TX_STATUS[s];
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${cfg.color}30`, background: statusFilter === s ? cfg.bg : 'transparent', color: cfg.color, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Ref.','Usuario','Tipo','Método','Monto','Estado','Hace'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: theme.textMuted, fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(tx => {
                const s = TX_STATUS[tx.status];
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{tx.ref}</td>
                    <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: '600', whiteSpace: 'nowrap' }}>{tx.user}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{tx.type}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{tx.method}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '800', color: theme.text, whiteSpace: 'nowrap' }}>{fmtXAF(tx.amount)}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${s.color}20` }}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{tx.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>
            {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} transacciones
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: '«', action: () => setPage(0),            disabled: page === 0 },
              { label: '‹', action: () => setPage(p => p - 1),  disabled: page === 0 },
              { label: '›', action: () => setPage(p => p + 1),  disabled: page >= totalPages - 1 },
              { label: '»', action: () => setPage(totalPages-1), disabled: page >= totalPages - 1 },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={btn.disabled} style={{ padding: '5px 10px', borderRadius: '7px', background: theme.bg, border: `1px solid ${theme.border}`, color: btn.disabled ? '#334155' : '#94a3b8', fontSize: '11px', cursor: btn.disabled ? 'default' : 'pointer' }}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: 'linear-gradient(135deg,rgba(239,68,68,0.05),rgba(249,115,22,0.05))', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>🚫 <strong style={{ color: '#ef4444' }}>SOLO MONITOREO</strong> — Consulta de datos exclusivamente. Sin capacidad de ejecutar, cancelar ni modificar pagos.</span>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>Actualización cada 30s · {d.lastUpdate}</span>
      </div>
    </div>
  );
};
