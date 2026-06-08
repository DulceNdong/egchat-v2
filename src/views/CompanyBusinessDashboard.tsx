/**
 * CompanyBusinessDashboard.tsx
 * Panel Empresarial Extendido para cuentas oficiales
 * 
 * Secciones:
 *   1. Resumen (KPIs de actividad)
 *   2. Regiones (Insular / Continental)
 *   3. Organigrama (editable con fotos y contactos)
 *   4. Estadísticas de consumo por región
 *   5. Comunicados (publicar a todos los usuarios de EgChat)
 *   6. Empleados internos (gestión de staff + chats internos)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface Props {
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  userProfile: any;
  onOpenChat?: (userId: string, name: string) => void;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const api = (p: string, o?: RequestInit) =>
  fetch(`${API_BASE}${p}`, { ...o, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(o?.headers || {}) } });

type Tab = 'overview' | 'regions' | 'org' | 'stats' | 'announcements' | 'staff';

const ANN_CATEGORIES = [
  { k:'general',      label:'General',       color:'#1485EE' },
  { k:'mantenimiento',label:'Mantenimiento', color:'#FA8C16' },
  { k:'corte',        label:'Corte',         color:'#FF4D4F' },
  { k:'aviso',        label:'Aviso',         color:'#722ED1' },
  { k:'oferta',       label:'Oferta',        color:'#52C41A' },
];

const C = { bg:'#F5F7FF', card:'#fff', text:'#1A1D23', sub:'#8C8FA3', border:'#E8ECF4' };

export const CompanyBusinessDashboard: React.FC<Props> = ({ isAuthenticated, onBack, viewPadding, userProfile, onOpenChat }) => {
  const { role, hasPermission, is_verified } = useRole(isAuthenticated);
  const [tab, setTab] = useState<Tab>('overview');
  const [provider, setProvider] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [org, setOrg] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  // Forms
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [showStatForm, setShowStatForm] = useState(false);

  const [orgForm, setOrgForm] = useState({ name:'', title:'', phone:'', email:'', region_id:'', parent_id:'', photo_url:'' });
  const [annForm, setAnnForm] = useState({ title:'', body:'', category:'general', region_id:'', cover_url:'', expires_at:'' });
  const [staffPhone, setStaffPhone] = useState('');
  const [staffTitle, setStaffTitle] = useState('Empleado');
  const [staffRegion, setStaffRegion] = useState('');
  const [regionForm, setRegionForm] = useState({ name:'', description:'', color:'#1485EE' });
  const [statForm, setStatForm] = useState({ stat_label:'', stat_value:'', unit:'', period:'', stat_type:'consumption_kwh', region_id:'' });

  const showToast = (msg: string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const loadProvider = useCallback(async () => {
    const r = await api('/api/provider/me');
    if (r.ok) setProvider(await r.json());
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rg, or, st, an, sf, ov] = await Promise.all([
        api('/api/company/regions'),
        api('/api/company/org'),
        api('/api/company/stats'),
        api('/api/company/announcements'),
        api('/api/company/staff'),
        api('/api/provider/stats/director'),
      ]);
      if (rg.ok) setRegions(await rg.json());
      if (or.ok) setOrg(await or.json());
      if (st.ok) setStats(await st.json());
      if (an.ok) setAnnouncements(await an.json());
      if (sf.ok) setStaff(await sf.json());
      if (ov.ok) setOverview(await ov.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadProvider(); loadData(); }, [loadProvider, loadData]);

  const fmt = (n: number) => Number(n||0).toLocaleString('es-GQ');
  const pcolor = provider?.color || '#1485EE';

  // ── Helpers de acciones ──────────────────────────────────────────
  const addRegion = async () => {
    const r = await api('/api/company/regions', { method:'POST', body:JSON.stringify(regionForm) });
    if (r.ok) { showToast('Región creada'); setShowRegionForm(false); setRegionForm({name:'',description:'',color:'#1485EE'}); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const addOrgMember = async () => {
    const r = await api('/api/company/org', { method:'POST', body:JSON.stringify(orgForm) });
    if (r.ok) { showToast('Miembro añadido'); setShowOrgForm(false); setOrgForm({name:'',title:'',phone:'',email:'',region_id:'',parent_id:'',photo_url:''}); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const addStat = async () => {
    const r = await api('/api/company/stats', { method:'POST', body:JSON.stringify(statForm) });
    if (r.ok) { showToast('Estadística añadida'); setShowStatForm(false); setStatForm({stat_label:'',stat_value:'',unit:'',period:'',stat_type:'consumption_kwh',region_id:''}); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const createAnnouncement = async () => {
    const r = await api('/api/company/announcements', { method:'POST', body:JSON.stringify(annForm) });
    if (r.ok) { showToast('Comunicado creado'); setShowAnnForm(false); setAnnForm({title:'',body:'',category:'general',region_id:'',cover_url:'',expires_at:''}); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const publishAnn = async (id: string, publish: boolean) => {
    const r = await api(`/api/company/announcements/${id}/publish`, { method:'PUT', body:JSON.stringify({publish}) });
    if (r.ok) { showToast(publish ? '✓ Publicado — llega a todos los usuarios' : 'Despublicado'); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const addStaff = async () => {
    const r = await api('/api/company/staff', { method:'POST', body:JSON.stringify({phone:staffPhone, role_title:staffTitle, region_id:staffRegion||undefined}) });
    if (r.ok) { showToast('Empleado añadido'); setShowStaffForm(false); setStaffPhone(''); setStaffTitle('Empleado'); setStaffRegion(''); loadData(); }
    else { const d=await r.json(); showToast(d.message||'Error',false); }
  };

  const removeStaff = async (userId: string) => {
    const r = await api(`/api/company/staff/${userId}`, { method:'DELETE' });
    if (r.ok) { showToast('Empleado eliminado'); loadData(); }
  };

  const TABS: Array<{id:Tab;label:string;icon:string}> = [
    {id:'overview',      label:'Resumen',     icon:'📊'},
    {id:'regions',       label:'Regiones',    icon:'🗺️'},
    {id:'org',           label:'Organigrama', icon:'🏗️'},
    {id:'stats',         label:'Consumo',     icon:'⚡'},
    {id:'announcements', label:'Comunicados', icon:'📢'},
    {id:'staff',         label:'Empleados',   icon:'👥'},
  ];

  return (
    <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',zIndex:2000,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',background:C.bg}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1B2B6B 0%,#0D1B4B 100%)', paddingTop:viewPadding.top, padding:`calc(${viewPadding.top} + 10px) 20px 0`}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
          <button onClick={onBack} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{flex:1}}>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:10,textTransform:'uppercase',letterSpacing:1}}>Panel Empresarial</div>
            <div style={{color:'#fff',fontWeight:800,fontSize:17,display:'flex',alignItems:'center',gap:8}}>
              {provider?.name || userProfile?.name}
              {is_verified && <VerifiedBadge type={role as any} size={17}/>}
            </div>
          </div>
          <button onClick={loadData} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>

        {/* Tabs horizontales con scroll */}
        <div style={{display:'flex',overflowX:'auto',gap:2,background:'rgba(255,255,255,0.07)',borderRadius:'10px 10px 0 0',padding:'2px 4px 0'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flexShrink:0, padding:'10px 14px', background:'none', border:'none', cursor:'pointer',
              color: tab===t.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: tab===t.id ? 700 : 400, fontSize:12,
              borderBottom: tab===t.id ? `2px solid ${pcolor}` : '2px solid transparent',
              whiteSpace:'nowrap',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        {loading && <div style={{textAlign:'center',padding:40,color:C.sub}}>Cargando...</div>}

        {/* ══ OVERVIEW ══ */}
        {!loading && tab==='overview' && overview && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {label:'Ingresos brutos',  value:`${fmt(overview.total?.revenue)} XAF`,    icon:'💰', color:pcolor},
                {label:'Comisión EgChat',  value:`${fmt(overview.total?.commission)} XAF`, icon:'📊', color:'#FF4D4F'},
                {label:'Ingresos netos',   value:`${fmt(overview.total?.net)} XAF`,        icon:'✅', color:'#52C41A'},
                {label:'Total pedidos',    value:overview.total?.orders??0,               icon:'🧾', color:'#1485EE'},
                {label:'Pendientes',       value:overview.pending??0,                      icon:'⏳', color:'#FA8C16'},
                {label:'Empleados',        value:staff.length,                             icon:'👥', color:'#722ED1'},
              ].map(k => (
                <div key={k.label} style={{background:C.card,borderRadius:16,padding:'14px 12px',border:`1px solid ${C.border}`,boxShadow:'0 1px 6px rgba(0,0,0,0.04)',textAlign:'center'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
                  <div style={{fontSize:typeof k.value==='string'&&k.value.length>10?13:20,fontWeight:800,color:k.color}}>{k.value}</div>
                  <div style={{fontSize:11,color:C.sub,marginTop:3}}>{k.label}</div>
                </div>
              ))}
            </div>
            {overview.daily?.length>0 && (
              <div style={{background:C.card,borderRadius:16,padding:16,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>Últimos 7 días</div>
                <div style={{display:'flex',alignItems:'flex-end',gap:6,height:70}}>
                  {(() => { const mx=Math.max(...overview.daily.map((d:any)=>parseFloat(d.revenue)||0),1); return overview.daily.map((d:any)=>{const h=Math.max(4,Math.round((parseFloat(d.revenue)||0)/mx*64));return(<div key={d.date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><div style={{width:'100%',height:`${h}px`,background:pcolor+'cc',borderRadius:'3px 3px 0 0'}}/><div style={{fontSize:9,color:C.sub}}>{new Date(d.date).toLocaleDateString('es-ES',{weekday:'short'})}</div></div>);}); })()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ REGIONES ══ */}
        {!loading && tab==='regions' && (
          <>
            <button onClick={()=>setShowRegionForm(true)} style={{padding:'12px',background:pcolor,color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:13}}>+ Añadir región</button>
            {showRegionForm && (
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                {[{k:'name',l:'Nombre (ej: Región Insular)',t:'text'},{k:'description',l:'Descripción',t:'text'}].map(f=>(
                  <input key={f.k} type={f.t} placeholder={f.l} value={(regionForm as any)[f.k]} onChange={e=>setRegionForm(p=>({...p,[f.k]:e.target.value}))}
                    style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                ))}
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowRegionForm(false)} style={{flex:1,padding:10,background:'#F5F7FF',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,color:C.sub,fontSize:13}}>Cancelar</button>
                  <button onClick={addRegion} style={{flex:2,padding:10,background:pcolor,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>Crear región</button>
                </div>
              </div>
            )}
            {regions.length===0 ? (
              <div style={{textAlign:'center',padding:32,color:C.sub}}>
                <div style={{fontSize:36,marginBottom:8}}>🗺️</div>
                <div>Añade las regiones de tu empresa (ej: Región Insular, Región Continental)</div>
              </div>
            ) : regions.map(r => (
              <div key={r.id} style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:r.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🗺️</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.text}}>{r.name}</div>
                  {r.description && <div style={{fontSize:12,color:C.sub}}>{r.description}</div>}
                </div>
                <div style={{fontSize:12,color:r.color,fontWeight:700,background:r.color+'18',padding:'3px 10px',borderRadius:20}}>Activa</div>
              </div>
            ))}
          </>
        )}

        {/* ══ ORGANIGRAMA ══ */}
        {!loading && tab==='org' && (
          <>
            <button onClick={()=>setShowOrgForm(true)} style={{padding:'12px',background:pcolor,color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:13}}>+ Añadir miembro</button>
            {showOrgForm && (
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,marginBottom:12,color:C.text}}>Nuevo miembro del organigrama</div>
                {[{k:'name',l:'Nombre completo *'},{k:'title',l:'Cargo * (ej: Director General)'},{k:'phone',l:'Teléfono (número en EgChat)'},{k:'email',l:'Email'}].map(f=>(
                  <input key={f.k} placeholder={f.l} value={(orgForm as any)[f.k]} onChange={e=>setOrgForm(p=>({...p,[f.k]:e.target.value}))}
                    style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                ))}
                <select value={orgForm.region_id} onChange={e=>setOrgForm(p=>({...p,region_id:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Sin región asignada</option>
                  {regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={orgForm.parent_id} onChange={e=>setOrgForm(p=>({...p,parent_id:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:12,fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Sin superior (nivel raíz)</option>
                  {org.map(o=><option key={o.id} value={o.id}>{o.name} — {o.title}</option>)}
                </select>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowOrgForm(false)} style={{flex:1,padding:10,background:'#F5F7FF',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,color:C.sub,fontSize:13}}>Cancelar</button>
                  <button onClick={addOrgMember} style={{flex:2,padding:10,background:pcolor,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>Añadir</button>
                </div>
              </div>
            )}
            {org.length===0 ? (
              <div style={{textAlign:'center',padding:32,color:C.sub}}>
                <div style={{fontSize:36,marginBottom:8}}>🏗️</div>
                <div>Construye el organigrama de tu empresa con fotos y contactos</div>
              </div>
            ) : org.map(m => (
              <div key={m.id} style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`,display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:48,height:48,borderRadius:'50%',background:pcolor+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,overflow:'hidden'}}>
                  {m.photo_url ? <img src={m.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : '👤'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.text}}>{m.name}</div>
                  <div style={{fontSize:12,color:pcolor,fontWeight:600}}>{m.title}</div>
                  {m.region_name && <div style={{fontSize:11,color:C.sub}}>📍 {m.region_name}</div>}
                  {m.phone && <div style={{fontSize:11,color:C.sub}}>📞 {m.phone}</div>}
                </div>
                {m.phone && onOpenChat && m.user_id && (
                  <button onClick={()=>onOpenChat(m.user_id, m.name)} style={{padding:'7px 12px',background:pcolor,color:'#fff',border:'none',borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>Chat</button>
                )}
              </div>
            ))}
          </>
        )}

        {/* ══ ESTADÍSTICAS DE CONSUMO ══ */}
        {!loading && tab==='stats' && (
          <>
            <button onClick={()=>setShowStatForm(true)} style={{padding:'12px',background:pcolor,color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:13}}>+ Añadir estadística</button>
            {showStatForm && (
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                <input placeholder="Etiqueta (ej: Consumo total kWh)" value={statForm.stat_label} onChange={e=>setStatForm(p=>({...p,stat_label:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <input type="number" placeholder="Valor" value={statForm.stat_value} onChange={e=>setStatForm(p=>({...p,stat_value:e.target.value}))}
                    style={{flex:2,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}/>
                  <input placeholder="Unidad (kWh, €)" value={statForm.unit} onChange={e=>setStatForm(p=>({...p,unit:e.target.value}))}
                    style={{flex:1,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}/>
                </div>
                <input placeholder="Período (ej: Enero 2026)" value={statForm.period} onChange={e=>setStatForm(p=>({...p,period:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                <select value={statForm.region_id} onChange={e=>setStatForm(p=>({...p,region_id:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:12,fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Todas las regiones</option>
                  {regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowStatForm(false)} style={{flex:1,padding:10,background:'#F5F7FF',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,color:C.sub,fontSize:13}}>Cancelar</button>
                  <button onClick={addStat} style={{flex:2,padding:10,background:pcolor,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>Añadir</button>
                </div>
              </div>
            )}
            {stats.length===0 ? (
              <div style={{textAlign:'center',padding:32,color:C.sub}}>
                <div style={{fontSize:36,marginBottom:8}}>⚡</div>
                <div>Añade estadísticas de consumo por región (kWh, clientes, incidencias)</div>
              </div>
            ) : regions.map(reg => {
              const regStats = stats.filter(s => s.region_id === reg.id);
              if (regStats.length === 0) return null;
              return (
                <div key={reg.id} style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:700,color:C.text,marginBottom:10}}>📍 {reg.name}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {regStats.map(s => (
                      <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                        <div>
                          <div style={{fontSize:13,color:C.text}}>{s.stat_label}</div>
                          {s.period && <div style={{fontSize:11,color:C.sub}}>{s.period}</div>}
                        </div>
                        <div style={{fontWeight:800,color:pcolor,fontSize:16}}>{Number(s.stat_value).toLocaleString()} {s.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══ COMUNICADOS ══ */}
        {!loading && tab==='announcements' && (
          <>
            <div style={{background:'#EFF5FD',borderRadius:12,padding:'10px 14px',border:'1px solid #C7D9FF',fontSize:12,color:'#1A3A6B',lineHeight:1.6}}>
              📢 Los comunicados <b>publicados</b> llegan a todos los usuarios de EgChat y aparecen en la pestaña de tu empresa dentro de Servicios.
            </div>
            <button onClick={()=>setShowAnnForm(true)} style={{padding:'12px',background:pcolor,color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:13}}>+ Nuevo comunicado</button>
            {showAnnForm && (
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                <input placeholder="Título del comunicado *" value={annForm.title} onChange={e=>setAnnForm(p=>({...p,title:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                <textarea placeholder="Texto del comunicado *" value={annForm.body} onChange={e=>setAnnForm(p=>({...p,body:e.target.value}))} rows={4}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',resize:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <select value={annForm.category} onChange={e=>setAnnForm(p=>({...p,category:e.target.value}))}
                    style={{flex:1,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:'none',background:'#fff'}}>
                    {ANN_CATEGORIES.map(c=><option key={c.k} value={c.k}>{c.label}</option>)}
                  </select>
                  <select value={annForm.region_id} onChange={e=>setAnnForm(p=>({...p,region_id:e.target.value}))}
                    style={{flex:1,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:'none',background:'#fff'}}>
                    <option value="">Todas las regiones</option>
                    {regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowAnnForm(false)} style={{flex:1,padding:10,background:'#F5F7FF',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,color:C.sub,fontSize:13}}>Cancelar</button>
                  <button onClick={createAnnouncement} style={{flex:2,padding:10,background:pcolor,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>Guardar comunicado</button>
                </div>
              </div>
            )}
            {announcements.length===0 ? (
              <div style={{textAlign:'center',padding:32,color:C.sub}}>
                <div style={{fontSize:36,marginBottom:8}}>📢</div>
                <div>Crea comunicados para informar a tus clientes (cortes, mantenimiento, ofertas)</div>
              </div>
            ) : announcements.map(a => {
              const cat = ANN_CATEGORIES.find(c=>c.k===a.category)||{color:pcolor,label:'General'};
              return (
                <div key={a.id} style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${a.is_published?cat.color+'44':C.border}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:C.text,marginBottom:3}}>{a.title}</div>
                      <div style={{fontSize:11,color:C.sub}}>{new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <div style={{background:cat.color+'18',color:cat.color,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,marginLeft:8}}>{cat.label}</div>
                  </div>
                  <div style={{fontSize:12,color:C.sub,marginBottom:12,lineHeight:1.5}}>{a.body.slice(0,120)}{a.body.length>120?'...':''}</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>publishAnn(a.id,!a.is_published)}
                      style={{flex:1,padding:'8px 0',background:a.is_published?'#FFF1F0':'linear-gradient(135deg,#52C41A,#389E0D)',color:a.is_published?'#FF4D4F':'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                      {a.is_published ? '⏸ Despublicar' : '🚀 Publicar ahora'}
                    </button>
                    {a.is_published && <div style={{background:'#F6FFED',color:'#52C41A',padding:'8px 12px',borderRadius:10,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#52C41A',display:'inline-block'}}/> Publicado</div>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══ EMPLEADOS ══ */}
        {!loading && tab==='staff' && (
          <>
            <div style={{background:'#EFF5FD',borderRadius:12,padding:'10px 14px',border:'1px solid #C7D9FF',fontSize:12,color:'#1A3A6B',lineHeight:1.6}}>
              👥 Añade empleados de tu empresa por número de teléfono. Deben tener cuenta en EgChat. Podrás crear chats internos con ellos.
            </div>
            <button onClick={()=>setShowStaffForm(true)} style={{padding:'12px',background:pcolor,color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:13}}>+ Añadir empleado</button>
            {showStaffForm && (
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                <input placeholder="Teléfono del empleado en EgChat *" value={staffPhone} onChange={e=>setStaffPhone(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                <input placeholder="Cargo (ej: Técnico, Gestor)" value={staffTitle} onChange={e=>setStaffTitle(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                <select value={staffRegion} onChange={e=>setStaffRegion(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:12,fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Sin región asignada</option>
                  {regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowStaffForm(false)} style={{flex:1,padding:10,background:'#F5F7FF',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,color:C.sub,fontSize:13}}>Cancelar</button>
                  <button onClick={addStaff} style={{flex:2,padding:10,background:pcolor,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>Añadir empleado</button>
                </div>
              </div>
            )}
            {staff.length===0 ? (
              <div style={{textAlign:'center',padding:32,color:C.sub}}>
                <div style={{fontSize:36,marginBottom:8}}>👥</div>
                <div>Añade empleados para crear chats internos y grupos de trabajo</div>
              </div>
            ) : staff.map(s => (
              <div key={s.id} style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:pcolor+'22',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                  {s.avatar_url ? <img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : '👤'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.text}}>{s.full_name}</div>
                  <div style={{fontSize:12,color:pcolor,fontWeight:600}}>{s.role_title}</div>
                  <div style={{fontSize:11,color:C.sub}}>{s.phone}{s.region_name?` • ${s.region_name}`:''}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {onOpenChat && <button onClick={()=>onOpenChat(s.user_id,s.full_name)} style={{padding:'6px 10px',background:pcolor,color:'#fff',border:'none',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer'}}>Chat</button>}
                  <button onClick={()=>removeStaff(s.user_id)} style={{padding:'6px 10px',background:'#FFF1F0',color:'#FF4D4F',border:'none',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer'}}>✗</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {toast && (
        <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:toast.ok?'#1A1D23':'#CF1322',color:'#fff',padding:'10px 22px',borderRadius:24,fontSize:13,fontWeight:600,zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default CompanyBusinessDashboard;
