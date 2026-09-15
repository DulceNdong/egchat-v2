// ══════════════════════════════════════════════════════════════════
// ActiveCallContext — Estado global de llamada activa
// Permite mostrar la mini barra PiP en cualquier pantalla
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ActiveCallInfo {
  callId: string;
  targetName: string;
  targetAvatar?: string;
  callType: 'audio' | 'video';
  duration: number;
  // Params necesarios para reabrir la pantalla desde el FloatingCallBar
  role?: 'caller' | 'callee';
  chatId?: string;
}

interface ActiveCallContextType {
  activeCall: ActiveCallInfo | null;
  setActiveCall: (info: ActiveCallInfo | ((prev: ActiveCallInfo | null) => ActiveCallInfo | null) | null) => void;
  isPip: boolean;
  setIsPip: (v: boolean) => void;
  registerCallControls: (controls: { endCall: () => void; toggleMute: () => void; isMuted: boolean }) => void;
  unregisterCallControls: () => void;
  callControls: { endCall: () => void; toggleMute: () => void; isMuted: boolean } | null;
}

const ActiveCallContext = createContext<ActiveCallContextType>({
  activeCall: null,
  setActiveCall: () => {},
  isPip: false,
  setIsPip: () => {},
  registerCallControls: () => {},
  unregisterCallControls: () => {},
  callControls: null,
});

export function ActiveCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCallState] = useState<ActiveCallInfo | null>(null);
  const [isPip, setIsPip] = useState(false);
  const [callControls, setCallControls] = useState<{ endCall: () => void; toggleMute: () => void; isMuted: boolean } | null>(null);

  const setActiveCall = useCallback((
    info: ActiveCallInfo | ((prev: ActiveCallInfo | null) => ActiveCallInfo | null) | null
  ) => {
    if (typeof info === 'function') {
      setActiveCallState(info);
    } else {
      setActiveCallState(info);
    }
  }, []);

  const registerCallControls = useCallback((controls: { endCall: () => void; toggleMute: () => void; isMuted: boolean }) => {
    setCallControls(controls);
  }, []);

  const unregisterCallControls = useCallback(() => {
    setCallControls(null);
  }, []);

  return (
    <ActiveCallContext.Provider value={{
      activeCall, setActiveCall,
      isPip, setIsPip,
      registerCallControls, unregisterCallControls, callControls,
    }}>
      {children}
    </ActiveCallContext.Provider>
  );
}

export function useActiveCall() {
  return useContext(ActiveCallContext);
}
  unregisterCallControls: () => void;
  callControls: { endCall: () => void; toggleMute: () => void; isMuted: boolean } | null;
}

const ActiveCallContext = createContext<ActiveCallContextType>({
  activeCall: null,
  setActiveCall: () => {},
  isPip: false,
  setIsPip: () => {},
  registerCallControls: () => {},
  unregisterCallControls: () => {},
  callControls: null,
});

export function ActiveCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCallState] = useState<ActiveCallInfo | null>(null);
  const [isPip, setIsPip] = useState(false);
  const [callControls, setCallControls] = useState<{ endCall: () => void; toggleMute: () => void; isMuted: boolean } | null>(null);

  const setActiveCall = useCallback((
    info: ActiveCallInfo | ((prev: ActiveCallInfo | null) => ActiveCallInfo | null) | null
  ) => {
    if (typeof info === 'function') {
      setActiveCallState(info);
    } else {
      setActiveCallState(info);
    }
  }, []);

  const registerCallControls = useCallback((controls: { endCall: () => void; toggleMute: () => void; isMuted: boolean }) => {
    setCallControls(controls);
  }, []);

  const unregisterCallControls = useCallback(() => {
    setCallControls(null);
  }, []);

  return (
    <ActiveCallContext.Provider value={{
      activeCall, setActiveCall,
      isPip, setIsPip,
      registerCallControls, unregisterCallControls, callControls,
    }}>
      {children}
    </ActiveCallContext.Provider>
  );
}

export function useActiveCall() {
  return useContext(ActiveCallContext);
}
