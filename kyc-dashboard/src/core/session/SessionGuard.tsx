/**
 * Guard de sesión por inactividad — 15 minutos sin interacción expira la sesión.
 * Detecta: mousemove, keydown, click, scroll, touchstart.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { useLocation } from 'react-router-dom';

const INACTIVITY_MS = 15 * 60 * 1000;  // 15 minutos
const WARNING_MS    =  2 * 60 * 1000;  // avisar 2 minutos antes

const LOGIN_PATHS = ['/bange/login', '/company/login', '/'];

interface SessionGuardProps { children: ReactNode; }

export function SessionGuard({ children }: SessionGuardProps) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const isPublicRoute = LOGIN_PATHS.includes(location.pathname);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current)  clearTimeout(warnRef.current);
  };

  const resetTimers = () => {
    if (!admin || isPublicRoute) return;
    clearTimers();
    setShowWarning(false);

    warnRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_MS - WARNING_MS);

    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_MS);
  };

  useEffect(() => {
    if (!admin || isPublicRoute) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();
    return () => {
      clearTimers();
      events.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [admin, location.pathname]);

  return (
    <>
      {children}
      {showWarning && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="card p-6 max-w-sm w-full mx-4 text-center animate-slide-up">
            <div className="text-4xl mb-3">⏱️</div>
            <h2 id="session-warning-title" className="text-lg font-bold mb-2">
              Sesión a punto de expirar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tu sesión expirará en 2 minutos por inactividad.
            </p>
            <button
              className="btn-primary w-full justify-center"
              onClick={resetTimers}
              autoFocus
            >
              Continuar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
