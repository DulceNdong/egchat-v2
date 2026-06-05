import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { ThemeContext } from './context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminRole = 'super_admin'|'operations'|'support'|'finance'|'security'|'auditor';

// ── Themes ────────────────────────────────────────────────────────────────────
interface Theme { id:string;name:string;preview:string;bg:string;bgSide:string;bgCard:string;border:string;text:string;textMuted:string;l1:string;l2:string;l3:string; }
const THEMES: Theme[] = [
  { id:'navy',    name:'Navy',        preview:'#07111e', bg:'#050d18', bgSide:'#07111e', bgCard:'#0a1628', border:'#0d1e2e', text:'#c8dcea', textMuted:'#2e5070', l1:'#7c6fcd', l2:'#4a8fc4', l3:'#3aaa8a' },
  { id:'slate',   name:'Slate',       preview:'#1a1f2e', bg:'#111827', bgSide:'#1a1f2e', bgCard:'#1e2538', border:'#252d3f', text:'#d4dce8', textMuted:'#4a5568', l1:'#818cf8', l2:'#60a5fa', l3:'#34d399' },
  { id:'midnight',name:'Midnight',    preview:'#0d0d1a', bg:'#080810', bgSide:'#0d0d1a', bgCard:'#111120', border:'#1a1a2e', text:'#c8c8e8', textMuted:'#2e2e50', l1:'#a78bfa', l2:'#6ea8fe', l3:'#4ade80' },
  { id:'charcoal',name:'Carbón',      preview:'#1c1c1e', bg:'#141414', bgSide:'#1c1c1e', bgCard:'#222224', border:'#2c2c2e', text:'#e0e0e6', textMuted:'#48484a', l1:'#bf8fee', l2:'#5eb8f0', l3:'#52c89a' },
  { id:'light',   name:'Claro',       preview:'#f0f4f8', bg:'#f0f4f8', bgSide:'#e8eef4', bgCard:'#ffffff', border:'#d0dce8', text:'#1a2e3a', textMuted:'#6b8aa8', l1:'#6050b8', l2:'#2a70b8', l3:'#1a9a7a' },
  { id:'light-warm',name:'Cálido',    preview:'#f5f0ea', bg:'#f5f0ea', bgSide:'#ece5dc', bgCard:'#ffffff', border:'#d8cebe', text:'#2a1e10', textMuted:'#8a7060', l1:'#9060c0', l2:'#d07030', l3:'#1a9a6a' },
  { id:'teal-light',name:'Aguamarina',preview:'#e8f6f4', bg:'#edf8f6', bgSide:'#ddf0ec', bgCard:'#ffffff', border:'#b8e0d8', text:'#0a2822', textMuted:'#3a7870', l1:'#6040b0', l2:'#0890a0', l3:'#00c8a0' },
  { id:'purple-light',name:'Lavanda', preview:'#f0ecf8', bg:'#f2eef8', bgSide:'#e8e0f4', bgCard:'#ffffff', border:'#d0c4e8', text:'#1a0e30', textMuted:'#7060a0', l1:'#8060d8', l2:'#6080e0', l3:'#40b890' },
];
const THEME_KEY = 'egchat-admin-theme';
function loadTheme() { try { const id = localStorage.getItem(THEME_KEY); return THEMES.find(t=>t.id===id)??THEMES[0]; } catch { return THEMES[0]; } }
function saveTheme(t: Theme) { try { localStorage.setItem(THEME_KEY, t.id); } catch {} }
function applyTheme(t: Theme) { const r = document.documentElement.style; r.setProperty('--bg',t.bg); r.setProperty('--bg-side',t.bgSide); r.setProperty('--bg-card',t.bgCard); r.setProperty('--border',t.border); r.setProperty('--text',t.text); r.setProperty('--text-muted',t.textMuted); r.setProperty('--l1',t.l1); r.setProperty('--l2',t.l2); r.setProperty('--l3',t.l3); }

