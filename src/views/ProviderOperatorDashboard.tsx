/**
 * ProviderOperatorDashboard.tsx
 * Panel de Operaciones — Ventas/Operador del proveedor
 * Procesa pedidos, activa modo automático, ve pendientes por producto
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  userProfile: any;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const api = (p: string, o?: RequestInit) =>
  fetch(`${API_BASE}${p}`, { ...o, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}`, ...(o?.headers||{}) } });

const STATUS_CFG: Record<string, { color:string; bg:string; label:string }> = {
  pending:    { color:'#F59E0B', bg:'#FFFBE6', label:'Pendiente' },
  processing: { color:'#1485EE', bg:'#EFF5FD', label:'Procesando' },
  completed:  { color:'#52C41A', bg:'#F6FFED', label:'Completado' },
  failed:     { color:'#FF4D4F', bg:'#FFF1F0', label:'Fallido' },
  refunded:   { color:'#722ED1', bg:'#F3E8FF', label:'Reembolsado' },
};

const C = { bg:'#F8FAFF', card:'#fff', text:'#1A1D23', sub:'#8C8FA3', border:'#EEF0F6' };

export const ProviderOperatorDashboard: React.FC<Props> = ({ isAuthenticated, onBack, viewPadding, userProfile }) => {
  const [provider, setProvider] = useState<any>(null);
  const [orders, setOrders]     = useState<any[]>([]);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState<string|null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [toast, setToast]       = useState<{msg:string;ok:boolean}|null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const showToast = (msg: string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const loadProvider = useCallback(async () => {
    const r = await api('/api/provider/me');
    if (r.ok) { const d = await r.json(); setProvider(d); setAutoMode(d.auto_process||false); }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let url = '/api/provider/orders?limit=200';
    if (status) url += `&status=${status}`;
    const r = await api(url);
    if (r.ok) setOrders(await r.json()); else setOrders([]);
    setLoading(false);
  }, [status]);

  useEffect(() => { loadProvider(); }, [loadProvider]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Auto-refresh cada 30s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadOrders(), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadOrders]);

  const processOrder = async (id: string, newStatus: string) => {
    setProcessing(id);
    const r = await api(`/api/provider/orders/${id}/process`, { method:'PUT', body:JSON.stringify({ status:newStatus }) });
    if (r.ok) {
      showToast(`${STATUS_CFG[newStatus]?.label} ✓`);
      setOrders(prev => prev.map(o => o.id===id ? {...o, status:newStatus} : o));
    } else {
      const d = await r.json(); showToast(d.message||'Error', false);
    }
    setProcessing(null);
  };

  const toggleAuto = async () => {
    const newVal = !autoMode;
    const r = await api('/api/provider/auto-process', { method:'PUT', body:JSON.stringify({ auto_process:newVal }) });
    if (r.ok) { setAutoMode(newVal); showToast(newVal ? '🤖 Modo automático activado' : '⏸️ Modo automático desactivado'); }
    else { const d = await r.json(); showToast(d.message||'Error', false); }
  };

  const pcolor = provider?.color || '#1485EE';
  const pname  = provider?.name  || 'Mi empresa';
  const pending = orders.filter(o => o.status === 'pending').length;

  const FILTERS = [
    { k:'', label:'Todos' },
    { k:'pending', label:`Pendientes${pending>0?` (${pending})`:''}` },
    { k:'processing', label:'Procesando' },
    { k:'completed', label:'Completados' },
    { k:'failed', label:'Fallidos' },
  ];

  const fmt = (n: number) => Number(n||0).toLocaleString('es-GQ');

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, display:'flex', flexDirection:'column', zIndex:2000, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${pcolor},${pcolor}cc)`, paddingTop:viewPadding.top, padding:`calc(${viewPadding.top} + 10px) 20px 14px`, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Panel Operaciones</div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{pname}</div>
        </div>
        {/* Toggle automático */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'rgba(255,255,255,0.9)', fontSize:11, fontWeight:600 }}>{autoMode ? '🤖 Auto' : '👤 Manual'}</span>
          <button onClick={toggleAuto} style={{ width:48, height:26, borderRadius:13, border:'none', cursor:'pointer', background:autoMode?'#52C41A':'rgba(255,255,255,0.3)', position:'relative', transition:'background 0.2s' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:autoMode?24:4, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </button>
        </div>
        <button onClick={loadOrders} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Info modo automático */}
      {autoMode && (
        <div style={{ background:'#F6FFED', borderBottom:'1px solid #B7EB8F', padding:'8px 16px', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#135200' }}>
          <span style={{ fontSize:16 }}>🤖</span>
          <span><b>Modo automático activo:</b> Los pedidos se confirman automáticamente sin intervención manual.</span>
        </div>
      )}

      {/* Filtro por estado */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        <div style={{ display:'flex', padding:'8px 12px', gap:6 }}>
          {FILTERS.map(f => (
            <button key={f.k} onClick={() => setStatus(f.k)} style={{
              flexShrink:0, padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:status===f.k?700:500,
              background:status===f.k?pcolor:'#F5F6FA',
              color:status===f.k?'#fff':C.sub,
              transition:'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Lista de pedidos */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading && <div style={{ textAlign:'center', padding:40, color:C.sub }}>Cargando pedidos...</div>}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign:'center', padding:48, color:C.sub }}>
            <div style={{ fontSize:44, marginBottom:10 }}>📋</div>
            <div style={{ fontWeight:600, color:C.text, marginBottom:6 }}>{status ? `Sin pedidos ${STATUS_CFG[status]?.label?.toLowerCase()}` : 'Sin pedidos'}</div>
            <div style={{ fontSize:13 }}>Los pedidos de tus clientes aparecerán aquí en tiempo real</div>
          </div>
        )}

        {!loading && orders.map(order => {
          const sc = STATUS_CFG[order.status] || STATUS_CFG.pending;
          const isPending = order.status === 'pending';
          const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
          return (
            <div key={order.id} style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${isPending?'#FFD591':C.border}`, boxShadow:isPending?'0 2px 12px rgba(245,158,11,0.15)':'0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* Cabecera */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:`${pcolor}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {order.category === 'recarga' ? '📱' : order.category === 'internet' ? '🌐' : '📺'}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{order.package_name || order.category}</div>
                    <div style={{ fontSize:11, color:C.sub }}>
                      {elapsed < 60 ? `Hace ${elapsed}min` : `Hace ${Math.floor(elapsed/60)}h`}
                    </div>
                  </div>
                </div>
                <div style={{ background:sc.bg, color:sc.color, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>{sc.label}</div>
              </div>

              {/* Cliente */}
              <div style={{ background:'#F8FAFF', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{order.user_name || 'Cliente'}</div>
                    <div style={{ fontSize:12, color:C.sub }}>{order.user_phone}</div>
                  </div>
                  {order.phone_target && (
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:10, color:C.sub }}>Recargar a</div>
                      <div style={{ fontWeight:700, fontSize:14, color:pcolor }}>{order.phone_target}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Monto y acciones */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:'#52C41A' }}>{fmt(parseFloat(order.amount))} XAF</div>
                  <div style={{ fontSize:10, color:C.sub }}>Comisión EgChat: {fmt(parseFloat(order.amount)*0.015)} XAF</div>
                </div>
                {isPending && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={() => processOrder(order.id, 'failed')}
                      disabled={processing === order.id}
                      style={{ padding:'8px 14px', background:'#FFF1F0', color:'#FF4D4F', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}
                    >✗ Rechazar</button>
                    <button
                      onClick={() => processOrder(order.id, 'completed')}
                      disabled={processing === order.id}
                      style={{ padding:'8px 18px', background:`linear-gradient(135deg,#52C41A,#389E0D)`, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(82,196,26,0.35)' }}
                    >
                      {processing === order.id ? '...' : '✓ Confirmar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:toast.ok?'#1A1D23':'#CF1322', color:'#fff', padding:'10px 22px', borderRadius:24, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};
export default ProviderOperatorDashboard;
