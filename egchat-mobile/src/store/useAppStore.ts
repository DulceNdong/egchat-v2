import { useEffect, useReducer } from 'react';
import { subscribe, getState, type AppState } from './appStore';

/** Hook que re-renderiza el componente cada vez que el store cambia. */
export function useAppStore(): AppState {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const unsub = subscribe(forceUpdate);
    return () => { unsub(); };
  }, []);

  return getState();
}
