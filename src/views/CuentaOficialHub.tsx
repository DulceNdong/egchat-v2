/**
 * CuentaOficialHub.tsx
 * Hub central de la Cuenta Oficial — punto de entrada a todos los módulos empresariales
 *
 * Contiene:
 *   1. Dashboard Empresarial — métricas y resumen de actividad
 *   2. Merchant Dashboard — productos, pedidos, cobros
 *   3. Panel de Proveedor — gestión de servicios EgChat
 *   4. Panel Director — ganancias, comisiones, análisis ejecutivo
 *   5. Panel Operaciones — procesar pedidos, modo automático
 */

import React, { useState, lazy, Suspense } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

// Lazy load de cada sub-módulo
const BusinessDashboard        = lazy(() => import('./BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const MerchantDashboard        = lazy(() => import('./MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));
const ServiceProviderDashboard = lazy(() => import('./ServiceProviderDashboard').then(m => ({ default: m.ServiceProviderDashboard })));
const ProviderDirectorDashboard  = lazy(() => import('./ProviderDirectorDashboard').then(m => ({ default: m.ProviderDirectorDashboard })));
const ProviderOperatorDashboard  = lazy(() => import('./ProviderOperatorDashboard').then(m => ({ default: m.ProviderOperatorDashboard })));
const OfficialAccountView        = lazy(() => import('./OfficialAccountView').then(m => ({ default: m.OfficialAccountView })));

interface CuentaOficialHubProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
}

type ActiveModule =
  | null
  | 'oficial'
  | 'business'
  | 'merchant'
  | 'provider'
  | 'director'
  | 'operator';

const C = {
  bg: '#F0F4FF',
  card: '#FFFFFF',
  text: '#1A1D23',
  sub: '#8C8FA3',
  border: '#E8ECF4',
};

export const CuentaOficialHub: React.FC<CuentaOficialHubProps> = ({
  userProfile, isAuthenticated, onBack, viewPadding,
}) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [active, setActive] = useState<ActiveModule>(null);

  // Si hay un sub-módulo activo, renderizarlo en pantalla completa
  if (active) {
    const commonProps = { isAuthenticated, onBack: () => setActive(null), viewPadding, userProfile };
    return (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 2100 }} />}>
        {active === 'oficial'   && <OfficialAccountView {...commonProps} />}
        {active === 'business'  && <BusinessDashboard {...commonProps} onNavigate={(v) => {
          if (v === 'official') setActive('oficial');
          else if (v === 'merchant') setActive('merchant');
          else setActive(null);
        }} />}
        {active === 'merchant'  && <MerchantDashboard {...commonProps} />}
        {active === 'provider'  && <ServiceProviderDashboard {...commonProps} />}
        {active === 'director'  && <ProviderDirectorDashboard {...commonProps} />}
        {active === 'operator'  && <ProviderOperatorDashboard {...commonProps} />}
      </Suspense>
    );
  }

  const ROLE_LABEL: Record<string, string> = {
    official: 'Cuenta Oficial', business: 'Empresa',
    merchant: 'Merchant', admin: 'Admin', super_admin: 'Super Admin',
  };
  const ROLE_COLOR: Record<string, string> = {
    official: '#5B8DEF', business: '#13C2C2',
    merchant: '#FA8C16', admin: '#722ED1', super_admin: '#CF1322',
  };
  const roleColor = ROLE_COLOR[role] || '#5B8DEF';

  // Módulos disponibles según permisos
  const modules = [
    {
      id: 'oficial' as ActiveModule,
      icon: '🏅',
      title: 'Cuenta Oficial',
      desc: 'Perfil verificado, broadcast a contactos y estadísticas de comunicación',
      color: '#5B8DEF',
      bg: '#EBF0FF',
      show: isAtLeast('official'),
      badge: is_verified ? '✓ Verificado' : '⏳ Pendiente',
      badgeColor: is_verified ? '#52C41A' : '#FA8C16',
    },
    {
      id: 'business' as ActiveModule,
      icon: '📊',
      title: 'Dashboard Empresarial',
      desc: 'KPIs de actividad, acciones rápidas y resumen de tu cuenta de empresa',
      color: '#13C2C2',
      bg: '#E6FFFB',
      show: isAtLeast('official'),
    },
    {
      id: 'merchant' as ActiveModule,
      icon: '🏪',
      title: 'Merchant',
      desc: 'Gestiona tu tienda: productos, pedidos de clientes y solicitudes de cobro',
      color: '#FA8C16',
      bg: '#FFF7E6',
      show: isAtLeast('merchant'),
    },
    {
      id: 'provider' as ActiveModule,
      icon: '📡',
      title: 'Panel de Proveedor',
      desc: 'Todos los pedidos de servicios EgChat (recarga, internet, canales, etc.)',
      color: '#1485EE',
      bg: '#EFF5FD',
      show: hasPermission('services.view_orders'),
    },
    {
      id: 'director' as ActiveModule,
      icon: '💼',
      title: 'Panel Director',
      desc: 'Ganancias brutas, comisión EgChat (1.5%), ingresos netos y tendencias',
      color: '#722ED1',
      bg: '#F3E8FF',
      show: hasPermission('provider.director') || isAtLeast('admin'),
    },
    {
      id: 'operator' as ActiveModule,
      icon: '⚙️',
      title: 'Panel Operaciones',
      desc: 'Procesa pedidos pendientes, activa el modo automático y gestiona tu equipo',
      color: '#2E9E6B',
      bg: '#F0FAF5',
      show: hasPermission('provider.operator') || isAtLeast('admin'),
    },
  ].filter(m => m.show);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg,
      display: 'flex', flexDirection: 'column', zIndex: 2000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}cc 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 20px`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Cuenta Oficial</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              {userProfile?.name || 'Mi empresa'}
              {is_verified && <VerifiedBadge type={role as any} size={20} />}
            </div>
          </div>
        </div>

        {/* Info de cuenta */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {userProfile?.avatarUrl
              ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : (userProfile?.avatar || 'E')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{userProfile?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{userProfile?.phone}</div>
            <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 10px', borderRadius: 20, display: 'inline-block', fontSize: 11, fontWeight: 700 }}>
              {ROLE_LABEL[role] || role}
            </div>
          </div>
          {is_verified && (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>✓</div>
              <div style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Verificado</div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de módulos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
          Módulos disponibles — {modules.length} activos
        </div>

        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActive(mod.id)}
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 18, padding: '16px 18px',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'transform 0.15s, box-shadow 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
          >
            {/* Icono */}
            <div style={{ width: 52, height: 52, borderRadius: 15, background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {mod.icon}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{mod.title}</span>
                {mod.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: mod.badgeColor, background: mod.badgeColor + '18', padding: '2px 8px', borderRadius: 10 }}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{mod.desc}</div>
            </div>

            {/* Arrow */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={mod.color} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </button>
        ))}

        {modules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: C.sub }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>Sin módulos activos</div>
            <div style={{ fontSize: 13 }}>Contacta al administrador para activar tu cuenta oficial</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuentaOficialHub;
