/**
 * Login — Portal de Monetización EGChat.
 * Mismo flujo que Company/Bange login, colores verde esmeralda.
 */
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Eye, EyeOff, DollarSign, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/api/client';

type Step = 'credentials' | 'totp';

export default function MonetizacionLogin() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/monetizacion/home';

  const [step,     setStep]     = useState<Step>('credentials');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [totp,     setTotp]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const totpRef = useRef<HTMLInputElement>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Email y contraseña son obligatorios.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('totp') || msg.toLowerCase().includes('2fa')) {
        setStep('totp');
        setTimeout(() => totpRef.current?.focus(), 100);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (totp.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
    setLoading(true);
    try {
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setTotp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4 shadow-lg shadow-emerald-500/30">
            <DollarSign className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">EGChat Monetización</h1>
          <p className="text-slate-400 text-sm mt-1">Panel de Revenue & Finanzas</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} noValidate>
              <h2 className="text-lg font-semibold mb-6">Iniciar sesión</h2>

              {error && (
                <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    id="email" type="email" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="admin@egchat.gq"
                    required aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="label">Contraseña</label>
                  <div className="relative">
                    <input
                      id="password" type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="input pr-10" required aria-required="true"
                    />
                    <button
                      type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                aria-busy={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Entrando…' : 'Entrar'}
              </button>

              <div className="mt-4 text-center">
                <a href="/" className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                  ← Volver al selector de portales
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTOTP} noValidate>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-lg font-semibold">Verificación en dos pasos</h2>
                <p className="text-sm text-gray-500 mt-1">Introduce el código de tu app de autenticación</p>
              </div>

              {error && (
                <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <input
                ref={totpRef} id="totp" type="text"
                inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={totp} onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl tracking-widest font-mono"
                placeholder="000000" autoComplete="one-time-code"
                aria-label="Código de verificación"
              />

              <button
                type="submit" disabled={loading || totp.length !== 6}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verificar
              </button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setTotp(''); }}
                className="btn-secondary w-full justify-center mt-2"
              >
                Volver
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 EGChat · Portal Monetización v1.0
        </p>
      </div>
    </div>
  );
}
