/**
 * SyncIndicator.tsx
 * Barra de estado de conexión/sincronización.
 * Se muestra solo cuando hay algo que informar al usuario.
 *
 * Estados:
 *  - Offline:   barra roja fija con icono de avión
 *  - Syncing:   barra amarilla con spinner
 *  - Pending:   barra naranja con contador
 *  - Error:     barra roja con botón de reintento
 *  - Online:    invisible (no molestar cuando todo va bien)
 */

import React, { useEffect, useState } from 'react';
import { useSync } from './useSync';

export const SyncIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, error, forceSync } = useSync();
  const [visible, setVisible] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  // Mostrar brevemente "Conectado" al volver online
  useEffect(() => {
    if (isOnline && visible) {
      setJustReconnected(true);
      const t = setTimeout(() => {
        setJustReconnected(false);
        setVisible(false);
      }, 2_500);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  // Controlar visibilidad
  useEffect(() => {
    const shouldShow = !isOnline || isSyncing || pendingCount > 0 || !!error;
    if (shouldShow) setVisible(true);
  }, [isOnline, isSyncing, pendingCount, error]);

  if (!visible) return null;

  // ── Estilos por estado ──────────────────────────────────────────
  const barStyle: React.CSSProperties = {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         9999,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    padding:        '6px 16px',
    fontSize:       '12px',
    fontWeight:     600,
    letterSpacing:  '0.3px',
    transition:     'background 0.3s ease',
    ...(justReconnected
      ? { background: '#10b981', color: '#fff' }
      : !isOnline
        ? { background: '#ef4444', color: '#fff' }
        : error
          ? { background: '#f97316', color: '#fff' }
          : isSyncing || pendingCount > 0
            ? { background: '#f59e0b', color: '#1a1a1a' }
            : { background: '#10b981', color: '#fff' }
    ),
  };

  const spinnerStyle: React.CSSProperties = {
    width:            '12px',
    height:           '12px',
    border:           '2px solid rgba(255,255,255,0.4)',
    borderTopColor:   '#fff',
    borderRadius:     '50%',
    animation:        'egchat-spin 0.7s linear infinite',
    flexShrink:       0,
  };

  const renderContent = () => {
    if (justReconnected) {
      return (
        <>
          <span>✓</span>
          <span>Conectado</span>
        </>
      );
    }
    if (!isOnline) {
      return (
        <>
          <span>✈</span>
          <span>Sin conexión — Modo offline</span>
          {pendingCount > 0 && (
            <span style={{ opacity: 0.8 }}>· {pendingCount} pendientes</span>
          )}
        </>
      );
    }
    if (error) {
      return (
        <>
          <span>⚠</span>
          <span>Error de sincronización</span>
          <button
            onClick={forceSync}
            style={{
              marginLeft:      '8px',
              padding:         '2px 10px',
              background:      'rgba(255,255,255,0.25)',
              border:          '1px solid rgba(255,255,255,0.5)',
              borderRadius:    '12px',
              color:           '#fff',
              fontSize:        '11px',
              fontWeight:      700,
              cursor:          'pointer',
            }}
          >
            Reintentar
          </button>
        </>
      );
    }
    if (isSyncing) {
      return (
        <>
          <div style={spinnerStyle} />
          <span>Sincronizando…</span>
        </>
      );
    }
    if (pendingCount > 0) {
      return (
        <>
          <span>↑</span>
          <span>{pendingCount} mensaje{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</span>
        </>
      );
    }
    return null;
  };

  return (
    <>
      {/* Keyframe de spinner inyectado una sola vez */}
      <style>{`
        @keyframes egchat-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={barStyle} role="status" aria-live="polite">
        {renderContent()}
      </div>
    </>
  );
};
