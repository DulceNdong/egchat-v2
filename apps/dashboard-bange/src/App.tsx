import React, { useEffect, useState, useCallback } from 'react';
import { authApi, setToken } from './api/kycApi';
import { LoginPage } from './pages/LoginPage';
import { CasesPage } from './pages/CasesPage';
import { AmlPage }   from './pages/AmlPage';
import { UpdateDialog } from './components/UpdateDialog';

type Page = 'cases' | 'aml' | 'audit';

// ── Iconos SVG modernos ───────────────────────────────────────────
const Icons = {
  Cases: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Aml: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Audit: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Bank: () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V12M12 12L8 9m4 3l4-3M3 21h18M3 10h18M3 7l9-4 9 4" />
    </svg>
  ),
  Online: () => (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="#22c55e">
      <circle cx="4" cy="4" r="4"/>
    </svg>
  ),
};

// ── Auto-lock ─────────────────────────────────────────────────────
const LOCK_TIMEOUT = 15 * 60 * 1000;
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

// ── LockScreen ────────────────────────────────────────────────────
function LockScreen({ onUnlock, dark }: { onUnlock: () => void; dark: boolean }) {
  const [pin, setPin] = useState('');
  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-8 w-80 shadow-2xl ${dark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Sesión bloqueada</h2>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-400'}`}>15 min de inactividad</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (pin.length >= 4) onUnlock(); }}>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            placeholder="Contraseña"
            className={`w-full border-2 rounded-xl px-4 py-3 mb-3 outline-none text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' : 'border-gray-200 focus:border-blue-500'}`}
            autoFocus aria-label="Contraseña de desbloqueo"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition">
            Desbloquear
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ page, setPage, admin, onLogout, dark, setDark }: {
  page: Page; setPage: (p: Page) => void;
  admin: any; onLogout: () => void;
  dark: boolean; setDark: (v: boolean) => void;
}) {
  const NAV = [
    { id: 'cases' as Page, Icon: Icons.Cases, label: 'Casos KYC',     badge: null },
    { id: 'aml'   as Page, Icon: Icons.Aml,   label: 'AML / SARs',   badge: '!' },
    { id: 'audit' as Page, Icon: Icons.Audit, label: 'Auditoría',    badge: null },
  ];

  return (
    <aside className="w-60 flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Icons.Bank />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">BANGE KYC</div>
            <div className="text-blue-300 text-xs mt-0.5">Panel de Cumplimiento</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Módulos</p>
        {NAV.map(({ id, Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left relative ${
              page === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition"
        >
          {dark ? <Icons.Sun /> : <Icons.Moon />}
          <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(admin?.email?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{admin?.email ?? ''}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Icons.Online />
              <span className="text-slate-400 text-xs">{admin?.role ?? 'Admin'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Icons.Logout />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const [admin,    setAdmin]    = useState<any>(null);
  const [page,     setPage]     = useState<Page>('cases');
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dark,     setDark]     = useState(() => localStorage.getItem('bange_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('bange_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('bange_token');
    if (saved) {
      setToken(saved);
      authApi.me().then(d => setAdmin(d.admin ?? d)).catch(() => localStorage.removeItem('bange_token'));
    }
  }, []);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useAutoLock(!!admin, useCallback(() => setIsLocked(true), []));

  const handleLogout = () => { localStorage.removeItem('bange_token'); setAdmin(null); setToken(''); };

  if (!admin) return <LoginPage onLogin={setAdmin} />;

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className={`flex h-screen overflow-hidden ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <UpdateDialog />
        {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} dark={dark} />}

        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-xs font-semibold z-40 flex items-center justify-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M5.636 5.636a9 9 0 000 12.728m3.536-3.536a4 4 0 010-5.656M12 13v2m0 4h.01" />
            </svg>
            Sin conexión — datos pueden no estar actualizados
          </div>
        )}

        <Sidebar page={page} setPage={setPage} admin={admin} onLogout={handleLogout} dark={dark} setDark={setDark} />

        <main className={`flex-1 overflow-hidden ${!isOnline ? 'mt-8' : ''}`}>
          {page === 'cases' && <CasesPage dark={dark} />}
          {page === 'aml'   && <AmlPage dark={dark} />}
          {page === 'audit' && (
            <div className={`flex items-center justify-center h-full ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <div className="text-center fade-in">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke={dark ? '#94a3b8' : '#64748b'} strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className={`text-lg font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Exportar audit log</p>
                <p className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Usa el botón "Exportar CSV" en la página de Casos</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
