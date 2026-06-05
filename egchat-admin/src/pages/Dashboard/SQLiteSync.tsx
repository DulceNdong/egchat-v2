import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

type DeviceStatus   = 'synced' | 'pending' | 'conflict' | 'offline';
type DevicePlatform = 'Android' | 'iOS' | 'Web';

interface Device {
  id: string; user: string; platform: DevicePlatform;
  lastSync: string; lastSyncTs: number;
  pendingItems: number; pendingKB: number; status: DeviceStatus;
}
interface ConflictRow {
  id: string; deviceId: string; user: string; table: string; field: string;
  localValue: string; serverValue: string; createdAt: string;
}
interface SyncData {
  totalDevices: number; onlineNow: number; offlineLong: number;
  pendingCount: number; pendingKB: number; conflictCount: number;
  syncSuccessRate: number;
  devices: Device[]; conflicts: ConflictRow[];
  activityChart: { hour: string; synced: number; failed: number; pending: number }[];
  weekChart:     { day: string; synced: number; pending: number; conflict: number; offline: number }[];
  conflictTrend: { day: string; conflicts: number }[];
  lastUpdate: string;
}

const STATUS_CFG: Record<DeviceStatus, { color: string; bg: string; label: string; icon: string }> = {
  synced:   { color: '#00c8a0', bg: 'rgba(0,200,160,0.1)',  label: 'Sincronizado', icon: '✅' },
  pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pendiente',    icon: '⏳' },
  conflict: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'Conflicto',    icon: '⚠️' },
  offline:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Offline',      icon: '📴' },
};
const PLATFORM_ICON: Record<DevicePlatform, string> = { Android: '🤖', iOS: '🍎', Web: '🌐' };

const USERS   = ['+240555570323','+240222334455','+240333221100','+240444556677','+240666778899','+240111223344','+240999887766','+240777665544','+240888990011','+240121314151','+240161718192','+240202122232','+240242526272','+240282930313'];
const TABLES  = ['messages','contacts','media','groups','settings','reactions'];
const FIELDS  = ['content','status','timestamp','read_at','name','avatar_url','deleted_at','updated_at'];

function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateDevices(): Device[] {
  const statuses: DeviceStatus[] = ['synced','synced','synced','synced','synced','synced','pending','pending','pending','conflict','conflict','offline','offline','offline'];
  return USERS.map((user, i) => {
    const status = statuses[i % statuses.length];
    const minsAgo = rnd(1, 60 * 24 * 10);
    return {
      id: `DEV-${(Math.random() * 0xFFFFFF | 0).toString(16).toUpperCase().padStart(6,'0')}`,
      user, platform: pick<DevicePlatform>(['Android','Android','iOS','Web']),
      lastSync: minsAgo < 60 ? `Hace ${minsAgo}m` : minsAgo < 60*24 ? `Hace ${Math.floor(minsAgo/60)}h` : `Hace ${Math.floor(minsAgo/1440)}d`,
      lastSyncTs: Date.now() - minsAgo * 60_000,
      pendingItems: status === 'synced' ? 0 : rnd(1, 80),
      pendingKB:    status === 'synced' ? 0 : rnd(2, 512),
      status,
    };
  });
}

