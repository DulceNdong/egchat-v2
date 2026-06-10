import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from './api';
import QRCode from 'qrcode';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type SubView =
  | null
  | 'perfil'
  | 'seguridad'
  | 'privacidad'
  | 'notificaciones'
  | 'interfaz'
  | 'permisos_amigos'
  | 'almacenamiento'
  | 'mas_general'
  | 'chat_config'
  | 'llamadas'
  | 'historial_chat'
  | 'otras_funciones'
  | 'comentarios'
  | 'acerca'
  | 'sonidos';

interface ConfiguracionViewProps {
  viewPadding: { top: string; bottom?: string };
  device: { isMobile: boolean };
  userProfile: any;
  setUserProfile: (p: any) => void;
  setAvatarCropUrl: (url: string) => void;
  setIsEditingProfile: (v: boolean) => void;
  isEditingProfile: boolean;
  editedProfile: any;
  setEditedProfile: (p: any) => void;
  soundSettings: any;
  updateSoundSetting: (key: string, value: any) => void;
  MESSAGE_TONES: any[];
  RINGTONES: any[];
  NOTIFICATION_TONES: any[];
  customTones: any[];
  saveCustomTones: (t: any[]) => void;
  appFontSize: number;
  setAppFontSize: (v: number) => void;
  appFontFamily: string;
  setAppFontFamily: (v: string) => void;
  activityLog: any[];
  walletPIN: any;
  setShowSetupPIN: (v: boolean) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setCurrentView: (v: string) => void;
  removePushListeners: () => Promise<void>;
  cleanupCallManager: () => Promise<void>;
  setIsAuthenticated: (v: boolean) => void;
  setRealChats: (c: any[]) => void;
  setSelectedChat: (c: any) => void;
  currentSettingsTab: string;
  setCurrentSettingsTab: (t: any) => void;
}

// ─────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <div
    onClick={onChange}
    style={{
      width: '44px', height: '26px', borderRadius: '13px',
      background: value ? '#07c160' : '#d1d5db',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: '3px',
      left: value ? '21px' : '3px',
      width: '20px', height: '20px', borderRadius: '50%',
      background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      transition: 'left 0.2s',
    }} />
  </div>
);

const SettingRow = ({
  icon, iconBg, label, value, onPress, danger = false, toggle, toggleValue,
}: {
  icon: React.ReactNode; iconBg: string; label: string;
  value?: string; onPress?: () => void; danger?: boolean;
  toggle?: boolean; toggleValue?: boolean;
}) => (
  <button
    onClick={onPress}
    style={{
      width: '100%', display: 'flex', alignItems: 'center',
      gap: '12px', padding: '13px 16px', background: 'none',
      border: 'none', cursor: onPress ? 'pointer' : 'default',
      outline: 'none', textAlign: 'left',
    }}
  >
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: iconBg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <span style={{ flex: 1, fontSize: '16px', color: danger ? '#ef4444' : '#111827', fontWeight: '400' }}>
      {label}
    </span>
    {toggle !== undefined
      ? <Toggle value={!!toggleValue} onChange={onPress || (() => {})} />
      : <>
          {value && <span style={{ fontSize: '14px', color: '#8e8e93', marginRight: '4px' }}>{value}</span>}
          {onPress && <ChevronRight />}
        </>
    }
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <div style={{
    fontSize: '13px', fontWeight: '500', color: '#8e8e93',
    padding: '16px 16px 6px', textTransform: 'none',
    letterSpacing: '0',
  }}>
    {label}
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: '#fff', borderRadius: '12px',
    marginLeft: '16px', marginRight: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }}>
    {children}
  </div>
);

const Divider = () => (
  <div style={{ height: '1px', background: '#f2f2f7', marginLeft: '60px' }} />
);

// Sub-vista wrapper con header
const SubScreen = ({
  title, onBack, children, paddingTop, paddingBottom,
}: {
  title: string; onBack: () => void; children: React.ReactNode;
  paddingTop: string; paddingBottom: string;
}) => (
  <div style={{
    position: 'absolute', inset: 0, background: '#f2f2f7',
    display: 'flex', flexDirection: 'column', zIndex: 10,
    paddingTop, paddingBottom,
    overflowY: 'auto',
  }}>
    {/* Header */}
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: paddingTop,
      background: 'rgba(242,242,247,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'flex-end', paddingBottom: '10px',
      zIndex: 20, borderBottom: '0.5px solid rgba(0,0,0,0.1)',
    }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        gap: '4px', color: '#07c160',
      }}>
        <svg width="10" height="16" viewBox="0 0 10 18" fill="none" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 1 1 9 9 17" />
        </svg>
        <span style={{ fontSize: '16px' }}>Volver</span>
      </button>
      <span style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        bottom: '10px', fontSize: '17px', fontWeight: '600', color: '#111827',
      }}>
        {title}
      </span>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ─────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────
