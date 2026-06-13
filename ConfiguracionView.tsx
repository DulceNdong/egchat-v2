import React, { useState } from 'react';
import { authAPI } from './api';
import QRCode from 'qrcode';

// Helper: abrir galería/cámara compatible con Android APK (Capacitor) y web
async function pickProfilePhoto(onResult: (dataUrl: string) => void) {
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  if (isCapacitor) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      // Mostrar action sheet: galería o cámara
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // pregunta: cámara o galería
      });
      if (photo.dataUrl) onResult(photo.dataUrl);
      return;
    } catch (e) {
      // Si falla Capacitor Camera, caer al input file
    }
  }
  // Web / fallback
  const i = document.createElement('input');
  i.type = 'file';
  i.accept = 'image/*';
  i.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
  document.body.appendChild(i);
  i.onchange = () => {
    const f = i.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = e => { onResult(e.target?.result as string); };
      r.readAsDataURL(f);
    }
    document.body.removeChild(i);
  };
  i.click();
}

// ─── Types ───────────────────────────────────
type SubView =
  | null | 'perfil' | 'seguridad' | 'privacidad' | 'notificaciones'
  | 'interfaz' | 'permisos_amigos' | 'almacenamiento' | 'chat_config'
  | 'llamadas' | 'historial_chat' | 'otras_funciones' | 'comentarios'
  | 'acerca' | 'sonidos';

export interface ConfiguracionViewProps {
  viewPadding: { top: string };
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

// ─── Shared UI atoms ─────────────────────────
const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <div onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 13, background: on ? '#07c160' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'left .2s' }} />
  </div>
);

const Row = ({ label, value, onPress, danger, right }: {
  label: string; value?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode;
}) => (
  <button onClick={onPress} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: onPress ? 'pointer' : 'default', outline: 'none', textAlign: 'left' }}>
    <span style={{ flex: 1, fontSize: 16, color: danger ? '#ef4444' : '#111827' }}>{label}</span>
    {right ?? (
      <>
        {value && <span style={{ fontSize: 14, color: '#8e8e93', marginRight: 6 }}>{value}</span>}
        {onPress && <Chevron />}
      </>
    )}
  </button>
);

const Divider = () => <div style={{ height: 1, background: '#f2f2f7', marginLeft: 16 }} />;
const Section = ({ label }: { label: string }) => (
  <div style={{ fontSize: 13, color: '#8e8e93', padding: '16px 16px 6px' }}>{label}</div>
);
const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#fff', marginLeft: 0, marginRight: 0, overflow: 'hidden' }}>{children}</div>
);

