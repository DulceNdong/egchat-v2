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
}

interface ActiveCallContextType {
  activeCall: ActiveCallInfo | null;
  setActiveCall: (info: ActiveCallInfo | null) => void;
  isPip: boolean;
  setIsPip: (v: boolean) => void;
}

const ActiveCallContext = createContext<ActiveCallContextType>({
  activeCall: null,
  setActiveCall: () => {},
  isPip: false,
  setIsPip: () => {},
});

export function ActiveCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [isPip, setIsPip] = useState(false);

  return (
    <ActiveCallContext.Provider value={{ activeCall, setActiveCall, isPip, setIsPip }}>
      {children}
    </ActiveCallContext.Provider>
  );
}

export function useActiveCall() {
  return useContext(ActiveCallContext);
}