// ── Level permissions ─────────────────────────────────────────────────────────
const LEVEL_ACCESS: Record<number, AdminRole[]> = {
  1: ['super_admin','auditor'],
  2: ['super_admin','operations','support','finance'],
  3: ['super_admin','security','operations'],
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const S = (c: React.ReactNode, w=18) => <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:'inline-block'}}>{c}</svg>;
const Ico = {
  Dashboard:     ({s=18})=>S(<><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/></>,s),
  TrendingUp:    ({s=18})=>S(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,s),
  Target:        ({s=18})=>S(<><circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={6}/><circle cx={12} cy={12} r={2}/></>,s),
  ShieldAlert:   ({s=18})=>S(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></>,s),
  Users:         ({s=18})=>S(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,s),
  MessageSquare: ({s=18})=>S(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,s),
  Wallet:        ({s=18})=>S(<><rect x={1} y={4} width={22} height={16} rx={2}/><line x1={1} y1={10} x2={23} y2={10}/></>,s),
  Headphones:    ({s=18})=>S(<><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>,s),
  AppWindow:     ({s=18})=>S(<><rect x={3} y={3} width={18} height={18} rx={2}/><line x1={3} y1={9} x2={21} y2={9}/><line x1={9} y1={21} x2={9} y2={9}/></>,s),
  Server:        ({s=18})=>S(<><rect x={2} y={2} width={20} height={8} rx={2}/><rect x={2} y={14} width={20} height={8} rx={2}/><line x1={6} y1={6} x2={6.01} y2={6}/><line x1={6} y1={18} x2={6.01} y2={18}/></>,s),
  GitBranch:     ({s=18})=>S(<><line x1={6} y1={3} x2={6} y2={15}/><circle cx={18} cy={6} r={3}/><circle cx={6} cy={18} r={3}/><path d="M18 9a9 9 0 0 1-9 9"/></>,s),
  ShieldCheck:   ({s=18})=>S(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,s),
  ClipboardList: ({s=18})=>S(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x={8} y={2} width={8} height={4} rx={1}/><line x1={9} y1={12} x2={15} y2={12}/><line x1={9} y1={16} x2={15} y2={16}/></>,s),
  RefreshCw:     ({s=18})=>S(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,s),
  LogOut:        ({s=14})=>S(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1={21} y1={12} x2={9} y2={12}/></>,s),
};

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { level:1, label:'NIVEL 1 — DIRECCIÓN',   color:'#7c6fcd', border:'rgba(124,111,205,0.3)', bg:'rgba(124,111,205,0.07)', activeBg:'rgba(124,111,205,0.16)',
    items:[{to:'/dashboard/executive',label:'Ejecutivo',I:Ico.Dashboard},{to:'/dashboard/financial',label:'Financiero',I:Ico.TrendingUp},{to:'/dashboard/strategic',label:'Estratégico',I:Ico.Target},{to:'/dashboard/risk',label:'Riesgo',I:Ico.ShieldAlert}] },
  { level:2, label:'NIVEL 2 — OPERACIONES', color:'#4a8fc4', border:'rgba(74,143,196,0.3)',  bg:'rgba(74,143,196,0.07)',  activeBg:'rgba(74,143,196,0.16)',
    items:[{to:'/dashboard/users',label:'Usuarios',I:Ico.Users},{to:'/dashboard/chat',label:'Chat',I:Ico.MessageSquare},{to:'/dashboard/wallet',label:'Wallet',I:Ico.Wallet},{to:'/dashboard/support',label:'Soporte',I:Ico.Headphones},{to:'/dashboard/mini-apps',label:'Mini Apps',I:Ico.AppWindow}] },
  { level:3, label:'NIVEL 3 — TECNOLOGÍA',  color:'#2aaa7a', border:'rgba(42,170,122,0.3)',  bg:'rgba(42,170,122,0.07)',  activeBg:'rgba(42,170,122,0.16)',
    items:[{to:'/dashboard/infrastructure',label:'Infraestructura',I:Ico.Server},{to:'/dashboard/devops',label:'DevOps',I:Ico.GitBranch},{to:'/dashboard/security',label:'Seguridad',I:Ico.ShieldCheck},{to:'/dashboard/audit',label:'Auditoría',I:Ico.ClipboardList},{to:'/dashboard/sqlite-sync',label:'Sincronización',I:Ico.RefreshCw}] },
];