function generateMock(): SyncData {
  const devices = generateDevices();
  const conflictDevices = devices.filter(d => d.status === 'conflict');
  const conflicts: ConflictRow[] = conflictDevices.flatMap(dev =>
    Array.from({ length: rnd(1,3) }, () => ({
      id: `CONF-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
      deviceId: dev.id, user: dev.user,
      table: pick(TABLES), field: pick(FIELDS),
      localValue:  pick(['null','"leído"','"enviado"','1','"2026-06-01T10:00:00Z"','"Nuevo nombre"','"url/img.jpg"']),
      serverValue: pick(['"pendiente"','"recibido"','0','"2026-06-01T09:55:12Z"','"Nombre anterior"','""']),
      createdAt: new Date(Date.now() - rnd(1,120)*60_000).toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit' }),
    }))
  );
  const synced = devices.filter(d => d.status === 'synced').length;
  const offline7 = devices.filter(d => (Date.now() - d.lastSyncTs) / (1000*60*60*24) > 7).length;
  return {
    totalDevices: devices.length, onlineNow: devices.filter(d => d.status !== 'offline').length,
    offlineLong: offline7, pendingCount: devices.filter(d => d.status === 'pending').length,
    pendingKB: devices.reduce((s,d) => s+d.pendingKB, 0), conflictCount: conflicts.length,
    syncSuccessRate: Math.round(synced / devices.length * 100),
    devices, conflicts,
    activityChart: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, synced: rnd(0,40), failed: rnd(0,8), pending: rnd(0,15) })),
    weekChart: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({ day, synced: rnd(30,80), pending: rnd(5,25), conflict: rnd(0,10), offline: rnd(0,6) })),
    conflictTrend: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({ day, conflicts: rnd(0,15) })),
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
  };
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: '12px', color: p.color||p.fill, fontWeight: '700', marginBottom: '2px' }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export const SQLiteSyncDashboard: React.FC = () => {
  const [data, setData]   = useState<SyncData>(generateMock());
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);
  const [statusFilter, setStatusFilter]     = useState<DeviceStatus|'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<DevicePlatform|'all'>('all');
  const [devPage, setDevPage] = useState(0);
  const DEV_PAGE = 8;

  const refresh = useCallback(() => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    setData(generateMock()); setDevPage(0);
  }, []);

  useEffect(() => {
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t+1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const filteredDevices = d.devices.filter(dev => {
    if (statusFilter   !== 'all' && dev.status   !== statusFilter)   return false;
    if (platformFilter !== 'all' && dev.platform !== platformFilter) return false;
    return true;
  });
  const pagedDevices  = filteredDevices.slice(devPage * DEV_PAGE, (devPage+1) * DEV_PAGE);
  const totalDevPages = Math.ceil(filteredDevices.length / DEV_PAGE);
  const rateColor = d.syncSuccessRate >= 90 ? '#00c8a0' : d.syncSuccessRate >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px', fontWeight: '900' }}>🔄 Sincronización SQLite</span>
            {d.pendingCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '4px 12px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b' }}>{d.pendingCount} dispositivos con sync pendiente</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>FASE C — Tecnología · SQLite Offline Sync · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#00c8a0 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00c8a0', fontWeight: '800' }}>{30-tick}</div>
            </div>
            <span style={{ fontSize: '10px', color: '#475569' }}>auto-refresh</span>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#00c8a0,#22c55e)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon:'📱', label:'Total Dispositivos', value: d.totalDevices,          color:'#00c8a0' },
          { icon:'🟢', label:'Online Ahora',        value: d.onlineNow,            color:'#22c55e' },
          { icon:'📴', label:'Offline >7 días',     value: d.offlineLong,          color:'#ef4444', alert: d.offlineLong > 0 },
          { icon:'⏳', label:'Cola Pendiente',       value: `${d.pendingCount} · ${d.pendingKB}KB`, color:'#f59e0b' },
          { icon:'⚠️', label:'Conflictos',          value: d.conflictCount,        color:'#a855f7', alert: d.conflictCount > 0 },
          { icon:'✅', label:'Tasa de Éxito',        value: `${d.syncSuccessRate}%`, color: rateColor },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${(item as any).alert ? item.color : item.color+'30'}`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {(item as any).alert && <div style={{ position: 'absolute', top:'8px', right:'8px', width:'8px', height:'8px', borderRadius:'50%', background:item.color, boxShadow:`0 0 6px ${item.color}` }} />}
            <div style={{ position:'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', borderRadius:'50%', background:`radial-gradient(circle,${item.color}20 0%,transparent 70%)` }} />
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize: String(item.value).length > 6 ? '14px' : '22px', fontWeight:'900', color: (item as any).alert ? item.color : '#f1f5f9', lineHeight:1.2 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '16px' }}>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'14px' }}>📈 Actividad de Sync — Últimas 24h</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={d.activityChart}>
            <defs>
              {[['Synced','#00c8a0'],['Failed','#ef4444'],['Pending','#f59e0b']].map(([k,c]) => (
                <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
            <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} interval={3} />
            <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="synced"  name="Sincronizados" stroke="#00c8a0" strokeWidth={2} fill="url(#gSynced)"  dot={false} />
            <Area type="monotone" dataKey="failed"  name="Fallidos"      stroke="#ef4444" strokeWidth={2} fill="url(#gFailed)"  dot={false} />
            <Area type="monotone" dataKey="pending" name="Pendientes"    stroke="#f59e0b" strokeWidth={2} fill="url(#gPending)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'14px' }}>📊 Dispositivos por Estado — 7 Días</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={d.weekChart} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="synced"   name="Sincronizados" fill="#00c8a0" radius={[3,3,0,0]} />
              <Bar dataKey="pending"  name="Pendientes"    fill="#f59e0b" radius={[3,3,0,0]} />
              <Bar dataKey="conflict" name="Conflictos"    fill="#a855f7" radius={[3,3,0,0]} />
              <Bar dataKey="offline"  name="Offline"       fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'14px' }}>🔀 Conflictos — 7 Días</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={d.conflictTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} formatter={(v:any)=>[v,'Conflictos']} />
              <Line type="monotone" dataKey="conflicts" name="Conflictos" stroke="#a855f7" strokeWidth={2} dot={{ fill:'#a855f7', r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device table */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px' }}>📱 Dispositivos ({filteredDevices.length})</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value as any); setDevPage(0); }} style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:'8px', padding:'5px 8px', color:'#94a3b8', fontSize:'11px', outline:'none' }}>
              <option value="all">Todas las plataformas</option>
              <option value="Android">🤖 Android</option>
              <option value="iOS">🍎 iOS</option>
              <option value="Web">🌐 Web</option>
            </select>
            {(['all','synced','pending','conflict','offline'] as const).map(s => {
              const cfg = s === 'all' ? { color:'#64748b', label:'Todos', icon:'📋', bg:'' } : STATUS_CFG[s];
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setDevPage(0); }}
                  style={{ padding:'4px 9px', borderRadius:'8px', border:`1px solid ${cfg.color}30`, background: statusFilter === s ? (cfg.bg||'#334155') : 'transparent', color:cfg.color, fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
                  {cfg.icon}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['ID','Usuario','Plataforma','Último Sync','Pendientes','KB','Estado'].map(h => (
                  <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedDevices.map(dev => {
                const sc = STATUS_CFG[dev.status];
                return (
                  <tr key={dev.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:'11px', color:'#94a3b8', whiteSpace:'nowrap' }}>{dev.id}</td>
                    <td style={{ padding:'8px 10px', color:'#e2e8f0', fontWeight:'600', whiteSpace:'nowrap' }}>{dev.user}</td>
                    <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}><span style={{ fontSize:'13px', marginRight:'4px' }}>{PLATFORM_ICON[dev.platform]}</span><span style={{ color:'#94a3b8', fontSize:'11px' }}>{dev.platform}</span></td>
                    <td style={{ padding:'8px 10px', color:'#64748b', whiteSpace:'nowrap', fontSize:'11px' }}>{dev.lastSync}</td>
                    <td style={{ padding:'8px 10px', color:dev.pendingItems>0?'#f59e0b':'#475569', fontWeight:dev.pendingItems>0?'700':'400', whiteSpace:'nowrap' }}>{dev.pendingItems>0?dev.pendingItems:'—'}</td>
                    <td style={{ padding:'8px 10px', color:dev.pendingKB>0?'#f59e0b':'#475569', fontSize:'11px', whiteSpace:'nowrap' }}>{dev.pendingKB>0?`${dev.pendingKB}KB`:'—'}</td>
                    <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:'10px', fontWeight:'800', color:sc.color, background:sc.bg, padding:'2px 8px', borderRadius:'6px' }}>{sc.icon} {sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'12px', flexWrap:'wrap', gap:'8px' }}>
          <span style={{ fontSize:'11px', color:'#475569' }}>{Math.min(devPage*DEV_PAGE+1,filteredDevices.length)}–{Math.min((devPage+1)*DEV_PAGE,filteredDevices.length)} de {filteredDevices.length}</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {[{l:'«',a:()=>setDevPage(0),d:devPage===0},{l:'‹',a:()=>setDevPage(p=>p-1),d:devPage===0},{l:'›',a:()=>setDevPage(p=>p+1),d:devPage>=totalDevPages-1},{l:'»',a:()=>setDevPage(totalDevPages-1),d:devPage>=totalDevPages-1}].map(btn => (
              <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding:'5px 10px', borderRadius:'7px', background:'#0f172a', border:'1px solid #334155', color:btn.d?'#334155':'#94a3b8', fontSize:'11px', cursor:btn.d?'default':'pointer' }}>{btn.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Conflict table */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #a855f730' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px' }}>⚠️ Conflictos ({d.conflicts.length})</div>
          {d.conflicts.length > 0 && <div style={{ fontSize:'11px', color:'#a855f7', background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:'8px', padding:'4px 10px', fontWeight:'700' }}>Solo lectura · revisión manual requerida</div>}
        </div>
        {d.conflicts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#475569', fontSize:'14px' }}>🎉 Sin conflictos activos</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['ID','Dispositivo','Usuario','Tabla','Campo','Valor Local','Valor Servidor','Hora'].map(h => (
                    <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.conflicts.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #0f172a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:'11px', color:'#a855f7', whiteSpace:'nowrap' }}>{c.id}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:'11px', color:'#94a3b8', whiteSpace:'nowrap' }}>{c.deviceId}</td>
                    <td style={{ padding:'8px 10px', color:'#e2e8f0', fontWeight:'600', whiteSpace:'nowrap' }}>{c.user}</td>
                    <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}><span style={{ background:'rgba(100,116,139,0.15)', color:'#94a3b8', padding:'2px 7px', borderRadius:'5px', fontSize:'11px', fontFamily:'monospace' }}>{c.table}</span></td>
                    <td style={{ padding:'8px 10px', color:'#64748b', fontFamily:'monospace', fontSize:'11px', whiteSpace:'nowrap' }}>{c.field}</td>
                    <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}><span style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b', padding:'2px 8px', borderRadius:'5px', fontFamily:'monospace', fontSize:'11px' }}>{c.localValue}</span></td>
                    <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}><span style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', padding:'2px 8px', borderRadius:'5px', fontFamily:'monospace', fontSize:'11px' }}>{c.serverValue}</span></td>
                    <td style={{ padding:'8px 10px', color:'#475569', fontSize:'11px', whiteSpace:'nowrap' }}>{c.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
