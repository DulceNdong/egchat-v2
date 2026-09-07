/**
 * OfficialAccountView.tsx — Cuenta Oficial EgChat
 * Disponible para: official, business, merchant, admin, super_admin
 *
 * ¿Por qué existe?
 * Las cuentas oficiales son negocios, instituciones o personas verificadas
 * que necesitan comunicarse con muchos contactos a la vez (broadcast),
 * ver estadísticas de su actividad y mostrar su identidad verificada.
 */

import React, { useState, useEffect } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface OfficialAccountViewProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  onManageStaff?: () => void;
  onNewIndividualChat?: () => void;
  onNewGroupChat?: () => void;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';

// Paleta de colores suaves
const COLORS = {
  primary:   '#5B8DEF',   // azul suave
  success:   '#52C41A',   // verde
  warning:   '#FAAD14',   // amarillo
  purple:    '#722ED1',   // morado
  teal:      '#13C2C2',   // teal
  bg:        '#F8FAFF',   // fondo muy suave
  card:      '#FFFFFF',
  text:      '#1A1D23',
  subtext:   '#8C8FA3',
  border:    '#EEF0F6',
};

export const OfficialAccountView: React.FC<OfficialAccountViewProps> = ({
  userProfile, isAuthenticated, onBack, viewPadding,
  onManageStaff, onNewIndividualChat, onNewGroupChat,
}) => {
  const { role, hasPermission, is_verified } = useRole(isAuthenticated);
  const [tab, setTab] = useState<'profile' | 'broadcast' | 'internal' | 'stats'>('profile');
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (tab === 'stats') {
      fetch(`${API_BASE}/api/official/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
    }
  }, [tab]);

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/official/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: broadcastText, targetType: 'all_contacts' }),
      });
      const d = await r.json();
      if (r.ok) { showToast(`Enviado a ${d.sent} contactos`); setBroadcastText(''); }
      else showToast(d.message || 'Error al enviar', false);
    } catch { showToast('Error de conexión', false); }
    setSending(false);
  };

  const ROLE_INFO: Record<string, { label: string; color: string; bg: string; desc: string }> = {
    official:    { label: 'Cuenta Oficial',       color: COLORS.primary, bg: '#EBF0FF', desc: 'Identidad verificada por EgChat' },
    business:    { label: 'Cuenta Empresarial',   color: COLORS.teal,    bg: '#E6FFFB', desc: 'Empresa registrada en EgChat' },
    merchant:    { label: 'Merchant',             color: COLORS.warning, bg: '#FFFBE6', desc: 'Vendedor verificado en EgChat' },
    admin:       { label: 'Administrador',        color: COLORS.purple,  bg: '#F3E8FF', desc: 'Acceso de administración' },
    super_admin: { label: 'Super Admin',          color: '#CF1322',      bg: '#FFF1F0', desc: 'Control total del sistema' },
  };

  const info = ROLE_INFO[role] || ROLE_INFO.official;

  const TABS = [
    { id: 'profile',    label: 'Perfil',              icon: '👤' },
    { id: 'broadcast',  label: 'Comunicado Masivo',   icon: '📣', locked: !hasPermission('chat.broadcast') },
    { id: 'internal',   label: 'Comunicación Interna',icon: '💬' },
    { id: 'stats',      label: 'Estadísticas',         icon: '📊', locked: !hasPermission('business.view_stats') },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}cc 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 16px`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            {userProfile?.name || 'Mi cuenta'}
            {is_verified && <VerifiedBadge type={role as any} size={18} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>{info.desc}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 700 }}>
          {info.label}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => !t.locked && setTab(t.id as any)} style={{
            flex: 1, padding: '13px 0', background: 'none', border: 'none', cursor: t.locked ? 'not-allowed' : 'pointer',
            fontWeight: tab === t.id ? 700 : 400,
            color: t.locked ? '#ccc' : tab === t.id ? info.color : COLORS.subtext,
            borderBottom: tab === t.id ? `2.5px solid ${info.color}` : '2.5px solid transparent',
            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s',
          }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.locked && <span style={{ fontSize: 10 }}>🔒</span>}
          </button>
        ))}
      </div>

      {/* ── Contenido ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

        {/* TAB PERFIL */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Card principal */}
            <div style={{ background: COLORS.card, borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${info.color}, ${info.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0, border: `3px solid ${info.bg}`, boxShadow: `0 0 0 2px ${info.color}44` }}>
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (userProfile?.avatar || 'U')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {userProfile?.name}
                    {is_verified && <VerifiedBadge type={role as any} size={20} />}
                  </div>
                  <div style={{ color: COLORS.subtext, fontSize: 13, marginTop: 3 }}>{userProfile?.phone}</div>
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: info.bg, color: info.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${info.color}33` }}>
                    ✓ {info.label}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✉️', label: 'Email', value: userProfile?.email || '—' },
                  { icon: '🏙️', label: 'Ciudad', value: userProfile?.city || '—' },
                  { icon: '📅', label: 'Miembro desde', value: userProfile?.joinDate || '—' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{f.icon}</span>
                    <span style={{ color: COLORS.subtext, fontSize: 13, minWidth: 100 }}>{f.label}</span>
                    <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 500 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info sobre la cuenta oficial */}
            <div style={{ background: info.bg, borderRadius: 16, padding: 16, border: `1px solid ${info.color}33` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: info.color, marginBottom: 8 }}>¿Para qué sirve tu cuenta {info.label}?</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', color: COLORS.text, fontSize: 13, lineHeight: 1.7 }}>
                <li>Envía comunicados masivos a todos tus contactos a la vez</li>
                <li>Muestra el badge de verificación en tus chats</li>
                <li>Accede a estadísticas de tu actividad en EgChat</li>
                {role === 'merchant' && <li>Gestiona productos, pedidos y cobra pagos</li>}
                {(role === 'admin' || role === 'super_admin') && <li>Administra usuarios, roles y el sistema completo</li>}
              </ul>
            </div>

            {!is_verified && (
              <div style={{ background: '#FFFBE6', borderRadius: 14, padding: 14, border: '1px solid #FFD666', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div style={{ fontSize: 13, color: '#7D4E00' }}>Tu cuenta aún no está verificada. Contacta con el administrador para solicitar la verificación.</div>
              </div>
            )}
          </div>
        )}

        {/* TAB BROADCAST */}
        {tab === 'broadcast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: COLORS.card, borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>📣 Enviar comunicado masivo</div>
              <div style={{ fontSize: 13, color: COLORS.subtext, marginBottom: 16, lineHeight: 1.6 }}>
                El comunicado llega a <b>todos tus contactos</b> como un mensaje directo en su chat contigo. Límite: 1 comunicado cada 30 minutos.
              </div>
              <textarea
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value.slice(0, 500))}
                placeholder="Escribe tu mensaje aquí..."
                rows={5}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${broadcastText ? info.color : COLORS.border}`, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border 0.2s', background: COLORS.bg, color: COLORS.text }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: broadcastText.length > 450 ? COLORS.warning : COLORS.subtext }}>{broadcastText.length}/500</span>
                <button
                  onClick={sendBroadcast}
                  disabled={sending || !broadcastText.trim()}
                  style={{ padding: '11px 28px', background: sending || !broadcastText.trim() ? '#e5e7eb' : info.color, color: sending || !broadcastText.trim() ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: sending || !broadcastText.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  {sending ? 'Enviando...' : '📤 Enviar a contactos'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB COMUNICACIÓN INTERNA */}
        {tab === 'internal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: COLORS.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.subtext, lineHeight: 1.6 }}>
              💬 Gestiona tu equipo interno y crea canales de comunicación dentro de EgChat sin salir de la plataforma.
            </div>

            {/* Añadir empleados */}
            <button
              onClick={() => onManageStaff?.()}
              style={{ background: COLORS.card, border: `1.5px solid ${info.color}33`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Gestionar empleados</div>
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 3 }}>Añade o elimina empleados de tu empresa en EgChat por número de teléfono</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* Chat individual interno */}
            <button
              onClick={() => onNewIndividualChat?.()}
              style={{ background: COLORS.card, border: `1.5px solid ${info.color}33`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Chat individual</div>
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 3 }}>Inicia una conversación privada con un empleado de tu empresa</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* Chat grupal interno */}
            <button
              onClick={() => onNewGroupChat?.()}
              style={{ background: COLORS.card, border: `1.5px solid ${info.color}33`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Grupo interno</div>
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 3 }}>Crea un grupo de trabajo para tu equipo (departamento, región, turno)</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            <div style={{ background: '#EFF5FD', borderRadius: 12, padding: '10px 14px', border: '1px solid #C7D9FF', fontSize: 12, color: '#1A3A6B', lineHeight: 1.6 }}>
              💡 Los chats internos funcionan igual que cualquier chat de EgChat. Tus empleados los verán en su lista de conversaciones.
            </div>
          </div>
        )}

        {/* TAB STATS */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: COLORS.subtext, lineHeight: 1.6, background: COLORS.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${COLORS.border}` }}>
              📊 Aquí ves el impacto de tu cuenta oficial: cuántos contactos tienes, cuántos mensajes has enviado y cuántos broadcasts has lanzado.
            </div>
            {stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Contactos', value: stats.contacts, icon: '👥', color: COLORS.primary, bg: '#EBF0FF', desc: 'Personas que te tienen guardado' },
                  { label: 'Mensajes enviados', value: stats.messages_sent, icon: '💬', color: COLORS.teal, bg: '#E6FFFB', desc: 'Total de mensajes tuyos' },
                  { label: 'Chats activos', value: stats.active_chats, icon: '🗨️', color: COLORS.purple, bg: '#F3E8FF', desc: 'Conversaciones abiertas' },
                  { label: 'Comunicados', value: stats.broadcasts, icon: '📣', color: COLORS.warning, bg: '#FFFBE6', desc: 'Comunicados masivos enviados' },
                ].map(s => (
                  <div key={s.label} style={{ background: COLORS.card, borderRadius: 18, padding: '16px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 8px' }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.subtext, marginTop: 2 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.subtext }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                <div>Cargando estadísticas...</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#1A1D23' : '#CF1322', color: '#fff', padding: '10px 22px', borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default OfficialAccountView;
