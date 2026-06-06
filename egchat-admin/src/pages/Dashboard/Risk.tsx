import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// ── Risk level config ─────────────────────────────────────────────────────────
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
const RISK = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  label: 'CRÍTICO',  icon: '🚨', score: 4 },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', label: 'ALTO',     icon: '⚠️', score: 3 },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'MEDIO',    icon: '🔶', score: 2 },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  label: 'BAJO',     icon: '✅', score: 1 },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface RiskEvent {
  id: string; time: string; category: string;
  title: string; description: string; level: RiskLevel;
  affected: string; status: 'open' | 'monitoring' | 'resolved';
}

interface RiskData {
  globalScore: number; // 0-100
  globalLevel: RiskLevel;
  summary: Record<RiskLevel, number>;
  fraud: {
    alertsToday: number; blockedTx: number; suspiciousAccounts: number;
    failedLoginsHour: number; anomalyScore: number;
    hourlyAlerts: { hour: string; alerts: number }[];
  };
  operational: {
    score: number; level: RiskLevel;
    items: { name: string; level: RiskLevel; detail: string }[];
  };
  financial: {
    score: number; level: RiskLevel;
    exposureXAF: number; failedTxPct: number; chargebackRate: number;
    items: { name: string; level: RiskLevel; detail: string }[];
  };
  technological: {
    score: number; level: RiskLevel;
    items: { name: string; level: RiskLevel; detail: string; latency?: number }[];
  };
  events: RiskEvent[];
  riskTrend: { day: string; critical: number; high: number; medium: number; low: number }[];
  lastUpdate: string;
}

