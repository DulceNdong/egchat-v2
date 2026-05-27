import React, { useEffect, useState } from 'react';

// Versión actual de esta APK — debe coincidir con versionCode en build.gradle
const CURRENT_VERSION_CODE = 6;
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com';

interface UpdateInfo {
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  minVersionCode: number;
}

export const AppUpdateChecker: React.FC = () => {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Solo verificar en APK nativa (Capacitor), no en web/PWA
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    // Verificar una vez al arrancar, con delay para no bloquear el inicio
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/app/version`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const data: UpdateInfo = await res.json();
        if (data.versionCode > CURRENT_VERSION_CODE) {
          setUpdate(data);
        }
      } catch {
        // Silencioso — no interrumpir la app si falla
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!update || dismissed) return null;

  const handleUpdate = async () => {
    setDownloading(true);
    try {
      // En Capacitor nativo abrir en navegador externo, en web abrir nueva pestaña
      const cap = (window as any).Capacitor;
      if (cap?.isNativePlatform?.()) {
        // Usar el plugin de App de Capacitor para abrir URL externa
        cap.Plugins?.App?.openUrl?.({ url: update.downloadUrl });
      }
      // Fallback siempre
      window.open(update.downloadUrl, '_blank');
    } catch {
      window.open(update.downloadUrl, '_blank');
    }
    setDownloading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
      left: '12px',
      right: '12px',
      background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
      borderRadius: '16px',
      padding: '14px 16px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,200,160,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Icono */}
      <div style={{ fontSize: '28px', flexShrink: 0 }}>🆕</div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
          Nueva versión disponible — v{update.version}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.3' }}>
          {update.releaseNotes}
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={handleUpdate}
          disabled={downloading}
          style={{
            background: '#fff',
            color: '#00c8a0',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {downloading ? '...' : 'Actualizar'}
        </button>
        {!update.forceUpdate && (
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '5px 14px',
              fontSize: '11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ahora no
          </button>
        )}
      </div>
    </div>
  );
};
