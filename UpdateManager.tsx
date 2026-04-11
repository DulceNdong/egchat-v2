import React, { useState, useEffect } from 'react';

// Componente de actualización automática
const UpdateManager: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Verificar versión al cargar
    checkForUpdates();
    
    // Configurar verificación periódica
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000); // Cada 5 minutos
    
    // Escuchar mensajes del service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateInfo({
          version: event.data.version,
          message: event.data.message
        });
        setShowUpdate(true);
      } else if (event.data.type === 'SW_UPDATED') {
        console.log('🎉 Service Worker actualizado:', event.data.version);
        window.location.reload();
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      clearInterval(interval);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/version-check');
      const versionInfo = await response.json();
      
      if (versionInfo.updateAvailable) {
        setUpdateInfo({
          version: versionInfo.latestVersion,
          message: versionInfo.updateMessage
        });
        setShowUpdate(true);
      }
    } catch (error) {
      console.error('Error verificando actualizaciones:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = () => {
    if (updateInfo) {
      // Mostrar notificación de actualización
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_WAITING'
        });
      }
      
      // Forzar recarga después de un breve retraso
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          🚀
        </div>
        
        <h2 style={{
          margin: '0 0 16px 0',
          color: '#1f2937',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          Actualización Disponible
        </h2>
        
        <p style={{
          margin: '0 0 12px 0',
          color: '#6b7280',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {updateInfo?.message || 'Nueva versión de EGCHAT disponible con mejoras empresariales'}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <button
            onClick={handleUpdate}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            Actualizar Ahora
          </button>
          
          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
          >
            Más Tarde
          </button>
        </div>
        
        {isChecking && (
          <div style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Verificando actualizaciones...
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateManager;
