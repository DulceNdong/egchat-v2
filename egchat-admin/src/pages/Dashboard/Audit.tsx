import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { adminAPI } from '../../api/adminClient';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditEntry {
  id: number; ts: string; adminEmail: string; adminRole: string;
  action: string; resourceType: string; resourceId: string;
  result: 'success' | 'failure'; ip?: string;
  metadata?: Record<string, any>;
}
interface AuditData {
  totalToday: number; failuresToday: number; uniqueAdmins: number;
  criticalActions: number;
  byAction:  { action: string; count: number; color: string }[];
  byAdmin:   { email: string; count: number }[];
  hourlyActivity: { hour: string; success: number; failure: number }[];
  weeklyActivity: { day: string; total: number; critical: number }[];
  entries: AuditEntry[];
  lastUpdate: string;
}

// ── Mock ──────────────────────────────────────────────────────────────────────
const ACTIONS = ['auth.login','auth.logout','auth.login_failed','admin.user_created','admin.role_changed','admin.user_deactivated','security.block_ip','security.block_user','data.export','settings.changed'];
const ADMINS  = ['superadmin@egchat.gq','ops@egchat.gq','security@egchat.gq','audit@egchat.gq'];
const ROLES   = ['super_admin','operations','security','auditor'];
const CRITICAL_ACTIONS = new Set(['admin.user_created','admin.role_changed','security.block_ip','security.block_user','data.export']);

