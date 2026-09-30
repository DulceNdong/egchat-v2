import { useState, useEffect } from 'react';
import { subscribe, getState, type AppState } from './appStore';

/**
 * Hook de store reactivo con soporte para selectores.
 * Solo dispara re-render cuando el valor retornado por el selector cambia realmente.
 */
export function useAppStore<T = AppState>(selector?: (state: AppState) => T): T {
  const [selectedState, setSelectedState] = useState<T>(() => {
    const current = getState();
    return selector ? selector(current) : (current as unknown as T);
  });

  useEffect(() => {
    let lastSelected = selectedState;
    const unsub = subscribe(() => {
      const nextState = getState();
      const nextSelected = selector ? selector(nextState) : (nextState as unknown as T);
      if (!Object.is(lastSelected, nextSelected)) {
        lastSelected = nextSelected;
        setSelectedState(nextSelected);
      }
    });
    return () => { unsub(); };
  }, [selector]);

  return selectedState;
}
