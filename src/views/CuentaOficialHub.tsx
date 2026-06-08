/**
 * CuentaOficialHub.tsx
 * Hub central de la Cuenta Oficial — punto de entrada a todos los módulos empresariales
 *
 * Lógica por tipo de entidad:
 *   - Operadoras (mo1-mo5, ip1-ip9, cc1-cc7): Panel Proveedor con sus servicios específicos
 *   - Supermercados / Tiendas: Merchant Dashboard + monedero EgChat para cobros
 *   - Bancos (bange, ccei, bgfi, ecobank, cbge): Dashboard empresarial sin Merchant
 *   - Todos: Dashboard Empresarial, Panel Director, Panel Operaciones
 */

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

const BusinessDashboard         = lazy(() => import('./BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const MerchantDashboard         = lazy(() => import('./MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));
const ServiceProviderDashboard  = lazy(() => import('./ServiceProviderDashboard').then(m => ({ default: m.ServiceProviderDashboard })));
const ProviderServicesDashboard = lazy(() => import('./ProviderServicesDashboard').then(m => ({ default: m.ProviderServicesDashboard })));
const ProviderDirectorDashboard = lazy(() => import('./ProviderDirectorDashboard').then(m => ({ default: m.ProviderDirectorDashboard })));
const ProviderOperatorDashboard = lazy(() => import('./ProviderOperatorDashboard').then(m => ({ default: m.ProviderOperatorDashboard })));
const OfficialAccountView       = lazy(() => import('./OfficialAccountView').then(m => ({ default: m.OfficialAccountView })));

interface Props {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  onOpenWallet?: () => void; // abre el monedero EgChat real
}

type ActiveModule = null | 'comunicacion' | 'business' | 'merchant' | 'provider' | 'director' | 'operator';

// Clasificación de entidades por tipo
const OPERADORAS_KEYS = ['mo1','mo2','mo3','mo4','mo5','ip1','ip2','ip3','ip4','ip5','ip6','ip7','ip8','ip9','cc1','cc2','cc3','cc4','cc5','cc6','cc7'];
const BANCOS_KEYS     = ['bange','ccei','bgfi','ecobank','cbge'];
const COMERCIO_KEYS   = ['sm','tienda','supermercado','comercio']; // supermercados y tiendas

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';

const C = { bg:'#F4F6FF', card:'#FFFFFF', text:'#1A1D23', sub:'#8C8FA3', border:'#E8ECF4' };

