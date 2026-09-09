/**
 * offlineStore.ts — Singleton global de conectividad
 *
 * Un solo listener de NetInfo para toda la app.
 * Cualquier componente puede suscribirse y obtener el estado
 * sin crear múltiples suscripciones duplicadas.
 *
 * Uso:
 *   import { useNetworkStatus } from '../store/offlineStore';
 *   const { isOnline } = useNetworkStatus();
 */

import { useState, useEffect } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// ── Estado interno (singleton) ────────────────────────────────────
let _isOnline = true;
let _isChecking = true;
const _listeners = new Set<() => void>();

const _notify = () => _listeners.forEach(fn => fn());

// ── Inicializar una sola vez ───────────────────────────────────────
let _initialized = false;

function _init() {
  if (_initialized) return;
  _initialized = true;

  // Estado inicial
  NetInfo.fetch().then((state: NetInfoState) => {
    _isOnline = !!state.isConnected && state.isInternetReachable !== false;
    _isChecking = false;
    _notify();
  });

  // Suscripción única para toda la vida de la app
  NetInfo.addEventListener((state: NetInfoState) => {
    const next = !!state.isConnected && state.isInternetReachable !== false;
    if (next !== _isOnline) {
      _isOnline = next;
      _notify();
    }
  });
}

// Inicializar al importar el módulo
_init();

// ── API pública ───────────────────────────────────────────────────

/** Estado actual (síncrono, sin hook) */
export const getNetworkStatus = () => ({ isOnline: _isOnline, isChecking: _isChecking });

/** Suscribirse a cambios */
export const subscribeNetworkStatus = (fn: () => void) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};

/** Hook de React — reactivo */
export function useNetworkStatus() {
  const [state, setState] = useState({ isOnline: _isOnline, isChecking: _isChecking });

  useEffect(() => {
    // Sincronizar por si cambió antes de montar
    setState({ isOnline: _isOnline, isChecking: _isChecking });

    const unsub = subscribeNetworkStatus(() => {
      setState({ isOnline: _isOnline, isChecking: _isChecking });
    });
    return unsub;
  }, []);

  return state;
}
