// ══════════════════════════════════════════════════════════════════
// ActiveCallContext — Puente React entre CallManager (singleton) y la UI
//
// El CallManager vive fuera de React. Este contexto:
//  1. Se suscribe al CallManager al montar
//  2. Convierte los snapshots del manager en estado React (re-renders eficientes)
//  3. Expone helpers de UI (isPip, uiState) y las acciones del manager
//
// IMPORTANTE: la fuente de verdad es CallManager, NO este contexto.
// La UI solo lee aquí; las acciones van al manager directamente.
// ══════════════════════════════════════════════════════════════════
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { callManager } from '../call/CallManager';
import type { CallManagerState, CallSession, CallUIState } from '../call/types';

// ── Tipos expuestos a la UI ───────────────────────────────────────

interface ActiveCallContextType {
  // Estado completo del manager (sincronizado)
  callState: CallManagerState;

  // Helpers de conveniencia para la UI
  activeCall: CallSession | null;
  isPip: boolean;

  // Acciones de UI
  setUIState: (state: CallUIState) => void;
  setPip: (pip: boolean) => void;
  expandCall: () => void;
  minimizeCall: () => void;

  // Acciones del manager (delegadas directamente)
  endCall:        () => Promise<void>;
  toggleMute:     () => void;
  toggleCamera:   () => void;
  switchCamera:   () => Promise<void>;
  toggleSpeaker:  () => Promise<void>;
  toggleBluetooth: () => Promise<void>;
}

// ── Contexto ──────────────────────────────────────────────────────

const ActiveCallContext = createContext<ActiveCallContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function ActiveCallProvider({ children }: { children: React.ReactNode }) {
  // Snapshot del CallManager — se actualiza cada vez que el manager notifica
  const [callState, setCallState] = useState<CallManagerState>(() => callManager.state);

  // Suscribirse al CallManager una sola vez
  useEffect(() => {
    const unsub = callManager.subscribe((snap) => {
      setCallState(snap);
    });
    return unsub;
  }, []);

  // ── Helpers derivados ──────────────────────────────────────────
  const activeCall = callState.session;
  const isPip      = callState.uiState === 'minimized';

  // ── Acciones de UI ─────────────────────────────────────────────
  const setUIState = useCallback((state: CallUIState) => {
    callManager.setUIState(state);
  }, []);

  const setPip = useCallback((pip: boolean) => {
    callManager.setUIState(pip ? 'minimized' : 'full');
  }, []);

  const expandCall = useCallback(() => {
    callManager.setUIState('full');
  }, []);

  const minimizeCall = useCallback(() => {
    callManager.setUIState('minimized');
  }, []);

  // ── Acciones del manager ───────────────────────────────────────
  const endCall       = useCallback(() => callManager.endCall(), []);
  const toggleMute    = useCallback(() => callManager.toggleMute(), []);
  const toggleCamera  = useCallback(() => callManager.toggleCamera(), []);
  const toggleSpeaker = useCallback(() => callManager.toggleSpeaker(), []);

  return (
    <ActiveCallContext.Provider value={{
      callState,
      activeCall,
      isPip,
      setUIState,
      setPip,
      expandCall,
      minimizeCall,
      endCall,
      toggleMute,
      toggleCamera,
      toggleSpeaker,
    }}>
      {children}
    </ActiveCallContext.Provider>
  );
}

// ── Hook de consumo ───────────────────────────────────────────────

export function useActiveCall(): ActiveCallContextType {
  const ctx = useContext(ActiveCallContext);
  if (!ctx) throw new Error('useActiveCall debe usarse dentro de <ActiveCallProvider>');
  return ctx;
}

// ── Re-export de tipos útiles para los consumidores ───────────────
export type { CallManagerState, CallSession, CallUIState };
