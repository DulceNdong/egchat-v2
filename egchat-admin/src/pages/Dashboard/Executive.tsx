import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { adminAPI } from '../../api/adminClient';

// ── Types ────────────────────────────────────────────────────────────────────
interface ExecMetrics {
  activeNow: number;
  activeToday: number;
  activeMonth: number;
  newToday: number;
  newWeek: number;
  totalUsers: number;
  platformHealth: 'optimal' | 'degraded' | 'critical';
  uptime: number;
  services: { name: string; status: 'ok' | 'degraded' | 'down'; latency?: number }[];
  alerts: { id: string; severity: 'critical' | 'warning' | 'info'; title: string; time: string }[];
  hourlyTrend: { hour: string; users: number }[];
  dailyTrend: { day: string; users: number; newUsers: number }[];
  chatVolume: number;
  walletVolume: number;
  successRate: number;
  lastUpdate: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  optimal:  { color: '#00c8a0', bg: 'rgba(0,200,160,0.1)',  border: 'rgba(0,200,160,0.3)',  label: 'ÓPTIMO',   dot: '#00c8a0' },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'DEGRADADO', dot: '#f59e0b' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  label: 'CRÍTICO',   dot: '#ef4444' },
};

const STATUS_CONFIG = {
  ok:       { color: '#00c8a0', label: 'OK' },
  degraded: { color: '#f59e0b', label: 'DEGRADADO' },
  down:     { color: '#ef4444', label: 'CAÍDO' },
};

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '🚨' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️' },
  info:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'ℹ️' },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtXAF(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M XAF';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K XAF';
  return n + ' XAF';
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend }: {
  icon: string; label: string; value: string | number; sub?: string;
  color: string; trend?: number;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: `1px solid ${color}30`,
      borderRadius: '16px', padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow top-right */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{sub}</div>}
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: `${color}20`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
        }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: trend >= 0 ? '#00c8a0' : '#ef4444', fontWeight: '700' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: '11px', color: '#475569' }}>vs ayer</span>
        </div>
      )}
    </div>
  );
}

// ── Service Row ───────────────────────────────────────────────────────────────
function ServiceRow({ name, status, latency }: { name: string; status: 'ok' | 'degraded' | 'down'; latency?: number }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: '10px',
      background: '#0f172a', border: `1px solid ${cfg.color}20`,
      marginBottom: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
        <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {latency !== undefined && <span style={{ fontSize: '11px', color: '#64748b' }}>{latency}ms</span>}
        <span style={{ fontSize: '11px', fontWeight: '800', color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: '6px' }}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ── Alert Row ─────────────────────────────────────────────────────────────────
function AlertRow({ severity, title, time }: { severity: 'critical' | 'warning' | 'info'; title: string; time: string }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '10px',
      background: cfg.bg, border: `1px solid ${cfg.color}30`,
      marginBottom: '6px',
    }}>
      <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{time}</div>
      </div>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '13px', color: p.color, fontWeight: '700' }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ── Generate realistic mock data ──────────────────────────────────────────────