export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  viewPadding, device, userProfile, setUserProfile, setAvatarCropUrl,
  setIsEditingProfile, isEditingProfile, editedProfile, setEditedProfile,
  soundSettings, updateSoundSetting, MESSAGE_TONES, RINGTONES, NOTIFICATION_TONES,
  customTones, saveCustomTones, appFontSize, setAppFontSize, appFontFamily, setAppFontFamily,
  activityLog, walletPIN, setShowSetupPIN, showToast, setCurrentView,
  removePushListeners, cleanupCallManager, setIsAuthenticated, setRealChats, setSelectedChat,
}) => {
  const [subView, setSubView] = useState<SubView>(null);
  const [searchText, setSearchText] = useState('');

  // Notificaciones locales
  const [notifMessages, setNotifMessages] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_notif_messages') ?? 'true'));
  const [notifGroups, setNotifGroups] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_notif_groups') ?? 'true'));
  const [notifCalls, setNotifCalls] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_notif_calls') ?? 'true'));
  const [notifStories, setNotifStories] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_notif_stories') ?? 'false'));
  const [notifPreview, setNotifPreview] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_notif_preview') ?? 'true'));

  // Interfaz
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('cfg_dark_mode') === 'true');
  const [chatBg, setChatBg] = useState(() =>
    localStorage.getItem('cfg_chat_bg') || '#e5ddd5');
  const [enterToSend, setEnterToSend] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_enter_send') ?? 'false'));

  // Chat
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_auto_dl_wifi') ?? 'true'));
  const [autoDownloadData, setAutoDownloadData] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_auto_dl_data') ?? 'false'));
  const [readReceipts, setReadReceipts] = useState(() =>
    JSON.parse(localStorage.getItem('cfg_read_receipts') ?? 'true'));
  const [fontSizeChat, setFontSizeChat] = useState<'small' | 'medium' | 'large'>(() =>
    (localStorage.getItem('cfg_font_size_chat') as any) || 'medium');

  // Privacidad
  const [lastSeenVisible, setLastSeenVisible] = useState(() =>
    localStorage.getItem('cfg_last_seen') || 'todos');
  const [photoVisible, setPhotoVisible] = useState(() =>
    localStorage.getItem('cfg_photo_vis') || 'todos');
  const [statusVisible, setStatusVisible] = useState(() =>
    localStorage.getItem('cfg_status_vis') || 'todos');
  const [blockedCount] = useState(0);

  // Almacenamiento
  const [storageUsed] = useState(() => Math.round(Math.random() * 200 + 50));

  // Búsqueda — todas las filas
  const allRows = [
    { label: 'Perfil', sub: 'perfil' }, { label: 'Seguridad de la cuenta', sub: 'seguridad' },
    { label: 'Mi información y autorizaciones', sub: 'privacidad' },
    { label: 'Notificaciones', sub: 'notificaciones' },
    { label: 'Interfaz y pantalla', sub: 'interfaz' },
    { label: 'Permisos de amigos', sub: 'permisos_amigos' },
    { label: 'Almacenamiento', sub: 'almacenamiento' },
    { label: 'Chat', sub: 'chat_config' },
    { label: 'Llamadas de voz y video', sub: 'llamadas' },
    { label: 'Administrar el historial de chat', sub: 'historial_chat' },
    { label: 'Otras funciones', sub: 'otras_funciones' },
    { label: 'Comentarios', sub: 'comentarios' },
    { label: 'Acerca de EGCHAT', sub: 'acerca' },
  ] as { label: string; sub: SubView }[];

  const filteredRows = searchText.trim()
    ? allRows.filter(r => r.label.toLowerCase().includes(searchText.toLowerCase()))
    : null;

  const padTop = viewPadding.top;
  const padBot = device.isMobile
    ? 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'
    : '24px';

  // ── persist helpers ──
  const saveNotif = (key: string, val: boolean) =>
    localStorage.setItem(key, JSON.stringify(val));
  const saveStr = (key: string, val: string) =>
    localStorage.setItem(key, val);

  // ── LOGOUT ──
  const handleLogout = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    try {
      await authAPI.logout();
      await removePushListeners().catch(() => {});
      await cleanupCallManager().catch(() => {});
    } catch {}
    ['user_avatar', 'egchat_contacts_cache', 'egchat_chats_cache', 'egchat_msgs_index'].forEach(k =>
      localStorage.removeItem(k));
    setIsAuthenticated(false);
    setUserProfile({ id: '', name: '', phone: '', email: '', address: '', city: '', country: 'Guinea Ecuatorial', avatar: 'U', avatarUrl: '', joinDate: new Date().toLocaleDateString('es-ES'), verificationStatus: 'pending', twoFactorEnabled: false, notificationsEnabled: true });
    setRealChats([]);
    setSelectedChat(null);
    setCurrentView('home');
  };

  // ── RENDER SUB-VISTAS ──
  const renderSubView = () => {
    if (!subView) return null;

    const wrap = (title: string, content: React.ReactNode) => (
      <SubScreen title={title} onBack={() => setSubView(null)} paddingTop={padTop} paddingBottom={padBot}>
        {content}
      </SubScreen>
    );

    // ── PERFIL ──
    if (subView === 'perfil') {
      // estado local para QR y edición de bio
      const [qrImg, setQrImg] = React.useState('');
      const [showQR, setShowQR] = React.useState(false);
      const [editingField, setEditingField] = React.useState<string | null>(null);
      const [fieldVal, setFieldVal] = React.useState('');
      const [gender, setGender] = React.useState(
        () => localStorage.getItem('cfg_gender') || 'No especificado');
      const [bio, setBio] = React.useState(
        () => localStorage.getItem('cfg_bio') || '');
      const [region, setRegion] = React.useState(
        () => userProfile.country || 'Guinea Ecuatorial');

      const maskPhone = (p: string) => {
        if (!p || p.length < 6) return p;
        return p.slice(0, 3) + '****' + p.slice(-2);
      };

      const generateQR = async () => {
        try {
          const data = JSON.stringify({ type: 'contact', app: 'EGCHAT', id: userProfile.id, phone: userProfile.phone, name: userProfile.name });
          const img = await QRCode.toDataURL(data, { width: 220, margin: 2, color: { dark: '#111827', light: '#ffffff' } });
          setQrImg(img); setShowQR(true);
        } catch {}
      };

      const openEdit = (field: string, current: string) => {
        setEditingField(field); setFieldVal(current);
      };

      const saveField = async () => {
        if (!editingField) return;
        try {
          if (editingField === 'name') {
            await authAPI.updateProfile({ full_name: fieldVal, avatar_url: userProfile.avatarUrl });
            setUserProfile({ ...userProfile, name: fieldVal });
            localStorage.setItem('egchat_user_profile', JSON.stringify({ ...userProfile, name: fieldVal }));
            showToast('✓ Nombre actualizado', 'success');
          } else if (editingField === 'bio') {
            setBio(fieldVal); localStorage.setItem('cfg_bio', fieldVal);
            showToast('✓ Novedades actualizadas', 'success');
          } else if (editingField === 'gender') {
            setGender(fieldVal); localStorage.setItem('cfg_gender', fieldVal);
            showToast('✓ Género guardado', 'success');
          } else if (editingField === 'region') {
            setRegion(fieldVal);
            setUserProfile({ ...userProfile, country: fieldVal });
            showToast('✓ Región actualizada', 'success');
          }
        } catch (e: any) { showToast(e?.message || 'Error al guardar', 'error'); }
        setEditingField(null);
      };

      return wrap('Perfil', (
        <div style={{ paddingBottom: '32px' }}>
          {/* Bloque foto + nombre */}
          <div style={{ background: '#fff', marginBottom: '1px' }}>
            {/* Foto de perfil */}
            <button
              onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = 'image/*';
                inp.onchange = () => { const f = inp.files?.[0]; if (f) { const r = new FileReader(); r.onload = e => setAvatarCropUrl(e.target?.result as string); r.readAsDataURL(f); } };
                inp.click();
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}
            >
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Foto de perfil</span>
              <div style={{ width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', background: 'linear-gradient(135deg,#07c160,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '10px' }}>
                {userProfile.avatarUrl
                  ? <img src={userProfile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{userProfile.avatar || 'U'}</span>}
              </div>
              <ChevronRight />
            </button>

            {/* Nombre */}
            <button onClick={() => openEdit('name', userProfile.name || '')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Nombre</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.name || '—'}</span>
              <ChevronRight />
            </button>

            {/* Novedades / Bio */}
            <button onClick={() => openEdit('bio', bio)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Novedades</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: bio ? 'normal' : 'italic' }}>{bio || 'Añadir estado'}</span>
              <ChevronRight />
            </button>

            {/* Género */}
            <button onClick={() => openEdit('gender', gender)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Género</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px' }}>{gender}</span>
              <ChevronRight />
            </button>

            {/* Región */}
            <button onClick={() => openEdit('region', region)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Región</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px' }}>{region}</span>
              <ChevronRight />
            </button>

            {/* Teléfono */}
            <button onClick={() => showToast('Contacta soporte para cambiar el teléfono', 'info')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Teléfono</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px', fontFamily: 'monospace' }}>{maskPhone(userProfile.phone || '')}</span>
              <ChevronRight />
            </button>

            {/* ID */}
            <button
              onClick={() => { navigator.clipboard?.writeText(userProfile.id || '').then(() => showToast('✓ ID copiado', 'success')).catch(() => showToast(userProfile.id || '', 'info')); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>ID</span>
              <span style={{ fontSize: '15px', color: '#8e8e93', marginRight: '8px', fontFamily: 'monospace' }}>{userProfile.id?.slice(0, 8).toUpperCase() || '—'}</span>
              <ChevronRight />
            </button>

            {/* Mi código QR */}
            <button onClick={generateQR}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Mi código QR</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" style={{ marginRight: '8px' }}>
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
              </svg>
              <ChevronRight />
            </button>

          </div>

          {/* Segunda sección */}
          <div style={{ background: '#fff', marginTop: '8px', marginBottom: '1px' }}>

            {/* Tono de timbre */}
            <button onClick={() => setSubView('sonidos')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Tono de timbre para llamadas entrantes</span>
              <span style={{ fontSize: '14px', color: '#8e8e93', marginRight: '8px' }}>{RINGTONES.find(r => r.id === soundSettings.ringtone)?.name || 'Clásico'}</span>
              <ChevronRight />
            </button>

            {/* Mi dirección */}
            <button onClick={() => openEdit('region', userProfile.address || '')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Mi dirección</span>
              <span style={{ fontSize: '14px', color: '#8e8e93', marginRight: '8px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.address || '—'}</span>
              <ChevronRight />
            </button>

            {/* Título de beneficiario */}
            <button onClick={() => showToast('Configura tu nombre en pagos recibidos', 'info')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>Mi título de beneficiario de ingreso</span>
              <span style={{ fontSize: '14px', color: '#8e8e93', marginRight: '8px' }}>{userProfile.name || '—'}</span>
              <ChevronRight />
            </button>

            {/* EGCoins — equivalente a WeBeans */}
            <button onClick={() => { setSubView(null); setCurrentView('monedero'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>EGCoins</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <ChevronRight />
            </button>
          </div>

          {/* PIN de pagos */}
          <div style={{ background: '#fff', marginTop: '8px' }}>
            <button onClick={() => setShowSetupPIN(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <span style={{ flex: 1, fontSize: '16px', color: '#111827', textAlign: 'left' }}>PIN de pagos</span>
              <span style={{ fontSize: '14px', color: walletPIN.isSet() ? '#07c160' : '#f59e0b', marginRight: '8px' }}>{walletPIN.isSet() ? '✅ Configurado' : '⚠️ Sin PIN'}</span>
              <ChevronRight />
            </button>
          </div>

          {/* Modal edición de campo */}
          {editingField && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>
                  {editingField === 'name' ? 'Nombre' : editingField === 'bio' ? 'Novedades' : editingField === 'gender' ? 'Género' : 'Región'}
                </div>

                {editingField === 'gender' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {['Hombre', 'Mujer', 'No especificado'].map(g => (
                      <button key={g} onClick={() => setFieldVal(g)}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: fieldVal === g ? '2px solid #07c160' : '1px solid #e5e7eb', background: fieldVal === g ? '#d1fae5' : '#f9fafb', fontSize: '15px', color: '#111827', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
                        {g} {fieldVal === g && '✓'}
                      </button>
                    ))}
                  </div>
                ) : editingField === 'region' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
                    {['Guinea Ecuatorial', 'Camerún', 'Gabón', 'Nigeria', 'España', 'Francia', 'Estados Unidos', 'China', 'Otro'].map(r => (
                      <button key={r} onClick={() => setFieldVal(r)}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: fieldVal === r ? '2px solid #07c160' : '1px solid #e5e7eb', background: fieldVal === r ? '#d1fae5' : '#f9fafb', fontSize: '15px', color: '#111827', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
                        {r} {fieldVal === r && '✓'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={fieldVal}
                    onChange={e => setFieldVal(e.target.value)}
                    autoFocus
                    placeholder={editingField === 'bio' ? 'Escribe tu estado...' : 'Escribe tu nombre...'}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #07c160', borderRadius: '10px', fontSize: '16px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                  />
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditingField(null)}
                    style={{ flex: 1, padding: '13px', background: '#f3f4f6', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={saveField}
                    style={{ flex: 1, padding: '13px', background: '#07c160', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal QR */}
          {showQR && qrImg && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', textAlign: 'center', width: '280px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '17px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Mi código QR</div>
                <div style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '18px' }}>Escanea para agregarme en EGCHAT</div>
                <img src={qrImg} alt="QR" style={{ width: '200px', height: '200px', margin: '0 auto 18px', display: 'block', borderRadius: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { const a = document.createElement('a'); a.href = qrImg; a.download = `egchat-qr-${userProfile.phone}.png`; a.click(); showToast('QR descargado', 'success'); }}
                    style={{ flex: 1, padding: '12px', background: '#07c160', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    Descargar
                  </button>
                  <button onClick={() => setShowQR(false)}
                    style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '10px', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ));
    }

    // ── SEGURIDAD ──
    if (subView === 'seguridad') return wrap('Seguridad de la cuenta', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Contraseña y acceso" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} iconBg="#eff6ff" label="Cambiar contraseña" onPress={() => showToast('Función próximamente', 'info')} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} iconBg="#ede9fe" label="Autenticación 2 factores" value={userProfile.twoFactorEnabled ? 'Activado' : 'Desactivado'} onPress={() => showToast('Próximamente disponible', 'info')} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M12 8v4M12 16h.01"/></svg>} iconBg="#fef3c7" label="PIN de pagos" value={walletPIN.isSet() ? '✅ Configurado' : '⚠️ Sin PIN'} onPress={() => setShowSetupPIN(true)} />
        </Card>

        <SectionHeader label="Dispositivos y sesiones" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>} iconBg="#d1fae5" label="Sesiones activas" value="Este dispositivo" onPress={() => showToast('Solo hay 1 sesión activa', 'info')} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>} iconBg="#f3f4f6" label="Registro de actividad" onPress={() => {}} />
        </Card>

        <SectionHeader label="Registro de accesos recientes" />
        <Card>
          {activityLog.slice(0, 4).map((log, i, arr) => (
            <React.Fragment key={log.id}>
              <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: log.type === 'login' ? '#d1fae5' : log.type === 'security' ? '#fee2e2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                  {log.type === 'login' ? '🔑' : log.type === 'security' ? '🔐' : log.type === 'transaction' ? '💸' : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{log.action}</div>
                  <div style={{ fontSize: '12px', color: '#8e8e93' }}>{log.timestamp?.toLocaleString('es-ES')}</div>
                </div>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
      </div>
    ));

    // ── PRIVACIDAD / MI INFORMACIÓN ──
    if (subView === 'privacidad') return wrap('Mi información', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Visibilidad" />
        <Card>
          {[
            { label: 'Última vez', stateVal: lastSeenVisible, setter: setLastSeenVisible, key: 'cfg_last_seen' },
            { label: 'Foto de perfil', stateVal: photoVisible, setter: setPhotoVisible, key: 'cfg_photo_vis' },
            { label: 'Estado / Historia', stateVal: statusVisible, setter: setStatusVisible, key: 'cfg_status_vis' },
          ].map((row, i, arr) => (
            <React.Fragment key={row.key}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827' }}>{row.label}</span>
                <select
                  value={row.stateVal}
                  onChange={e => { row.setter(e.target.value); saveStr(row.key, e.target.value); }}
                  style={{ fontSize: '14px', color: '#07c160', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <option value="todos">Todos</option>
                  <option value="contactos">Contactos</option>
                  <option value="nadie">Nadie</option>
                </select>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Contactos bloqueados" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} iconBg="#fee2e2" label="Bloqueados" value={`${blockedCount} contactos`} onPress={() => showToast('Sin contactos bloqueados', 'info')} />
        </Card>

        <SectionHeader label="Datos personales" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} iconBg="#f3f4f6" label="Descargar mis datos" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>} iconBg="#fee2e2" label="Eliminar mi cuenta" danger onPress={() => showToast('Contacta con soporte para eliminar tu cuenta', 'info')} />
        </Card>
      </div>
    ));

    // ── NOTIFICACIONES ──
    if (subView === 'notificaciones') return wrap('Notificaciones', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Mensajes y grupos" />
        <Card>
          <SettingRow icon="💬" iconBg="#d1fae5" label="Mensajes privados" toggle toggleValue={notifMessages}
            onPress={() => { const v = !notifMessages; setNotifMessages(v); saveNotif('cfg_notif_messages', v); }} />
          <Divider />
          <SettingRow icon="👥" iconBg="#dbeafe" label="Grupos" toggle toggleValue={notifGroups}
            onPress={() => { const v = !notifGroups; setNotifGroups(v); saveNotif('cfg_notif_groups', v); }} />
          <Divider />
          <SettingRow icon="📖" iconBg="#fef9c3" label="Mostrar vista previa" toggle toggleValue={notifPreview}
            onPress={() => { const v = !notifPreview; setNotifPreview(v); saveNotif('cfg_notif_preview', v); }} />
        </Card>

        <SectionHeader label="Llamadas y estados" />
        <Card>
          <SettingRow icon="📞" iconBg="#ede9fe" label="Llamadas" toggle toggleValue={notifCalls}
            onPress={() => { const v = !notifCalls; setNotifCalls(v); saveNotif('cfg_notif_calls', v); }} />
          <Divider />
          <SettingRow icon="🎞️" iconBg="#fce7f3" label="Historias / Estados" toggle toggleValue={notifStories}
            onPress={() => { const v = !notifStories; setNotifStories(v); saveNotif('cfg_notif_stories', v); }} />
        </Card>

        <SectionHeader label="Sonidos (ajuste rápido)" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>} iconBg="#fef3c7"
            label="Volumen" value={`${Math.round(soundSettings.volume * 100)}%`} onPress={() => setSubView('sonidos')} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M2 12h1M21 12h1M4.22 4.22l.71.71M18.36 18.36l.71.71"/><circle cx="12" cy="12" r="4"/></svg>} iconBg="#f0fdf4"
            label="Vibración" toggle toggleValue={soundSettings.vibrationEnabled}
            onPress={() => updateSoundSetting('vibrationEnabled', !soundSettings.vibrationEnabled)} />
        </Card>
      </div>
    ));

    // ── INTERFAZ Y PANTALLA ──
    if (subView === 'interfaz') return wrap('Interfaz y pantalla', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Apariencia" />
        <Card>
          <SettingRow icon="🌙" iconBg="#312e81" label="Modo oscuro" toggle toggleValue={darkMode}
            onPress={() => { const v = !darkMode; setDarkMode(v); localStorage.setItem('cfg_dark_mode', String(v)); showToast(v ? 'Modo oscuro: próximamente' : 'Modo claro activado', 'info'); }} />
          <Divider />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '15px', color: '#111827', marginBottom: '12px' }}>Tamaño de letra</div>
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 12px', fontSize: `${appFontSize * 14}px`, color: '#374151', marginBottom: '12px' }}>
              Vista previa del texto
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#8e8e93' }}>A</span>
              <input type="range" min="0.8" max="1.5" step="0.05" value={appFontSize}
                onChange={e => { const v = parseFloat(e.target.value); setAppFontSize(v); localStorage.setItem('egchat_fontsize', String(v)); }}
                style={{ flex: 1, accentColor: '#07c160' }} />
              <span style={{ fontSize: '18px', color: '#374151' }}>A</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {[{ label: 'Pequeña', v: 0.85 }, { label: 'Normal', v: 1 }, { label: 'Grande', v: 1.15 }, { label: 'Muy grande', v: 1.35 }].map(opt => (
                <button key={opt.v} onClick={() => { setAppFontSize(opt.v); localStorage.setItem('egchat_fontsize', String(opt.v)); }}
                  style={{ padding: '5px 10px', borderRadius: '8px', border: Math.abs(appFontSize - opt.v) < 0.03 ? '1.5px solid #07c160' : '1px solid #e5e7eb', background: Math.abs(appFontSize - opt.v) < 0.03 ? '#d1fae5' : '#f9fafb', color: Math.abs(appFontSize - opt.v) < 0.03 ? '#07c160' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <SectionHeader label="Tipografía" />
        <Card>
          {[
            { id: 'default', name: 'Sistema', font: "'Segoe UI', system-ui, sans-serif" },
            { id: 'rounded', name: 'Redondeada', font: "'Nunito', sans-serif" },
            { id: 'modern', name: 'Moderna', font: "'Inter', sans-serif" },
            { id: 'classic', name: 'Clásica', font: 'Georgia, serif' },
            { id: 'mono', name: 'Mono', font: "'Courier New', monospace" },
          ].map((f, i, arr) => (
            <React.Fragment key={f.id}>
              <button onClick={() => { setAppFontFamily(f.id); localStorage.setItem('egchat_fontfamily', f.id); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827', fontFamily: f.font, textAlign: 'left' }}>{f.name} — Hola, ¿cómo estás?</span>
                {appFontFamily === f.id && <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Chat" />
        <Card>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '15px', color: '#111827', marginBottom: '10px' }}>Fondo del chat</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['#e5ddd5', '#d6eaf8', '#d5f5e3', '#f9ebea', '#f4ecf7', '#fdfefe'].map(c => (
                <button key={c} onClick={() => { setChatBg(c); saveStr('cfg_chat_bg', c); }}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', background: c, border: chatBg === c ? '2.5px solid #07c160' : '1.5px solid #e5e7eb', cursor: 'pointer', outline: 'none' }} />
              ))}
            </div>
          </div>
        </Card>
      </div>
    ));

    // ── PERMISOS DE AMIGOS ──
    if (subView === 'permisos_amigos') return wrap('Permisos de amigos', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="¿Quién puede contactarme?" />
        <Card>
          {[
            { label: 'Añadirme como contacto', options: ['Todos', 'Solo mis contactos'] },
            { label: 'Enviarme mensajes', options: ['Todos', 'Solo contactos'] },
            { label: 'Verme en búsqueda', options: ['Todos', 'Nadie'] },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827' }}>{row.label}</span>
                <select style={{ fontSize: '14px', color: '#07c160', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
                  {row.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Solicitudes de contacto" />
        <Card>
          <SettingRow icon="✅" iconBg="#d1fae5" label="Aceptar automáticamente" toggle toggleValue={false} onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="🔕" iconBg="#fee2e2" label="Silenciar desconocidos" toggle toggleValue={true} onPress={() => showToast('Próximamente', 'info')} />
        </Card>
      </div>
    ));

    // ── ALMACENAMIENTO ──
    if (subView === 'almacenamiento') return wrap('Almacenamiento', (
      <div style={{ paddingBottom: '32px' }}>
        {/* Gráfico de uso */}
        <div style={{ margin: '16px', background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Uso de almacenamiento</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#07c160', marginBottom: '4px' }}>{storageUsed} MB</div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>de espacio usado</div>
          <div style={{ marginTop: '14px', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(storageUsed / 5, 100)}%`, background: 'linear-gradient(90deg, #07c160, #00b4e6)', borderRadius: '4px', transition: 'width 0.5s' }} />
          </div>
        </div>

        <SectionHeader label="Por tipo de contenido" />
        <Card>
          {[
            { icon: '🖼️', bg: '#dbeafe', label: 'Fotos', size: `${Math.round(storageUsed * 0.45)} MB` },
            { icon: '🎥', bg: '#ede9fe', label: 'Videos', size: `${Math.round(storageUsed * 0.30)} MB` },
            { icon: '🎵', bg: '#fef3c7', label: 'Audio y mensajes de voz', size: `${Math.round(storageUsed * 0.12)} MB` },
            { icon: '📄', bg: '#d1fae5', label: 'Documentos', size: `${Math.round(storageUsed * 0.13)} MB` },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{row.icon}</div>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827' }}>{row.label}</span>
                <span style={{ fontSize: '14px', color: '#8e8e93' }}>{row.size}</span>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Gestión" />
        <Card>
          <SettingRow icon="🗑️" iconBg="#fee2e2" label="Liberar espacio" onPress={() => showToast('Caché limpiada', 'success')} danger />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} iconBg="#f3f4f6"
            label="Descarga automática en Wi-Fi" toggle toggleValue={autoDownloadWifi}
            onPress={() => { const v = !autoDownloadWifi; setAutoDownloadWifi(v); localStorage.setItem('cfg_auto_dl_wifi', JSON.stringify(v)); }} />
          <Divider />
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M1 6l11 14L23 6"/></svg>} iconBg="#fef3c7"
            label="Descarga automática en datos" toggle toggleValue={autoDownloadData}
            onPress={() => { const v = !autoDownloadData; setAutoDownloadData(v); localStorage.setItem('cfg_auto_dl_data', JSON.stringify(v)); }} />
        </Card>
      </div>
    ));

    // ── CHAT CONFIG ──
    if (subView === 'chat_config') return wrap('Chat', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Comportamiento" />
        <Card>
          <SettingRow icon="↩️" iconBg="#d1fae5" label="Enter para enviar" toggle toggleValue={enterToSend}
            onPress={() => { const v = !enterToSend; setEnterToSend(v); localStorage.setItem('cfg_enter_send', JSON.stringify(v)); }} />
          <Divider />
          <SettingRow icon="✅" iconBg="#dbeafe" label="Confirmaciones de lectura" toggle toggleValue={readReceipts}
            onPress={() => { const v = !readReceipts; setReadReceipts(v); localStorage.setItem('cfg_read_receipts', JSON.stringify(v)); }} />
        </Card>

        <SectionHeader label="Tamaño de fuente en chat" />
        <Card>
          {(['small', 'medium', 'large'] as const).map((sz, i, arr) => {
            const labels = { small: 'Pequeña', medium: 'Normal', large: 'Grande' };
            return (
              <React.Fragment key={sz}>
                <button onClick={() => { setFontSizeChat(sz); localStorage.setItem('cfg_font_size_chat', sz); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                  <span style={{ flex: 1, fontSize: '15px', color: '#111827', textAlign: 'left' }}>{labels[sz]}</span>
                  {fontSizeChat === sz && <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </Card>

        <SectionHeader label="Medios" />
        <Card>
          <SettingRow icon="🖼️" iconBg="#dbeafe" label="Guardar fotos automáticamente" toggle toggleValue={autoDownloadWifi}
            onPress={() => { const v = !autoDownloadWifi; setAutoDownloadWifi(v); }} />
          <Divider />
          <SettingRow icon="📍" iconBg="#fce7f3" label="Compartir ubicación en chats" toggle toggleValue={false} onPress={() => showToast('Activa desde el chat', 'info')} />
        </Card>
      </div>
    ));

    // ── LLAMADAS ──
    if (subView === 'llamadas') return wrap('Llamadas de voz y video', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Calidad y red" />
        <Card>
          {[
            { label: 'Usar datos para llamadas', icon: '📶', bg: '#dbeafe' },
            { label: 'Llamadas HD', icon: '🎙️', bg: '#d1fae5' },
            { label: 'Reducir uso de datos', icon: '📉', bg: '#fef3c7' },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <SettingRow icon={row.icon} iconBg={row.bg} label={row.label} toggle toggleValue={true} onPress={() => showToast('Próximamente', 'info')} />
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Privacidad en llamadas" />
        <Card>
          <SettingRow icon="🔕" iconBg="#fee2e2" label="Silenciar llamadas de desconocidos" toggle toggleValue={false} onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="📞" iconBg="#d1fae5" label="Mostrar ID al llamar" toggle toggleValue={true} onPress={() => showToast('Próximamente', 'info')} />
        </Card>

        <SectionHeader label="Tonos (acceso rápido)" />
        <Card>
          <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/></svg>} iconBg="#dbeafe"
            label="Tono de llamada" value={RINGTONES.find(r => r.id === soundSettings.ringtone)?.name || 'Clásico'}
            onPress={() => setSubView('sonidos')} />
        </Card>
      </div>
    ));

    // ── HISTORIAL CHAT ──
    if (subView === 'historial_chat') return wrap('Historial de chat', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Copia de seguridad" />
        <Card>
          <SettingRow icon="☁️" iconBg="#dbeafe" label="Copia en la nube" value="Automática" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="📅" iconBg="#d1fae5" label="Frecuencia" value="Diaria" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="📡" iconBg="#fef3c7" label="Solo con Wi-Fi" toggle toggleValue={true} onPress={() => showToast('Próximamente', 'info')} />
        </Card>

        <SectionHeader label="Acciones" />
        <Card>
          <SettingRow icon="📤" iconBg="#d1fae5" label="Exportar chat" onPress={() => showToast('Selecciona un chat para exportarlo', 'info')} />
          <Divider />
          <SettingRow icon="🗑️" iconBg="#fee2e2" label="Eliminar todos los chats" danger onPress={() => { if (confirm('¿Eliminar todos los chats locales?')) { showToast('Chats locales eliminados', 'success'); } }} />
          <Divider />
          <SettingRow icon="🧹" iconBg="#fef3c7" label="Borrar mensajes eliminados" onPress={() => showToast('Caché limpiada', 'success')} />
        </Card>
      </div>
    ));

    // ── OTRAS FUNCIONES ──
    if (subView === 'otras_funciones') return wrap('Otras funciones', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Herramientas" />
        <Card>
          <SettingRow icon="📷" iconBg="#dbeafe" label="Escáner QR" onPress={() => { setSubView(null); setCurrentView('qr-scanner'); }} />
          <Divider />
          <SettingRow icon="🗺️" iconBg="#d1fae5" label="Compartir ubicación" onPress={() => { setSubView(null); setCurrentView('mapa'); }} />
          <Divider />
          <SettingRow icon="🔔" iconBg="#fef3c7" label="Activar notificaciones push" onPress={async () => {
            if (!('Notification' in window)) { showToast('No soportado en este navegador', 'error'); return; }
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
              new Notification('✅ Notificaciones activadas', { body: 'EGCHAT te notificará', icon: '/logo-120.svg.png' });
              showToast('✅ Notificaciones activadas', 'success');
            } else {
              showToast('Permisos denegados — actívalos en el navegador', 'error');
            }
          }} />
          <Divider />
          <SettingRow icon="🌐" iconBg="#ede9fe" label="Idioma de la app" value="Español" onPress={() => showToast('Español — más idiomas próximamente', 'info')} />
        </Card>

        <SectionHeader label="Experimental" />
        <Card>
          <SettingRow icon="🤖" iconBg="#d1fae5" label="LIA-25 Asistente IA" onPress={() => { setSubView(null); setCurrentView('Lia-25'); }} />
          <Divider />
          <SettingRow icon="⚡" iconBg="#fef3c7" label="Modo offline" toggle toggleValue={false} onPress={() => showToast('Próximamente', 'info')} />
        </Card>
      </div>
    ));

    // ── COMENTARIOS ──
    if (subView === 'comentarios') return wrap('Comentarios', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Envíanos tu opinión" />
        <div style={{ margin: '0 16px', background: '#fff', borderRadius: '12px', padding: '16px' }}>
          <textarea
            placeholder="Escribe tu comentario, sugerencia o reporte de error..."
            rows={5}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', fontSize: '15px', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827' }}
          />
          <button onClick={() => showToast('✓ Comentario enviado — ¡gracias!', 'success')} style={{ marginTop: '12px', width: '100%', background: '#07c160', border: 'none', borderRadius: '10px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Enviar comentario
          </button>
        </div>

        <SectionHeader label="Contacto directo" />
        <Card>
          <SettingRow icon="✉️" iconBg="#dbeafe" label="support@egchat.com" onPress={() => window.open('mailto:support@egchat.com')} />
          <Divider />
          <SettingRow icon="💬" iconBg="#d1fae5" label="Chat en vivo" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="📞" iconBg="#fef3c7" label="+240 222 123 456" onPress={() => window.open('tel:+240222123456')} />
        </Card>
      </div>
    ));

    // ── ACERCA DE ──
    if (subView === 'acerca') return wrap('Acerca de EGCHAT', (
      <div style={{ paddingBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px', background: '#fff', marginBottom: '8px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg,#07c160,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 4px 16px rgba(7,193,96,0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>EGCHAT</div>
          <div style={{ fontSize: '14px', color: '#8e8e93' }}>Versión 2.5.3</div>
        </div>

        <Card>
          {[
            { label: 'Versión', value: '2.5.3' },
            { label: 'Desarrollador', value: 'EGCHAT Team' },
            { label: 'País', value: 'Guinea Ecuatorial' },
            { label: 'Licencia', value: 'Propietaria' },
            { label: 'Backend', value: 'Neon + Render' },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px' }}>
                <span style={{ fontSize: '15px', color: '#111827' }}>{row.label}</span>
                <span style={{ fontSize: '14px', color: '#8e8e93' }}>{row.value}</span>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Legal" />
        <Card>
          <SettingRow icon="📋" iconBg="#f3f4f6" label="Términos de servicio" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="🔒" iconBg="#dbeafe" label="Política de privacidad" onPress={() => showToast('Próximamente', 'info')} />
          <Divider />
          <SettingRow icon="📜" iconBg="#fef3c7" label="Licencias de código abierto" onPress={() => showToast('Próximamente', 'info')} />
        </Card>
      </div>
    ));

    // ── SONIDOS (sub-vista) ──
    if (subView === 'sonidos') return wrap('Sonidos y notificaciones', (
      <div style={{ paddingBottom: '32px' }}>
        <SectionHeader label="Volumen general" />
        <div style={{ margin: '0 16px', background: '#fff', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span style={{ fontSize: '15px', color: '#111827', flex: 1 }}>Volumen</span>
            <span style={{ fontSize: '14px', color: '#8e8e93' }}>{Math.round(soundSettings.volume * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={soundSettings.volume}
            onChange={e => updateSoundSetting('volume', parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#07c160' }} />
        </div>

        <SectionHeader label="Tono de mensajes" />
        <Card>
          {MESSAGE_TONES.map((tone, i, arr) => (
            <React.Fragment key={tone.id}>
              <button onClick={() => { updateSoundSetting('messageTone', tone.id); if (tone.id !== 'none') tone.play(soundSettings.volume); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827', textAlign: 'left' }}>{tone.name}</span>
                {soundSettings.messageTone === tone.id
                  ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <button onClick={e => { e.stopPropagation(); if (tone.id !== 'none') tone.play(soundSettings.volume); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Tono de llamada" />
        <Card>
          {RINGTONES.map((tone, i, arr) => (
            <React.Fragment key={tone.id}>
              <button onClick={() => { updateSoundSetting('ringtone', tone.id); if (tone.id !== 'none' && tone.id !== 'vibrate_only') tone.play(soundSettings.volume); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827', textAlign: 'left' }}>{tone.name}</span>
                {soundSettings.ringtone === tone.id
                  ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : tone.id !== 'none' && tone.id !== 'vibrate_only'
                    ? <button onClick={e => { e.stopPropagation(); tone.play(soundSettings.volume); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </button>
                    : null}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader label="Tono de notificación" />
        <Card>
          {NOTIFICATION_TONES.map((tone, i, arr) => (
            <React.Fragment key={tone.id}>
              <button onClick={() => { updateSoundSetting('notificationTone', tone.id); if (tone.id !== 'none') tone.play(soundSettings.volume); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                <span style={{ flex: 1, fontSize: '15px', color: '#111827', textAlign: 'left' }}>{tone.name}</span>
                {soundSettings.notificationTone === tone.id
                  ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : tone.id !== 'none'
                    ? <button onClick={e => { e.stopPropagation(); tone.play(soundSettings.volume); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </button>
                    : null}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
      </div>
    ));

    return null;
  };

  // ── LISTA PRINCIPAL ──
  const rows = filteredRows || null;

  return (
    <div style={{
      position: 'relative',
      paddingTop: padTop,
      paddingBottom: padBot,
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#f2f2f7',
    }}>
      {/* ── HEADER FIJO ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: padTop,
        background: 'rgba(242,242,247,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'flex-end',
        paddingBottom: '10px', paddingLeft: '16px', paddingRight: '16px',
        zIndex: 5, borderBottom: '0.5px solid rgba(0,0,0,0.08)',
      }}>
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#07c160', padding: '0 8px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="10" height="16" viewBox="0 0 10 18" fill="none" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 1 1 9 9 17"/></svg>
          <span style={{ fontSize: '16px' }}>Atrás</span>
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', fontSize: '17px', fontWeight: '600', color: '#111827' }}>
          Configuración
        </span>
      </div>

      {/* ── SCROLL AREA ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Buscador */}
        <div style={{ margin: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '8px 12px', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Buscar"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#111827', background: 'transparent' }}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0', display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {rows && (
          <div style={{ margin: '0 16px' }}>
            {rows.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: '#8e8e93', fontSize: '15px' }}>Sin resultados</div>
              : <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {rows.map((r, i) => (
                    <React.Fragment key={r.sub}>
                      <button onClick={() => setSubView(r.sub)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: '12px' }}>
                        <span style={{ flex: 1, fontSize: '15px', color: '#111827', textAlign: 'left' }}>{r.label}</span>
                        <ChevronRight />
                      </button>
                      {i < rows.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Lista completa — solo cuando no hay búsqueda */}
        {!rows && <>

          {/* ── SECCIÓN CUENTA ── */}
          {/* Perfil Card especial */}
          <div style={{ margin: '0 16px 8px' }}>
            <button onClick={() => setSubView('perfil')} style={{ width: '100%', background: '#fff', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', border: 'none', cursor: 'pointer', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg,#07c160,#00b4e6)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#fff', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                {userProfile.avatarUrl
                  ? <img src={userProfile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{userProfile.avatar || 'U'}</span>}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '17px', fontWeight: '600', color: '#111827' }}>{userProfile.name || 'Usuario'}</div>
                <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '2px' }}>{userProfile.phone} · {userProfile.email || 'Sin email'}</div>
              </div>
              <ChevronRight />
            </button>
          </div>

          <SectionHeader label="Cuenta" />
          <Card>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>} iconBg="#fee2e2" label="Seguridad de la cuenta" onPress={() => setSubView('seguridad')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>} iconBg="#f3f4f6" label="Mi información y autorizaciones" onPress={() => setSubView('privacidad')} />
          </Card>

          {/* ── SECCIÓN GENERAL ── */}
          <SectionHeader label="General" />
          <Card>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} iconBg="#fef3c7" label="Notificaciones" onPress={() => setSubView('notificaciones')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} iconBg="#dbeafe" label="Interfaz y pantalla" onPress={() => setSubView('interfaz')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} iconBg="#ede9fe" label="Permisos de amigos" onPress={() => setSubView('permisos_amigos')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M22 12H3M3 12l6-6M3 12l6 6"/><path d="M22 6v12"/></svg>} iconBg="#d1fae5" label="Almacenamiento" value={`${storageUsed} MB`} onPress={() => setSubView('almacenamiento')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>} iconBg="#f3f4f6" label="Más" onPress={() => setSubView('otras_funciones')} />
          </Card>

          {/* ── SECCIÓN FUNCIONES ── */}
          <SectionHeader label="Funciones" />
          <Card>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#07c160" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} iconBg="#d1fae5" label="Chat" onPress={() => setSubView('chat_config')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/></svg>} iconBg="#dbeafe" label="Llamadas de voz y video" onPress={() => setSubView('llamadas')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M3 8h4"/></svg>} iconBg="#fef3c7" label="Administrar el historial de chat" onPress={() => setSubView('historial_chat')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} iconBg="#ede9fe" label="Otras funciones" onPress={() => setSubView('otras_funciones')} />
          </Card>

          {/* ── SECCIÓN AYUDA E INFORMACIÓN ── */}
          <SectionHeader label="Ayuda e información" />
          <Card>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} iconBg="#f3f4f6" label="Comentarios" onPress={() => setSubView('comentarios')} />
            <Divider />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>} iconBg="#dbeafe" label="Acerca de EGCHAT" value="v2.5.3" onPress={() => setSubView('acerca')} />
          </Card>

          {/* ── ACCIONES DE CUENTA ── */}
          <div style={{ height: '16px' }} />
          <Card>
            <button onClick={() => showToast('Función de cambio de cuenta — próximamente', 'info')}
              style={{ width: '100%', padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#07c160', fontWeight: '500', textAlign: 'center' }}>
              Cambiar de cuenta
            </button>
          </Card>

          <div style={{ height: '12px' }} />
          <Card>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#ef4444', fontWeight: '500', textAlign: 'center' }}>
              Cerrar sesión
            </button>
          </Card>

          {/* Links legales footer */}
          <div style={{ textAlign: 'center', padding: '20px 16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => showToast('Próximamente', 'info')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#07c160' }}>
              Información personal recopilada
            </button>
            <button onClick={() => showToast('Próximamente', 'info')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#07c160' }}>
              Información compartida con terceros
            </button>
          </div>

          <div style={{ height: '8px' }} />
        </>}
      </div>

      {/* ── SUB-VISTAS (overlay absoluto) ── */}
      {subView && renderSubView()}
    </div>
  );
};

export default ConfiguracionView;
