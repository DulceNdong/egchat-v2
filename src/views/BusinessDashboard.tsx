/**
 * BusinessDashboard.tsx — Dashboard Empresarial EgChat
 *
 * ¿Por qué existe?
 * Las empresas y cuentas verificadas necesitan un panel centralizado
 * para ver su actividad, comunicarse con clientes y acceder rápidamente
 * a las herramientas de negocio (wallet, broadcast, merchant, contactos).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface BusinessDashboardProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  onNavigate: (view: string) => void;
  viewPadding: { top: string; bottom: string };
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';

const COLORS = {
  primary: '#5B8DEF',
  success: '#52C41A',
  warning: '#FAAD14',
  purple:  '#722ED1',
  teal:    '#13C2C2',
  pink:    '#EB2F96',
  bg:      '#F8FAFF',
  card:    '#FFFFFF',
  text:    '#1A1D23',
  subtext: '#8C8FA3',
  border:  '#EEF0F6',
};

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  userProfile, isAuthenticated, onBack, onNavigate, viewPadding,
}) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [statsRes, walletRes] = await Promise.all([
        fetch(`${API_BASE}/api/official/stats`, { headers }),
        fetch(`${API_BASE}/api/wallet/balance`, { headers }),
      ]);
      const s = statsRes.ok ? await statsRes.json() : {};
      const w = walletRes.ok ? await walletRes.json() : {};
      setStats({ ...s, wallet_balance: w.balance || 0 });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (!isAtLeast('official')) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: COLORS.text }}>Acceso restringido</div>
        <div style={{ color: COLORS.subtext, textAlign: 'center', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          El Dashboard Empresarial está disponible solo para cuentas Oficial, Business, Merchant o Admin.
        </div>
        <button onClick={onBack} style={{ padding: '13px 36px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Volver</button>
      </div>
    );
  }

  const ROLE_COLORS: Record<string, string> = {
    official: COLORS.primary, business: COLORS.teal,
    merchant: COLORS.warning, admin: COLORS.purple, super_admin: '#CF1322',
  };
  const roleColor = ROLE_COLORS[role] || COLORS.primary;

  const ROLE_LABELS: Record<string, string> = {
    official: 'Cuenta Oficial', business: 'Empresa',
    merchant: 'Merchant', admin: 'Admin', super_admin: 'Super Admin',
  };

  const kpis = [
    { label: 'Contactos', value: stats?.contacts ?? '—', icon: '👥', color: COLORS.primary, bg: '#EBF0FF',
      desc: 'Total de contactos guardados en tu cuenta' },
    { label: 'Mensajes', value: stats?.messages_sent ?? '—', icon: '💬', color: COLORS.teal, bg: '#E6FFFB',
      desc: 'Mensajes que has enviado en total' },
    { label: 'Chats activos', value: stats?.active_chats ?? '—', icon: '🗨️', color: COLORS.purple, bg: '#F3E8FF',
      desc: 'Conversaciones en las que participas' },
    { label: 'Broadcasts', value: stats?.broadcasts ?? '—', icon: '📢', color: COLORS.warning, bg: '#FFFBE6',
      desc: 'Mensajes masivos enviados a tus contactos' },
    ...(hasPermission('wallet.view') ? [{
      label: 'Balance', value: stats?.wallet_balance != null ? `${Number(stats.wallet_balance).toLocaleString()} XAF` : '—',
      icon: '💰', color: COLORS.success, bg: '#F6FFED',
      desc: 'Saldo disponible en tu monedero EgChat',
    }] : []),
  ];

  const quickActions = [
    { label: 'Broadcast', icon: '📢', color: COLORS.primary, bg: '#EBF0FF', perm: 'chat.broadcast', view: 'official',
      desc: 'Envía un mensaje a todos tus contactos' },
    { label: 'Contactos', icon: '👥', color: COLORS.teal, bg: '#E6FFFB', perm: 'business.view_stats', view: 'contactos',
      desc: 'Gestiona tu lista de contactos' },
    { label: 'Monedero', icon: '💳', color: COLORS.success, bg: '#F6FFED', perm: 'wallet.view', view: 'monedero',
      desc: 'Transfiere dinero y recarga tu saldo' },
    { label: 'Merchant', icon: '🏪', color: COLORS.warning, bg: '#FFFBE6', perm: 'merchant.products', view: 'merchant',
      desc: 'Gestiona tu tienda y pedidos' },
  ].filter(a => hasPermission(a.perm));

  return (
    <div style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}bb 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 18px`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            Dashboard Empresarial
            {is_verified && <VerifiedBadge type={role as any} size={18} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
            {ROLE_LABELS[role] || role} • {userProfile?.name}
          </div>
        </div>
        <button onClick={loadDashboard} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Explicación */}
        <div style={{ background: '#EBF0FF', borderRadius: 14, padding: '12px 16px', border: '1px solid #C7D9FF', fontSize: 13, color: '#1A3A6B', lineHeight: 1.6 }}>
          <b>¿Para qué sirve este panel?</b><br/>
          Aquí tienes una vista unificada de tu actividad como cuenta verificada: estadísticas de comunicación, acceso rápido a tus herramientas y resumen de tu cuenta.
        </div>

        {/* KPIs */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Resumen de actividad
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ background: COLORS.card, borderRadius: 18, height: 100, border: `1px solid ${COLORS.border}`, animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {kpis.map(kpi => (
                <div key={kpi.label} style={{ background: COLORS.card, borderRadius: 18, padding: '16px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: typeof kpi.value === 'string' && kpi.value.length > 6 ? 16 : 24, fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 3 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.subtext, marginTop: 2, lineHeight: 1.4 }}>{kpi.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        {quickActions.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ Acciones rápidas
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.view)}
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: '16px 12px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{action.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{action.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.subtext, textAlign: 'center', lineHeight: 1.4 }}>{action.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mi cuenta */}
        <div style={{ background: COLORS.card, borderRadius: 18, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.subtext, marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>Mi cuenta</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${roleColor},${roleColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
              {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (userProfile?.avatar || 'U')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                {userProfile?.name}
                {is_verified && <VerifiedBadge type={role as any} size={16} />}
              </div>
              <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 2 }}>{userProfile?.phone}</div>
              <div style={{ marginTop: 6, display: 'inline-flex', background: roleColor + '18', color: roleColor, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${roleColor}33` }}>
                {ROLE_LABELS[role] || role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
