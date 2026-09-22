// BANGE KYC Admin — App principal con router y layout
import React, { useEffect, useState, useCallback } from 'react';
import { authApi, setToken } from './api/kycApi';
import { LoginPage } from './pages/LoginPage';
import { CasesPage } from './pages/CasesPage';
import { AmlPage }   from './pages/AmlPage';
import { UpdateDialog } from './components/UpdateDialog';

type Page = 'cases' | 'aml' | 'audit';

const LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutos

function useAutoLock(enabled: boolean, onLock: () => void) {
  useEffect(() => {
    if (!enabled) return;
    let timer = setTimeout(onLock, LOCK_TIMEOUT);
    const reset = () => { clearTimeout(timer); timer = setTimeout(onLock, LOCK_TIMEOUT); };
    ['mousemove','keydown','click','touchstart'].forEach(e => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      ['mousemove','keydown','click','touchstart'].forEach(e => window.removeEventListener(e, reset));
    };
  }, [enabled, onLock]);
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En producción: verificar con backend
    if (pin.length >= 4) onUnlock();
    else setError('PIN incorrecto');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-80 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-gray-900">Sesión bloqueada</h2>
          <p className="text-sm text-gray-400 mt-1">15 min de inactividad</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Contraseña"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:border-blue-500 outline-none text-sm"
            autoFocus
            aria-label="Contraseña de desbloqueo"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl text-sm">
            Desbloquear
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, admin, onLogout }: {
  page: Page; setPage: (p: Page) => void;
  admin: any; onLogout: () => void;
}) {
  const NAV = [
    { id: 'cases' as Page, icon: '📋', label: 'Casos KYC' },
    { id: 'aml'   as Page, icon: '⚠️', label: 'AML / SARs' },
    { id: 'audit' as Page, icon: '📜', label: 'Auditoría' },
  ];
  return (
    <aside className="w-56 bg-blue-900 text-white flex flex-col h-full">
      <div className="px-4 py-5 border-b border-blue-800">
        <div className="text-lg font-bold">🏦 BANGE KYC</div>
        <div className="text-xs text-blue-300 mt-0.5">{admin?.role ?? 'Compliance'}</div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Navegación principal">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
              page === item.id
                ? 'bg-white/20 text-white'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-blue-800">
        <div className="text-xs text-blue-300 truncate mb-2">{admin?.email}</div>
        <button
          onClick={onLogout}
          className="text-xs text-blue-300 hover:text-white transition"
          aria-label="Cerrar sesión"
        >
          ← Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const [admin,    setAdmin]    = useState<any>(null);
  const [page,     setPage]     = useState<Page>('cases');
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Restaurar sesión
  useEffect(() => {
    const saved = localStorage.getItem('bange_token');
    if (saved) {
      setToken(saved);
      authApi.me().then(setAdmin).catch(() => {
        localStorage.removeItem('bange_token');
      });
    }
  }, []);

  // Monitor de red
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') document.getElementById('search-input')?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useAutoLock(!!admin, useCallback(() => setIsLocked(true), []));

  const handleLogout = () => {
    localStorage.removeItem('bange_token');
    setAdmin(null);
    setToken('');
  };

  if (!admin) return <LoginPage onLogin={setAdmin} />;

  return (
    <>
      <UpdateDialog />
      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}

      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1.5 text-xs font-semibold z-40"
          role="alert"
          aria-live="polite"
        >
          ⚠️ Sin conexión con el servidor — los datos pueden no estar actualizados
        </div>
      )}

      <div className={`flex h-screen bg-gray-50 ${!isOnline ? 'pt-7' : ''}`}>
        <Sidebar page={page} setPage={setPage} admin={admin} onLogout={handleLogout} />
        <main className="flex-1 overflow-hidden">
          {page === 'cases' && <CasesPage />}
          {page === 'aml'   && <AmlPage />}
          {page === 'audit' && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <span className="text-5xl block mb-3">📜</span>
                <p className="text-lg font-semibold">Exportar audit log</p>
                <p className="text-sm mt-1">Usa el botón "Exportar CSV" en la página de Casos</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
