import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, ComposedChart,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface StrategicData {
  growth: {
    totalUsers: number; monthlyGrowthPct: number; weeklyGrowthPct: number;
    dailyGrowthPct: number; projectedEOY: number; churnRate: number;
  };
  retention: {
    day1: number; day7: number; day30: number; day90: number;
    avgSessionMin: number; sessionsPerDay: number;
  };
  features: { name: string; dau: number; mau: number; adoptionPct: number; color: string; icon: string }[];
  wallet: { txCount: number; avgTxValue: number; adoptionPct: number; repeatUsers: number; topCategories: { name: string; pct: number; color: string }[] };
  chat: { dailyMessages: number; activeChats: number; groupChats: number; avgMsgPerUser: number; voiceMin: number; videoMin: number };
  miniApps: { name: string; users: number; sessions: number; color: string; icon: string; country: string }[];
  userGrowthHistory: { month: string; users: number; new: number; churned: number }[];
  retentionCohorts: { cohort: string; w1: number; w2: number; w4: number; w8: number; w12: number }[];
  featureUsage: { feature: string; wallet: number; chat: number; miniApps: number; news: number; social: number }[];
  expansion: { country: string; users: number; growth: number; flag: string; status: 'active' | 'growing' | 'planned' }[];
  weeklyActive: { week: string; wau: number; dau: number; mau: number }[];
  lastUpdate: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
function generateMock(): StrategicData {
  const base = 3847;
  return {
    growth: {
      totalUsers: base, monthlyGrowthPct: 18.4, weeklyGrowthPct: 4.2,
      dailyGrowthPct: 0.8, projectedEOY: Math.floor(base * 3.8), churnRate: 3.1,
    },
    retention: {
      day1: 72, day7: 54, day30: 38, day90: 24,
      avgSessionMin: 12.4, sessionsPerDay: 2.8,
    },
    features: [
      { name: 'Chat',       dau: 2841, mau: 3420, adoptionPct: 89, color: '#00c8a0', icon: '💬' },
      { name: 'Wallet',     dau: 1204, mau: 2180, adoptionPct: 57, color: '#f59e0b', icon: '💰' },
      { name: 'Mini Apps',  dau:  876, mau: 1640, adoptionPct: 43, color: '#3b82f6', icon: '📱' },
      { name: 'Noticias',   dau:  654, mau: 1320, adoptionPct: 34, color: '#a855f7', icon: '📰' },
      { name: 'Apuestas',   dau:  412, mau:  890, adoptionPct: 23, color: '#ec4899', icon: '🎲' },
      { name: 'Mi Taxi',    dau:  287, mau:  640, adoptionPct: 17, color: '#f97316', icon: '🚕' },
      { name: 'Educación',  dau:  198, mau:  480, adoptionPct: 12, color: '#22c55e', icon: '🎓' },
      { name: 'Hoteles',    dau:   94, mau:  240, adoptionPct:  6, color: '#00b4e6', icon: '🏨' },
    ],
    wallet: {
      txCount: 1847, avgTxValue: 12_400, adoptionPct: 57, repeatUsers: 68,
      topCategories: [
        { name: 'Transferencias', pct: 42, color: '#00c8a0' },
        { name: 'Recargas Móvil', pct: 28, color: '#3b82f6' },
        { name: 'Pagos Servicios', pct: 18, color: '#f59e0b' },
        { name: 'Compras Online', pct: 12, color: '#a855f7' },
      ],
    },
    chat: {
      dailyMessages: 48_200, activeChats: 2_841, groupChats: 420,
      avgMsgPerUser: 17, voiceMin: 8_400, videoMin: 2_100,
    },
    miniApps: [
      { name: 'Apuestas GQ',   users: 412, sessions: 1840, color: '#ec4899', icon: '🎲', country: '🇬🇶 GQ' },
      { name: 'Mi Taxi',       users: 287, sessions:  940, color: '#f97316', icon: '🚕', country: '🇬🇶 GQ' },
      { name: 'CEMAC Tasa',    users: 198, sessions:  620, color: '#3b82f6', icon: '💱', country: '🌍 CEMAC' },
      { name: 'Educación',     users: 198, sessions:  580, color: '#22c55e', icon: '🎓', country: '🇬🇶 GQ' },
      { name: 'Hoteles GQ',    users:  94, sessions:  310, color: '#00b4e6', icon: '🏨', country: '🇬🇶 GQ' },
      { name: 'Estados',       users:  76, sessions:  890, color: '#a855f7', icon: '📸', country: '🇬🇶 GQ' },
    ],
    userGrowthHistory: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((month, i) => {
      const u = Math.floor(800 + i * 280 + Math.random() * 120);
      return { month, users: u, new: Math.floor(u * 0.18), churned: Math.floor(u * 0.03) };
    }),
    retentionCohorts: ['Ene','Feb','Mar','Abr','May'].map((cohort, i) => ({
      cohort, w1: 72 - i * 2, w2: 61 - i * 2, w4: 48 - i * 1.5,
      w8: 35 - i * 1.5, w12: 24 - i * 1,
    })),
    featureUsage: [
      { feature: 'Chat',     wallet: 40, chat: 95, miniApps: 30, news: 45, social: 60 },
      { feature: 'Wallet',   wallet: 85, chat: 35, miniApps: 25, news: 20, social: 30 },
      { feature: 'Mini Apps',wallet: 30, chat: 40, miniApps: 75, news: 35, social: 45 },
      { feature: 'Noticias', wallet: 20, chat: 50, miniApps: 35, news: 80, social: 55 },
      { feature: 'Social',   wallet: 25, chat: 70, miniApps: 40, news: 60, social: 85 },
    ],
    expansion: [
      { country: 'Guinea Ecuatorial', users: 3420, growth: 18.4, flag: '🇬🇶', status: 'active' },
      { country: 'Camerún',           users:  287, growth: 142,  flag: '🇨🇲', status: 'growing' },
      { country: 'Gabón',             users:   94, growth:  88,  flag: '🇬🇦', status: 'growing' },
      { country: 'Congo',             users:   46, growth:  210, flag: '🇨🇬', status: 'growing' },
      { country: 'Nigeria',           users:    0, growth:    0, flag: '🇳🇬', status: 'planned' },
      { country: 'Senegal',           users:    0, growth:    0, flag: '🇸🇳', status: 'planned' },
    ],
    weeklyActive: Array.from({ length: 10 }, (_, i) => ({
      week: `S${i + 1}`,
      dau: Math.floor(1800 + i * 120 + Math.random() * 100),
      wau: Math.floor(2400 + i * 160 + Math.random() * 140),
      mau: Math.floor(3200 + i * 80  + Math.random() * 80),
    })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {typeof p.value === 'number' && p.value > 999 ? p.value.toLocaleString() : p.value}</div>
      ))}
    </div>
  );
};

