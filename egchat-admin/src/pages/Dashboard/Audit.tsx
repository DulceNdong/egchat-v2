import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../api/adminClient';
import { useTheme } from '../../context/ThemeContext';

const IC = {
  Clipboard: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x={8} y={2} width={8} height={4} rx={1}/><line x1={9} y1={12} x2={15} y2={12}/><line x1={9} y1={16} x2={15} y2={16}/></svg>,
  Users:     () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>,
  Activity:  () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  AlertTri:  () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  Download:  () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/></svg>,
  RefreshCw: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

const CRITICAL_ACTIONS = new Set(['admin.user_created','admin.role_changed','security.block_ip','security.block_user','data.export']);

export const AuditDashboard: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs]   = useState<any[]>([]);
  const [tick, setTick]   = useState(0);
  const [pulse, setPulse] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage]   = useState(0);
  const PAGE = 12;

  const load = useCallback(async () => {
    setPulse(true); setTimeout(()=>setPulse(false),500);
    try {
      const data = await adminAPI.getAuditLog({ limit: '100' });
      setLogs(Array.isArray(data) ? data : []);
    } catch { setLogs([]); }
  }, []);

  useEffect(() => {
    load();
    const rt = setInterval(load, 30_000);
    const tt = setInterval(() => setTick(t=>(t+1)%30), 1_000);
    return () => { clearInterval(rt); clearInterval(tt); };
  }, [load]);

  const filtered = logs.filter(l => {
    if (filter === 'critical') return CRITICAL_ACTIONS.has(l.action);
    if (filter === 'failure')  return l.result === 'failure';
    return true;
  });
  const paged = filtered.slice(page * PAGE, (page+1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);
  const criticals  = logs.filter(l => CRITICAL_ACTIONS.has(l.action)).length;
  const failures   = logs.filter(l => l.result === 'failure').length;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>;
  };

  return (
    <div style={{ color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>📋 Dashboard de Auditoría</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>Sistema · Log inmutable · {logs.length} entradas reales · {new Date().toLocaleTimeString('es-GQ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(${theme.l1} ${(30-tick)/30*360}deg,${theme.border} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#818cf8', fontWeight: 800 }}>{30-tick}</div>
            </div>
          </div>
          <button onClick={load} style={{ background: pulse ? theme.bgCard : `linear-gradient(135deg,${theme.l1},${theme.l2})`, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.RefreshCw /> {pulse?'...':'Actualizar'}
          </button>
          <button onClick={() => adminAPI.exportAudit('csv')} style={{ background: theme.bgCard, border: `1px solid ${theme.l3}30`, borderRadius: 10, padding: '7px 14px', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IC.Download /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { Icon: IC.Activity,  label: 'Total Registros', value: logs.length,    color: '#818cf8' },
          { Icon: IC.AlertTri,  label: 'Críticas',        value: criticals,      color: '#f59e0b', alert: criticals > 0 },
          { Icon: IC.AlertTri,  label: 'Fallidas',        value: failures,       color: '#ef4444', alert: failures > 5 },
          { Icon: IC.Users,     label: 'Admins Activos',  value: new Set(logs.map(l=>l.admin_id)).size, color: '#60a5fa' },
          { Icon: IC.Clipboard, label: 'Exitosas',        value: logs.filter(l=>l.result==='success').length, color: '#34d399' },
        ].map(({ Icon, label, value, color, alert }: any) => (
          <div key={label} style={{ background: theme.bgCard, border: `${alert ? 1.5 : 1}px solid ${alert ? color+'50' : theme.border}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {alert && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle,${color}20 0%,transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
              <div style={{ color }}><Icon /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: alert ? color : theme.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Log table — REAL DATA */}
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            📜 Log de Auditoría — Datos Reales ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{k:'all',l:'Todos'},{k:'critical',l:'⚠️ Críticos'},{k:'failure',l:'❌ Fallidos'}].map(f => (
              <button key={f.k} onClick={() => { setFilter(f.k); setPage(0); }}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: filter === f.k ? theme.l1+'18' : 'transparent', color: filter === f.k ? theme.l1 : theme.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>Cargando logs de auditoría...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['ID','Hace','Admin','Acción','Recurso','Resultado','IP'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: theme.textMuted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((l: any) => {
                    const isCrit  = CRITICAL_ACTIONS.has(l.action);
                    const isFail  = l.result === 'failure';
                    const rowColor = isCrit ? '#f59e0b' : isFail ? '#ef4444' : theme.textMuted;
                    const tsAgo = l.created_at ? (() => { const diff = Date.now() - new Date(l.created_at).getTime(); const m = Math.floor(diff/60000); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h`; })() : '—';
                    return (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${theme.bg}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '7px 10px', color: theme.textMuted, fontFamily: 'monospace', fontSize: 11 }}>{l.id}</td>
                        <td style={{ padding: '7px 10px', color: theme.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>{tsAgo}</td>
                        <td style={{ padding: '7px 10px', color: theme.text, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11 }}>
                          {l.admin_id ? l.admin_id.substring(0,8)+'...' : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, color: rowColor, fontWeight: isCrit ? 700 : 400 }}>
                            {isCrit && '⚠️ '}{l.action}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', color: theme.textMuted, fontSize: 11 }}>{l.resource_type || '—'}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: isFail ? '#ef4444' : '#22c55e', background: isFail ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 6 }}>
                            {isFail ? '❌' : '✅'} {l.result}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', color: theme.textMuted, fontFamily: 'monospace', fontSize: 10 }}>{l.ip_address || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: theme.textMuted }}>{Math.min(page*PAGE+1,filtered.length)}–{Math.min((page+1)*PAGE,filtered.length)} de {filtered.length}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{l:'«',a:()=>setPage(0),d:page===0},{l:'‹',a:()=>setPage(p=>p-1),d:page===0},{l:'›',a:()=>setPage(p=>p+1),d:page>=totalPages-1},{l:'»',a:()=>setPage(totalPages-1),d:page>=totalPages-1}].map(btn => (
                  <button key={btn.l} onClick={btn.a} disabled={btn.d} style={{ padding:'5px 10px', borderRadius:7, background:theme.bg, border:`1px solid ${theme.border}`, color:btn.d?theme.border:theme.textMuted, fontSize:11, cursor:btn.d?'default':'pointer' }}>{btn.l}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
