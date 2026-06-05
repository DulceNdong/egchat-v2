import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
type UserStatus = 'active' | 'inactive' | 'blocked' | 'suspended' | 'unverified';

interface UserRow {
  id: string; name: string; phone: string; country: string;
  platform: string; version: string; status: UserStatus;
  registered: string; lastSeen: string; sessions: number;
}

interface UsersData {
  totals: Record<UserStatus, number> & { all: number };
  registeredToday: number; registeredWeek: number; registeredMonth: number;
  byCountry: { country: string; flag: string; count: number; pct: number }[];
  byPlatform: { name: string; count: number; color: string }[];
  byVersion: { version: string; count: number; color: string }[];
  growthTrend: { day: string; registered: number; active: number }[];
  users: UserRow[];
  lastUpdate: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<UserStatus, { color: string; bg: string; label: string; icon: string }> = {
  active:     { color: '#00c8a0', bg: 'rgba(0,200,160,0.1)',   label: 'Activo',      icon: '🟢' },
  inactive:   { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Inactivo',    icon: '⚫' },
  blocked:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Bloqueado',   icon: '🔴' },
  suspended:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Suspendido',  icon: '🟡' },
  unverified: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: 'Sin Verificar',icon: '🔵' },
};

// ── Mock generator ────────────────────────────────────────────────────────────
const NAMES = ['Carlos Nguema','María Obiang','Pedro Esono','Ana Mba','Luis Eyene','Rosa Nchama','David Ondo','Elena Abaga','Miguel Bindang','Sofia Mba Nze','Jean Ateba','Fatima Mbongo'];
const COUNTRIES = [['🇬🇶','Guinea Ecuatorial'],['🇨🇲','Camerún'],['🇬🇦','Gabón'],['🇨🇬','Congo'],['🇳🇬','Nigeria'],['🇫🇷','Francia']];
const PLATFORMS = ['Android','iOS','PWA'];
const VERSIONS = ['2.5.1','2.4.0','2.3.2','2.2.0'];
const STATUSES: UserStatus[] = ['active','active','active','active','inactive','inactive','blocked','suspended','unverified'];

function generateMock(): UsersData {
  const total = 3847;
  const active = 2641; const inactive = 820; const blocked = 124;
  const suspended = 187; const unverified = 75;

  const users: UserRow[] = Array.from({ length: 50 }, (_, i) => {
    const [flag, country] = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: String(1000 + i),
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      phone: `+240 ${Math.floor(222_000_000 + Math.random() * 9_000_000)}`,
      country: `${flag} ${country}`,
      platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
      version: VERSIONS[Math.floor(Math.random() * VERSIONS.length)],
      status,
      registered: date.toLocaleDateString('es-GQ'),
      lastSeen: status === 'active' ? 'Hace ' + Math.floor(Math.random() * 60) + ' min' : 'Hace ' + Math.floor(Math.random() * 30) + ' días',
      sessions: Math.floor(Math.random() * 200 + 1),
    };
  });

  return {
    totals: { all: total, active, inactive, blocked, suspended, unverified },
    registeredToday: Math.floor(18 + Math.random() * 30),
    registeredWeek:  Math.floor(180 + Math.random() * 80),
    registeredMonth: Math.floor(720 + Math.random() * 200),
    byCountry: [
      { country: 'Guinea Ecuatorial', flag: '🇬🇶', count: 3120, pct: 81 },
      { country: 'Camerún',           flag: '🇨🇲', count:  287, pct: 7.5 },
      { country: 'Gabón',             flag: '🇬🇦', count:  194, pct: 5 },
      { country: 'Congo',             flag: '🇨🇬', count:  148, pct: 3.8 },
      { country: 'Otros',             flag: '🌍', count:   98, pct: 2.5 },
    ],
    byPlatform: [
      { name: 'Android', count: 2140, color: '#00c8a0' },
      { name: 'iOS',     count:  892, color: '#3b82f6' },
      { name: 'PWA',     count:  815, color: '#a855f7' },
    ],
    byVersion: [
      { version: 'v2.5.1', count: 2840, color: '#00c8a0' },
      { version: 'v2.4.0', count:  620, color: '#3b82f6' },
      { version: 'v2.3.2', count:  280, color: '#f59e0b' },
      { version: 'v2.2.0', count:  107, color: '#ef4444' },
    ],
    growthTrend: Array.from({ length: 30 }, (_, i) => ({
      day: `D${i + 1}`,
      registered: Math.floor(15 + Math.sin(i / 5) * 8 + Math.random() * 10),
      active:     Math.floor(2400 + i * 12 + Math.random() * 50),
    })),
    users,
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: p.color || p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value?.toLocaleString()}</div>
      ))}
    </div>
  );
};