// ── Mock generator ────────────────────────────────────────────────────────────
function generateMock(): RiskData {
  const events: RiskEvent[] = [
    { id:'1', time:'Hace 4 min',  category:'Fraude',      title:'Múltiples intentos de login fallidos',        description:'IP 41.202.x.x — 18 intentos en 5 min desde Camerún', level:'critical', affected:'Auth Service', status:'open' },
    { id:'2', time:'Hace 12 min', category:'Financiero',  title:'Transacción inusual detectada',               description:'Tx de 2.4M XAF fuera del patrón habitual del usuario', level:'high', affected:'Wallet', status:'monitoring' },
    { id:'3', time:'Hace 28 min', category:'Tecnológico', title:'Latencia elevada en WebSocket',               description:'P95 > 280ms, umbral normal 150ms', level:'medium', affected:'WebSocket Relay', status:'monitoring' },
    { id:'4', time:'Hace 1h',     category:'Operativo',   title:'Tasa de error API > 2%',                      description:'Endpoint /api/messages retornando 502 esporádicamente', level:'high', affected:'API Render', status:'monitoring' },
    { id:'5', time:'Hace 2h',     category:'Fraude',      title:'Cuenta con comportamiento anómalo',           description:'Usuario creó 47 chats en 10 min — posible spam', level:'medium', affected:'Chat Service', status:'open' },
    { id:'6', time:'Hace 3h',     category:'Financiero',  title:'Spike de transacciones fallidas',             description:'8% de tx fallidas en ventana de 30 min (normal <2%)', level:'high', affected:'Payment Gateway', status:'resolved' },
    { id:'7', time:'Hace 4h',     category:'Tecnológico', title:'Certificado SSL próximo a expirar',           description:'Certificado egchat.gq expira en 14 días', level:'medium', affected:'CDN / Vercel', status:'open' },
    { id:'8', time:'Hace 6h',     category:'Operativo',   title:'Backup de base de datos no completado',       description:'Job de backup de las 03:00 finalizó con advertencias', level:'low', affected:'Neon DB', status:'resolved' },
  ];

  return {
    globalScore: 62,
    globalLevel: 'high',
    summary: { critical: 1, high: 3, medium: 3, low: 1 },
    fraud: {
      alertsToday: 14, blockedTx: 3, suspiciousAccounts: 2,
      failedLoginsHour: 18, anomalyScore: 72,
      hourlyAlerts: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        alerts: Math.floor(i >= 6 && i <= 22 ? Math.random() * 4 : Math.random() * 1.5),
      })),
    },
    operational: {
      score: 58, level: 'high',
      items: [
        { name: 'API Error Rate',      level: 'high',   detail: '2.1% — umbral: 1%' },
        { name: 'Disponibilidad',      level: 'low',    detail: '99.84% — objetivo: 99.9%' },
        { name: 'Cola de mensajes',    level: 'medium', detail: '340 msgs en cola (normal <100)' },
        { name: 'Workers activos',     level: 'low',    detail: '3/3 operativos' },
        { name: 'Tiempo recuperación', level: 'medium', detail: 'MTTR últimas 24h: 18 min' },
      ],
    },
    financial: {
      score: 71, level: 'high',
      exposureXAF: 4_800_000, failedTxPct: 3.2, chargebackRate: 0.8,
      items: [
        { name: 'Tasa tx fallidas',    level: 'high',   detail: '3.2% — umbral: 2%' },
        { name: 'Chargebacks',         level: 'low',    detail: '0.8% — límite: 1%' },
        { name: 'Exposición máxima',   level: 'medium', detail: '4.8M XAF pendiente liquidación' },
        { name: 'Transacciones grandes', level: 'medium', detail: '3 tx >1M XAF en revisión' },
        { name: 'Saldos bloqueados',   level: 'low',    detail: '120K XAF en disputa' },
      ],
    },
    technological: {
      score: 45, level: 'medium',
      items: [
        { name: 'WebSocket latency',   level: 'medium', detail: 'P95: 280ms',  latency: 280 },
        { name: 'API Render',          level: 'low',    detail: 'P95: 142ms',  latency: 142 },
        { name: 'Neon DB',            level: 'low',    detail: 'P95: 18ms',   latency: 18  },
        { name: 'Vercel CDN',         level: 'low',    detail: 'P95: 22ms',   latency: 22  },
        { name: 'SSL Cert egchat.gq', level: 'medium', detail: 'Expira en 14 días' },
        { name: 'Deps vulnerables',   level: 'medium', detail: '2 paquetes con advisory' },
      ],
    },
    events,
    riskTrend: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      critical: Math.floor(Math.random() * 3),
      high:     Math.floor(Math.random() * 6 + 1),
      medium:   Math.floor(Math.random() * 8 + 2),
      low:      Math.floor(Math.random() * 5 + 1),
    })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: `1px solid ${'#334155'}`, borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const r = RISK[level];
  return (
    <span style={{ fontSize: '10px', fontWeight: '800', color: r.color, background: r.bg, border: `1px solid ${r.border}`, padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
      {r.icon} {r.label}
    </span>
  );
}

function ScoreGauge({ score, level, label }: { score: number; level: RiskLevel; label: string }) {
  const r = RISK[level];
  const data = [{ value: score, fill: r.color }, { value: 100 - score, fill: '#1e293b' }];
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1px solid ${r.border}`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</div>
      <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ResponsiveContainer width={80} height={80}>
          <RadialBarChart innerRadius="65%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: r.color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>/100</div>
        </div>
      </div>
      <RiskBadge level={level} />
    </div>
  );
}

function RiskItem({ name, level, detail, latency }: { name: string; level: RiskLevel; detail: string; latency?: number }) {
  const r = RISK[level];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', background: r.bg, border: `1px solid ${r.border}`, marginBottom: '6px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{name}</div>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
        {latency !== undefined && (
          <span style={{ fontSize: '11px', color: '#64748b' }}>{latency}ms</span>
        )}
        <RiskBadge level={level} />
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  open:       { color: '#ef4444', label: 'ABIERTO'    },
  monitoring: { color: '#f59e0b', label: 'MONITOREANDO' },
  resolved:   { color: '#22c55e', label: 'RESUELTO'   },
};

function EventRow({ event }: { event: RiskEvent }) {
  const r = RISK[event.level];
  const s = STATUS_STYLES[event.status];
  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px', background: r.bg, border: `1px solid ${r.border}`, marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{r.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>{event.title}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{event.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '10px', flexShrink: 0 }}>
          <RiskBadge level={event.level} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: s.color }}>{s.label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
        <span style={{ fontSize: '10px', color: '#64748b' }}>📦 {event.affected}</span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>🏷️ {event.category}</span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>🕐 {event.time}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const RiskDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<RiskData>(generateMock());
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

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
  const globalR = RISK[d.globalLevel];
  const filteredEvents = filter === 'all' ? d.events : d.events.filter(e => e.level === filter);

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px', fontWeight: '900' }}>⚠️ Dashboard de Riesgo</span>
            <div style={{ padding: '4px 14px', borderRadius: '20px', background: globalR.bg, border: `1px solid ${globalR.border}`, fontSize: '12px', fontWeight: '800', color: globalR.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: globalR.color, boxShadow: `0 0 8px ${globalR.color}`, animation: 'pulse 1.5s infinite' }} />
              RIESGO GLOBAL {globalR.label}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>Solo lectura · Actualización automática · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(${globalR.color} ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: globalR.color, fontWeight: '800' }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: '11px', color: theme.textMuted }}>próx. actualización</span>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : `linear-gradient(135deg,${globalR.color},#f97316)`, border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Summary counters + Global score ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr) 2fr', gap: '12px', marginBottom: '20px' }}>
        {(['critical','high','medium','low'] as RiskLevel[]).map(level => {
          const r = RISK[level];
          return (
            <div key={level} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1px solid ${r.border}`, borderRadius: '14px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s', transform: filter === level ? 'scale(0.97)' : 'scale(1)' }}
              onClick={() => setFilter(f => f === level ? 'all' : level)}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>{r.icon}</div>
              <div style={{ fontSize: '30px', fontWeight: '900', color: r.color, lineHeight: 1 }}>{d.summary[level]}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: r.color, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.label}</div>
              {filter === level && <div style={{ marginTop: '6px', fontSize: '10px', color: theme.textMuted }}>filtro activo</div>}
            </div>
          );
        })}
        {/* Global score */}
        <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `2px solid ${globalR.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width={80} height={80}>
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: d.globalScore, fill: globalR.color }, { value: 100 - d.globalScore, fill: '#1e293b' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: globalR.color, lineHeight: 1 }}>{d.globalScore}</div>
              <div style={{ fontSize: '9px', color: theme.textMuted }}>/100</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Puntuación Global de Riesgo</div>
            <RiskBadge level={d.globalLevel} />
            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px' }}>0 = sin riesgo · 100 = riesgo máximo</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {(['critical','high','medium','low'] as RiskLevel[]).map(l => (
                <div key={l} style={{ width: '12px', height: '12px', borderRadius: '3px', background: RISK[l].color, opacity: d.summary[l] > 0 ? 1 : 0.2 }} title={RISK[l].label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Category scores + Fraud ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        <ScoreGauge score={d.fraud.anomalyScore}        level={d.fraud.anomalyScore > 70 ? 'critical' : d.fraud.anomalyScore > 50 ? 'high' : 'medium'} label="Riesgo Fraude" />
        <ScoreGauge score={d.operational.score}         level={d.operational.level}   label="Riesgo Operativo"    />
        <ScoreGauge score={d.financial.score}           level={d.financial.level}     label="Riesgo Financiero"   />
        <ScoreGauge score={d.technological.score}       level={d.technological.level} label="Riesgo Tecnológico"  />
      </div>

      {/* ── Row 3: Fraud + Risk trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Fraud panel */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: '1px solid #ef444430' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🕵️ Alertas de Fraude
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'Alertas Hoy',        value: d.fraud.alertsToday,          color: '#ef4444' },
              { label: 'Tx Bloqueadas',       value: d.fraud.blockedTx,            color: '#f97316' },
              { label: 'Cuentas Sospechosas', value: d.fraud.suspiciousAccounts,   color: '#f59e0b' },
              { label: 'Logins Fallidos/h',   value: d.fraud.failedLoginsHour,     color: '#818cf8' },
            ].map(item => (
              <div key={item.label} style={{ background: theme.bg, borderRadius: '10px', padding: '10px', border: `1px solid ${item.color}20` }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Alertas por Hora — Últimas 24h</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={d.fraud.hourlyAlerts}>
              <defs>
                <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} width={20} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="alerts" name="Alertas" stroke="#ef4444" strokeWidth={2} fill="url(#gradFraud)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk trend */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📈 Tendencia de Riesgo — Últimos 7 días
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.riskTrend} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="critical" name="Crítico" stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
              <Bar dataKey="high"     name="Alto"    stackId="a" fill="#f97316" />
              <Bar dataKey="medium"   name="Medio"   stackId="a" fill="#f59e0b" />
              <Bar dataKey="low"      name="Bajo"    stackId="a" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Category details ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Operational */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>⚙️ Riesgo Operativo</span>
            <RiskBadge level={d.operational.level} />
          </div>
          {d.operational.items.map(item => <RiskItem key={item.name} {...item} />)}
        </div>

        {/* Financial */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>💰 Riesgo Financiero</span>
            <RiskBadge level={d.financial.level} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <div style={{ background: theme.bg, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#f97316' }}>{(d.financial.exposureXAF/1_000_000).toFixed(1)}M XAF</div>
              <div style={{ fontSize: '9px', color: theme.textMuted }}>exposición</div>
            </div>
            <div style={{ background: theme.bg, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', color: d.financial.failedTxPct > 2 ? '#ef4444' : '#22c55e' }}>{d.financial.failedTxPct}%</div>
              <div style={{ fontSize: '9px', color: theme.textMuted }}>tx fallidas</div>
            </div>
          </div>
          {d.financial.items.map(item => <RiskItem key={item.name} {...item} />)}
        </div>

        {/* Technological */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '18px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>🔧 Riesgo Tecnológico</span>
            <RiskBadge level={d.technological.level} />
          </div>
          {d.technological.items.map(item => <RiskItem key={item.name} {...item} />)}
        </div>
      </div>

      {/* ── Row 5: Event log ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📋 Registro de Eventos Críticos
          </div>
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: filter === 'all' ? '#334155' : 'transparent', color: filter === 'all' ? '#f1f5f9' : '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              Todos ({d.events.length})
            </button>
            {(['critical','high','medium','low'] as RiskLevel[]).map(level => (
              <button key={level} onClick={() => setFilter(f => f === level ? 'all' : level)}
                style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${RISK[level].border}`, background: filter === level ? RISK[level].bg : 'transparent', color: RISK[level].color, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {RISK[level].icon} {d.summary[level]}
              </button>
            ))}
          </div>
        </div>
        <div>
          {filteredEvents.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px', color: '#22c55e', fontSize: '13px' }}>✅ Sin eventos para este nivel de riesgo</div>
            : filteredEvents.map(e => <EventRow key={e.id} event={e} />)
          }
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>⚠️ Dashboard de Riesgo · Solo Lectura · Las puntuaciones son calculadas en tiempo real</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['critical','high','medium','low'] as RiskLevel[]).map(l => (
            <span key={l} style={{ fontSize: '11px', color: RISK[l].color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: RISK[l].color, display: 'inline-block' }} />
              {RISK[l].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