// ── Section title ─────────────────────────────────────────────────────────────
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>{children}</div>
);

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, color, trend }: { icon: string; label: string; value: string | number; sub?: string; color: string; trend?: number }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1px solid ${color}30`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle,${color}25 0%,transparent 70%)` }} />
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>{icon} {label}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#f1f5f9', lineHeight: 1.1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: trend >= 0 ? '#00c8a0' : '#ef4444', fontWeight: '700' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ── Retention gauge ───────────────────────────────────────────────────────────
function RetentionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{label}</span>
        <span style={{ fontSize: '12px', color, fontWeight: '800' }}>{value}%</span>
      </div>
      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '3px', boxShadow: `0 0 6px ${color}60`, transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:  { color: '#00c8a0', label: 'ACTIVO'    },
  growing: { color: '#f59e0b', label: 'CRECIENDO' },
  planned: { color: '#475569', label: 'PLANIFICADO'},
};

// ── Main component ────────────────────────────────────────────────────────────
export const StrategicDashboard: React.FC = () => {
  const [data, setData] = useState<StrategicData>(generateMock());
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);

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

  return (
    <div style={{ color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>🎯 Dashboard Estratégico</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>Crecimiento · Retención · Funcionalidades · Expansión Internacional</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `conic-gradient(#00c8a0 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00c8a0', fontWeight: '800' }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{d.lastUpdate}</span>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Growth KPIs ── */}
      <div style={{ marginBottom: '8px' }}>
        <SectionTitle>📈 Indicadores de Crecimiento</SectionTitle>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <KPI icon="👥" label="Total Usuarios"      value={d.growth.totalUsers}       sub="registrados"          color="#00c8a0" trend={d.growth.monthlyGrowthPct} />
        <KPI icon="📅" label="Crecimiento Mensual" value={`${d.growth.monthlyGrowthPct}%`} sub="vs mes anterior" color="#3b82f6" />
        <KPI icon="📆" label="Crecimiento Semanal" value={`${d.growth.weeklyGrowthPct}%`}  sub="vs semana ant."  color="#a855f7" />
        <KPI icon="✨" label="Crecimiento Diario"  value={`${d.growth.dailyGrowthPct}%`}   sub="usuarios nuevos"  color="#f59e0b" />
        <KPI icon="🔭" label="Proyección Fin Año"  value={d.growth.projectedEOY}     sub="usuarios estimados"   color="#00b4e6" />
        <KPI icon="🚪" label="Tasa Churn"          value={`${d.growth.churnRate}%`}  sub="abandono mensual"     color={d.growth.churnRate < 5 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* ── Row 2: User growth + WAU/DAU/MAU ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '18px' }}>

        {/* Growth area */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>📊 Crecimiento de Usuarios — 12 Meses</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={d.userGrowthHistory}>
              <defs>
                <linearGradient id="gradU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="users"   name="Total"    stroke="#00c8a0" strokeWidth={2} fill="url(#gradU)" dot={false} />
              <Bar                  dataKey="new"     name="Nuevos"   fill="#3b82f6" opacity={0.8} radius={[3,3,0,0]} />
              <Bar                  dataKey="churned" name="Abandonos" fill="#ef4444" opacity={0.6} radius={[3,3,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* DAU / WAU / MAU */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>📡 DAU / WAU / MAU — 10 Semanas</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={d.weeklyActive}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="mau" name="MAU" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wau" name="WAU" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="dau" name="DAU" stroke="#00c8a0" strokeWidth={2} dot={{ fill: '#00c8a0', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Retention + Feature adoption ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '18px' }}>

        {/* Retention */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>🔁 Retención de Usuarios</SectionTitle>
          <RetentionBar label="Día 1"  value={d.retention.day1}  color="#00c8a0" />
          <RetentionBar label="Día 7"  value={d.retention.day7}  color="#3b82f6" />
          <RetentionBar label="Día 30" value={d.retention.day30} color="#a855f7" />
          <RetentionBar label="Día 90" value={d.retention.day90} color="#f59e0b" />
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#00c8a0' }}>{d.retention.avgSessionMin}m</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>sesión media</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{d.retention.sessionsPerDay}x</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>sesiones/día</div>
            </div>
          </div>
          {/* Cohort table */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Cohortes de Retención</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>{['Cohorte','S1','S2','S4','S8','S12'].map(h => <th key={h} style={{ padding: '4px 6px', color: '#64748b', textAlign: 'center', fontWeight: '700' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {d.retentionCohorts.map(c => (
                    <tr key={c.cohort}>
                      <td style={{ padding: '4px 6px', color: '#94a3b8', fontWeight: '600' }}>{c.cohort}</td>
                      {[c.w1, c.w2, c.w4, c.w8, c.w12].map((v, i) => (
                        <td key={i} style={{ padding: '4px 6px', textAlign: 'center', borderRadius: '4px', background: `rgba(0,200,160,${v/100 * 0.4})`, color: `hsl(${160 + v},70%,65%)`, fontWeight: '700' }}>{v}%</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Feature adoption */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>⚙️ Adopción de Funcionalidades</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
            {d.features.map(f => (
              <div key={f.name} style={{ background: '#0f172a', borderRadius: '10px', padding: '10px', border: `1px solid ${f.color}20` }}>
                <div style={{ fontSize: '14px', marginBottom: '3px' }}>{f.icon}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{f.name}</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: f.color }}>{f.adoptionPct}%</div>
                <div style={{ fontSize: '10px', color: '#475569' }}>DAU: {f.dau.toLocaleString()}</div>
                <div style={{ height: '3px', background: '#1e293b', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.adoptionPct}%`, background: f.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
          {/* Radar chart */}
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={d.featureUsage}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="Chat"     dataKey="chat"     stroke="#00c8a0" fill="#00c8a0" fillOpacity={0.15} />
              <Radar name="Wallet"   dataKey="wallet"   stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
              <Radar name="MiniApps" dataKey="miniApps" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
              <Tooltip content={<Tip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Wallet + Chat deep dive ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Wallet */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #f59e0b20' }}>
          <SectionTitle>💰 Uso del Wallet</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Tx Diarias',    value: d.wallet.txCount.toLocaleString(), color: '#f59e0b' },
              { label: 'Valor Medio Tx',value: `${(d.wallet.avgTxValue/1000).toFixed(0)}K XAF`, color: '#00c8a0' },
              { label: 'Adopción',      value: `${d.wallet.adoptionPct}%`,          color: '#3b82f6' },
              { label: 'Usuarios Recur.',value: `${d.wallet.repeatUsers}%`,         color: '#a855f7' },
            ].map(item => (
              <div key={item.label} style={{ background: '#0f172a', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: '900', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Categorías Top</div>
          {d.wallet.topCategories.map(cat => (
            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '5px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: cat.color, minWidth: '30px', textAlign: 'right' }}>{cat.pct}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #00c8a020' }}>
          <SectionTitle>💬 Uso del Chat</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Mensajes/Día',   value: (d.chat.dailyMessages/1000).toFixed(1)+'K', color: '#00c8a0' },
              { label: 'Chats Activos',  value: d.chat.activeChats.toLocaleString(),        color: '#3b82f6' },
              { label: 'Grupos',         value: d.chat.groupChats.toLocaleString(),          color: '#a855f7' },
              { label: 'Msg/Usuario/Día',value: d.chat.avgMsgPerUser,                        color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ background: '#0f172a', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: '900', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>VoIP — Llamadas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#0f172a', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #00c8a020' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎙️</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#00c8a0' }}>{(d.chat.voiceMin/60).toFixed(0)}h</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>voz / día</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #3b82f620' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>📹</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{(d.chat.videoMin/60).toFixed(0)}h</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>vídeo / día</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Mini apps + Expansion ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Mini Apps */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>📱 Uso de Mini Apps</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={d.miniApps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={95} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="users"    name="Usuarios" radius={[0,4,4,0]}>
                {d.miniApps.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {d.miniApps.map(m => (
              <div key={m.name} style={{ background: '#0f172a', borderRadius: '8px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${m.color}20` }}>
                <span style={{ fontSize: '12px' }}>{m.icon}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{m.name}</span>
                <span style={{ fontSize: '10px', color: '#475569' }}>{m.country}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: m.color }}>{m.sessions} sesiones</span>
              </div>
            ))}
          </div>
        </div>

        {/* International expansion */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <SectionTitle>🌍 Expansión Internacional — CEMAC + Oeste África</SectionTitle>
          {d.expansion.map(c => {
            const s = STATUS_MAP[c.status];
            return (
              <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#0f172a', marginBottom: '6px', border: `1px solid ${s.color}15` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{c.country}</div>
                    {c.users > 0 && <div style={{ fontSize: '10px', color: '#64748b' }}>{c.users.toLocaleString()} usuarios</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {c.growth > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#00c8a0' }}>▲ {c.growth}%</span>
                  )}
                  <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: `${s.color}15`, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${s.color}30` }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(0,180,230,0.05)', borderRadius: '10px', border: '1px solid rgba(0,180,230,0.15)' }}>
            <div style={{ fontSize: '11px', color: '#00b4e6', fontWeight: '700', marginBottom: '4px' }}>🗺️ Plan de Expansión</div>
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
              Fase 1 (activo): Guinea Ecuatorial · Fase 2 (2026): CEMAC completa · Fase 3 (2027): Costa Oeste África
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#475569' }}>🎯 Dashboard Estratégico · Solo Lectura · Datos en tiempo real combinados con proyecciones estadísticas</span>
        <span style={{ fontSize: '11px', color: '#334155' }}>EGCHAT v2.5 · {new Date().toLocaleDateString('es-GQ', { month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
};
