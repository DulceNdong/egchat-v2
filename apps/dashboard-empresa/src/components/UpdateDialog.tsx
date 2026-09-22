import { useEffect, useState } from 'react';

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'installed' | 'error';

type PendingUpdate = {
  version: string;
  currentVersion?: string;
  date?: string;
  body?: string;
  downloadAndInstall: () => Promise<void>;
};

function isTauriDesktop() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function UpdateDialog() {
  const [state, setState] = useState<UpdateState>('idle');
  const [update, setUpdate] = useState<PendingUpdate | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTauriDesktop()) return;
    let cancelled = false;
    async function run() {
      setState('checking');
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const nextUpdate = await check();
        if (cancelled) return;
        if (nextUpdate) {
          setUpdate(nextUpdate as PendingUpdate);
          setState('available');
        } else {
          setState('idle');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setState('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  async function installUpdate() {
    if (!update) return;
    setState('downloading');
    setError('');
    try {
      await update.downloadAndInstall();
      setState('installed');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  if (state !== 'available' && state !== 'downloading' && state !== 'installed' && state !== 'error') return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
        {state === 'available' && update && (
          <>
            <h2 className="font-bold text-gray-900">Nueva versión disponible</h2>
            <p className="mt-1 text-sm text-gray-600">EGCHAT KYC Monitor {update.version}</p>
            {update.body && <p className="mt-2 text-xs text-gray-500 whitespace-pre-line">{update.body}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100" onClick={() => setState('idle')}>Luego</button>
              <button className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white" onClick={installUpdate}>Actualizar</button>
            </div>
          </>
        )}
        {state === 'downloading' && <p className="text-sm font-semibold text-blue-700">Descargando e instalando actualización…</p>}
        {state === 'installed' && (
          <>
            <h2 className="font-bold text-gray-900">Actualización instalada</h2>
            <p className="mt-1 text-sm text-gray-600">Cierra y vuelve a abrir la app para aplicar la nueva versión.</p>
            <button className="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white" onClick={() => setState('idle')}>Entendido</button>
          </>
        )}
        {state === 'error' && error && (
          <>
            <h2 className="font-bold text-red-700">No se pudo comprobar la actualización</h2>
            <p className="mt-1 text-xs text-red-500">{error}</p>
            <button className="mt-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100" onClick={() => setState('idle')}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}