// ─── Sub-screen wrapper ───────────────────────
const Sub = ({ title, onBack, padTop, padBot, children }: {
  title: string; onBack: () => void; padTop: string; padBot: string; children: React.ReactNode;
}) => (
  <div style={{ position: 'absolute', inset: 0, background: '#f2f2f7', display: 'flex', flexDirection: 'column', zIndex: 10, overflow: 'hidden' }}>
    {/* fixed header */}
    <div style={{ flexShrink: 0, paddingTop: padTop, background: 'rgba(242,242,247,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '.5px solid rgba(0,0,0,.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px 10px', position: 'relative' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#07c160', padding: 0, outline: 'none', zIndex: 1 }}>
          <svg width="10" height="16" viewBox="0 0 10 18" fill="none" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 1 1 9 9 17" /></svg>
          <span style={{ fontSize: 16 }}>Volver</span>
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 17, fontWeight: 600, color: '#111827' }}>{title}</span>
      </div>
    </div>
    {/* scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: padBot }}>{children}</div>
  </div>
);

// ══════════════════════════════════════════════
// SUB-VISTA: PERFIL
// ══════════════════════════════════════════════
const PerfilView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [qrImg, setQrImg] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldVal, setFieldVal] = useState('');
  const [gender, setGenderState] = useState(() => localStorage.getItem('cfg_gender') || 'No especificado');
  const [bio, setBioState] = useState(() => localStorage.getItem('cfg_bio') || '');
  const [region, setRegionState] = useState(() => p.userProfile.country || 'Guinea Ecuatorial');

  const maskPhone = (ph: string) => ph.length < 6 ? ph : ph.slice(0, 3) + '****' + ph.slice(-2);

  const genQR = async () => {
    try {
      const img = await QRCode.toDataURL(JSON.stringify({ app: 'EGCHAT', id: p.userProfile.id, phone: p.userProfile.phone, name: p.userProfile.name }), { width: 220, margin: 2 });
      setQrImg(img); setShowQR(true);
    } catch {}
  };

  const openEdit = (field: string, val: string) => { setEditingField(field); setFieldVal(val); };

  const saveField = async () => {
    if (!editingField) return;
    try {
      if (editingField === 'name') {
        await authAPI.updateProfile({ full_name: fieldVal, avatar_url: p.userProfile.avatarUrl });
        const updated = { ...p.userProfile, name: fieldVal };
        p.setUserProfile(updated);
        localStorage.setItem('egchat_user_profile', JSON.stringify(updated));
        p.showToast('✓ Nombre actualizado', 'success');
      } else if (editingField === 'bio') {
        setBioState(fieldVal); localStorage.setItem('cfg_bio', fieldVal);
        p.showToast('✓ Bio actualizada', 'success');
      } else if (editingField === 'gender') {
        setGenderState(fieldVal); localStorage.setItem('cfg_gender', fieldVal);
        p.showToast('✓ Género guardado', 'success');
      } else if (editingField === 'region') {
        setRegionState(fieldVal);
        const updated = { ...p.userProfile, country: fieldVal };
        p.setUserProfile(updated);
        localStorage.setItem('egchat_user_profile', JSON.stringify(updated));
        p.showToast('✓ Región actualizada', 'success');
      } else if (editingField === 'address') {
        const updated = { ...p.userProfile, address: fieldVal };
        p.setUserProfile(updated);
        localStorage.setItem('egchat_user_profile', JSON.stringify(updated));
        p.showToast('✓ Dirección guardada', 'success');
      }
    } catch (e: any) { p.showToast(e?.message || 'Error al guardar', 'error'); }
    setEditingField(null);
  };

  const fieldRow = (label: string, value: string, field: string, extra?: React.ReactNode) => (
    <button onClick={() => openEdit(field, value)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
      <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>{label}</span>
      {extra}
      <span style={{ fontSize: 15, color: '#8e8e93', marginRight: 8, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
      <Chevron />
    </button>
  );

  return (
    <Sub title="Perfil" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>

        {/* ── Sección 1: identidad ── */}
        <Card>
          {/* Foto */}
          <button onClick={() => pickProfilePhoto(url => p.setAvatarCropUrl(url))}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>Foto de perfil</span>
            <div style={{ width: 52, height: 52, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(135deg,#07c160,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
              {p.userProfile.avatarUrl
                ? <img src={p.userProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{p.userProfile.avatar || 'U'}</span>}
            </div>
            <Chevron />
          </button>
          <Divider />
          {fieldRow('Nombre', p.userProfile.name || '', 'name')}
          <Divider />
          {fieldRow('Novedades', bio || 'Añadir estado', 'bio')}
          <Divider />
          {fieldRow('Género', gender, 'gender')}
          <Divider />
          {fieldRow('Región', region, 'region')}
          <Divider />
          {/* Teléfono — read-only enmascarado */}
          <button onClick={() => p.showToast('Contacta soporte para cambiar el teléfono', 'info')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>Teléfono</span>
            <span style={{ fontSize: 15, color: '#8e8e93', marginRight: 8, fontFamily: 'monospace' }}>{maskPhone(p.userProfile.phone || '')}</span>
            <Chevron />
          </button>
          <Divider />
          {/* ID — copiar */}
          <button onClick={() => navigator.clipboard?.writeText(p.userProfile.id || '').then(() => p.showToast('✓ ID copiado', 'success')).catch(() => {})}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>ID</span>
            <span style={{ fontSize: 15, color: '#8e8e93', marginRight: 8, fontFamily: 'monospace' }}>{p.userProfile.id?.slice(0, 8).toUpperCase() || '—'}</span>
            <Chevron />
          </button>
          <Divider />
          {/* QR */}
          <button onClick={genQR}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>Mi código QR</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" style={{ marginRight: 8 }}>
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
            </svg>
            <Chevron />
          </button>
        </Card>

        {/* ── Sección 2: servicios ── */}
        <div style={{ marginTop: 8 }} />
        <Card>
          <button onClick={() => { /* navegar a sonidos */ p.onBack(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>Tono de timbre para llamadas entrantes</span>
            <span style={{ fontSize: 14, color: '#8e8e93', marginRight: 8 }}>{p.RINGTONES.find((r: any) => r.id === p.soundSettings.ringtone)?.name || 'Clásico'}</span>
            <Chevron />
          </button>
          <Divider />
          {fieldRow('Mi dirección', p.userProfile.address || '', 'address')}
          <Divider />
          <button onClick={() => p.showToast('Configura tu nombre en cobros', 'info')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>Mi título de beneficiario de ingreso</span>
            <span style={{ fontSize: 14, color: '#8e8e93', marginRight: 8, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.userProfile.name || '—'}</span>
            <Chevron />
          </button>
          <Divider />
          <button onClick={() => p.setCurrentView('monedero')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>EGCoins</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 8 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            <Chevron />
          </button>
        </Card>

        {/* ── Sección 3: seguridad ── */}
        <div style={{ marginTop: 8 }} />
        <Card>
          <button onClick={() => p.setShowSetupPIN(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>PIN de pagos</span>
            <span style={{ fontSize: 14, color: p.walletPIN.isSet() ? '#07c160' : '#f59e0b', marginRight: 8 }}>{p.walletPIN.isSet() ? '✅ Configurado' : '⚠️ Sin PIN'}</span>
            <Chevron />
          </button>
        </Card>

        {/* ── Modal edición ── */}
        {editingField && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 16, textAlign: 'center' }}>
                {editingField === 'name' ? 'Nombre' : editingField === 'bio' ? 'Novedades' : editingField === 'gender' ? 'Género' : editingField === 'region' ? 'Región' : 'Dirección'}
              </div>
              {editingField === 'gender' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {['Hombre', 'Mujer', 'No especificado'].map(g => (
                    <button key={g} onClick={() => setFieldVal(g)}
                      style={{ padding: '12px 16px', borderRadius: 10, border: fieldVal === g ? '2px solid #07c160' : '1px solid #e5e7eb', background: fieldVal === g ? '#d1fae5' : '#f9fafb', fontSize: 15, color: '#111827', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
                      {g} {fieldVal === g ? '✓' : ''}
                    </button>
                  ))}
                </div>
              ) : editingField === 'region' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
                  {['Guinea Ecuatorial', 'Camerún', 'Gabón', 'Nigeria', 'España', 'Francia', 'Estados Unidos', 'China', 'Otro'].map(r => (
                    <button key={r} onClick={() => setFieldVal(r)}
                      style={{ padding: '12px 16px', borderRadius: 10, border: fieldVal === r ? '2px solid #07c160' : '1px solid #e5e7eb', background: fieldVal === r ? '#d1fae5' : '#f9fafb', fontSize: 15, color: '#111827', cursor: 'pointer', outline: 'none', textAlign: 'left' }}>
                      {r} {fieldVal === r ? '✓' : ''}
                    </button>
                  ))}
                </div>
              ) : (
                <input autoFocus type="text" value={fieldVal} onChange={e => setFieldVal(e.target.value)}
                  placeholder={editingField === 'bio' ? 'Escribe tu estado...' : 'Escribe aquí...'}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #07c160', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: editingField === 'name' || editingField === 'bio' || editingField === 'address' ? 0 : 8 }}>
                <button onClick={() => setEditingField(null)}
                  style={{ flex: 1, padding: 13, background: '#f3f4f6', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={saveField}
                  style={{ flex: 1, padding: 13, background: '#07c160', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal QR ── */}
        {showQR && qrImg && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', textAlign: 'center', width: 280, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Mi código QR</div>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 18 }}>Escanea para agregarme en EGCHAT</div>
              <img src={qrImg} alt="QR" style={{ width: 200, height: 200, borderRadius: 12, display: 'block', margin: '0 auto 18px' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { const a = document.createElement('a'); a.href = qrImg; a.download = 'egchat-qr.png'; a.click(); p.showToast('QR descargado', 'success'); }}
                  style={{ flex: 1, padding: 12, background: '#07c160', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Descargar</button>
                <button onClick={() => setShowQR(false)}
                  style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 10, color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: SEGURIDAD
// ══════════════════════════════════════════════
const SeguridadView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => (
  <Sub title="Seguridad de la cuenta" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
    <div style={{ paddingBottom: 32 }}>
      <Section label="Contraseña y acceso" />
      <Card>
        <Row label="Cambiar contraseña" onPress={() => p.showToast('Próximamente', 'info')} />
        <Divider />
        <Row label="Autenticación 2 factores" value={p.userProfile.twoFactorEnabled ? 'Activado' : 'Desactivado'} onPress={() => p.showToast('Próximamente', 'info')} />
        <Divider />
        <Row label="PIN de pagos" value={p.walletPIN.isSet() ? '✅ Configurado' : '⚠️ Sin PIN'} onPress={() => p.setShowSetupPIN(true)} />
      </Card>
      <Section label="Sesiones" />
      <Card>
        <Row label="Sesiones activas" value="Este dispositivo" onPress={() => p.showToast('Solo 1 sesión activa', 'info')} />
      </Card>
      <Section label="Actividad reciente" />
      <Card>
        {p.activityLog.slice(0, 5).map((log: any, i: number, arr: any[]) => (
          <React.Fragment key={log.id}>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: log.type === 'login' ? '#d1fae5' : log.type === 'security' ? '#fee2e2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {log.type === 'login' ? '🔑' : log.type === 'security' ? '🔐' : log.type === 'transaction' ? '💸' : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{log.action}</div>
                <div style={{ fontSize: 12, color: '#8e8e93' }}>{log.timestamp?.toLocaleString('es-ES')}</div>
              </div>
            </div>
            {i < arr.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
    </div>
  </Sub>
);

// ══════════════════════════════════════════════
// SUB-VISTA: PRIVACIDAD
// ══════════════════════════════════════════════
const PrivacidadView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('cfg_last_seen') || 'todos');
  const [photoVis, setPhotoVis] = useState(() => localStorage.getItem('cfg_photo_vis') || 'todos');
  const [statusVis, setStatusVis] = useState(() => localStorage.getItem('cfg_status_vis') || 'todos');

  const selRow = (label: string, val: string, setter: (v: string) => void, key: string) => (
    <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>{label}</span>
      <select value={val} onChange={e => { setter(e.target.value); localStorage.setItem(key, e.target.value); }}
        style={{ fontSize: 14, color: '#07c160', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
        <option value="todos">Todos</option>
        <option value="contactos">Contactos</option>
        <option value="nadie">Nadie</option>
      </select>
    </div>
  );

  return (
    <Sub title="Mi información" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Visibilidad" />
        <Card>
          {selRow('Última vez', lastSeen, setLastSeen, 'cfg_last_seen')}
          <Divider />
          {selRow('Foto de perfil', photoVis, setPhotoVis, 'cfg_photo_vis')}
          <Divider />
          {selRow('Estado / Historia', statusVis, setStatusVis, 'cfg_status_vis')}
        </Card>
        <Section label="Contactos bloqueados" />
        <Card>
          <Row label="Bloqueados" value="0 contactos" onPress={() => p.showToast('Sin contactos bloqueados', 'info')} />
        </Card>
        <Section label="Datos personales" />
        <Card>
          <Row label="Descargar mis datos" onPress={() => p.showToast('Próximamente', 'info')} />
          <Divider />
          <Row label="Eliminar mi cuenta" danger onPress={() => p.showToast('Contacta soporte para eliminar tu cuenta', 'info')} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: NOTIFICACIONES
// ══════════════════════════════════════════════
const NotificacionesView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [msgs, setMsgs] = useState(() => JSON.parse(localStorage.getItem('cfg_notif_messages') ?? 'true'));
  const [groups, setGroups] = useState(() => JSON.parse(localStorage.getItem('cfg_notif_groups') ?? 'true'));
  const [calls, setCalls] = useState(() => JSON.parse(localStorage.getItem('cfg_notif_calls') ?? 'true'));
  const [stories, setStories] = useState(() => JSON.parse(localStorage.getItem('cfg_notif_stories') ?? 'false'));
  const [preview, setPreview] = useState(() => JSON.parse(localStorage.getItem('cfg_notif_preview') ?? 'true'));
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'default');

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    const next = !val; setter(next); localStorage.setItem(key, JSON.stringify(next));
  };

  const requestPerm = async () => {
    if (!('Notification' in window)) { p.showToast('No soportado en este navegador', 'error'); return; }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      new Notification('✅ Notificaciones activadas', { body: 'EGCHAT te notificará' });
      p.showToast('✅ Notificaciones activadas', 'success');
    } else { p.showToast('Permisos denegados', 'error'); }
  };

  return (
    <Sub title="Notificaciones" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        {/* Permisos del sistema */}
        <Section label="Permiso del sistema" />
        <Card>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Notificaciones push</div>
              <div style={{ fontSize: 12, color: notifPerm === 'granted' ? '#07c160' : notifPerm === 'denied' ? '#ef4444' : '#8e8e93' }}>
                {notifPerm === 'granted' ? '✅ Activadas' : notifPerm === 'denied' ? '❌ Bloqueadas — actívalas en ajustes del sistema' : '⏳ Sin configurar'}
              </div>
            </div>
            {notifPerm !== 'granted' && notifPerm !== 'denied' && (
              <button onClick={requestPerm} style={{ padding: '8px 16px', background: '#07c160', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Activar</button>
            )}
          </div>
        </Card>

        <Section label="Mensajes y grupos" />
        <Card>
          <Row label="Mensajes privados" right={<Toggle on={msgs} onToggle={() => toggle('cfg_notif_messages', msgs, setMsgs)} />} />
          <Divider />
          <Row label="Grupos" right={<Toggle on={groups} onToggle={() => toggle('cfg_notif_groups', groups, setGroups)} />} />
          <Divider />
          <Row label="Vista previa del mensaje" right={<Toggle on={preview} onToggle={() => toggle('cfg_notif_preview', preview, setPreview)} />} />
        </Card>
        <Section label="Llamadas y estados" />
        <Card>
          <Row label="Llamadas entrantes" right={<Toggle on={calls} onToggle={() => toggle('cfg_notif_calls', calls, setCalls)} />} />
          <Divider />
          <Row label="Historias / Estados" right={<Toggle on={stories} onToggle={() => toggle('cfg_notif_stories', stories, setStories)} />} />
        </Card>
        <Section label="Sonidos rápidos" />
        <Card>
          <Row label="Volumen" value={`${Math.round(p.soundSettings.volume * 100)}%`} onPress={() => {}} />
          <Divider />
          <Row label="Vibración" right={<Toggle on={p.soundSettings.vibrationEnabled} onToggle={() => p.updateSoundSetting('vibrationEnabled', !p.soundSettings.vibrationEnabled)} />} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: INTERFAZ
// ══════════════════════════════════════════════
const InterfazView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [chatBg, setChatBg] = useState(() => localStorage.getItem('cfg_chat_bg') || '#e5ddd5');
  const fonts = [
    { id: 'default', name: 'Sistema', sample: 'Hola, ¿cómo estás?', font: "system-ui,sans-serif" },
    { id: 'rounded', name: 'Redondeada', sample: 'Hola, ¿cómo estás?', font: "'Nunito',sans-serif" },
    { id: 'modern', name: 'Moderna', sample: 'Hola, ¿cómo estás?', font: "'Inter',sans-serif" },
    { id: 'classic', name: 'Clásica', sample: 'Hola, ¿cómo estás?', font: 'Georgia,serif' },
    { id: 'mono', name: 'Mono', sample: 'Hola, ¿cómo estás?', font: "'Courier New',monospace" },
  ];
  return (
    <Sub title="Interfaz y pantalla" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Tamaño de letra" />
        <div style={{ margin: '0 0 0 0', background: '#fff', padding: '16px' }}>
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px', fontSize: p.appFontSize * 14, color: '#374151', marginBottom: 12 }}>Vista previa del texto en EGCHAT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#8e8e93' }}>A</span>
            <input type="range" min="0.8" max="1.5" step="0.05" value={p.appFontSize}
              onChange={e => { const v = parseFloat(e.target.value); p.setAppFontSize(v); localStorage.setItem('egchat_fontsize', String(v)); }}
              style={{ flex: 1, accentColor: '#07c160' }} />
            <span style={{ fontSize: 18, color: '#374151' }}>A</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {[{ label: 'Pequeña', v: 0.85 }, { label: 'Normal', v: 1 }, { label: 'Grande', v: 1.15 }, { label: 'Muy grande', v: 1.35 }].map(o => (
              <button key={o.v} onClick={() => { p.setAppFontSize(o.v); localStorage.setItem('egchat_fontsize', String(o.v)); }}
                style={{ padding: '5px 10px', borderRadius: 8, border: Math.abs(p.appFontSize - o.v) < 0.03 ? '1.5px solid #07c160' : '1px solid #e5e7eb', background: Math.abs(p.appFontSize - o.v) < 0.03 ? '#d1fae5' : '#f9fafb', color: Math.abs(p.appFontSize - o.v) < 0.03 ? '#07c160' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <Section label="Estilo de letra" />
        <Card>
          {fonts.map((f, i, arr) => (
            <React.Fragment key={f.id}>
              <button onClick={() => { p.setAppFontFamily(f.id); localStorage.setItem('egchat_fontfamily', f.id); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.appFontFamily === f.id ? '#07c160' : '#8e8e93' }}>{f.name}</div>
                  <div style={{ fontSize: 14, color: '#111827', fontFamily: f.font }}>{f.sample}</div>
                </div>
                {p.appFontFamily === f.id && <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
        <Section label="Fondo del chat" />
        <div style={{ background: '#fff', padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['#e5ddd5', '#d6eaf8', '#d5f5e3', '#f9ebea', '#f4ecf7', '#fff', '#111827'].map(c => (
            <button key={c} onClick={() => { setChatBg(c); localStorage.setItem('cfg_chat_bg', c); }}
              style={{ width: 44, height: 44, borderRadius: 8, background: c, border: chatBg === c ? '3px solid #07c160' : '1.5px solid #e5e7eb', cursor: 'pointer', outline: 'none' }} />
          ))}
        </div>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: PERMISOS DE AMIGOS
// ══════════════════════════════════════════════
const PermisosAmigosView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [addMe, setAddMe] = useState(() => localStorage.getItem('cfg_perm_add') || 'Todos');
  const [msgMe, setMsgMe] = useState(() => localStorage.getItem('cfg_perm_msg') || 'Todos');
  const [findMe, setFindMe] = useState(() => localStorage.getItem('cfg_perm_find') || 'Todos');
  const [autoAccept, setAutoAccept] = useState(() => JSON.parse(localStorage.getItem('cfg_auto_accept') ?? 'false'));
  const [muteUnknown, setMuteUnknown] = useState(() => JSON.parse(localStorage.getItem('cfg_mute_unknown') ?? 'true'));

  const selRow = (label: string, val: string, setter: (v: string) => void, key: string, opts: string[]) => (
    <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 16, color: '#111827' }}>{label}</span>
      <select value={val} onChange={e => { setter(e.target.value); localStorage.setItem(key, e.target.value); }}
        style={{ fontSize: 14, color: '#07c160', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <Sub title="Permisos de amigos" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="¿Quién puede..." />
        <Card>
          {selRow('Añadirme como contacto', addMe, setAddMe, 'cfg_perm_add', ['Todos', 'Solo mis contactos', 'Nadie'])}
          <Divider />
          {selRow('Enviarme mensajes', msgMe, setMsgMe, 'cfg_perm_msg', ['Todos', 'Solo contactos'])}
          <Divider />
          {selRow('Encontrarme por búsqueda', findMe, setFindMe, 'cfg_perm_find', ['Todos', 'Nadie'])}
        </Card>
        <Section label="Solicitudes" />
        <Card>
          <Row label="Aceptar automáticamente" right={<Toggle on={autoAccept} onToggle={() => { const v = !autoAccept; setAutoAccept(v); localStorage.setItem('cfg_auto_accept', JSON.stringify(v)); }} />} />
          <Divider />
          <Row label="Silenciar desconocidos" right={<Toggle on={muteUnknown} onToggle={() => { const v = !muteUnknown; setMuteUnknown(v); localStorage.setItem('cfg_mute_unknown', JSON.stringify(v)); }} />} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: ALMACENAMIENTO
// ══════════════════════════════════════════════
const AlmacenamientoView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [used] = useState(() => Math.round(Math.random() * 200 + 50));
  const [autoWifi, setAutoWifi] = useState(() => JSON.parse(localStorage.getItem('cfg_auto_dl_wifi') ?? 'true'));
  const [autoData, setAutoData] = useState(() => JSON.parse(localStorage.getItem('cfg_auto_dl_data') ?? 'false'));
  const pct = Math.min(used / 5, 100);

  return (
    <Sub title="Almacenamiento" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <div style={{ margin: '12px 0 0', background: '#fff', padding: '20px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Uso de almacenamiento</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#07c160' }}>{used} MB</div>
          <div style={{ marginTop: 12, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#07c160,#00b4e6)', borderRadius: 3, transition: 'width .5s' }} />
          </div>
        </div>
        <Section label="Por tipo" />
        <Card>
          {[
            { icon: '🖼️', label: 'Fotos', size: `${Math.round(used * 0.45)} MB` },
            { icon: '🎥', label: 'Videos', size: `${Math.round(used * 0.30)} MB` },
            { icon: '🎵', label: 'Audio', size: `${Math.round(used * 0.12)} MB` },
            { icon: '📄', label: 'Documentos', size: `${Math.round(used * 0.13)} MB` },
          ].map((r, i, arr) => (
            <React.Fragment key={r.label}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <span style={{ flex: 1, fontSize: 15, color: '#111827' }}>{r.label}</span>
                <span style={{ fontSize: 14, color: '#8e8e93' }}>{r.size}</span>
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
        <Section label="Descarga automática" />
        <Card>
          <Row label="Solo con Wi-Fi" right={<Toggle on={autoWifi} onToggle={() => { const v = !autoWifi; setAutoWifi(v); localStorage.setItem('cfg_auto_dl_wifi', JSON.stringify(v)); }} />} />
          <Divider />
          <Row label="Con datos móviles" right={<Toggle on={autoData} onToggle={() => { const v = !autoData; setAutoData(v); localStorage.setItem('cfg_auto_dl_data', JSON.stringify(v)); }} />} />
        </Card>
        <Section label="Gestión" />
        <Card>
          <Row label="Liberar espacio" danger onPress={() => { localStorage.removeItem('egchat_contacts_cache'); localStorage.removeItem('egchat_chats_cache'); p.showToast('✓ Caché limpiada', 'success'); }} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: CHAT CONFIG
// ══════════════════════════════════════════════
const ChatConfigView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [enterSend, setEnterSend] = useState(() => JSON.parse(localStorage.getItem('cfg_enter_send') ?? 'false'));
  const [readReceipts, setReadReceipts] = useState(() => JSON.parse(localStorage.getItem('cfg_read_receipts') ?? 'true'));
  const [savePhotos, setSavePhotos] = useState(() => JSON.parse(localStorage.getItem('cfg_save_photos') ?? 'false'));
  const [fontSz, setFontSz] = useState<'small' | 'medium' | 'large'>(() => (localStorage.getItem('cfg_font_size_chat') as any) || 'medium');

  return (
    <Sub title="Chat" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Comportamiento" />
        <Card>
          <Row label="Enter para enviar" right={<Toggle on={enterSend} onToggle={() => { const v = !enterSend; setEnterSend(v); localStorage.setItem('cfg_enter_send', JSON.stringify(v)); }} />} />
          <Divider />
          <Row label="Confirmaciones de lectura (✓✓)" right={<Toggle on={readReceipts} onToggle={() => { const v = !readReceipts; setReadReceipts(v); localStorage.setItem('cfg_read_receipts', JSON.stringify(v)); }} />} />
          <Divider />
          <Row label="Guardar fotos automáticamente" right={<Toggle on={savePhotos} onToggle={() => { const v = !savePhotos; setSavePhotos(v); localStorage.setItem('cfg_save_photos', JSON.stringify(v)); }} />} />
        </Card>
        <Section label="Tamaño de fuente en chats" />
        <Card>
          {(['small', 'medium', 'large'] as const).map((sz, i, arr) => {
            const labels = { small: 'Pequeña', medium: 'Normal', large: 'Grande' };
            return (
              <React.Fragment key={sz}>
                <button onClick={() => { setFontSz(sz); localStorage.setItem('cfg_font_size_chat', sz); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', gap: 12 }}>
                  <span style={{ flex: 1, fontSize: 16, color: '#111827', textAlign: 'left' }}>{labels[sz]}</span>
                  {fontSz === sz && <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: LLAMADAS
// ══════════════════════════════════════════════
const LlamadasView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [hdCall, setHdCall] = useState(() => JSON.parse(localStorage.getItem('cfg_hd_call') ?? 'true'));
  const [saveData, setSaveData] = useState(() => JSON.parse(localStorage.getItem('cfg_save_data_call') ?? 'false'));
  const [muteUnknown, setMuteUnknown] = useState(() => JSON.parse(localStorage.getItem('cfg_mute_call_unknown') ?? 'false'));

  return (
    <Sub title="Llamadas de voz y video" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Calidad" />
        <Card>
          <Row label="Llamadas HD" right={<Toggle on={hdCall} onToggle={() => { const v = !hdCall; setHdCall(v); localStorage.setItem('cfg_hd_call', JSON.stringify(v)); }} />} />
          <Divider />
          <Row label="Reducir uso de datos" right={<Toggle on={saveData} onToggle={() => { const v = !saveData; setSaveData(v); localStorage.setItem('cfg_save_data_call', JSON.stringify(v)); }} />} />
        </Card>
        <Section label="Privacidad" />
        <Card>
          <Row label="Silenciar llamadas de desconocidos" right={<Toggle on={muteUnknown} onToggle={() => { const v = !muteUnknown; setMuteUnknown(v); localStorage.setItem('cfg_mute_call_unknown', JSON.stringify(v)); }} />} />
        </Card>
        <Section label="Tono de llamada" />
        <Card>
          {p.RINGTONES.map((t: any, i: number, arr: any[]) => (
            <React.Fragment key={t.id}>
              <button onClick={() => { p.updateSoundSetting('ringtone', t.id); if (t.id !== 'none' && t.id !== 'vibrate_only') t.play(p.soundSettings.volume); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
                <span style={{ flex: 1, fontSize: 15, color: '#111827', textAlign: 'left' }}>{t.name}</span>
                {p.soundSettings.ringtone === t.id
                  ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : t.id !== 'none' && t.id !== 'vibrate_only'
                    ? <button onClick={e => { e.stopPropagation(); t.play(p.soundSettings.volume); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </button>
                    : null}
              </button>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: HISTORIAL CHAT
// ══════════════════════════════════════════════
const HistorialView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [backupWifi, setBackupWifi] = useState(() => JSON.parse(localStorage.getItem('cfg_backup_wifi') ?? 'true'));
  return (
    <Sub title="Historial de chat" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Copia de seguridad" />
        <Card>
          <Row label="Copia en la nube" value="Automática" onPress={() => p.showToast('Próximamente', 'info')} />
          <Divider />
          <Row label="Frecuencia" value="Diaria" onPress={() => p.showToast('Próximamente', 'info')} />
          <Divider />
          <Row label="Solo con Wi-Fi" right={<Toggle on={backupWifi} onToggle={() => { const v = !backupWifi; setBackupWifi(v); localStorage.setItem('cfg_backup_wifi', JSON.stringify(v)); }} />} />
        </Card>
        <Section label="Acciones" />
        <Card>
          <Row label="Exportar chat" onPress={() => p.showToast('Selecciona un chat para exportarlo', 'info')} />
          <Divider />
          <Row label="Borrar mensajes eliminados" onPress={() => p.showToast('✓ Limpiado', 'success')} />
          <Divider />
          <Row label="Eliminar todos los chats" danger onPress={() => { if (confirm('¿Eliminar todos los chats locales?')) p.showToast('✓ Chats locales eliminados', 'success'); }} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: OTRAS FUNCIONES
// ══════════════════════════════════════════════
const OtrasFuncionesView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => (
  <Sub title="Otras funciones" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
    <div style={{ paddingBottom: 32 }}>
      <Section label="Herramientas" />
      <Card>
        <Row label="Escáner QR" onPress={() => p.setCurrentView('qr-scanner')} />
        <Divider />
        <Row label="Compartir ubicación" onPress={() => p.setCurrentView('mapa')} />
        <Divider />
        <Row label="Activar notificaciones push" onPress={async () => {
          if (!('Notification' in window)) { p.showToast('No soportado', 'error'); return; }
          const perm = await Notification.requestPermission();
          if (perm === 'granted') { p.showToast('✅ Notificaciones activadas', 'success'); }
          else { p.showToast('Permisos denegados — actívalos en el sistema', 'error'); }
        }} />
        <Divider />
        <Row label="Idioma de la app" value="Español" onPress={() => p.showToast('Más idiomas próximamente', 'info')} />
      </Card>
      <Section label="IA y experimental" />
      <Card>
        <Row label="🤖 LIA-25 — Asistente IA" onPress={() => p.setCurrentView('Lia-25')} />
        <Divider />
        <Row label="Modo offline" value="Próximamente" />
      </Card>
    </div>
  </Sub>
);

// ══════════════════════════════════════════════
// SUB-VISTA: SONIDOS
// ══════════════════════════════════════════════
const SonidosView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => (
  <Sub title="Sonidos y notificaciones" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
    <div style={{ paddingBottom: 32 }}>
      <Section label="Volumen general" />
      <div style={{ background: '#fff', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#8e8e93' }}>🔈</span>
          <input type="range" min="0" max="1" step="0.05" value={p.soundSettings.volume}
            onChange={e => p.updateSoundSetting('volume', parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#07c160' }} />
          <span style={{ fontSize: 13, color: '#8e8e93' }}>🔊</span>
          <span style={{ fontSize: 13, color: '#111827', width: 36 }}>{Math.round(p.soundSettings.volume * 100)}%</span>
        </div>
        <Row label="Vibración" right={<Toggle on={p.soundSettings.vibrationEnabled} onToggle={() => p.updateSoundSetting('vibrationEnabled', !p.soundSettings.vibrationEnabled)} />} />
      </div>
      <Section label="Tono de mensajes" />
      <Card>
        {p.MESSAGE_TONES.map((t: any, i: number, arr: any[]) => (
          <React.Fragment key={t.id}>
            <button onClick={() => { p.updateSoundSetting('messageTone', t.id); if (t.id !== 'none') t.play(p.soundSettings.volume); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <span style={{ flex: 1, fontSize: 15, color: '#111827', textAlign: 'left' }}>{t.name}</span>
              {p.soundSettings.messageTone === t.id
                ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                : t.id !== 'none'
                  ? <button onClick={ev => { ev.stopPropagation(); t.play(p.soundSettings.volume); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#8e8e93' }}>▶</button>
                  : null}
            </button>
            {i < arr.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
      <Section label="Tono de llamada" />
      <Card>
        {p.RINGTONES.map((t: any, i: number, arr: any[]) => (
          <React.Fragment key={t.id}>
            <button onClick={() => { p.updateSoundSetting('ringtone', t.id); if (t.id !== 'none' && t.id !== 'vibrate_only') t.play(p.soundSettings.volume); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <span style={{ flex: 1, fontSize: 15, color: '#111827', textAlign: 'left' }}>{t.name}</span>
              {p.soundSettings.ringtone === t.id
                ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                : null}
            </button>
            {i < arr.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
      <Section label="Tono de notificación" />
      <Card>
        {p.NOTIFICATION_TONES.map((t: any, i: number, arr: any[]) => (
          <React.Fragment key={t.id}>
            <button onClick={() => { p.updateSoundSetting('notificationTone', t.id); if (t.id !== 'none') t.play(p.soundSettings.volume); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <span style={{ flex: 1, fontSize: 15, color: '#111827', textAlign: 'left' }}>{t.name}</span>
              {p.soundSettings.notificationTone === t.id
                ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                : null}
            </button>
            {i < arr.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
    </div>
  </Sub>
);

// ══════════════════════════════════════════════
// SUB-VISTA: COMENTARIOS
// ══════════════════════════════════════════════
const ComentariosView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => {
  const [text, setText] = useState('');
  return (
    <Sub title="Comentarios" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
      <div style={{ paddingBottom: 32 }}>
        <Section label="Envíanos tu opinión" />
        <div style={{ background: '#fff', padding: 16 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Escribe tu comentario, sugerencia o reporte de error..."
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <button onClick={() => { setText(''); p.showToast('✓ Comentario enviado — ¡gracias!', 'success'); }}
            style={{ marginTop: 12, width: '100%', background: '#07c160', border: 'none', borderRadius: 10, padding: 13, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Enviar comentario
          </button>
        </div>
        <Section label="Contacto directo" />
        <Card>
          <Row label="✉️  support@egchat.com" onPress={() => window.open('mailto:support@egchat.com')} />
          <Divider />
          <Row label="📞  +240 222 123 456" onPress={() => window.open('tel:+240222123456')} />
        </Card>
      </div>
    </Sub>
  );
};

// ══════════════════════════════════════════════
// SUB-VISTA: ACERCA DE
// ══════════════════════════════════════════════
const AcercaView = (p: ConfiguracionViewProps & { onBack: () => void; padTop: string; padBot: string }) => (
  <Sub title="Acerca de EGCHAT" onBack={p.onBack} padTop={p.padTop} padBot={p.padBot}>
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px', background: '#fff' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#07c160,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 4px 16px rgba(7,193,96,.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>EGCHAT</div>
        <div style={{ fontSize: 14, color: '#8e8e93' }}>Versión 2.5.3</div>
      </div>
      <Section label="" />
      <Card>
        {[
          { label: 'Versión', value: '2.5.3' },
          { label: 'Desarrollador', value: 'EGCHAT Team' },
          { label: 'País', value: 'Guinea Ecuatorial' },
          { label: 'Licencia', value: 'Propietaria' },
          { label: 'Backend', value: 'Neon + Render' },
        ].map((r, i, arr) => (
          <React.Fragment key={r.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px' }}>
              <span style={{ fontSize: 15, color: '#111827' }}>{r.label}</span>
              <span style={{ fontSize: 14, color: '#8e8e93' }}>{r.value}</span>
            </div>
            {i < arr.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
      <Section label="Legal" />
      <Card>
        <Row label="Términos de servicio" onPress={() => p.showToast('Próximamente', 'info')} />
        <Divider />
        <Row label="Política de privacidad" onPress={() => p.showToast('Próximamente', 'info')} />
        <Divider />
        <Row label="Licencias de código abierto" onPress={() => p.showToast('Próximamente', 'info')} />
      </Card>
    </div>
  </Sub>
);

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════
export const ConfiguracionView: React.FC<ConfiguracionViewProps> = (props) => {
  const { viewPadding, device, userProfile, setCurrentView, setUserProfile,
    removePushListeners, cleanupCallManager, setIsAuthenticated,
    setRealChats, setSelectedChat, showToast, walletPIN } = props;

  const [subView, setSubView] = useState<SubView>(null);
  const [search, setSearch] = useState('');
  const [storageUsed] = useState(() => Math.round(Math.random() * 200 + 50));

  const padTop = viewPadding.top;
  const padBot = device.isMobile
    ? 'calc(64px + env(safe-area-inset-bottom,0px) + 16px)'
    : '24px';

  const handleLogout = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    try { await authAPI.logout(); await removePushListeners().catch(() => {}); await cleanupCallManager().catch(() => {}); } catch {}
    ['user_avatar', 'egchat_contacts_cache', 'egchat_chats_cache', 'egchat_msgs_index'].forEach(k => localStorage.removeItem(k));
    setIsAuthenticated(false);
    setUserProfile({ id: '', name: '', phone: '', email: '', address: '', city: '', country: 'Guinea Ecuatorial', avatar: 'U', avatarUrl: '', joinDate: new Date().toLocaleDateString('es-ES'), verificationStatus: 'pending', twoFactorEnabled: false, notificationsEnabled: true });
    setRealChats([]); setSelectedChat(null); setCurrentView('home');
  };

  const subProps = { ...props, onBack: () => setSubView(null), padTop, padBot };

  const allRows: { label: string; sub: SubView }[] = [
    { label: 'Perfil', sub: 'perfil' }, { label: 'Seguridad de la cuenta', sub: 'seguridad' },
    { label: 'Mi información y autorizaciones', sub: 'privacidad' },
    { label: 'Notificaciones', sub: 'notificaciones' }, { label: 'Interfaz y pantalla', sub: 'interfaz' },
    { label: 'Permisos de amigos', sub: 'permisos_amigos' }, { label: 'Almacenamiento', sub: 'almacenamiento' },
    { label: 'Chat', sub: 'chat_config' }, { label: 'Llamadas de voz y video', sub: 'llamadas' },
    { label: 'Administrar historial de chat', sub: 'historial_chat' },
    { label: 'Otras funciones', sub: 'otras_funciones' },
    { label: 'Sonidos y notificaciones', sub: 'sonidos' },
    { label: 'Comentarios', sub: 'comentarios' }, { label: 'Acerca de EGCHAT', sub: 'acerca' },
  ];
  const filtered = search.trim()
    ? allRows.filter(r => r.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ position: 'relative', paddingTop: padTop, paddingBottom: padBot, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f2f2f7' }}>

      {/* ── HEADER ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: padTop, background: 'rgba(242,242,247,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 5, borderBottom: '.5px solid rgba(0,0,0,.08)' }}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', padding: '0 16px 10px' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#07c160', display: 'flex', alignItems: 'center', gap: 4, padding: 0, outline: 'none' }}>
            <svg width="10" height="16" viewBox="0 0 10 18" fill="none" stroke="#07c160" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 1 1 9 9 17" /></svg>
            <span style={{ fontSize: 16 }}>Atrás</span>
          </button>
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 10, fontSize: 17, fontWeight: 600, color: '#111827' }}>Configuración</span>
        </div>
      </div>

      {/* ── SCROLL ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Buscador */}
        <div style={{ margin: '12px 16px 8px', background: '#fff', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#111827', background: 'transparent' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 0, fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>

        {/* Resultados búsqueda */}
        {filtered && (
          <div style={{ margin: '0 0' }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: 32, color: '#8e8e93', fontSize: 15 }}>Sin resultados</div>
              : <Card>
                  {filtered.map((r, i, arr) => (
                    <React.Fragment key={r.sub}>
                      <Row label={r.label} onPress={() => setSubView(r.sub)} />
                      {i < arr.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Card>
            }
          </div>
        )}

        {/* Lista completa */}
        {!filtered && <>
          {/* Hero perfil */}
          <button onClick={() => setSubView('perfil')}
            style={{ width: '100%', background: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, border: 'none', cursor: 'pointer', outline: 'none', marginBottom: 1 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#07c160,#00b4e6)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
              {userProfile.avatarUrl
                ? <img src={userProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{userProfile.avatar || 'U'}</span>}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>{userProfile.name || 'Usuario'}</div>
              <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>{userProfile.phone} · {userProfile.email || 'Sin email'}</div>
            </div>
            <Chevron />
          </button>

          {/* CUENTA */}
          <Section label="Cuenta" />
          <Card>
            <Row label="Seguridad de la cuenta" onPress={() => setSubView('seguridad')} />
            <Divider />
            <Row label="Mi información y autorizaciones" onPress={() => setSubView('privacidad')} />
          </Card>

          {/* GENERAL */}
          <Section label="General" />
          <Card>
            <Row label="Notificaciones" onPress={() => setSubView('notificaciones')} />
            <Divider />
            <Row label="Interfaz y pantalla" onPress={() => setSubView('interfaz')} />
            <Divider />
            <Row label="Permisos de amigos" onPress={() => setSubView('permisos_amigos')} />
            <Divider />
            <Row label="Almacenamiento" value={`${storageUsed} MB`} onPress={() => setSubView('almacenamiento')} />
            <Divider />
            <Row label="Sonidos y notificaciones" onPress={() => setSubView('sonidos')} />
          </Card>

          {/* FUNCIONES */}
          <Section label="Funciones" />
          <Card>
            <Row label="Chat" onPress={() => setSubView('chat_config')} />
            <Divider />
            <Row label="Llamadas de voz y video" onPress={() => setSubView('llamadas')} />
            <Divider />
            <Row label="Administrar historial de chat" onPress={() => setSubView('historial_chat')} />
            <Divider />
            <Row label="Otras funciones" onPress={() => setSubView('otras_funciones')} />
          </Card>

          {/* AYUDA */}
          <Section label="Ayuda e información" />
          <Card>
            <Row label="Comentarios" onPress={() => setSubView('comentarios')} />
            <Divider />
            <Row label="Acerca de EGCHAT" value="v2.5.3" onPress={() => setSubView('acerca')} />
          </Card>

          {/* ACCIONES */}
          <div style={{ height: 16 }} />
          <Card>
            <button onClick={() => showToast('Función próximamente', 'info')}
              style={{ width: '100%', padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#07c160', fontWeight: 500, textAlign: 'center' }}>
              Cambiar de cuenta
            </button>
          </Card>
          <div style={{ height: 12 }} />
          <Card>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ef4444', fontWeight: 500, textAlign: 'center' }}>
              Cerrar sesión
            </button>
          </Card>

          {/* Legal */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '20px 16px', flexWrap: 'wrap' }}>
            {['Información personal recopilada', 'Información compartida con terceros'].map(t => (
              <button key={t} onClick={() => showToast('Próximamente', 'info')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#07c160' }}>{t}</button>
            ))}
          </div>
          <div style={{ height: 8 }} />
        </>}
      </div>

      {/* ── SUB-VISTAS (cada una como componente propio = hooks correctos) ── */}
      {subView === 'perfil'           && <PerfilView           {...subProps} />}
      {subView === 'seguridad'        && <SeguridadView        {...subProps} />}
      {subView === 'privacidad'       && <PrivacidadView       {...subProps} />}
      {subView === 'notificaciones'   && <NotificacionesView   {...subProps} />}
      {subView === 'interfaz'         && <InterfazView         {...subProps} />}
      {subView === 'permisos_amigos'  && <PermisosAmigosView   {...subProps} />}
      {subView === 'almacenamiento'   && <AlmacenamientoView   {...subProps} />}
      {subView === 'chat_config'      && <ChatConfigView       {...subProps} />}
      {subView === 'llamadas'         && <LlamadasView         {...subProps} />}
      {subView === 'historial_chat'   && <HistorialView        {...subProps} />}
      {subView === 'otras_funciones'  && <OtrasFuncionesView   {...subProps} />}
      {subView === 'sonidos'          && <SonidosView          {...subProps} />}
      {subView === 'comentarios'      && <ComentariosView      {...subProps} />}
      {subView === 'acerca'           && <AcercaView           {...subProps} />}
    </div>
  );
};

export default ConfiguracionView;
