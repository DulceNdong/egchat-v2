/**
 * ProviderDirectorDashboard.tsx
 * Panel Ejecutivo del Director/CEO del proveedor
 * Ve: ganancias, comisiones EgChat (1.5%), tendencias
 * NO puede procesar pedidos — solo visualización
 */
import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';

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

const C = { bg:'#F8FAFF', card:'#fff', text:'#1A1D23', sub:'#8C8FA3', border:'#EEF0F6' };

export const ProviderDirectorDashboard: React.FC<Props> = ({ isAuthenticated, onBack, viewPadding, userProfile }) => {
  const [provider, setProvider] = useState<any>(null);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'today'|'month'|'total'>('today');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api('/api/provider/me'), api('/api/provider/stats/director'),
      ]);
      if (pRes.ok) setProvider(await pRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pcolor = provider?.color || '#1485EE';
  const pname  = provider?.name  || 'Mi empresa';

  const TAB_DATA: Record<string, any> = {
    today: stats?.today, month: stats?.month, total: stats?.total,
  };
  const d = TAB_DATA[tab] || {};

  const fmt = (n: number) => Number(n || 0).toLocaleString('es-GQ');

  // Bar chart simple con divs
  const maxRev = Math.max(...(stats?.daily || []).map((d: any) => parseFloat(d.revenue) || 0), 1);

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, display:'flex', flexDirection:'column', zIndex:2000, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${pcolor},${pcolor}cc)`, paddingTop:viewPadding.top, padding:`calc(${viewPadding.top} + 10px) 20px 18px`, display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginBottom:2, letterSpacing:0.5, textTransform:'uppercase' }}>Panel Ejecutivo</div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:17, display:'flex', alignItems:'center', gap:8 }}>
            {pname} <VerifiedBadge type="business" size={17}/>
          </div>
        </div>
        <button onClick={load} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Periodo tabs */}
      <div style={{ display:'flex', background:C.card, borderBottom:`1px solid ${C.border}` }}>
        {[['today','Hoy'],['month','Este mes'],['total','Total']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer', fontWeight:tab===k?700:400, color:tab===k?pcolor:C.sub, borderBottom:tab===k?`2.5px solid ${pcolor}`:'2.5px solid transparent', fontSize:13 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 16px', display:'flex', flexDirection:'column', gap:14 }}>
        {loading ? <div style={{ textAlign:'center', padding:48, color:C.sub }}>Cargando...</div> : <>

          {/* KPIs principales */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Ventas brutas',  value:`${fmt(d.revenue)} XAF`,    icon:'💰', color:pcolor,    bg:`${pcolor}18`, desc:'Total facturado a clientes' },
              { label:'Comisión EgChat',value:`${fmt(d.commission)} XAF`, icon:'📊', color:'#FF4D4F', bg:'#FFF1F0',    desc:`${((stats?.commission_rate||0.015)*100).toFixed(1)}% por cada venta` },
              { label:'Ingresos netos', value:`${fmt(d.net)} XAF`,        icon:'✅', color:'#52C41A', bg:'#F6FFED',    desc:'Después de comisión EgChat' },
              { label:'Pedidos',        value:d.orders??0,                icon:'🛒', color:'#1485EE', bg:'#EFF5FD',    desc:'Transacciones completadas' },
              { label:'Pendientes',     value:stats?.pending??0,          icon:'⏳', color:'#F59E0B', bg:'#FFFBE6',    desc:'Requieren procesamiento' },
              { label:'Tasa éxito',     value:d.orders>0?`${Math.round((d.orders/(d.orders+(stats?.pending||0)))*100)}%`:'—', icon:'📈', color:'#722ED1', bg:'#F3E8FF', desc:'Pedidos completados vs total' },
            ].map(k => (
              <div key={k.label} style={{ background:C.card, borderRadius:18, padding:'14px 12px', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', border:`1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ width:40, height:40, borderRadius:13, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 8px' }}>{k.icon}</div>
                <div style={{ fontSize:typeof k.value==='string'&&k.value.length>10?13:18, fontWeight:800, color:k.color, lineHeight:1.2 }}>{k.value}</div>
                <div style={{ fontSize:11, fontWeight:600, color:C.text, marginTop:3 }}>{k.label}</div>
                <div style={{ fontSize:10, color:C.sub, marginTop:2, lineHeight:1.4 }}>{k.desc}</div>
              </div>
            ))}
          </div>

          {/* Gráfico últimos 7 días */}
          {stats?.daily?.length > 0 && (
            <div style={{ background:C.card, borderRadius:18, padding:18, border:`1px solid ${C.border}`, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:16 }}>📈 Últimos 7 días</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
                {stats.daily.map((day: any) => {
                  const h = Math.round((parseFloat(day.revenue)||0) / maxRev * 76);
                  return (
                    <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:9, color:C.sub, fontWeight:600 }}>{fmt(parseFloat(day.revenue)||0).slice(0,-4)||'0'}</div>
                      <div style={{ width:'100%', height:`${h||4}px`, background:`${pcolor}cc`, borderRadius:'4px 4px 0 0', minHeight:4 }}/>
                      <div style={{ fontSize:9, color:C.sub }}>{new Date(day.date).toLocaleDateString('es-ES',{weekday:'short'})}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Por producto */}
          {stats?.by_product?.length > 0 && (
            <div style={{ background:C.card, borderRadius:18, padding:18, border:`1px solid ${C.border}`, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:14 }}>📦 Por producto</div>
              {stats.by_product.map((p: any, i: number) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{p.package_name || p.category}</div>
                    <div style={{ fontSize:11, color:C.sub }}>{p.orders} pedidos</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, color:pcolor, fontSize:14 }}>{fmt(parseFloat(p.revenue))} XAF</div>
                    <div style={{ fontSize:10, color:'#FF4D4F' }}>-{fmt(parseFloat(p.revenue)*0.015)} comisión</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info comisión */}
          <div style={{ background:'#FFFBE6', borderRadius:14, padding:'12px 16px', border:'1px solid #FFD591', fontSize:13, color:'#7D4E00', lineHeight:1.6 }}>
            💡 <b>Comisión EgChat:</b> El 1.5% de cada venta procesada a través de la plataforma se descuenta automáticamente. Este es el coste de usar la infraestructura de EgChat para llegar a tus clientes.
          </div>
        </>}
      </div>
    </div>
  );
};
export default ProviderDirectorDashboard;
