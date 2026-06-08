/**
 * OfficialAccountView.tsx
 * Vista de cuenta oficial — perfil enriquecido, estadísticas y broadcast
 */

import React, { useState, useEffect } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface OfficialAccountViewProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
}

interface BroadcastMessage {
  text: string;
  targetType: 'all_contacts' | 'segment';
  segment?: string;
}

export const OfficialAccountView: React.FC<OfficialAccountViewProps> = ({
  userProfile,
  isAuthenticated,
  onBack,
  viewPadding,
}) => {
  const { role, hasPermission, is_verified } = useRole(isAuthenticated);
  const [tab, setTab] = useState<'profile' | 'broadcast' | 'stats'>('profile');
  const [broadcast, setBroadcast] = useState<BroadcastMessage>({ text: '', targetType: 'all_contacts' });
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (tab === 'stats') loadStats();
  }, [tab]);

  const loadStats = async () => {
    try {
      const BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/official/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const sendBroadcast = async () => {
    if (!broadcast.text.trim()) return;
    setSending(true);
    try {
      const BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/official/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(broadcast),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Broadcast enviado a ${data.sent} contactos`);
        setBroadcast({ text: '', targetType: 'all_contacts' });
      } else {
        showToast(`❌ ${data.message}`);
      }
    } catch {
      showToast('❌ Error al enviar broadcast');
    } finally {
      setSending(false);
    }
  };

  const roleLabel: Record<string, string> = {
    official: 'Cuenta Oficial',
    business: 'Cuenta Empresarial',
    merchant: 'Merchant',
    admin: 'Administrador',
    super_admin: 'Super Admin',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column', zIndex: 2000 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#00b4e6,#0088cc)', paddingTop: viewPadding.top, padding: `calc(${viewPadding.top} + 8px) 16px 12px`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            {userProfile?.name || 'Mi cuenta'}
            {is_verified && <VerifiedBadge type={role as any} size={18} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{roleLabel[role] || 'Usuario'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        {['profile', 'broadcast', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 400, color: tab === t ? '#00b4e6' : '#6b7280',
            borderBottom: tab === t ? '2px solid #00b4e6' : '2px solid transparent',
            fontSize: 13,
          }}>
            {t === 'profile' ? '👤 Perfil' : t === 'broadcast' ? '📢 Broadcast' : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* TAB: PERFIL */}
        {tab === 'profile' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#00b4e6,#0088cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.avatar || 'U')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {userProfile?.name}
                    {is_verified && <VerifiedBadge type={role as any} size={18} />}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{userProfile?.phone}</div>
                  <div style={{ marginTop: 4, background: '#e0f7fa', color: '#00838f', padding: '2px 10px', borderRadius: 20, display: 'inline-block', fontSize: 12, fontWeight: 600 }}>
                    {roleLabel[role] || 'Usuario'}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, color: '#374151', fontSize: 14 }}>
                <div style={{ marginBottom: 8 }}><b>Email:</b> {userProfile?.email || '—'}</div>
                <div style={{ marginBottom: 8 }}><b>Ciudad:</b> {userProfile?.city || '—'}</div>
                <div><b>Miembro desde:</b> {userProfile?.joinDate || '—'}</div>
              </div>
            </div>
            {!is_verified && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 14, fontSize: 13, color: '#92400e' }}>
                ⚠️ Tu cuenta aún no está verificada. Contacta con el administrador para solicitar verificación.
              </div>
            )}
          </div>
        )}

        {/* TAB: BROADCAST */}
        {tab === 'broadcast' && (
          <div>
            {!hasPermission('chat.broadcast') ? (
              <div style={{ background: '#fee2e2', borderRadius: 12, padding: 16, color: '#991b1b', fontSize: 14 }}>
                🔒 El broadcast solo está disponible para cuentas oficiales, empresariales y merchants verificados.
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📢 Enviar mensaje a todos</div>
                <select
                  value={broadcast.targetType}
                  onChange={e => setBroadcast(prev => ({ ...prev, targetType: e.target.value as any }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12, fontSize: 14, outline: 'none', background: '#f9fafb' }}
                >
                  <option value="all_contacts">Todos mis contactos</option>
                </select>
                <textarea
                  value={broadcast.text}
                  onChange={e => setBroadcast(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Escribe tu mensaje de broadcast..."
                  rows={5}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12, textAlign: 'right' }}>{broadcast.text.length}/500</div>
                <button
                  onClick={sendBroadcast}
                  disabled={sending || !broadcast.text.trim()}
                  style={{ width: '100%', padding: '12px', background: sending ? '#9ca3af' : '#00b4e6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: sending ? 'not-allowed' : 'pointer' }}
                >
                  {sending ? 'Enviando...' : '📤 Enviar broadcast'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: STATS */}
        {tab === 'stats' && (
          <div>
            {!hasPermission('business.view_stats') ? (
              <div style={{ background: '#fee2e2', borderRadius: 12, padding: 16, color: '#991b1b', fontSize: 14 }}>
                🔒 Estadísticas disponibles solo para cuentas empresariales.
              </div>
            ) : stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Contactos', value: stats.contacts || 0, icon: '👥', color: '#00b4e6' },
                  { label: 'Mensajes enviados', value: stats.messages_sent || 0, icon: '💬', color: '#00c8a0' },
                  { label: 'Chats activos', value: stats.active_chats || 0, icon: '🗨️', color: '#8b5cf6' },
                  { label: 'Broadcasts', value: stats.broadcasts || 0, icon: '📢', color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>{stat.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>Cargando estadísticas...</div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default OfficialAccountView;
