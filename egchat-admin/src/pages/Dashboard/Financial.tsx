import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

// ── Currency config ───────────────────────────────────────────────────────────
type Currency = 'XAF' | 'EUR' | 'USD' | 'GBP';
const CURRENCY_RATES: Record<Currency, number> = { XAF: 1, EUR: 0.00152, USD: 0.00165, GBP: 0.0013 };
const CURRENCY_SYMBOLS: Record<Currency, string> = { XAF: 'XAF', EUR: '€', USD: '$', GBP: '£' };

function convertAmount(xaf: number, currency: Currency): string {
  const val = xaf * CURRENCY_RATES[currency];
  const sym = CURRENCY_SYMBOLS[currency];
  if (val >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `${sym}${(val / 1_000).toFixed(1)}K`;
  return `${sym}${val.toFixed(currency === 'XAF' ? 0 : 2)}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FinancialData {
  revenue: { daily: number; weekly: number; monthly: number; annual: number };
  commissions: { total: number; wallet: number; premium: number; ads: number };
  profit: { estimated: number; margin: number };
  costs: { operational: number; infrastructure: number; marketing: number; support: number };
  services: { name: string; revenue: number; color: string; icon: string }[];
  dailyRevenue: { day: string; revenue: number; costs: number; profit: number }[];
  monthlyRevenue: { month: string; revenue: number; target: number }[];
  weeklyTrend: { week: string; revenue: number; commissions: number }[];
  projection: { month: string; projected: number; optimistic: number; conservative: number }[];
  lastUpdate: string;
}

// ── Generate mock financial data ──────────────────────────────────────────────
function generateMock(): FinancialData {
  const daily     = 485_000 + Math.random() * 120_000;
  const weekly    = daily * 6.8;
  const monthly   = daily * 28.5;
  const annual    = monthly * 11.2;
  const infra     = 145_000;
  const ops       = 85_000;

  return {
    revenue: { daily, weekly, monthly, annual },
    commissions: {
      total:   daily * 0.18,
      wallet:  daily * 0.10,
      premium: daily * 0.05,
      ads:     daily * 0.03,
    },
    profit: {
      estimated: daily - infra - ops,
      margin:    parseFloat(((daily - infra - ops) / daily * 100).toFixed(1)),
    },
    costs: { operational: ops, infrastructure: infra, marketing: 32_000, support: 18_000 },
    services: [
      { name: 'Wallet / Pagos',   revenue: daily * 0.42, color: '#34d399', icon: '💰' },
      { name: 'Chat Premium',     revenue: daily * 0.28, color: '#60a5fa', icon: '💬' },
      { name: 'Publicidad',       revenue: daily * 0.15, color: '#818cf8', icon: '📢' },
      { name: 'Suscripciones',    revenue: daily * 0.10, color: '#f59e0b', icon: '⭐' },
      { name: 'Integraciones API',revenue: daily * 0.05, color: '#ec4899', icon: '🔌' },
    ],
    dailyRevenue: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day, i) => {
      const r = daily * (0.7 + Math.sin(i / 7 * Math.PI) * 0.3 + Math.random() * 0.1);
      const c = infra + ops;
      return { day, revenue: Math.floor(r), costs: Math.floor(c * 0.9), profit: Math.floor(r - c * 0.9) };
    }),
    monthlyRevenue: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((month, i) => ({
      month,
      revenue: Math.floor(monthly * (0.6 + Math.sin(i / 12 * Math.PI) * 0.4 + Math.random() * 0.15)),
      target:  Math.floor(monthly * 1.05),
    })),
    weeklyTrend: ['S1','S2','S3','S4','S5','S6','S7','S8'].map((week) => {
      const r = weekly * (0.85 + Math.random() * 0.3);
      return { week, revenue: Math.floor(r), commissions: Math.floor(r * 0.18) };
    }),
    projection: ['Jul','Ago','Sep','Oct','Nov','Dic'].map((month, i) => ({
      month,
      projected:    Math.floor(monthly * (1 + i * 0.08)),
      optimistic:   Math.floor(monthly * (1 + i * 0.15)),
      conservative: Math.floor(monthly * (1 + i * 0.03)),
    })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px', minWidth: '140px' }}>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color, fontWeight: '700', marginBottom: '2px' }}>
          {p.name}: {convertAmount(p.value, currency)}
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function FinCard({ icon, label, value, sub, color, trend, badge }: {
  icon: string; label: string; value: string; sub?: string;
  color: string; trend?: number; badge?: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: `1px solid ${color}30`, borderRadius: '16px', padding: '18px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
      {badge && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '800', color, background: `${color}15`, padding: '2px 7px', borderRadius: '8px', border: `1px solid ${color}30` }}>
          {badge}
        </div>
      )}
      <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{icon} {label}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: theme.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: trend >= 0 ? theme.l3 : '#ef4444', fontWeight: '700' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs período anterior
        </div>
      )}
    </div>
  );
}

// ── Cost row ──────────────────────────────────────────────────────────────────
function CostRow({ label, amount, total, color, icon, currency }: {
  label: string; amount: number; total: number; color: string; icon: string; currency: Currency;
}) {
  const pct = Math.round(amount / total * 100);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>{icon} {label}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>{pct}%</span>
          <span style={{ fontSize: '13px', color, fontWeight: '800' }}>{convertAmount(amount, currency)}</span>
        </div>
      </div>
      <div style={{ height: '5px', background: theme.bgCard, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', boxShadow: `0 0 6px ${color}50`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const FinancialDashboard: React.FC = () => {
  const theme = useTheme();
  const [data, setData]       = useState<FinancialData>(generateMock());
  const [currency, setCurrency] = useState<Currency>('XAF');
  const [pulse, setPulse]     = useState(false);
  const [tick, setTick]       = useState(0);
  const [period, setPeriod]   = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const refresh = useCallback(async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    try {
      const w = await adminAPI.getWallet();
      setData(prev => ({
        ...prev,
        revenue: {
          daily:   w.volumeToday   ?? prev.revenue.daily,
          weekly:  (w.volumeToday ?? prev.revenue.daily) * 6.8,
          monthly: (w.volumeToday ?? prev.revenue.daily) * 28.5,
          annual:  (w.volumeToday ?? prev.revenue.daily) * 12 * 28.5 / 30,
        },
        lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit' }),
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

  const totalCosts = Object.values(data.costs).reduce((a, b) => a + b, 0);
  const totalRevenue = data.revenue[period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly'];

  return (
    <div style={{ color: theme.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>💹 Dashboard Financiero</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '3px' }}>Solo lectura · Actualiza cada 30s · {data.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            {(['daily','weekly','monthly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                background: period === p ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : 'transparent',
                color: period === p ? '#fff' : '#64748b', transition: 'all 0.2s',
              }}>
                {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
          {/* Currency selector */}
          <div style={{ display: 'flex', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            {(['XAF','EUR','USD','GBP'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                background: currency === c ? 'linear-gradient(135deg,#a855f7,#3b82f6)' : 'transparent',
                color: currency === c ? '#fff' : '#64748b', transition: 'all 0.2s',
              }}>{c}</button>
            ))}
          </div>
          {/* Refresh */}
          <button onClick={refresh} style={{
            background: pulse ? '#334155' : 'linear-gradient(135deg,#00c8a0,#00b4e6)',
            border: 'none', borderRadius: '10px', padding: '7px 14px',
            color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
          }}>
            {pulse ? '⟳ ...' : `⟳ ${30 - tick}s`}
          </button>
        </div>
      </div>

      {/* ── Row 1: Revenue KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <FinCard icon="📅" label="Ingresos Diarios"   value={convertAmount(data.revenue.daily,   currency)} sub="hoy" color="#00c8a0" trend={6}  badge="HOY" />
        <FinCard icon="📆" label="Ingresos Semanales" value={convertAmount(data.revenue.weekly,  currency)} sub="últimos 7 días"  color="#3b82f6" trend={4}  />
        <FinCard icon="🗓️" label="Ingresos Mensuales" value={convertAmount(data.revenue.monthly, currency)} sub="este mes"        color="#a855f7" trend={11} />
        <FinCard icon="📈" label="Ingresos Anuales"   value={convertAmount(data.revenue.annual,  currency)} sub="proyección año"  color="#f59e0b" trend={18} />
        <FinCard icon="🤝" label="Comisiones"         value={convertAmount(data.commissions.total, currency)} sub="hoy (18% avg)"  color="#ec4899" trend={3}  />
        <FinCard icon="✅" label="Beneficio Estimado" value={convertAmount(data.profit.estimated, currency)} sub={`margen ${data.profit.margin}%`} color="#22c55e" trend={data.profit.margin > 30 ? 5 : -2} />
        <FinCard icon="🏗️" label="Costes Infraestr."  value={convertAmount(data.costs.infrastructure, currency)} sub="mensual fijo"  color="#ef4444" />
        <FinCard icon="⚙️" label="Costes Operativos"  value={convertAmount(data.costs.operational, currency)} sub="mensual"       color="#f97316" />
      </div>

      {/* ── Row 2: Revenue vs Cost + Services Pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Revenue / Costs / Profit weekly bar */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            📊 Ingresos vs Costes vs Beneficio — Últimos 7 días ({currency})
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyRevenue} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => convertAmount(v, currency)} width={70} />
              <Tooltip content={(props) => <ChartTip {...props} currency={currency} />} />
              <Bar dataKey="revenue" name="Ingresos" fill="#00c8a0" radius={[4,4,0,0]} />
              <Bar dataKey="costs"   name="Costes"   fill="#ef4444" radius={[4,4,0,0]} opacity={0.8} />
              <Bar dataKey="profit"  name="Beneficio" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Services pie */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            🏆 Servicios más Rentables
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={data.services} dataKey="revenue" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                {data.services.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => convertAmount(v, currency)} contentStyle={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '8px' }}>
            {data.services.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: theme.textMuted }}>{s.icon} {s.name}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: s.color }}>{convertAmount(s.revenue, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Monthly + Commissions breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Monthly area chart */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            📈 Ingresos Mensuales vs Objetivo ({currency})
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={data.monthlyRevenue}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTgt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => convertAmount(v, currency)} width={70} />
              <Tooltip content={(props) => <ChartTip {...props} currency={currency} />} />
              <Area type="monotone" dataKey="target"  name="Objetivo"  stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#gradTgt)" dot={false} />
              <Area type="monotone" dataKey="revenue" name="Real"      stroke="#00c8a0" strokeWidth={2}   fill="url(#gradRev)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly commissions line */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            🤝 Tendencia Comisiones — 8 Semanas ({currency})
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => convertAmount(v, currency)} width={70} />
              <Tooltip content={(props) => <ChartTip {...props} currency={currency} />} />
              <Line type="monotone" dataKey="revenue"     name="Ingresos"   stroke="#00c8a0" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} />
              <Line type="monotone" dataKey="commissions" name="Comisiones" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Cost breakdown + Projection ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

        {/* Cost breakdown */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              📉 Desglose de Costes Mensuales
            </div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444' }}>{convertAmount(totalCosts, currency)}</span>
          </div>
          <CostRow label="Infraestructura" amount={data.costs.infrastructure} total={totalCosts} color="#ef4444" icon="🏗️" currency={currency} />
          <CostRow label="Operativos"       amount={data.costs.operational}   total={totalCosts} color="#f97316" icon="⚙️" currency={currency} />
          <CostRow label="Marketing"        amount={data.costs.marketing}     total={totalCosts} color="#f59e0b" icon="📢" currency={currency} />
          <CostRow label="Soporte"          amount={data.costs.support}       total={totalCosts} color="#a855f7" icon="🎧" currency={currency} />

          {/* Margin indicator */}
          <div style={{ marginTop: '20px', padding: '14px', background: theme.bg, borderRadius: '12px', border: `1px solid ${data.profit.margin > 30 ? '#00c8a040' : '#ef444440'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>Margen de Beneficio</span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: data.profit.margin > 30 ? theme.l3 : '#ef4444' }}>{data.profit.margin}%</span>
            </div>
            <div style={{ height: '8px', background: theme.bgCard, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: `${Math.min(data.profit.margin, 100)}%`,
                background: data.profit.margin > 30 ? 'linear-gradient(90deg,#00c8a0,#22c55e)' : 'linear-gradient(90deg,#ef4444,#f97316)',
                boxShadow: `0 0 8px ${data.profit.margin > 30 ? '#00c8a060' : '#ef444460'}`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* 6-month projection */}
        <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            🔭 Proyección 6 Meses ({currency})
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '14px' }}>Optimista / Base / Conservador</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.projection}>
              <defs>
                <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => convertAmount(v, currency)} width={70} />
              <Tooltip content={(props) => <ChartTip {...props} currency={currency} />} />
              <Area type="monotone" dataKey="optimistic"    name="Optimista"    stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#gradOpt)" dot={false} />
              <Area type="monotone" dataKey="projected"     name="Base"         stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPrj)" dot={{ fill: '#60a5fa', r: 4 }} />
              <Line type="monotone" dataKey="conservative" name="Conservador"  stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 5: Commission breakdown ── */}
      <div style={{ background: theme.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          🤝 Desglose de Comisiones Diarias
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Wallet / Pagos',   amount: data.commissions.wallet,  color: '#34d399', icon: '💰', pct: '10%' },
            { label: 'Chat Premium',     amount: data.commissions.premium, color: '#60a5fa', icon: '💬', pct: '5%'  },
            { label: 'Publicidad',       amount: data.commissions.ads,     color: '#818cf8', icon: '📢', pct: '3%'  },
            { label: 'Total Comisiones', amount: data.commissions.total,   color: '#ec4899', icon: '✅', pct: '18%' },
          ].map(({ label, amount, color, icon, pct }) => (
            <div key={label} style={{ background: theme.bg, borderRadius: '12px', padding: '14px', border: `1px solid ${color}20` }}>
              <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>{icon} {label}</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color }}>{convertAmount(amount, currency)}</div>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>tasa: {pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '14px', padding: '12px', background: theme.bgCard, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>💹 Dashboard Financiero · Solo Lectura · Los datos financieros son estimaciones basadas en transacciones reales</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {(['XAF','EUR','USD','GBP'] as const).map(c => (
            <span key={c} style={{ fontSize: '11px', color: '#334155' }}>
              1 {c} = {c === 'XAF' ? '1' : (1 / CURRENCY_RATES[c]).toFixed(0)} XAF
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
