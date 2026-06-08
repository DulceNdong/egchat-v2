/**
 * BusinessDashboard.tsx
 * Dashboard empresarial para cuentas business/merchant/official
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface BusinessDashboardProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  onNavigate: (view: string) => void;
  viewPadding: { top: string; bottom: string };
}

interface DashboardStats {
  contacts: number;
  messages_sent: number;
  active_chats: number;
  broadcasts: number;
  wallet_balance: number;
  monthly_transactions: number;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  userProfile,
  isAuthenticated,
  onBack,
  onNavigate,
  viewPadding,
}) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'contacts' | 'messages' | 'finance'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
      const token = localStorage.getItem('token') || '';

      const [statsRes, walletRes] = await Promise.all([
        fetch(`${BASE}/api/official/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : {};
      const walletData = walletRes.ok ? await walletRes.json() : {};

      setStats({
        contacts: statsData.contacts || 0,
        messages_sent: statsData.messages_sent || 0,
        active_chats: statsData.active_chats || 0,
        broadcasts: statsData.broadcasts || 0,
        wallet_balance: walletData.balance || 0,
        monthly_transactions: walletData.monthly_transactions || 0,
      });
    } catch {}
    setLoading(false);
  };

  if (!isAtLeast('official')) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Acceso restringido</div>
        <div style={{ color: '#6b7280', textAlign: 'center', fontSize: 14, marginBottom: 24 }}>
          El dashboard empresarial está disponible para cuentas oficiales, empresariales y merchants.
        </div>
        <button onClick={onBack} style={{ padding: '12px 32px', background: '#00b4e6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
          Volver
        </button>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    official: 'Cuenta Oficial', business: 'Empresa', merchant: 'Merchant',
    admin: 'Administrador', super_admin: 'Super Admin',
  };

  const kpiCards = [
    { label: 'Contactos', value: stats?.contacts ?? '—', icon: '👥', color: '#00b4e6', perm: 'business.view_stats' },
    { label: 'Mensajes enviados', value: stats?.messages_sent ?? '—', icon: '💬', color: '#00c8a0', perm: 'business.view_stats' },
    { label: 'Chats activos', value: stats?.active_chats ?? '—', icon: '🗨️', color: '#8b5cf6', perm: 'business.view_stats' },
    { label: 'Broadcasts', value: stats?.broadcasts ?? '—', icon: '📢', color: '#f59e0b', perm: 'chat.broadcast' },
    { label: 'Balance XAF', value: stats?.wallet_balance ? `${stats.wallet_balance.toLocaleString()}` : '—', icon: '💰', color: '#10b981', perm: 'wallet.view' },
    { label: 'Trans. este mes', value: stats?.monthly_transactions ?? '—', icon: '📈', color: '#ef4444', perm: 'wallet.view' },
  ];

  const quickActions = [
    { label: 'Enviar Broadcast', icon: '📢', perm: 'chat.broadcast', action: () => onNavigate('official') },
    { label: 'Ver Contactos', icon: '👥', perm: 'business.view_stats', action: () => onNavigate('contactos') },
    { label: 'Monedero', icon: '💳', perm: 'wallet.view', action: () => onNavigate('monedero') },
    { label: 'Merchant', icon: '🏪', perm: 'merchant.products', action: () => onNavigate('merchant') },
  ].filter(a => hasPermission(a.perm));

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column', zIndex: 2000 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#00b4e6,#0088cc)', paddingTop: viewPadding.top, padding: `calc(${viewPadding.top} + 8px) 16px 16px`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
            Dashboard Empresarial
            {is_verified && <VerifiedBadge type={role as any} size={18} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{roleLabel[role] || 'Usuario'} • {userProfile?.name}</div>
        </div>
        <button onClick={loadDashboard} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Contenido scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* KPIs */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 10 }}>📊 Resumen</div>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Cargando...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {kpiCards.filter(k => hasPermission(k.perm)).map(kpi => (
                <div key={kpi.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        {quickActions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 10 }}>⚡ Acciones rápidas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={action.action}
                  style={{ background: '#fff', border: 'none', borderRadius: 14, padding: '16px 12px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 28 }}>{action.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info de cuenta */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12 }}>🏢 Mi cuenta</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#00b4e6,#0088cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
              {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.avatar || 'U')}
            </div>
            <div>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {userProfile?.name}
                {is_verified && <VerifiedBadge type={role as any} size={16} />}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{userProfile?.phone}</div>
              <div style={{ fontSize: 11, marginTop: 4, background: '#e0f7fa', color: '#00838f', padding: '2px 8px', borderRadius: 20, display: 'inline-block', fontWeight: 600 }}>
                {roleLabel[role] || 'Usuario'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