function generateMock(): AuditData {
  const entries: AuditEntry[] = Array.from({ length: 60 }, (_, i) => {
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const adminIdx = Math.floor(Math.random() * ADMINS.length);
    const minsAgo = i * 8 + Math.floor(Math.random() * 7);
    return {
      id: 1000 - i,
      ts: minsAgo < 60 ? `Hace ${minsAgo}m` : `Hace ${Math.floor(minsAgo/60)}h ${minsAgo%60}m`,
      adminEmail: ADMINS[adminIdx],
      adminRole: ROLES[adminIdx],
      action,
      resourceType: action.split('.')[0],
      resourceId: `${Math.floor(Math.random() * 9000 + 1000)}`,
      result: Math.random() > 0.08 ? 'success' : 'failure',
      ip: `${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    };
  });

  const criticals = entries.filter(e => CRITICAL_ACTIONS.has(e.action)).length;
  const actionCounts: Record<string,number> = {};
  entries.forEach(e => { actionCounts[e.action] = (actionCounts[e.action]||0)+1; });
  const COLORS = ['#00c8a0','#3b82f6','#f59e0b','#a855f7','#ef4444','#f97316','#22c55e','#00b4e6','#ec4899','#64748b'];

  return {
    totalToday: entries.length,
    failuresToday: entries.filter(e => e.result === 'failure').length,
    uniqueAdmins: new Set(entries.map(e => e.adminEmail)).size,
    criticalActions: criticals,
    byAction: Object.entries(actionCounts).sort((a,b) => b[1]-a[1]).map(([action, count], i) => ({ action, count, color: COLORS[i % COLORS.length] })),
    byAdmin: ADMINS.map(email => ({ email, count: entries.filter(e => e.adminEmail === email).length })).sort((a,b) => b.count-a.count),
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      success: Math.floor(Math.random() * 8),
      failure: Math.floor(Math.random() * 2),
    })),
    weeklyActivity: ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => ({
      day,
      total:    Math.floor(20 + Math.random() * 40),
      critical: Math.floor(Math.random() * 8),
    })),
    entries,
    lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
  };
}

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

export const AuditDashboard: React.FC = () => {
  const [data, setData] = useState<AuditData>(generateMock());
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState<'all'|'success'|'failure'>('all');
  const [page, setPage] = useState(0);
  const PAGE = 12;

  const refresh = useCallback(async () => {
    setPulse(true); setTimeout(() => setPulse(false), 500);
    try {
      const api = await adminAPI.getAuditLog({ limit: '60' });
      if (Array.isArray(api) && api.length > 0) {
        const mapped: AuditEntry[] = api.map((r: any, i: number) => ({
          id: r.id || i, ts: r.created_at ? new Date(r.created_at).toLocaleTimeString() : `Hace ${i}m`,
          adminEmail: r.admin_id || 'admin', adminRole: 'admin',
          action: r.action || 'unknown', resourceType: r.resource_type || '',
          resourceId: r.resource_id || '', result: r.result || 'success',
          ip: r.ip_address,
        }));
        setData(prev => ({ ...generateMock(), entries: mapped, lastUpdate: new Date().toLocaleTimeString('es-GQ', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) }));
        return;
      }
    } catch {}
    setData(generateMock());
  }, []);

  useEffect(() => {
    refresh();
    const rt = setInterval(refresh, 30_000);
    const tt = setInterval(() => setTick(t => (t+1) % 30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [refresh]);

  const d = data;
  const filtered = d.entries.filter(e => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    if (resultFilter !== 'all' && e.result !== resultFilter) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE, (page+1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>📋 Dashboard de Auditoría</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>Sistema · Log inmutable · Todas las acciones de administradores · {d.lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `conic-gradient(#6366f1 ${(30-tick)/30*360}deg,#1e293b 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#6366f1', fontWeight: '800' }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={refresh} style={{ background: pulse ? '#334155' : 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', borderRadius: '10px', padding: '7px 16px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {pulse ? '⟳ ...' : '⟳ Actualizar'}
          </button>
          <button onClick={() => adminAPI.exportAudit('csv')} style={{ background: 'rgba(0,200,160,0.1)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '10px', padding: '7px 14px', color: '#00c8a0', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            ⬇️ Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {[
          { icon:'📊', label:'Acciones Hoy',     value: d.totalToday,         color:'#6366f1' },
          { icon:'❌', label:'Fallos',             value: d.failuresToday,      color: d.failuresToday > 5 ? '#ef4444' : '#64748b', alert: d.failuresToday > 5 },
          { icon:'👤', label:'Admins Activos',    value: d.uniqueAdmins,       color:'#3b82f6' },
          { icon:'⚠️', label:'Acciones Críticas', value: d.criticalActions,    color:'#f59e0b', alert: d.criticalActions > 0 },
        ].map(item => (
          <div key={item.label} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: `1.5px solid ${(item as any).alert ? item.color : item.color+'30'}`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {(item as any).alert && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />}
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize:'24px', fontWeight:'900', color: (item as any).alert ? item.color : '#f1f5f9' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>📊 Actividad por Hora — Hoy</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.hourlyActivity} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="success" name="Exitosas" fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="failure" name="Fallidas"  fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>📅 Semanal</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={d.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="total"    name="Total"    stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="critical" name="Críticas" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>👤 Por Admin</div>
          {d.byAdmin.map(a => (
            <div key={a.email} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{a.email.split('@')[0]}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1' }}>{a.count}</span>
              </div>
              <div style={{ height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${a.count/d.totalToday*100}%`, background: '#6366f1', borderRadius: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log table */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>📜 Log de Auditoría ({filtered.length})</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '5px 8px', color: '#94a3b8', fontSize: '11px', outline: 'none' }}>
              <option value="all">Todas las acciones</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {(['all','success','failure'] as const).map(r => (
              <button key={r} onClick={() => { setResultFilter(r); setPage(0); }}
                style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${r==='success'?'rgba(0,200,160,0.3)':r==='failure'?'rgba(239,68,68,0.3)':'#334155'}`, background: resultFilter === r ? r==='success'?'rgba(0,200,160,0.1)':r==='failure'?'rgba(239,68,68,0.1)':'#334155' : 'transparent', color: r==='success'?'#00c8a0':r==='failure'?'#ef4444':'#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {r === 'all' ? 'Todos' : r === 'success' ? '✅ Exitosas' : '❌ Fallidas'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['ID','Hace','Admin','Rol','Acción','Recurso','ID Recurso','Resultado','IP'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748b', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #0f172a' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = '#0f172a')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '7px 10px', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>{e.id}</td>
                  <td style={{ padding: '7px 10px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '11px' }}>{e.ts}</td>
                  <td style={{ padding: '7px 10px', color: '#e2e8f0', fontWeight: '600', whiteSpace: 'nowrap', fontSize: '11px' }}>{e.adminEmail.split('@')[0]}</td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', background: '#0f172a', padding: '1px 6px', borderRadius: '5px' }}>{e.adminRole}</span>
                  </td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '11px', color: CRITICAL_ACTIONS.has(e.action) ? '#f59e0b' : '#94a3b8', fontWeight: CRITICAL_ACTIONS.has(e.action) ? '700' : '400' }}>
                      {CRITICAL_ACTIONS.has(e.action) ? '⚠️ ' : ''}{e.action}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '11px' }}>{e.resourceType}</td>
                  <td style={{ padding: '7px 10px', color: '#475569', fontFamily: 'monospace', fontSize: '11px' }}>{e.resourceId}</td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: e.result === 'success' ? '#00c8a0' : '#ef4444', background: e.result === 'success' ? 'rgba(0,200,160,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: '6px' }}>
                      {e.result === 'success' ? '✅' : '❌'} {e.result === 'success' ? 'OK' : 'FALLO'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#475569', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>{e.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>{Math.min(page*PAGE+1,filtered.length)}–{Math.min((page+1)*PAGE,filtered.length)} de {filtered.length}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{l:'«',a:()=>setPage(0),d:page===0},{l:'‹',a:()=>setPage(p=>p-1),d:page===0},{l:'›',a:()=>setPage(p=>p+1),d:page>=totalPages-1},{l:'»',a:()=>setPage(totalPages-1),d:page>=totalPages-1}].map(btn => (
              <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding:'5px 10px', borderRadius:'7px', background:'#0f172a', border:'1px solid #334155', color:btn.d?'#334155':'#94a3b8', fontSize:'11px', cursor:btn.d?'default':'pointer' }}>{btn.l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