function getFirstRoute(role: AdminRole) {
  for (const g of NAV_GROUPS) { if (LEVEL_ACCESS[g.level].includes(role)) return g.items[0].to; }
  return '/dashboard/executive';
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({size=30}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width={40} height={40} rx={10} fill="white"/>
    <rect x={4} y={4} width={32} height={32} rx={8} fill="url(#egG)"/>
    <defs><linearGradient id="egG" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#00c8a0"/><stop offset="1" stopColor="#00b4e6"/></linearGradient></defs>
    <path d="M28 15a2 2 0 0 0-2-2H14a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8l4 3v-3h2V15z" fill="white" fillOpacity={0.95}/>
    <circle cx={15.5} cy={19} r={1.4} fill="#00c8a0"/><circle cx={20} cy={19} r={1.4} fill="#00c8a0"/><circle cx={24.5} cy={19} r={1.4} fill="#00c8a0"/>
  </svg>;
}

// ── NavItem with hover ────────────────────────────────────────────────────────
function NavItem({to,label,I,color,activeBg,collapsed,textMuted}:any) {
  const [hov,setHov] = useState(false);
  return <NavLink to={to} title={collapsed?label:undefined}
    style={({isActive})=>({ display:'flex', alignItems:'center', gap:collapsed?0:9, justifyContent:collapsed?'center':'flex-start', padding:collapsed?'8px 0':'7px 9px', borderRadius:8, marginBottom:2, textDecoration:'none', fontSize:12, fontWeight:isActive?700:hov?600:400, color:isActive||hov?color:textMuted, background:isActive?activeBg:hov?activeBg+'80':'transparent', borderLeft:!collapsed&&isActive?`3px solid ${color}`:!collapsed&&hov?`3px solid ${color}60`:'3px solid transparent', transform:hov&&!isActive?'translateX(3px)':'translateX(0)', boxShadow:hov?`2px 2px 8px ${color}15`:'none', transition:'all 0.15s cubic-bezier(0.4,0,0.2,1)' })}
    onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
    <span style={{flexShrink:0,transform:hov?'scale(1.1)':'scale(1)',transition:'transform 0.15s',display:'inline-flex'}}><I s={14}/></span>
    {!collapsed&&<span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</span>}
  </NavLink>;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function AppSidebar({collapsed,onToggle,theme,role}:{collapsed:boolean;onToggle:()=>void;theme:Theme;role:AdminRole}) {
  const {admin,logout} = useAuthStore();
  if (!admin) return null;
  const ROLE_META:Record<AdminRole,{label:string;color:string}> = {
    super_admin:{label:'Super Admin',color:'#c47070'}, operations:{label:'Operaciones',color:'#5a8fc4'},
    support:{label:'Soporte',color:'#4aaa7a'}, finance:{label:'Finanzas',color:'#c4a44a'},
    security:{label:'Seguridad',color:'#9a70c4'}, auditor:{label:'Auditor',color:'#6b8aaa'},
  };
  const rm = ROLE_META[role]??{label:role,color:'#6b8aaa'};
  return <div style={{width:collapsed?52:220,minHeight:'100vh',background:`linear-gradient(180deg,${theme.bgSide},${theme.bg})`,borderRight:`1px solid ${theme.border}`,display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,bottom:0,zIndex:100,transition:'width 0.22s cubic-bezier(0.4,0,0.2,1)',overflow:'hidden'}}>
    {/* Header */}
    <div style={{padding:collapsed?'13px 8px':'14px',borderBottom:`1px solid ${theme.border}`,display:'flex',alignItems:'center',justifyContent:collapsed?'center':'space-between',gap:8,flexShrink:0}}>
      {!collapsed&&<div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        <Logo size={30}/>
        <div><div style={{fontSize:15,fontWeight:800,color:theme.text,letterSpacing:'-0.5px',fontFamily:'system-ui,sans-serif'}}>egchat</div><div style={{fontSize:9,color:theme.textMuted,textTransform:'uppercase',letterSpacing:'1.5px',fontWeight:700}}>Admin Portal</div></div>
      </div>}
      {collapsed&&<Logo size={26}/>}
      <button onClick={onToggle} style={{background:'transparent',border:`1px solid ${theme.border}`,borderRadius:6,color:theme.textMuted,cursor:'pointer',padding:'3px 7px',fontSize:13,lineHeight:1}}>{collapsed?'›':'‹'}</button>
    </div>
    {/* Nav */}
    <nav style={{flex:1,padding:collapsed?'10px 5px':'12px 8px',overflowY:'auto',overflowX:'hidden'}}>
      {NAV_GROUPS.map(g=>{
        if (!LEVEL_ACCESS[g.level].includes(role)) return null;
        return <div key={g.level} style={{marginBottom:9,borderRadius:9,border:collapsed?'none':`1px solid ${g.border}`,background:collapsed?'transparent':g.bg,overflow:'hidden'}}>
          {!collapsed&&<div style={{padding:'8px 10px 5px',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:g.color,boxShadow:`0 0 5px ${g.color}80`}}/>
            <span style={{fontSize:9,fontWeight:800,color:g.color,textTransform:'uppercase',letterSpacing:'1.2px',whiteSpace:'nowrap'}}>{g.label}</span>
          </div>}
          {collapsed&&<div style={{height:2,background:g.bg,borderRadius:1,margin:'2px 4px 5px'}}/>}
          <div style={{padding:collapsed?'0 0 2px':'2px 4px 6px'}}>
            {g.items.map(item=><NavItem key={item.to} to={item.to} label={item.label} I={item.I} color={g.color} activeBg={g.activeBg} collapsed={collapsed} textMuted={theme.textMuted}/>)}
          </div>
        </div>;
      })}
    </nav>
    {/* Footer */}
    {!collapsed?<div style={{padding:'10px 12px',borderTop:`1px solid ${theme.border}`,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:`${rm.color}18`,border:`1px solid ${rm.color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:rm.color,flexShrink:0}}>{admin.email.charAt(0).toUpperCase()}</div>
        <div style={{minWidth:0}}><div style={{fontSize:11,color:theme.text,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{admin.email.split('@')[0]}</div><div style={{fontSize:10,color:rm.color,fontWeight:600,opacity:0.8}}>{rm.label}</div></div>
      </div>
      <button onClick={logout} style={{width:'100%',padding:'6px 10px',background:'transparent',border:`1px solid ${theme.border}`,borderRadius:7,color:theme.textMuted,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}} onMouseEnter={e=>{(e.currentTarget as any).style.color='#c47070';(e.currentTarget as any).style.borderColor='rgba(196,112,112,0.3)'}} onMouseLeave={e=>{(e.currentTarget as any).style.color=theme.textMuted;(e.currentTarget as any).style.borderColor=theme.border}}>
        <Ico.LogOut s={12}/> Cerrar sesión
      </button>
    </div>:<div style={{padding:'8px 5px',borderTop:`1px solid ${theme.border}`,flexShrink:0,display:'flex',justifyContent:'center'}}>
      <button onClick={logout} title="Cerrar sesión" style={{background:'transparent',border:`1px solid ${theme.border}`,borderRadius:7,color:theme.textMuted,cursor:'pointer',padding:'6px 7px',display:'flex',alignItems:'center'}}><Ico.LogOut s={13}/></button>
    </div>}
  </div>;
}

// ── Titles ────────────────────────────────────────────────────────────────────
const TITLES:Record<string,string> = {
  '/dashboard/executive':'Centro de Control Ejecutivo', '/dashboard/financial':'Dashboard Financiero',
  '/dashboard/strategic':'Dashboard Estratégico',       '/dashboard/risk':'Dashboard de Riesgo',
  '/dashboard/users':'Dashboard de Usuarios',           '/dashboard/support':'Dashboard de Soporte',
  '/dashboard/mini-apps':'Dashboard Mini Apps',         '/dashboard/devops':'Dashboard DevOps',
  '/dashboard/operational':'Dashboard Operacional',     '/dashboard/chat':'Dashboard Chat',
  '/dashboard/wallet':'Dashboard Wallet',               '/dashboard/security':'Seguridad — SOC',
  '/dashboard/infrastructure':'Infraestructura',        '/dashboard/sqlite-sync':'Sincronización SQLite',
  '/dashboard/audit':'Auditoría',                       '/admin/users':'Administradores',
};

// ── Theme picker ──────────────────────────────────────────────────────────────
function ThemePicker({theme,onTheme}:{theme:Theme;onTheme:(t:Theme)=>void}) {
  const [open,setOpen] = useState(false);
  return <div style={{position:'relative'}}>
    <button onClick={()=>setOpen(s=>!s)} style={{display:'flex',alignItems:'center',gap:8,background:'transparent',border:`1px solid ${theme.border}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',color:theme.textMuted,fontSize:11,fontWeight:600}}>
      <div style={{display:'flex',gap:3}}>{[theme.l1,theme.l2,theme.l3].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:c}}/>)}</div>
      <span>{theme.name}</span><span style={{fontSize:10}}>▾</span>
    </button>
    {open&&<div style={{position:'absolute',right:0,top:38,background:theme.bgCard,border:`1px solid ${theme.border}`,borderRadius:12,padding:12,zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',minWidth:220}}>
      <div style={{fontSize:10,fontWeight:700,color:theme.textMuted,textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>Tema de Color</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {THEMES.map(t=><button key={t.id} onClick={()=>{onTheme(t);setOpen(false);}} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,background:theme.id===t.id?`${t.l2}18`:'transparent',border:theme.id===t.id?`1px solid ${t.l2}40`:'1px solid transparent',cursor:'pointer'}}>
          <div style={{width:20,height:20,borderRadius:5,background:t.preview,border:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',gap:2}}>{[t.l1,t.l2,t.l3].map((c,i)=><div key={i} style={{width:3,height:3,borderRadius:'50%',background:c}}/>)}</div>
          <span style={{fontSize:12,color:theme.id===t.id?t.l2:theme.text,fontWeight:theme.id===t.id?700:400}}>{t.name}</span>
          {theme.id===t.id&&<span style={{marginLeft:'auto',color:t.l2,fontSize:11}}>✓</span>}
        </button>)}
      </div>
    </div>}
  </div>;
}

// ── Error boundary ────────────────────────────────────────────────────────────
class EB extends React.Component<{children:React.ReactNode},{err:string|null}> {
  constructor(p:any){super(p);this.state={err:null};}
  static getDerivedStateFromError(e:Error){return{err:e.message};}
  render(){
    if(this.state.err) return <div style={{padding:32,color:'#f1f5f9'}}><div style={{background:'rgba(239,68,68,0.1)',border:'1px solid #ef444450',borderRadius:12,padding:20}}><div style={{color:'#ef4444',fontWeight:700,marginBottom:8}}>Error en dashboard</div><pre style={{color:'#94a3b8',fontSize:11,overflow:'auto'}}>{this.state.err}</pre><button onClick={()=>this.setState({err:null})} style={{marginTop:12,padding:'6px 14px',background:'#1e293b',border:'1px solid #334155',borderRadius:7,color:'#94a3b8',cursor:'pointer'}}>Reintentar</button></div></div>;
    return this.props.children;
  }
}

// ── Lazy dashboard loader ─────────────────────────────────────────────────────
// Using React.lazy to catch import errors per dashboard
const ExecutiveDashboard      = React.lazy(()=>import('./pages/Dashboard/Executive').then(m=>({default:m.ExecutiveDashboard})));
const FinancialDashboard      = React.lazy(()=>import('./pages/Dashboard/Financial').then(m=>({default:m.FinancialDashboard})));
const StrategicDashboard      = React.lazy(()=>import('./pages/Dashboard/Strategic').then(m=>({default:m.StrategicDashboard})));
const RiskDashboard           = React.lazy(()=>import('./pages/Dashboard/Risk').then(m=>({default:m.RiskDashboard})));
const UsersDashboard          = React.lazy(()=>import('./pages/Dashboard/Users').then(m=>({default:m.UsersDashboard})));
const SupportDashboard        = React.lazy(()=>import('./pages/Dashboard/Support').then(m=>({default:m.SupportDashboard})));
const MiniAppsDashboard       = React.lazy(()=>import('./pages/Dashboard/MiniApps').then(m=>({default:m.MiniAppsDashboard})));
const DevOpsDashboard         = React.lazy(()=>import('./pages/Dashboard/DevOps').then(m=>({default:m.DevOpsDashboard})));
const OperationalDashboard    = React.lazy(()=>import('./pages/Dashboard/Operational').then(m=>({default:m.OperationalDashboard})));
const ChatDashboard           = React.lazy(()=>import('./pages/Dashboard/Chat').then(m=>({default:m.ChatDashboard})));
const WalletDashboard         = React.lazy(()=>import('./pages/Dashboard/Wallet').then(m=>({default:m.WalletDashboard})));
const SecurityDashboard       = React.lazy(()=>import('./pages/Dashboard/Security').then(m=>({default:m.SecurityDashboard})));
const InfrastructureDashboard = React.lazy(()=>import('./pages/Dashboard/Infrastructure').then(m=>({default:m.InfrastructureDashboard})));
const SQLiteSyncDashboard     = React.lazy(()=>import('./pages/Dashboard/SQLiteSync').then(m=>({default:m.SQLiteSyncDashboard})));
const AuditDashboard          = React.lazy(()=>import('./pages/Dashboard/Audit').then(m=>({default:m.AuditDashboard})));
const UserManagement          = React.lazy(()=>import('./pages/Admin/UserManagement').then(m=>({default:m.UserManagement})));

function D({children}:{children:React.ReactNode}) {
  return <EB><React.Suspense fallback={<div style={{padding:40,color:'#64748b',textAlign:'center'}}>Cargando dashboard...</div>}>{children}</React.Suspense></EB>;
}

// ── Protected layout ──────────────────────────────────────────────────────────
function ProtectedLayout() {
  const admin = useAuthStore(s=>s.admin);
  const location = useLocation();
  const [collapsed,setCollapsed] = useState(false);
  const [theme,setThemeState] = useState<Theme>(()=>{ const t=loadTheme(); applyTheme(t); return t; });

  if(!admin) return <Navigate to="/login" replace/>;
  const role = admin.role as AdminRole;
  const title = TITLES[location.pathname]??'Admin Portal';

  const handleTheme = (t:Theme)=>{ applyTheme(t); saveTheme(t); setThemeState(t); };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{display:'flex',minHeight:'100vh',background:theme.bg}}>
        <AppSidebar collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)} theme={theme} role={role}/>
        <div style={{marginLeft:collapsed?52:220,flex:1,display:'flex',flexDirection:'column',minWidth:0,transition:'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)'}}>
          {/* Header */}
          <div style={{height:52,background:theme.bgSide,borderBottom:`1px solid ${theme.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',position:'sticky',top:0,zIndex:50}}>
            <h1 style={{fontSize:14,fontWeight:600,color:theme.textMuted,margin:0,letterSpacing:'0.3px'}}>{title}</h1>
            <ThemePicker theme={theme} onTheme={handleTheme}/>
          </div>
          {/* Content */}
          <main style={{flex:1,padding:24,overflowY:'auto',overflowX:'hidden'}}>
            <Routes>
              <Route path="/dashboard/executive"      element={<D><ExecutiveDashboard/></D>}/>
              <Route path="/dashboard/financial"      element={<D><FinancialDashboard/></D>}/>
              <Route path="/dashboard/strategic"      element={<D><StrategicDashboard/></D>}/>
              <Route path="/dashboard/risk"           element={<D><RiskDashboard/></D>}/>
              <Route path="/dashboard/users"          element={<D><UsersDashboard/></D>}/>
              <Route path="/dashboard/support"        element={<D><SupportDashboard/></D>}/>
              <Route path="/dashboard/mini-apps"      element={<D><MiniAppsDashboard/></D>}/>
              <Route path="/dashboard/devops"         element={<D><DevOpsDashboard/></D>}/>
              <Route path="/dashboard/operational"    element={<D><OperationalDashboard/></D>}/>
              <Route path="/dashboard/chat"           element={<D><ChatDashboard/></D>}/>
              <Route path="/dashboard/wallet"         element={<D><WalletDashboard/></D>}/>
              <Route path="/dashboard/security"       element={<D><SecurityDashboard/></D>}/>
              <Route path="/dashboard/infrastructure" element={<D><InfrastructureDashboard/></D>}/>
              <Route path="/dashboard/sqlite-sync"    element={<D><SQLiteSyncDashboard/></D>}/>
              <Route path="/dashboard/audit"          element={<D><AuditDashboard/></D>}/>
              <Route path="/admin/users"              element={<D><UserManagement/></D>}/>
              <Route path="*" element={<Navigate to={getFirstRoute(role)} replace/>}/>
            </Routes>
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/*"     element={<ProtectedLayout/>}/>
  </Routes>;
}