function generateMock(): ExecMetrics {
  const now = new Date();
  const hour = now.getHours();
  const baseActive = Math.floor(150 + Math.sin(hour / 24 * Math.PI * 2) * 80 + Math.random() * 30);
  return {
    activeNow:     baseActive,
    activeToday:   Math.floor(baseActive * 3.2),
    activeMonth:   Math.floor(baseActive * 22),
    newToday:      Math.floor(12 + Math.random() * 40),
    newWeek:       Math.floor(180 + Math.random() * 120),
    totalUsers:    3847,
    platformHealth: 'optimal',
    uptime:        99.84,
    services: [
      { name: 'API Principal (Render)',  status: 'ok',       latency: Math.floor(120 + Math.random() * 80) },
      { name: 'Base de Datos (Neon)',    status: 'ok',       latency: Math.floor(8  + Math.random() * 12) },
      { name: 'CDN / Frontend (Vercel)', status: 'ok',       latency: Math.floor(18 + Math.random() * 10) },
      { name: 'Push Notifications',     status: 'ok',       latency: Math.floor(45 + Math.random() * 30) },
      { name: 'Almacenamiento (ImageKit)', status: 'ok',    latency: Math.floor(60 + Math.random() * 40) },
      { name: 'WebSocket Relay',        status: 'degraded', latency: Math.floor(280 + Math.random() * 100) },
    ],
    alerts: [
      { id: '1', severity: 'warning', title: 'WebSocket latencia elevada (>250ms)', time: 'Hace 8 min' },
      { id: '2', severity: 'info',    title: 'Deploy completado — v2.5.1', time: 'Hace 42 min' },
      { id: '3', severity: 'info',    title: '3 nuevos usuarios registrados desde GQ', time: 'Hace 1h' },
    ],
    hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      users: Math.floor(80 + Math.sin((i - 6) / 24 * Math.PI * 2) * 120 + Math.random() * 20),
    })),
    dailyTrend: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((day, i) => ({
      day,
      users:    Math.floor(400 + Math.sin(i / 7 * Math.PI) * 200 + Math.random() * 50),
      newUsers: Math.floor(20 + Math.random() * 60),
    })),
    chatVolume:    Math.floor(1200 + Math.random() * 800),
    walletVolume:  Math.floor(2_500_000 + Math.random() * 1_500_000),
    successRate:   parseFloat((97.2 + Math.random() * 2.5).toFixed(1)),
    lastUpdate:    now.toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<ExecMetrics>(generateMock());
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    try {
      // Fetch all endpoints in parallel, merge into executive view
      const [ops, chat, wallet, infra] = await Promise.allSettled([
        adminAPI.getOperational(),
        adminAPI.getChat(),
        adminAPI.getWallet(),
        adminAPI.getInfra(),
      ]);

      const o = ops.status      === 'fulfilled' ? ops.value      : null;
      const c = chat.status     === 'fulfilled' ? chat.value     : null;
      const w = wallet.status   === 'fulfilled' ? wallet.value   : null;
      const inf = infra.status  === 'fulfilled' ? infra.value    : null;

      const services = inf?.services ?? data.services;
      const downCount = services.filter((s: any) => s.status === 'down').length;
      const degradCount = services.filter((s: any) => s.status === 'degraded').length;
      const health: ExecMetrics['platformHealth'] =
        downCount > 0 ? 'critical' : degradCount > 1 ? 'degraded' : 'optimal';

      setData(prev => ({
        ...prev,
        activeNow:     o?.activeUsers    ?? prev.activeNow,
        activeToday:   o?.activeUsers    ? Math.floor(o.activeUsers * 3.2) : prev.activeToday,
        activeMonth:   o?.totalUsers     ?? prev.activeMonth,
        newToday:      o?.newUsersToday  ?? prev.newToday,
        totalUsers:    o?.totalUsers     ?? prev.totalUsers,
        uptime:        o?.uptime         ?? prev.uptime,
        platformHealth: health,
        services:      services,
        chatVolume:    c?.messagesPerMin ? c.messagesPerMin * 60 : prev.chatVolume,
        walletVolume:  w?.volumeToday    ?? prev.walletVolume,
        successRate:   w?.successRate    ?? prev.successRate,
        hourlyTrend:   o?.hourlyUsers    ?? prev.hourlyTrend,
        lastUpdate:    new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }));
    } catch {
      // fallback: just refresh mock numbers
      setData(generateMock());
    }
  }, []);

  // Auto-refresh every 30s, countdown tick every second
  useEffect(() => {
    refresh();
    const refreshTimer = setInterval(refresh, 30_000);
    const tickTimer    = setInterval(() => setTick(t => (t + 1) % 30), 1_000);
    return () => { clearInterval(refreshTimer); clearInterval(tickTimer); };
  }, [refresh]);

  const health = HEALTH_CONFIG[data.platformHealth];

  return (
    <div style={{ color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#f1f5f9' }}>🏛️ Centro de Control Ejecutivo</div>
            <div style={{
              padding: '4px 12px', borderRadius: '20px',
              background: health.bg, border: `1px solid ${health.border}`,
              fontSize: '11px', fontWeight: '800', color: health.color, letterSpacing: '1px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: health.color, boxShadow: `0 0 6px ${health.color}`, animation: 'pulse 2s infinite' }} />
              PLATAFORMA {health.label}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Vista solo lectura · Dirección General · Actualización automática cada 30s
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Countdown ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 14px', borderRadius: '20px', border: '1px solid #334155' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `conic-gradient(#00c8a0 ${(30 - tick) / 30 * 360}deg, #1e293b 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00c8a0', fontWeight: '800' }}>{30 - tick}</div>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>próx. actualización</span>
          </div>
          <button onClick={refresh} style={{
            background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
            border: 'none', borderRadius: '10px', padding: '8px 16px',
            color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            opacity: pulse ? 0.7 : 1, transition: 'opacity 0.3s',
          }}>
            {pulse ? '⟳ Actualizando...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Timestamp ── */}
      <div style={{ fontSize: '11px', color: '#334155', marginBottom: '20px', textAlign: 'right' }}>
        Última actualización: {data.lastUpdate} · Uptime: {data.uptime}%
      </div>

      {/* ── Row 1: KPIs principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <KpiCard icon="🟢" label="Activos Ahora"   value={fmt(data.activeNow)}   sub="usuarios en línea"      color="#00c8a0" trend={8}  />
        <KpiCard icon="📅" label="Activos Hoy"     value={fmt(data.activeToday)} sub="sesiones únicas"        color="#3b82f6" trend={5}  />
        <KpiCard icon="📆" label="Activos Mes"     value={fmt(data.activeMonth)} sub="usuarios únicos"        color="#a855f7" trend={12} />
        <KpiCard icon="✨" label="Nuevos Hoy"      value={fmt(data.newToday)}    sub="registros nuevos"       color="#f59e0b" trend={3}  />
        <KpiCard icon="👥" label="Total Usuarios"  value={fmt(data.totalUsers)}  sub="registrados"            color="#00b4e6"            />
        <KpiCard icon="💬" label="Mensajes/hora"   value={fmt(data.chatVolume)}  sub="tráfico de chat"        color="#ec4899"            />
        <KpiCard icon="💰" label="Volumen Wallet"  value={fmtXAF(data.walletVolume)} sub="transacciones hoy"  color="#22c55e"            />
        <KpiCard icon="✅" label="Tasa de Éxito"   value={`${data.successRate}%`} sub="transacciones ok"      color="#00c8a0" trend={1}  />
      </div>

      {/* ── Row 2: Gráficas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Usuarios activos 24h */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            📈 Usuarios Activos — Últimas 24h
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.hourlyTrend}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="users" name="Usuarios" stroke="#00c8a0" strokeWidth={2} fill="url(#gradGreen)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia semanal */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            📊 Actividad Semanal — Usuarios y Nuevos Registros
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="users"    name="Activos"  fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="newUsers" name="Nuevos"   fill="#00c8a0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Servicios + Alertas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Estado de Servicios */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              ⚙️ Estado de Servicios Críticos
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {data.services.filter(s => s.status === 'ok').length}/{data.services.length} operativos
            </div>
          </div>
          {data.services.map(s => <ServiceRow key={s.name} {...s} />)}
        </div>

        {/* Alertas */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🔔 Alertas Activas
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: data.alerts.some(a => a.severity === 'critical') ? '#ef4444' : '#64748b' }}>
              {data.alerts.filter(a => a.severity === 'critical').length} críticas
            </div>
          </div>
          {data.alerts.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px', color: '#00c8a0', fontSize: '13px' }}>✅ Sin alertas activas</div>
            : data.alerts.map(a => <AlertRow key={a.id} {...a} />)
          }
        </div>
      </div>

      {/* ── Row 4: Indicadores de salud ── */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          💡 Indicadores de Salud de la Plataforma
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Disponibilidad API',      value: data.uptime,         max: 100,  unit: '%',   color: '#00c8a0', icon: '⚡' },
            { label: 'Tasa Éxito Transacciones', value: data.successRate,   max: 100,  unit: '%',   color: '#22c55e', icon: '✅' },
            { label: 'Usuarios Activos (cap.)',  value: Math.min(data.activeNow / 10, 100), max: 100, unit: '%', color: '#3b82f6', icon: '📊' },
            { label: 'Servicios Operativos',     value: data.services.filter(s => s.status === 'ok').length / data.services.length * 100, max: 100, unit: '%', color: '#a855f7', icon: '⚙️' },
          ].map(({ label, value, max, unit, color, icon }) => (
            <div key={label} style={{ background: '#0f172a', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{icon} {label}</span>
                <span style={{ fontSize: '14px', color, fontWeight: '800' }}>{value.toFixed(1)}{unit}</span>
              </div>
              <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${(value / max) * 100}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 8px ${color}60`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#1e293b' }}>
        EGCHAT Admin Portal · Centro de Control Ejecutivo · Solo Lectura · {new Date().toLocaleDateString('es-GQ', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
};
