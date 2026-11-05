// ══════════════════════════════════════════════════════════════════
// ActiveCallContext — Puente React entre CallManager (singleton) y la UI
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { callManager } from '../call/CallManager';
import type { CallManagerState, CallSession, CallUIState } from '../call/types';

interface ActiveCallContextType {
  callState:        CallManagerState;
  activeCall:       CallSession | null;
  isPip:            boolean;
  setUIState:       (state: CallUIState) => void;
  setPip:           (pip: boolean) => void;
  expandCall:       () => void;
  minimizeCall:     () => void;
  endCall:          () => Promise<void>;
  toggleMute:       () => void;
  toggleCamera:     () => void;
  switchCamera:     () => Promise<void>;
  toggleSpeaker:    () => Promise<void>;
  toggleBluetooth:  () => Promise<void>;
}

const ActiveCallContext = createContext<ActiveCallContextType | null>(null);

export function ActiveCallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallManagerState>(() => callManager.state);

  useEffect(() => {
    const unsub = callManager.subscribe(snap => setCallState(snap));
    return unsub;
  }, []);

  const activeCall = callState.session;
  const isPip      = callState.uiState === 'minimized';

  const setUIState     = useCallback((s: CallUIState) => callManager.setUIState(s), []);
  const setPip         = useCallback((p: boolean) => callManager.setUIState(p ? 'minimized' : 'full'), []);
  const expandCall     = useCallback(() => callManager.setUIState('full'), []);
  const minimizeCall   = useCallback(() => callManager.setUIState('minimized'), []);
  const endCall        = useCallback(() => callManager.endCall(), []);
  const toggleMute     = useCallback(() => callManager.toggleMute(), []);
  const toggleCamera   = useCallback(() => callManager.toggleCamera(), []);
  const switchCamera   = useCallback(() => callManager.switchCamera(), []);
  const toggleSpeaker  = useCallback(() => callManager.toggleSpeaker(), []);
  const toggleBluetooth = useCallback(() => callManager.toggleBluetooth(), []);

  return (
    <ActiveCallContext.Provider value={{
      callState, activeCall, isPip,
      setUIState, setPip, expandCall, minimizeCall,
      endCall, toggleMute, toggleCamera, switchCamera,
      toggleSpeaker, toggleBluetooth,
    }}>
      {children}
    </ActiveCallContext.Provider>
  );
}

export function useActiveCall(): ActiveCallContextType {
  const ctx = useContext(ActiveCallContext);
  if (!ctx) throw new Error('useActiveCall debe usarse dentro de <ActiveCallProvider>');
  return ctx;
}

export type { CallManagerState, CallSession, CallUIState };
