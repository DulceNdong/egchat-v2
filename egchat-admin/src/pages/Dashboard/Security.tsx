import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { adminAPI } from '../../api/adminClient';

// ── Types ─────────────────────────────────────────────────────────────────────
type ThreatLevel  = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ThreatType   = 'brute_force' | 'token_invalid' | 'rate_limit' | 'suspicious_tx' | 'sqli_attempt' | 'xss_attempt' | 'anomaly' | 'geo_block';
type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';

interface ThreatEvent {
  id: string; ts: string; type: ThreatType; level: ThreatLevel;
  ip: string; country: string; flag: string;
  target: string; detail: string; blocked: boolean;
}

interface Incident {
  id: string; title: string; level: ThreatLevel; status: IncidentStatus;
  started: string; duration: string; affectedUsers: number;
  summary: string; timeline: { ts: string; action: string }[];
}

interface SecData {
  // Real-time counters
  attacksToday: number; bruteForceHour: number; blockedIPs: number;
  invalidTokensHour: number; suspiciousEvents: number; activeThreats: number;
  // Threat summary
  threatsByLevel: Record<ThreatLevel, number>;
  threatsByType: { type: string; count: number; color: string; icon: string }[];
  // Charts
  hourlyAttacks: { hour: string; brute: number; tokens: number; anomaly: number; sqli: number }[];
  dailyAttacks:  { day: string; total: number; blocked: number; critical: number }[];
  // Geo
  topAttackGeo: { country: string; flag: string; count: number; blocked: number }[];
  // Events
  events: ThreatEvent[];
  // Incidents
  incidents: Incident[];
  // Blocked IPs list
  blockedIPList: { ip: string; country: string; flag: string; reason: string; since: string; expires: string }[];
  lastUpdate: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const THREAT: Record<ThreatLevel, { color: string; bg: string; border: string; label: string; icon: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   label: 'CRÍTICO', icon: '🚨' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.3)',  label: 'ALTO',    icon: '⚠️' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  label: 'MEDIO',   icon: '🔶' },
  low:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', label: 'BAJO',    icon: '🔵' },
  info:     { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)', label: 'INFO',   icon: 'ℹ️' },
};

const THREAT_TYPE_CFG: Record<ThreatType, { label: string; icon: string; color: string }> = {
  brute_force:   { label: 'Fuerza Bruta',       icon: '🔨', color: '#ef4444' },
  token_invalid: { label: 'Token Inválido',      icon: '🔑', color: '#f97316' },
  rate_limit:    { label: 'Rate Limit',          icon: '⚡', color: '#f59e0b' },
  suspicious_tx: { label: 'Tx Sospechosa',       icon: '💰', color: '#a855f7' },
  sqli_attempt:  { label: 'SQLi Intento',        icon: '💉', color: '#ef4444' },
  xss_attempt:   { label: 'XSS Intento',         icon: '🕷️', color: '#f97316' },
  anomaly:       { label: 'Comportam. Anómalo',  icon: '👻', color: '#3b82f6' },
  geo_block:     { label: 'Bloqueo Geográfico',  icon: '🌍', color: '#64748b' },
};

const INCIDENT_STATUS: Record<IncidentStatus, { color: string; label: string }> = {
  open:          { color: '#ef4444', label: 'Abierto'       },
  investigating: { color: '#f59e0b', label: 'Investigando'  },
  contained:     { color: '#3b82f6', label: 'Contenido'     },
  resolved:      { color: '#00c8a0', label: 'Resuelto'      },
};

// ── Mock ──────────────────────────────────────────────────────────────────────
const IPs = ['41.202.43.18','197.255.8.201','185.220.101.45','103.27.62.88','45.142.212.100','31.13.64.7'];
const COUNTRIES = [['🇨🇲','Camerún'],['🇷🇺','Rusia'],['🇨🇳','China'],['🇧🇷','Brasil'],['🇳🇱','Países Bajos'],['🇺🇸','EEUU']];
const TARGETS = ['/api/auth/login','/api/wallet/deposit','/api/messages','/api/admin/auth/login','/api/users'];
const TYPES: ThreatType[] = ['brute_force','token_invalid','rate_limit','suspicious_tx','sqli_attempt','xss_attempt','anomaly','geo_block'];

