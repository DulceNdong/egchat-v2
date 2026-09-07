/**
 * CuentaOficialHub.tsx
 * Hub central de la Cuenta Oficial — mismo estilo que ProviderServicesDashboard
 * Header oscuro con branding de la empresa + módulos con iconos limpios
 */

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

const BusinessDashboard         = lazy(() => import('./BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const MerchantDashboard         = lazy(() => import('./MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));
const ProviderServicesDashboard = lazy(() => import('./ProviderServicesDashboard').then(m => ({ default: m.ProviderServicesDashboard })));
const ProviderDirectorDashboard = lazy(() => import('./ProviderDirectorDashboard').then(m => ({ default: m.ProviderDirectorDashboard })));
const ProviderOperatorDashboard = lazy(() => import('./ProviderOperatorDashboard').then(m => ({ default: m.ProviderOperatorDashboard })));
const OfficialAccountView       = lazy(() => import('./OfficialAccountView').then(m => ({ default: m.OfficialAccountView })));
const CompanyBusinessDashboard  = lazy(() => import('./CompanyBusinessDashboard').then(m => ({ default: m.CompanyBusinessDashboard })));

interface Props {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  onOpenWallet?: () => void;
}

type ActiveModule = null | 'comunicacion' | 'business' | 'merchant' | 'provider' | 'director' | 'operator';

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';

const OPERADORAS_KEYS = ['mo1','mo2','mo3','mo4','mo5','ip1','ip2','ip3','ip4','ip5','ip6','ip7','ip8','ip9','cc1','cc2','cc3','cc4','cc5','cc6','cc7'];
const BANCOS_KEYS     = ['bange','ccei','bgfi','ecobank','cbge'];

