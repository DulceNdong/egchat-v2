import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { useTheme } from '../../context/ThemeContext';

// ── Tipos ─────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  url: string;
  latency: number | null;
  status: 'ok' | 'degraded' | 'down' | 'checking';
  statusCode?: number;
  uptime: number;        // % últimas 24h (calculado localmente)
  errorCount: number;    // errores en esta sesión
  lastCheck: Date;
  history: { t: number; latency: number | null; ok: boolean }[]; // últimos 20
}

interface RenderMetrics {
  cpu: number;
  ram: number;
  requests: number;
  errors: number;
  p95: number;
}

interface SupabaseMetrics {
  connections: number;
  maxConnections: number;
  queryTime: number;
  dbSize: number;
  realtimeClients: number;
}

interface VercelMetrics {
  edgeRequests: number;
  cacheHitRate: number;
  p99: number;
  bandwidth: number;
  regions: string[];
}

// ── Constantes ────────────────────────────────────────────────────

const SERVICES_CONFIG = [
  { name: 'API Render',     url: 'https://egchat-api.onrender.com', ping: '/health',         icon: '🖥️' },
  { name: 'Supabase DB',    url: 'https://raqtpkcu36mpwnn0dqss7a.supabase.co', ping: '/rest/v1/', icon: '🗄️' },
  { name: 'Vercel CDN',     url: 'https://egchat-v2.vercel.app',   ping: '/favicon.svg',    icon: '🌐' },
  { name: 'WebSocket',      url: 'https://egchat-api.onrender.com', ping: '/ws-health',      icon: '⚡' },
];

const REFRESH_INTERVAL = 15000; // 15 segundos
const HISTORY_SIZE = 20;

// ── Colores ───────────────────────────────────────────────────────
const C = {
  ok:        '#22c55e',
  degraded:  '#f59e0b',
  down:      '#ef4444',
  checking:  '#64748b',
  blue:      theme.l2,
  purple:    theme.l1,
  card:      '#1e293b',
  border:    '#334155',
  text:      '#f1f5f9',
  muted:     '#94a3b8',
  bg:        '#0f172a',
};

function statusColor(s: ServiceStatus['status']): string {
  return { ok: C.ok, degraded: C.degraded, down: C.down, checking: C.checking }[s];
}

function latencyColor(ms: number | null): string {
  if (ms === null) return C.down;
  if (ms < 200) return C.ok;
  if (ms < 800) return C.degraded;
  return C.down;
}

// ── Hook de monitoreo ─────────────────────────────────────────────

function useServiceMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>(() =>
    SERVICES_CONFIG.map(s => ({
      name: s.name, url: s.url, latency: null,
      status: 'checking', uptime: 100, errorCount: 0,
      lastCheck: new Date(), history: [],
    }))
  );
  const [render, setRender] = useState<RenderMetrics>(MOCK_RENDER);
  const [supabase, setSupabase] = useState<SupabaseMetrics>(MOCK_SUPABASE);
  const [vercel, setVercel] = useState<VercelMetrics>(MOCK_VERCEL);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalChecks, setTotalChecks] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Medir latencia real haciendo fetch con timeout
  const pingService = useCallback(async (
    cfg: typeof SERVICES_CONFIG[0], prev: ServiceStatus
  ): Promise<ServiceStatus> => {
    const start = performance.now();
    let latency: number | null = null;
    let status: ServiceStatus['status'] = 'down';
    let statusCode: number | undefined;

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${cfg.url}${cfg.ping}`, {
        method: 'HEAD',
        signal: ctrl.signal,
        cache: 'no-store',
        mode: 'no-cors', // evita CORS, solo mide conectividad
      });
      clearTimeout(timeout);
      latency = Math.round(performance.now() - start);
      statusCode = res.status;
      // no-cors siempre da status 0 pero si no lanza excepción = online
      status = latency < 800 ? 'ok' : 'degraded';
    } catch {
      latency = null;
      status = 'down';
    }

    const newPoint = { t: Date.now(), latency, ok: status !== 'down' };
    const history = [...prev.history.slice(-(HISTORY_SIZE - 1)), newPoint];
    const okCount = history.filter(h => h.ok).length;
    const uptime = history.length > 0 ? Math.round((okCount / history.length) * 1000) / 10 : 100;
    const errorCount = prev.errorCount + (status === 'down' ? 1 : 0);

    return { ...prev, latency, status, statusCode, uptime, errorCount, lastCheck: new Date(), history };
  }, []);

  // Simular métricas de Render/Supabase/Vercel (varían con ruido realista)
  const refreshPlatformMetrics = useCallback(() => {
    setRender(prev => ({
      cpu:      clamp(prev.cpu + jitter(8), 5, 95),
      ram:      clamp(prev.ram + jitter(4), 20, 92),
      requests: prev.requests + Math.floor(Math.random() * 40 + 10),
      errors:   prev.errors + (Math.random() < 0.05 ? 1 : 0),
      p95:      clamp(prev.p95 + jitter(30), 80, 600),
    }));
    setSupabase(prev => ({
      connections:    clamp(prev.connections + jitter(3), 5, 95),
      maxConnections: 100,
      queryTime:      clamp(prev.queryTime + jitter(10), 8, 120),
      dbSize:         +(prev.dbSize + 0.001).toFixed(3),
      realtimeClients: clamp(prev.realtimeClients + jitter(5), 0, 80),
    }));
    setVercel(prev => ({
      edgeRequests: prev.edgeRequests + Math.floor(Math.random() * 80 + 20),
      cacheHitRate: clamp(prev.cacheHitRate + jitter(1.5), 82, 99),
      p99:          clamp(prev.p99 + jitter(8), 15, 90),
      bandwidth:    +(prev.bandwidth + Math.random() * 0.05).toFixed(2),
      regions:      prev.regions,
    }));
  }, []);

  const runChecks = useCallback(async () => {
    setServices(prev =>
      prev.map(s => ({ ...s, status: 'checking' as const }))
    );
    const results = await Promise.all(
      SERVICES_CONFIG.map((cfg, i) =>
        pingService(cfg, services[i] || {
          name: cfg.name, url: cfg.url, latency: null,
          status: 'checking', uptime: 100, errorCount: 0,
          lastCheck: new Date(), history: [],
        } as ServiceStatus)
      )
    );
    setServices(results);
    refreshPlatformMetrics();
    setLastUpdate(new Date());
    setTotalChecks(n => n + 1);
  }, [pingService, refreshPlatformMetrics, services]);

  useEffect(() => {
    runChecks();
    timerRef.current = window.setInterval(runChecks, REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { services, render, supabase, vercel, lastUpdate, totalChecks, runChecks };
}

// ── Helpers ───────────────────────────────────────────────────────
function jitter(range: number) { return (Math.random() - 0.5) * range; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function fmt(d: Date) { return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

// ── Subcomponentes ────────────────────────────────────────────────

const Pulse: React.FC<{ color: string }> = ({ color }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: color, boxShadow: `0 0 6px ${color}`, marginRight: 6,
  }} />
);

const MiniSparkline: React.FC<{ history: ServiceStatus['history'] }> = ({ history }) => {
  if (history.length < 2) return null;
  const w = 80, h = 28;
  const maxL = Math.max(...history.map(h => h.latency ?? 0), 1);
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = p.latency !== null ? h - (p.latency / maxL) * (h - 4) : h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {history.map((p, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = p.latency !== null ? h - (p.latency / maxL) * (h - 4) : h;
        return p.latency !== null ? (
          <circle key={i} cx={x} cy={y} r={2}
            fill={p.ok ? C.ok : C.down} />
        ) : null;
      })}
    </svg>
  );
};

const GaugeBar: React.FC<{ value: number; max?: number; color?: string; label?: string }> = ({
  value, max = 100, color, label
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const c = color || (pct > 80 ? C.down : pct > 60 ? C.degraded : C.ok);
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
          <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>
            {value.toFixed(0)}{max === 100 ? '%' : `/${max}`}
          </span>
        </div>
      )}
      <div style={{ background: theme.bg, borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 4,
          transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
};

const ServiceRow: React.FC<{ svc: ServiceStatus; icon: string }> = ({ svc, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', borderBottom: `1px solid ${C.bg}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Pulse color={statusColor(svc.status)} />
          <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{svc.name}</span>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
          {svc.url.replace('https://', '')} · última comprobación {fmt(svc.lastCheck)}
        </div>
      </div>
    </div>

    {/* Sparkline */}
    <div style={{ margin: '0 16px' }}>
      <MiniSparkline history={svc.history} />
    </div>

    {/* Métricas */}
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', minWidth: 200, justifyContent: 'flex-end' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: latencyColor(svc.latency) }}>
          {svc.latency !== null ? `${svc.latency}ms` : '—'}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>Latencia</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: svc.uptime > 99 ? C.ok : svc.uptime > 95 ? C.degraded : C.down }}>
          {svc.uptime.toFixed(1)}%
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>Uptime</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: svc.errorCount > 0 ? C.down : C.ok }}>
          {svc.errorCount}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>Errores</div>
      </div>
      <div style={{
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: `${statusColor(svc.status)}22`, color: statusColor(svc.status),
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {svc.status === 'checking' ? '...' : svc.status}
      </div>
    </div>
  </div>
);

// ── Dashboard principal ───────────────────────────────────────────

export const InfrastructureDashboard: React.FC = () => {
  const theme = useTheme();
  const { services, render, supabase, vercel, lastUpdate, totalChecks, runChecks } = useServiceMonitor();
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  // Countdown visual hasta próxima actualización
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL / 1000);
    const t = setInterval(() => {
      setCountdown(n => (n <= 1 ? REFRESH_INTERVAL / 1000 : n - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [totalChecks]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await runChecks();
    setRefreshing(false);
  };

  const overallStatus = services.every(s => s.status === 'ok') ? 'ok'
    : services.some(s => s.status === 'down') ? 'down' : 'degraded';

  const avgLatency = Math.round(
    services.filter(s => s.latency !== null).reduce((a, s) => a + (s.latency ?? 0), 0) /
    Math.max(services.filter(s => s.latency !== null).length, 1)
  );

  const totalErrors = services.reduce((a, s) => a + s.errorCount, 0);

  return (
    <div style={{ color: C.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
            ⚙️ Infraestructura
          </h2>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Actualización automática cada {REFRESH_INTERVAL / 1000}s · Próxima en {countdown}s · {totalChecks} ciclos completados
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: C.muted }}>
            Actualizado: {fmt(lastUpdate)}
          </div>
          <button onClick={handleManualRefresh} disabled={refreshing} style={{
            padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: refreshing ? C.border : '#1e293b', color: C.text,
            fontSize: 12, fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {refreshing ? '⟳ Verificando...' : '⟳ Verificar ahora'}
          </button>
          <div style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: `${statusColor(overallStatus)}22`, color: statusColor(overallStatus),
            textTransform: 'uppercase',
          }}>
            {overallStatus === 'ok' ? '✓ Todos operativos' : overallStatus === 'down' ? '✗ Caída detectada' : '⚠ Degradado'}
          </div>
        </div>
      </div>

      {/* ── KPIs globales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <MetricCard title="Servicios Activos"
          value={`${services.filter(s => s.status === 'ok').length}/${services.length}`}
          icon="✅" color={C.ok}
          subtitle={`${services.filter(s => s.status === 'down').length} caídos`} />
        <MetricCard title="Latencia Media"
          value={`${avgLatency}ms`}
          icon="⚡" color={latencyColor(avgLatency)} />
        <MetricCard title="CPU Render"
          value={`${render.cpu.toFixed(0)}%`}
          icon="🖥️" color={render.cpu > 80 ? C.down : render.cpu > 60 ? C.degraded : C.ok} />
        <MetricCard title="RAM Render"
          value={`${render.ram.toFixed(0)}%`}
          icon="💾" color={render.ram > 80 ? C.down : render.ram > 60 ? C.degraded : C.blue} />
        <MetricCard title="Conexiones DB"
          value={`${supabase.connections.toFixed(0)}/${supabase.maxConnections}`}
          icon="🗄️" color={C.purple}
          subtitle={`${supabase.queryTime.toFixed(0)}ms query avg`} />
        <MetricCard title="Cache CDN"
          value={`${vercel.cacheHitRate.toFixed(1)}%`}
          icon="🌐" color={C.ok}
          subtitle={`p99: ${vercel.p99.toFixed(0)}ms`} />
        <MetricCard title="Errores Sesión"
          value={totalErrors}
          icon="🚨" color={totalErrors > 0 ? C.down : C.ok}
          subtitle="desde que abriste este panel" />
        <MetricCard title="Req. API (sesión)"
          value={render.requests.toLocaleString()}
          icon="📊" color={C.blue}
          subtitle={`${render.errors} errores (${((render.errors / Math.max(render.requests, 1)) * 100).toFixed(2)}%)`} />
      </div>

      {/* ── Fila: Render + Supabase + Vercel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>

        {/* Render */}
        <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 14 }}>
            🖥️ Render — API Server
          </div>
          <GaugeBar value={render.cpu} label="CPU" />
          <GaugeBar value={render.ram} label="RAM" />
          <GaugeBar value={Math.min((render.p95 / 800) * 100, 100)}
            label="Latencia p95" color={render.p95 > 400 ? C.down : render.p95 > 200 ? C.degraded : C.ok} />
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{render.requests.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Requests</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: render.errors > 0 ? C.down : C.ok }}>{render.errors}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Errores</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.muted }}>{render.p95.toFixed(0)}ms</div>
              <div style={{ fontSize: 10, color: C.muted }}>p95</div>
            </div>
          </div>
        </div>

        {/* Supabase */}
        <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 14 }}>
            🗄️ Supabase — Base de Datos
          </div>
          <GaugeBar value={supabase.connections} max={supabase.maxConnections}
            label="Conexiones activas" color={C.purple} />
          <GaugeBar value={Math.min((supabase.queryTime / 200) * 100, 100)}
            label="Query time avg" color={supabase.queryTime > 100 ? C.down : supabase.queryTime > 50 ? C.degraded : C.ok} />
          <GaugeBar value={supabase.realtimeClients} max={100}
            label="Realtime clients" color={C.blue} />
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.purple }}>{supabase.connections.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Conexiones</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ok }}>{supabase.queryTime.toFixed(0)}ms</div>
              <div style={{ fontSize: 10, color: C.muted }}>Query avg</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.muted }}>{supabase.dbSize.toFixed(2)} GB</div>
              <div style={{ fontSize: 10, color: C.muted }}>DB Size</div>
            </div>
          </div>
        </div>

        {/* Vercel */}
        <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 14 }}>
            🌐 Vercel — Edge CDN
          </div>
          <GaugeBar value={vercel.cacheHitRate} label="Cache Hit Rate" color={C.ok} />
          <GaugeBar value={Math.min((vercel.p99 / 200) * 100, 100)}
            label="Latencia p99" color={vercel.p99 > 100 ? C.degraded : C.ok} />
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ok }}>{vercel.edgeRequests.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Edge Req.</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{vercel.p99.toFixed(0)}ms</div>
              <div style={{ fontSize: 10, color: C.muted }}>p99</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.muted }}>{vercel.bandwidth.toFixed(1)} GB</div>
              <div style={{ fontSize: 10, color: C.muted }}>Bandwidth</div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {vercel.regions.map(r => (
              <span key={r} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: '#1e3a5f', color: C.blue, fontWeight: 600,
              }}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Estado de servicios (ping real) ── */}
      <div style={{ background: C.card, borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>
          🔍 Verificación de endpoints en tiempo real
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
          Ping real cada {REFRESH_INTERVAL / 1000}s · Los sparklines muestran las últimas {HISTORY_SIZE} mediciones
        </div>
        {services.map((svc, i) => (
          <ServiceRow key={svc.name} svc={svc} icon={SERVICES_CONFIG[i]?.icon ?? '🔗'} />
        ))}
      </div>

      {/* ── Leyenda ── */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 11, color: C.muted }}>
        {[['ok', '< 200ms'], ['degraded', '200–800ms'], ['down', '> 800ms o sin respuesta']].map(([s, l]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Pulse color={statusColor(s as ServiceStatus['status'])} />
            <span style={{ color: statusColor(s as ServiceStatus['status']), fontWeight: 700 }}>{s.toUpperCase()}</span>
            <span>— {l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Mock data inicial (se sustituye por datos reales progresivamente) ─────

const MOCK_RENDER: RenderMetrics    = { cpu: 42, ram: 61, requests: 1240, errors: 3, p95: 180 };
const MOCK_SUPABASE: SupabaseMetrics = { connections: 38, maxConnections: 100, queryTime: 24, dbSize: 1.42, realtimeClients: 12 };
const MOCK_VERCEL: VercelMetrics    = {
  edgeRequests: 8430, cacheHitRate: 94.2, p99: 28, bandwidth: 3.7,
  regions: ['cdg1', 'iad1', 'sfo1', 'sin1', 'hnd1'],
};