export const CuentaOficialHub: React.FC<Props> = ({
  userProfile, isAuthenticated, onBack, viewPadding, onOpenWallet,
}) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [active, setActive] = useState<ActiveModule>(null);
  const [providerInfo, setProviderInfo] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/provider/me`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setProviderInfo(d)).catch(() => {});
  }, [isAuthenticated]);

  // Determinar tipo de entidad según provider_key
  const pk = providerInfo?.provider_key || '';
  const isOperadora = OPERADORAS_KEYS.includes(pk) || providerInfo?.category === 'recarga' || providerInfo?.category === 'internet' || providerInfo?.category === 'canales';
  const isBanco     = BANCOS_KEYS.includes(pk) || providerInfo?.category === 'banco';
  const isComercio  = COMERCIO_KEYS.some(k => pk.includes(k)) || providerInfo?.category === 'comercio' || providerInfo?.category === 'supermercado';
  const isMerchantType = isComercio || (!isOperadora && !isBanco); // por defecto merchant para tipos desconocidos que no son operadora/banco

  // Sub-módulo activo
  if (active) {
    const p = { isAuthenticated, onBack: () => setActive(null), viewPadding, userProfile };
    return (
      <Suspense fallback={<div style={{ position:'fixed', inset:0, background:C.bg, zIndex:2100 }}/>}>
        {active === 'comunicacion' && <OfficialAccountView {...p} />}
        {active === 'business'     && <BusinessDashboard {...p} onNavigate={v => { if(v==='merchant') setActive('merchant'); else if(v==='provider') setActive('provider'); else setActive(null); }} />}
        {active === 'merchant'     && <MerchantDashboard {...p} onOpenWallet={onOpenWallet} />}
        {active === 'provider'     && <ProviderServicesDashboard {...p} />}
        {active === 'director'     && <ProviderDirectorDashboard {...p} />}
        {active === 'operator'     && <ProviderOperatorDashboard {...p} />}
      </Suspense>
    );
  }

  const ROLE_COLOR: Record<string,string> = {
    official:'#5B8DEF', business:'#13C2C2', merchant:'#FA8C16', admin:'#722ED1', super_admin:'#CF1322',
  };
  const ROLE_LABEL: Record<string,string> = {
    official:'Cuenta Oficial', business:'Empresa', merchant:'Merchant', admin:'Admin', super_admin:'Super Admin',
  };
  const roleColor = ROLE_COLOR[role] || '#5B8DEF';

  // Módulos según tipo de entidad
  const modules: Array<{
    id: ActiveModule; icon: React.ReactNode; title: string; desc: string;
    color: string; show: boolean; tag?: string; tagColor?: string;
  }> = [
    {
      id: 'comunicacion',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>,
      title: 'Comunicación',
      desc: 'Envía comunicados masivos a tus contactos y consulta estadísticas de alcance',
      color: '#5B8DEF',
      show: isAtLeast('official'),
      tag: is_verified ? '✓ Verificado' : undefined,
      tagColor: '#52C41A',
    },
    {
      id: 'business',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="7 10 10 13 14 9 17 12"/></svg>,
      title: 'Panel Empresarial',
      desc: 'Resumen de actividad, métricas clave y acceso al monedero EgChat',
      color: '#13C2C2',
      show: isAtLeast('official'),
    },
    {
      id: 'merchant',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      title: 'Gestión de Tienda',
      desc: 'Catálogo de productos, pedidos de clientes y cobros via monedero EgChat',
      color: '#FA8C16',
      show: isMerchantType && isAtLeast('merchant'),
    },
    {
      id: 'provider',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
      title: `Panel de Servicios${providerInfo?.name ? ` — ${providerInfo.name}` : ''}`,
      desc: isOperadora
        ? `Gestiona y procesa pedidos de ${providerInfo?.category === 'recarga' ? 'recarga móvil' : providerInfo?.category === 'internet' ? 'internet' : 'canales de TV'} solicitados por usuarios de EgChat`
        : isBanco
        ? 'Gestiona solicitudes de servicios bancarios realizadas a través de EgChat'
        : 'Gestiona pedidos de servicios de tu entidad en EgChat',
      color: '#1485EE',
      show: hasPermission('services.view_orders'),
    },
    {
      id: 'director',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
      title: 'Dirección Ejecutiva',
      desc: 'Ventas brutas, comisión EgChat (1.5%), ingresos netos y tendencias diarias',
      color: '#722ED1',
      show: hasPermission('provider.director') || isAtLeast('admin'),
    },
    {
      id: 'operator',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      title: 'Operaciones',
      desc: 'Procesa pedidos pendientes en tiempo real, activa el modo de procesamiento automático',
      color: '#2E9E6B',
      show: hasPermission('provider.operator') || isAtLeast('admin'),
    },
  ].filter(m => m.show);

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, display:'flex', flexDirection:'column', zIndex:2000, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(150deg, ${roleColor} 0%, ${roleColor}aa 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 0`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.18)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>EgChat Business</div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:18, display:'flex', alignItems:'center', gap:8 }}>
              Cuenta Oficial
              {is_verified && <VerifiedBadge type={role as any} size={18}/>}
            </div>
          </div>
        </div>

        {/* Card de perfil */}
        <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'16px 16px 0 0', padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
            {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/> : (userProfile?.avatar||'E')}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{userProfile?.name}</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12 }}>{userProfile?.phone}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'4px 12px', color:'#fff', fontSize:11, fontWeight:700 }}>
            {ROLE_LABEL[role] || role}
          </div>
        </div>
      </div>

      {/* Lista de módulos */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        {modules.length === 0 && (
          <div style={{ textAlign:'center', padding:48, color:C.sub }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.5" style={{ margin:'0 auto 12px', display:'block' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div style={{ fontWeight:600, color:C.text, marginBottom:6 }}>Sin módulos activos</div>
            <div style={{ fontSize:13 }}>Contacta al administrador para activar tu cuenta oficial</div>
          </div>
        )}

        {modules.map(mod => (
          <button key={mod.id as string}
            onClick={() => setActive(mod.id)}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'14px 16px', cursor:'pointer', textAlign:'left', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:14, width:'100%', transition:'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.boxShadow='0 1px 6px rgba(0,0,0,0.05)'}
          >
            {/* Icono limpio sin fondo */}
            <div style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:mod.color }}>
              {mod.icon}
            </div>

            {/* Texto */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{mod.title}</span>
                {mod.tag && <span style={{ fontSize:10, fontWeight:700, color:mod.tagColor, background:(mod.tagColor||'#52C41A')+'18', padding:'1px 8px', borderRadius:10 }}>{mod.tag}</span>}
              </div>
              <div style={{ fontSize:12, color:C.sub, lineHeight:1.5 }}>{mod.desc}</div>
            </div>

            {/* Flecha */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CuentaOficialHub;