// Tema por categoría — igual que ProviderServicesDashboard
const CAT_THEME: Record<string, { color: string; label: string; icon: string }> = {
  facturas:     { color: '#F59E0B', label: 'Electricidad / Facturas', icon: '⚡' },
  electricidad: { color: '#F59E0B', label: 'Electricidad',            icon: '⚡' },
  recarga:      { color: '#2E9E6B', label: 'Recarga móvil',           icon: '📱' },
  internet:     { color: '#1485EE', label: 'Internet',                icon: '🌐' },
  canales:      { color: '#722ED1', label: 'Canales TV',              icon: '📺' },
  agua:         { color: '#0EA5E9', label: 'Agua / SNGE',             icon: '💧' },
  banco:        { color: '#003082', label: 'Servicios bancarios',     icon: '🏦' },
  seguros:      { color: '#10B981', label: 'Seguros',                 icon: '🛡️' },
  comercio:     { color: '#FA8C16', label: 'Comercio / Tienda',       icon: '🏪' },
  supermercado: { color: '#FA8C16', label: 'Supermercado',            icon: '🛒' },
};

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

  if (active) {
    const p = { isAuthenticated, onBack: () => setActive(null), viewPadding, userProfile };
    return (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#0D1B4B', zIndex: 2100 }}/>}>
        {active === 'comunicacion' && <OfficialAccountView {...p}
          onManageStaff={() => setActive('business')}
          onNewIndividualChat={() => { setActive(null); setTimeout(() => window.dispatchEvent(new CustomEvent('egchat-open-new-chat')), 200); }}
          onNewGroupChat={() => { setActive(null); setTimeout(() => window.dispatchEvent(new CustomEvent('egchat-open-create-group')), 200); }}
        />}
        {active === 'business'     && <CompanyBusinessDashboard {...p} />}
        {active === 'merchant'     && <MerchantDashboard {...p} onOpenWallet={onOpenWallet} />}
        {active === 'provider'     && <ProviderServicesDashboard {...p} />}
        {active === 'director'     && <ProviderDirectorDashboard {...p} />}
        {active === 'operator'     && <ProviderOperatorDashboard {...p} />}
      </Suspense>
    );
  }

  const pk = providerInfo?.provider_key || '';
  const cat = providerInfo?.category || 'facturas';
  const isOperadora = OPERADORAS_KEYS.includes(pk) || ['recarga','internet','canales'].includes(cat);
  const isBanco     = BANCOS_KEYS.includes(pk) || cat === 'banco';
  const isComercio  = ['comercio','supermercado'].includes(cat);
  const isMerchantType = isComercio;

  const catTheme = CAT_THEME[cat] || { color: '#5B8DEF', label: 'Servicios', icon: '🏢' };
  const pname = providerInfo?.name || userProfile?.name || 'Mi empresa';

  const ROLE_LABEL: Record<string, string> = {
    official: 'Cuenta Oficial', business: 'Empresa',
    merchant: 'Merchant', admin: 'Admin', super_admin: 'Super Admin',
  };

  // Módulos disponibles
  const modules: Array<{
    id: ActiveModule;
    icon: React.ReactNode;
    title: string;
    desc: string;
    accentColor: string;
    show: boolean;
    badge?: string;
  }> = [
    {
      id: 'comunicacion',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9"  cy="10" r="1" fill="currentColor"/>
          <circle cx="12" cy="10" r="1" fill="currentColor"/>
          <circle cx="15" cy="10" r="1" fill="currentColor"/>
        </svg>
      ),
      title: 'Comunicación',
      desc: 'Comunicados masivos a tus contactos · Estadísticas de alcance · Badge verificado',
      accentColor: '#5B8DEF',
      show: isAtLeast('official'),
      badge: is_verified ? '✓ Verificado' : undefined,
    },
    {
      id: 'provider',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: `Panel de Servicios${providerInfo?.name ? ` — ${providerInfo.name}` : ''}`,
      desc: isOperadora
        ? `Pedidos de ${catTheme.label} · Confirmar / Rechazar · Modo automático`
        : isBanco
        ? 'Solicitudes de servicios bancarios · Gestión de transacciones'
        : `Pedidos de ${catTheme.label} · Historial · Estadísticas`,
      accentColor: catTheme.color,
      show: hasPermission('services.view_orders'),
    },
    {
      id: 'business',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <polyline points="6 10 9 13 13 9 16 12"/>
        </svg>
      ),
      title: 'Panel Empresarial',
      desc: 'KPIs de actividad · Monedero EgChat · Acciones rápidas',
      accentColor: '#13C2C2',
      show: isAtLeast('official'),
    },
    {
      id: 'merchant',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      title: 'Gestión de Tienda',
      desc: 'Catálogo de productos · Pedidos de clientes · Cobros via monedero',
      accentColor: '#FA8C16',
      show: isMerchantType && isAtLeast('merchant'),
    },
    {
      id: 'director',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
          <line x1="2"  y1="20" x2="22" y2="20"/>
        </svg>
      ),
      title: 'Dirección Ejecutiva',
      desc: 'Ingresos brutos · Comisión EgChat 1.5% · Ingresos netos · Tendencias',
      accentColor: '#722ED1',
      show: hasPermission('provider.director') || isAtLeast('admin'),
    },
    {
      id: 'operator',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      title: 'Operaciones',
      desc: 'Procesa pedidos en tiempo real · Modo automático · Gestión de equipo',
      accentColor: '#2E9E6B',
      show: hasPermission('provider.operator') || isAtLeast('admin'),
    },
  ].filter(m => m.show);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', zIndex: 2000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#F5F7FF',
    }}>

      {/* ── Header oscuro — mismo estilo que ProviderServicesDashboard ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2B6B 0%, #0D1B4B 100%)',
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 0`,
      }}>
        {/* Fila superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Logo / icono de la empresa */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: catTheme.color + '22', border: `1.5px solid ${catTheme.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {catTheme.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 7 }}>
              {pname}
              {is_verified && <VerifiedBadge type={role as any} size={17}/>}
            </div>
            <div style={{ color: catTheme.color, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52C41A', display: 'inline-block' }}/>
              {catTheme.label} · {ROLE_LABEL[role] || 'Cuenta Oficial'}
            </div>
          </div>
        </div>

        {/* Barra de módulos rápida */}
        <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
          {modules.slice(0, 3).map(m => (
            <button key={m.id as string} onClick={() => setActive(m.id)}
              style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ color: m.accentColor, opacity: 0.9 }}>{m.icon}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: 64 }}>{m.title.split('—')[0].split(' ').slice(0, 2).join(' ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista completa de módulos ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {modules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#8C8FA3' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
            <div style={{ fontWeight: 600, color: '#1A1D23', marginBottom: 6 }}>Sin módulos activos</div>
            <div style={{ fontSize: 13 }}>Contacta al administrador de EgChat para activar tu cuenta</div>
          </div>
        )}

        {modules.map(mod => (
          <button
            key={mod.id as string}
            onClick={() => setActive(mod.id)}
            style={{
              background: '#fff', border: '1px solid #E8ECF4',
              borderRadius: 16, padding: '14px 16px',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'}
          >
            {/* Icono limpio con color del módulo */}
            <div style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: mod.accentColor }}>
              {mod.icon}
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1D23' }}>{mod.title}</span>
                {mod.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#52C41A', background: '#F6FFED', padding: '1px 8px', borderRadius: 10, border: '1px solid #B7EB8F' }}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#8C8FA3', lineHeight: 1.5 }}>{mod.desc}</div>
            </div>

            {/* Flecha */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mod.accentColor} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CuentaOficialHub;