// ── Status filter button ──────────────────────────────────────────────────────
function StatusBtn({ status, count, active, onClick }: { status: UserStatus | 'all'; count: number; active: boolean; onClick: () => void }) {
  const cfg = status === 'all' ? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Todos', icon: '👥' } : STATUS[status];
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
      border: active ? `2px solid ${cfg.color}` : '1px solid #1e293b',
      background: active ? cfg.bg : 'linear-gradient(135deg,#1e293b,#0f172a)',
      transition: 'all 0.15s',
    }}>
      <div style={{ fontSize: '18px' }}>{cfg.icon}</div>
      <div style={{ fontSize: '20px', fontWeight: '900', color: active ? cfg.color : '#f1f5f9' }}>{count.toLocaleString()}</div>
      <div style={{ fontSize: '10px', fontWeight: '700', color: active ? cfg.color : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{cfg.label}</div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const UsersDashboard: React.FC = () => {
  const [data, setData]           = useState<UsersData>(generateMock());
  const [tick, setTick]           = useState(0);
  const [pulse, setPulse]         = useState(false);
  const [statusFilter, setStatus] = useState<UserStatus | 'all'>('all');
  const [countryFilter, setCountry] = useState('all');
  const [platformFilter, setPlatform] = useState('all');
  const [versionFilter, setVersion]   = useState('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const PAGE_SIZE = 10;

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

  // Filtering
  const filtered = data.users.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (countryFilter !== 'all' && !u.country.includes(countryFilter)) return false;
    if (platformFilter !== 'all' && u.platform !== platformFilter) return false;
    if (versionFilter !== 'all' && u.version !== versionFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.phone.includes(search)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const d = data;

  return (
    <div style={{ color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>👤 Dashboard de Usuarios</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>FASE B — Operaciones · Tiempo real · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#00c8a0 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00c8a0', fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Status counters ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['all','active','inactive','blocked','suspended','unverified'] as const).map(s => (
          <StatusBtn key={s} status={s} count={s === 'all' ? d.totals.all : d.totals[s]} active={statusFilter === s} onClick={() => { setStatus(s); setPage(0); }} />
        ))}
      </div>

      {/* ── Row 2: Registration KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Registrados Hoy',  value: d.registeredToday, color: '#00c8a0', icon: '📅' },
          { label: 'Esta Semana',      value: d.registeredWeek,  color: '#3b82f6', icon: '📆' },
          { label: 'Este Mes',         value: d.registeredMonth, color: '#a855f7', icon: '🗓️' },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1px solid ${item.color}30`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: item.color }}>{item.value.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>nuevos usuarios</div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Growth trend */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>📈 Crecimiento — Últimos 30 días</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={d.growthTrend}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} interval={4} />
              <YAxis yAxisId="left"  tick={{ fill: '#475569', fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Area yAxisId="right" type="monotone" dataKey="active"     name="Activos"    stroke="#3b82f6" strokeWidth={1.5} fill="transparent" dot={false} />
              <Area yAxisId="left"  type="monotone" dataKey="registered" name="Registros"  stroke="#00c8a0" strokeWidth={2}   fill="url(#gA)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By platform */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>📱 Por Plataforma</div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={d.byPlatform} dataKey="count" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3}>
                {d.byPlatform.map((p, i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString()} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          {d.byPlatform.map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, display: 'inline-block' }} />
                {p.name}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: p.color }}>{p.count.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* By version */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>🔢 Por Versión</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={d.byVersion} layout="vertical" barSize={10}>
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 9 }} />
              <YAxis dataKey="version" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={45} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="Usuarios" radius={[0,4,4,0]}>
                {d.byVersion.map((v, i) => <Cell key={i} fill={v.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {d.byVersion.map(v => (
            <div key={v.version} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{v.version}</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: v.color }}>{Math.round(v.count / d.totals.all * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 4: Country breakdown ── */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>🌍 Distribución por País</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px' }}>
          {d.byCountry.map(c => (
            <div key={c.country} style={{ background: '#0f172a', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{c.flag} {c.country}</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#00c8a0' }}>{c.count.toLocaleString()}</span>
              </div>
              <div style={{ height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.pct}%`, background: 'linear-gradient(90deg,#00c8a0,#00b4e6)', borderRadius: '3px', transition: 'width 0.6s' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: 'right' }}>{c.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: User table with filters ── */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📋 Lista de Usuarios ({filtered.length.toLocaleString()})
          </div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              placeholder="🔍 Buscar nombre o teléfono..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '6px 10px', color: '#f1f5f9', fontSize: '12px', outline: 'none', width: '200px' }}
            />
            {[
              { label: 'País', value: countryFilter, setter: setCountry, options: [['all','Todos los países'],['Guinea Ecuatorial','🇬🇶 Guinea Ecuatorial'],['Camerún','🇨🇲 Camerún'],['Gabón','🇬🇦 Gabón'],['Congo','🇨🇬 Congo']] },
              { label: 'Plataforma', value: platformFilter, setter: setPlatform, options: [['all','Todas'],['Android','Android'],['iOS','iOS'],['PWA','PWA']] },
              { label: 'Versión', value: versionFilter, setter: setVersion, options: [['all','Todas'],['2.5.1','v2.5.1'],['2.4.0','v2.4.0'],['2.3.2','v2.3.2'],['2.2.0','v2.2.0']] },
            ].map(f => (
              <select key={f.label} value={f.value} onChange={e => { f.setter(e.target.value); setPage(0); }}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '6px 8px', color: '#94a3b8', fontSize: '11px', outline: 'none', cursor: 'pointer' }}>
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Usuario','Teléfono','País','Plataforma','Versión','Estado','Registrado','Última Vez','Sesiones'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(u => {
                const s = STATUS[u.status];
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #0f172a', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 10px', color: '#e2e8f0', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg,${s.color}40,${s.color}20)`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: s.color, flexShrink: 0 }}>
                          {u.name.charAt(0)}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{u.phone}</td>
                    <td style={{ padding: '9px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{u.country}</td>
                    <td style={{ padding: '9px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px' }}>{u.platform === 'Android' ? '🤖' : u.platform === 'iOS' ? '🍎' : '🌐'}</span> {u.platform}
                    </td>
                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: u.version === '2.5.1' ? '#00c8a0' : '#f59e0b', background: u.version === '2.5.1' ? 'rgba(0,200,160,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: '6px' }}>
                        v{u.version}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${s.color}20` }}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>{u.registered}</td>
                    <td style={{ padding: '9px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>{u.lastSeen}</td>
                    <td style={{ padding: '9px 10px', color: '#94a3b8', textAlign: 'center' }}>{u.sessions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Mostrando {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length.toLocaleString()} usuarios
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setPage(0)}           disabled={page === 0}            style={{ padding: '5px 10px', borderRadius: '7px', background: '#0f172a', border: '1px solid #334155', color: page === 0 ? '#334155' : '#94a3b8', fontSize: '11px', cursor: page === 0 ? 'default' : 'pointer' }}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}            style={{ padding: '5px 10px', borderRadius: '7px', background: '#0f172a', border: '1px solid #334155', color: page === 0 ? '#334155' : '#94a3b8', fontSize: '11px', cursor: page === 0 ? 'default' : 'pointer' }}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, Math.min(page - 2 + i, totalPages - 1));
              return (
                <button key={p} onClick={() => setPage(p)} style={{ padding: '5px 10px', borderRadius: '7px', background: p === page ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : '#0f172a', border: `1px solid ${p === page ? '#00c8a0' : '#334155'}`, color: p === page ? '#fff' : '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: p === page ? '800' : '400' }}>{p + 1}</button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} style={{ padding: '5px 10px', borderRadius: '7px', background: '#0f172a', border: '1px solid #334155', color: page >= totalPages - 1 ? '#334155' : '#94a3b8', fontSize: '11px', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} style={{ padding: '5px 10px', borderRadius: '7px', background: '#0f172a', border: '1px solid #334155', color: page >= totalPages - 1 ? '#334155' : '#94a3b8', fontSize: '11px', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
};
