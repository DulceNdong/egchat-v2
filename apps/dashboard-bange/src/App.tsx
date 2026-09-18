// BANGE KYC Admin — App principal
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

// ── Auto-lock por inactividad (15 minutos) ────────────────────────
const LOCK_TIMEOUT = 15 * 60 * 1000;

function useAutoLock(onLock: () => void) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> = setTimeout(onLock, LOCK_TIMEOUT);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(onLock, LOCK_TIMEOUT);
    };

    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('click', reset);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('click', reset);
    };
  }, [onLock]);
}

// ── Atajos de teclado ─────────────────────────────────────────────
function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.key.toLowerCase()}`;
      const fn  = handlers[key] ?? handlers[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

// ── Pantalla de bloqueo ───────────────────────────────────────────
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En producción: verificar PIN o 2FA con el backend
    if (pin.length >= 4) { onUnlock(); }
    else { setError('PIN incorrecto'); }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-80 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-bold text-gray-800">Sesión bloqueada</h2>
          <p className="text-sm text-gray-500 mt-1">Inactividad detectada</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Introduce tu PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center text-xl tracking-widest mb-4 focus:border-blue-500 outline-none"
            autoFocus
            maxLength={8}
            aria-label="PIN de desbloqueo"
          />
          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Desbloquear
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────
export default function App() {
  const [isLocked, setIsLocked]   = useState(false);
  const [isOnline, setIsOnline]   = useState(true);
  const [activeCase, setActiveCase] = useState<string | null>(null);

  // Verificar conectividad al iniciar
  useEffect(() => {
    invoke<boolean>('check_network_status')
      .then(online => setIsOnline(online))
      .catch(() => setIsOnline(false));
  }, []);

  useAutoLock(() => setIsLocked(true));

  useKeyboardShortcuts({
    'ctrl+n': () => console.log('→ Siguiente caso'),
    'ctrl+a': () => console.log('→ Aprobar caso:', activeCase),
    'ctrl+r': () => console.log('→ Rechazar caso:', activeCase),
    'ctrl+f': () => document.getElementById('search-input')?.focus(),
    'ctrl+p': () => {
      invoke('print_kyc_report', {
        htmlContent: document.documentElement.outerHTML,
        applicationId: activeCase ?? '',
      }).catch(console.error);
    },
    'F5': () => window.location.reload(),
  });

  return (
    <>
      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}

      {/* Banner offline */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold">
          ⚠️ Sin conexión con el servidor. Los datos pueden no estar actualizados.
        </div>
      )}

      {/* Aquí va el router y las pantallas del dashboard */}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <span className="font-bold text-lg">BANGE — Panel de Cumplimiento KYC</span>
          </div>
          <div className="text-sm opacity-75">
            {isOnline ? '🟢 Conectado' : '🔴 Sin conexión'}
          </div>
        </header>
        <main className="p-6">
          <p className="text-gray-500 text-center mt-20">
            Dashboard BANGE KYC — cargando componentes...
          </p>
        </main>
      </div>
    </>
  );
}