function generateMock(): SecData {
  const events: ThreatEvent[] = Array.from({ length: 50 }, (_, i) => {
    const [flag, country] = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const levels: ThreatLevel[] = ['critical','critical','high','high','medium','medium','low','info'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const cfg = THREAT_TYPE_CFG[type];
    const minAgo = i * 3 + Math.floor(Math.random() * 3);
    return {
      id: `EVT-${1000+i}`, ts: minAgo < 60 ? `${minAgo}m` : `${Math.floor(minAgo/60)}h`, type, level,
      ip: IPs[Math.floor(Math.random() * IPs.length)], country, flag,
      target: TARGETS[Math.floor(Math.random() * TARGETS.length)],
      detail: `${cfg.label} desde ${country} — ${Math.floor(1+Math.random()*50)} intentos`,
      blocked: Math.random() > 0.3,
    };
  });

  return {
    attacksToday: 284, bruteForceHour: 18, blockedIPs: 47,
    invalidTokensHour: 34, suspiciousEvents: 12, activeThreats: 5,
    threatsByLevel: { critical: 3, high: 8, medium: 22, low: 41, info: 87 },
    threatsByType: [
      { type: 'Fuerza Bruta',      count: 94,  color: '#ef4444', icon: '🔨' },
      { type: 'Token Inválido',    count: 72,  color: '#f97316', icon: '🔑' },
      { type: 'Rate Limit',        count: 58,  color: '#f59e0b', icon: '⚡' },
      { type: 'Comportam. Anómalo',count: 31,  color: '#3b82f6', icon: '👻' },
      { type: 'Tx Sospechosa',     count: 18,  color: '#a855f7', icon: '💰' },
      { type: 'SQLi / XSS',        count:  7,  color: '#ef4444', icon: '💉' },
      { type: 'Geo Bloqueado',     count:  4,  color: '#64748b', icon: '🌍' },
    ],
    hourlyAttacks: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      brute:   Math.floor(Math.random() * 8),
      tokens:  Math.floor(Math.random() * 6),
      anomaly: Math.floor(Math.random() * 4),
      sqli:    Math.floor(Math.random() * 2),
    })),
    dailyAttacks: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      total:    Math.floor(150 + Math.random() * 200),
      blocked:  Math.floor(120 + Math.random() * 150),
      critical: Math.floor(Math.random() * 6),
    })),
    topAttackGeo: [
      { country: 'Camerún',      flag: '🇨🇲', count: 84,  blocked: 79  },
      { country: 'Rusia',        flag: '🇷🇺', count: 62,  blocked: 62  },
      { country: 'China',        flag: '🇨🇳', count: 48,  blocked: 48  },
      { country: 'Brasil',       flag: '🇧🇷', count: 34,  blocked: 28  },
      { country: 'Países Bajos', flag: '🇳🇱', count: 22,  blocked: 18  },
    ],
    events,
    incidents: [
      {
        id:'INC-001', title:'Campaña de fuerza bruta contra /api/auth/login',
        level:'critical', status:'investigating', started:'Hace 28 min', duration:'28 min', affectedUsers: 0,
        summary:'18 IPs distintas realizando 580 intentos en 30 min. Posible botnet coordinada.',
        timeline:[
          { ts:'10:14', action:'Detección: umbral de 10 intentos/IP superado' },
          { ts:'10:16', action:'Bloqueo automático: 6 IPs bloqueadas por WAF' },
          { ts:'10:22', action:'Escalado a nivel HIGH: patrón de botnet detectado' },
          { ts:'10:28', action:'Investigación en curso: análisis de fingerprints' },
        ],
      },
      {
        id:'INC-002', title:'Tokens JWT con firmas inválidas detectados',
        level:'high', status:'contained', started:'Hace 2h', duration:'45 min', affectedUsers: 3,
        summary:'34 tokens con firma alterada rechazados. 3 cuentas en revisión por posible compromiso.',
        timeline:[
          { ts:'08:30', action:'Tokens inválidos detectados — intentos de falsificación JWT' },
          { ts:'08:35', action:'Cuentas afectadas forzadas a re-autenticación' },
          { ts:'08:52', action:'Análisis: tokens generados externamente, sin acceso real' },
          { ts:'09:15', action:'Incidente contenido — monitoreo activo' },
        ],
      },
      {
        id:'INC-003', title:'Transacciones sospechosas desde cuenta nueva',
        level:'medium', status:'resolved', started:'Hace 6h', duration:'18 min', affectedUsers: 1,
        summary:'Cuenta creada hace 3h realizó 8 tx por 4.2M XAF. Patrón de mule account.',
        timeline:[
          { ts:'04:10', action:'Alerta: volumen inusual para cuenta nueva' },
          { ts:'04:12', action:'Cuenta suspendida preventivamente' },
          { ts:'04:18', action:'Revisión manual: patrón mule confirmado' },
          { ts:'04:28', action:'Cuenta bloqueada definitivamente — caso cerrado' },
        ],
      },
    ],
    blockedIPList: IPs.slice(0,5).map((ip, i) => ({
      ip, country: COUNTRIES[i][1], flag: COUNTRIES[i][0],
      reason: ['Fuerza bruta','SQLi detectado','Rate limit x10','Fuerza bruta','Geo bloqueado'][i],
      since: `Hace ${[2,8,1,24,0.5][i]}h`,
      expires: ['Permanente','24h','1h','Permanente','12h'][i],
    })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export const SecurityDashboard: React.FC = () => {
  const [data, setData]       = useState<SecData>(generateMock());
  const [tick, setTick]       = useState(0);
  const [pulse, setPulse]     = useState(false);
  const [levelFilter, setLevel] = useState<ThreatLevel | 'all'>('all');
  const [expandedInc, setExpanded] = useState<string | null>('INC-001');
  const [page, setPage]       = useState(0);
  const PAGE = 12;

  const refresh = useCallback(async () => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    try {
      const api = await adminAPI.getSecurity();
      const mock = generateMock();
      mock.bruteForceHour  = api.failedLoginsHour ?? mock.bruteForceHour;
      mock.blockedIPs      = api.blockedIps       ?? mock.blockedIPs;
      mock.lastUpdate      = new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      setData(mock);
    } catch { setData(generateMock()); }
  }, []);

  useEffect(() => {
    refresh();
    const rt = setInterval(refresh, 20_000);
    const tt = setInterval(() => setTick(t => (t+1) % 20), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const hasCritical = d.activeThreats > 0;
  const filtered = levelFilter === 'all' ? d.events : d.events.filter(e => e.level === levelFilter);
  const paged = filtered.slice(page * PAGE, (page+1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  return (
    <div style={{ color: '#f1f5f9' }}>

      {/* ── SOC Banner ── */}
      {hasCritical && (
        <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(249,115,22,0.08))', border: '1.5px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🚨</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#ef4444' }}>ALERTA CRÍTICA ACTIVA — {d.activeThreats} amenazas en tiempo real</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Campaña de fuerza bruta en curso · {d.bruteForceHour} intentos en la última hora</div>
          </div>
          <div style={{ marginLeft: 'auto', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>🛡️ Centro de Operaciones de Seguridad</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>FASE C — SOC · Auto-refresh 20s · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(${hasCritical ? '#ef4444' : '#00c8a0'} ${(20-tick)/20*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: hasCritical ? '#ef4444' : '#00c8a0', fontWeight: '800' }}>{20-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : hasCritical ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {[
          { icon:'🎯', label:'Ataques Hoy',        value:d.attacksToday,         color:'#ef4444', alert:true },
          { icon:'🔨', label:'Fuerza Bruta/hora',   value:d.bruteForceHour,       color:'#f97316', alert:d.bruteForceHour>10 },
          { icon:'🚫', label:'IPs Bloqueadas',      value:d.blockedIPs,           color:'#a855f7' },
          { icon:'🔑', label:'Tokens Inválidos/h',  value:d.invalidTokensHour,    color:'#f59e0b', alert:d.invalidTokensHour>20 },
          { icon:'👻', label:'Eventos Sospechosos', value:d.suspiciousEvents,     color:'#3b82f6' },
          { icon:'🔴', label:'Amenazas Activas',    value:d.activeThreats,        color:'#ef4444', alert:d.activeThreats>0 },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${item.alert ? item.color : item.color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {item.alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />}
            <div style={{ position: 'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', borderRadius:'50%', background:`radial-gradient(circle,${item.color}20 0%,transparent 70%)` }} />
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize:'22px', fontWeight:'900', color: item.alert ? item.color : '#f1f5f9' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Threat level summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '18px' }}>
        {(['critical','high','medium','low','info'] as ThreatLevel[]).map(level => {
          const cfg = THREAT[level];
          return (
            <div key={level} onClick={() => setLevel(l => l === level ? 'all' : level)}
              style={{ background: levelFilter === level ? cfg.bg : 'linear-gradient(135deg,#1e293b,#0f172a)', border: `${levelFilter === level ? 2 : 1}px solid ${cfg.border}`, borderRadius: '12px', padding: '14px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{cfg.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: cfg.color, lineHeight: 1 }}>{d.threatsByLevel[level]}</div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: cfg.color, marginTop: '4px', textTransform: 'uppercase' }}>{cfg.label}</div>
              {levelFilter === level && <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>filtro activo</div>}
            </div>
          );
        })}
      </div>

      {/* ── Row 3: Attack charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📊 Ataques por Tipo — Últimas 24h
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.hourlyAttacks}>
              <defs>
                {[['brute','#ef4444'],['tokens','#f97316'],['anomaly','#3b82f6'],['sqli','#a855f7']].map(([k,c]) => (
                  <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="brute"   name="F.Bruta"  stroke="#ef4444" strokeWidth={2} fill="url(#gbrute)"   dot={false} />
              <Area type="monotone" dataKey="tokens"  name="Tokens"   stroke="#f97316" strokeWidth={2} fill="url(#gtokens)"  dot={false} />
              <Area type="monotone" dataKey="anomaly" name="Anomalía" stroke="#3b82f6" strokeWidth={1.5} fill="url(#ganomaly)" dot={false} />
              <Area type="monotone" dataKey="sqli"    name="SQLi/XSS" stroke="#a855f7" strokeWidth={1.5} fill="url(#gsqli)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🌍 Top Orígenes de Ataques
          </div>
          {d.topAttackGeo.map(geo => {
            const maxCount = d.topAttackGeo[0].count;
            return (
              <div key={geo.country} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#e2e8f0' }}>{geo.flag} {geo.country}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>{geo.count} ataques</span>
                    <span style={{ fontSize: '11px', color: '#00c8a0' }}>{geo.blocked} bloq.</span>
                  </div>
                </div>
                <div style={{ height: '5px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${geo.blocked/maxCount*100}%`, background: '#00c8a0', transition: 'width 0.5s' }} />
                    <div style={{ width: `${(geo.count-geo.blocked)/maxCount*100}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '10px' }}>
            <span style={{ color: '#00c8a0' }}>■ Bloqueado</span>
            <span style={{ color: '#ef4444' }}>■ Pasó filtros</span>
          </div>
        </div>
      </div>

      {/* ── Row 4: Type breakdown + Weekly + Blocked IPs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Type breakdown */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🏷️ Clasificación de Amenazas
          </div>
          {d.threatsByType.map(t => {
            const total = d.threatsByType.reduce((s,x) => s+x.count, 0);
            return (
              <div key={t.type} style={{ marginBottom: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.icon} {t.type}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: t.color }}>{t.count}</span>
                </div>
                <div style={{ height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.count/total*100}%`, background: t.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly trend */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            📅 Tendencia Semanal
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.dailyAttacks} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="total"    name="Total"     fill="#334155" radius={[2,2,0,0]} />
              <Bar dataKey="blocked"  name="Bloqueado" fill="#00c8a0" radius={[2,2,0,0]} />
              <Bar dataKey="critical" name="Críticos"  fill="#ef4444" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blocked IPs */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #ef444420' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            🚫 IPs Bloqueadas ({d.blockedIPs})
          </div>
          {d.blockedIPList.map(ip => (
            <div key={ip.ip} style={{ padding: '8px 10px', background: '#0f172a', borderRadius: '8px', marginBottom: '6px', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ef4444', fontWeight: '700' }}>{ip.ip}</span>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>{ip.expires}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{ip.flag} {ip.country} · {ip.reason} · {ip.since}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: Incidents ── */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
          📋 Gestión de Incidentes — Respuesta
        </div>
        {d.incidents.map(inc => {
          const t = THREAT[inc.level];
          const s = INCIDENT_STATUS[inc.status];
          const expanded = expandedInc === inc.id;
          return (
            <div key={inc.id} style={{ marginBottom: '10px', borderRadius: '12px', background: t.bg, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
              <div onClick={() => setExpanded(expanded ? null : inc.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>{inc.title}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {inc.id} · {inc.started} · duración: {inc.duration}
                      {inc.affectedUsers > 0 && ` · ${inc.affectedUsers} usuarios afectados`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: t.color, background: `${t.color}15`, padding: '2px 8px', borderRadius: '6px' }}>{t.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: `${s.color}15`, padding: '2px 8px', borderRadius: '6px' }}>{s.label}</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded && (
                <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0 12px', lineHeight: 1.6 }}>{inc.summary}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Timeline de Respuesta</div>
                  {inc.timeline.map((tl, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '10px', color: t.color, fontFamily: 'monospace', flexShrink: 0, fontWeight: '700' }}>{tl.ts}</span>
                      <div style={{ width: '1px', background: `${t.color}30`, alignSelf: 'stretch', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{tl.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Row 6: Event log ── */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📡 Registro de Eventos ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => { setLevel('all'); setPage(0); }} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #334155', background: levelFilter === 'all' ? '#334155' : 'transparent', color: '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Todos</button>
            {(['critical','high','medium','low'] as ThreatLevel[]).map(l => (
              <button key={l} onClick={() => { setLevel(l); setPage(0); }}
                style={{ padding: '4px 9px', borderRadius: '8px', border: `1px solid ${THREAT[l].border}`, background: levelFilter === l ? THREAT[l].bg : 'transparent', color: THREAT[l].color, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {THREAT[l].icon}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Hace','Tipo','Nivel','IP Origen','País','Objetivo','Detalle','Acción'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748b', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(evt => {
                const t = THREAT[evt.level];
                const tc = THREAT_TYPE_CFG[evt.type];
                return (
                  <tr key={evt.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '7px 10px', color: '#475569', whiteSpace: 'nowrap', fontSize: '11px' }}>{evt.ts}</td>
                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', marginRight: '4px' }}>{tc.icon}</span>
                      <span style={{ fontSize: '11px', color: tc.color, fontWeight: '600' }}>{tc.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: t.color, background: t.bg, padding: '2px 7px', borderRadius: '6px' }}>{t.icon} {t.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: '#ef4444', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{evt.ip}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{evt.flag} {evt.country}</td>
                    <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{evt.target}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>{evt.detail}</td>
                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: evt.blocked ? '#00c8a0' : '#f59e0b', background: evt.blocked ? 'rgba(0,200,160,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: '6px' }}>
                        {evt.blocked ? '🚫 BLOQUEADO' : '⚠️ PASÓ'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>{Math.min(page*PAGE+1,filtered.length)}–{Math.min((page+1)*PAGE,filtered.length)} de {filtered.length} eventos</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{l:'«',a:()=>setPage(0),d:page===0},{l:'‹',a:()=>setPage(p=>p-1),d:page===0},{l:'›',a:()=>setPage(p=>p+1),d:page>=totalPages-1},{l:'»',a:()=>setPage(totalPages-1),d:page>=totalPages-1}].map(btn => (
              <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding:'5px 10px', borderRadius:'7px', background:'#0f172a', border:'1px solid #334155', color:btn.d?'#334155':'#94a3b8', fontSize:'11px', cursor:btn.d?'default':'pointer' }}>{btn.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', padding: '10px 16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#475569' }}>🛡️ SOC · FASE C — Tecnología · Click en incidente para ver timeline · Auto-refresh 20s</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['critical','high','medium','low'] as ThreatLevel[]).map(l => (
            <span key={l} style={{ fontSize: '11px', color: THREAT[l].color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: THREAT[l].color, display: 'inline-block' }} />{THREAT[l].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
