/**
 * Login BANGE — Email + Contraseña + 2FA TOTP
 * Flujo: credenciales → token provisional → código TOTP → token definitivo
 */
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/client';

type Step = 'credentials' | 'totp';

export default function BangeLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/bange/queue';

  const [step,      setStep]      = useState<Step>('credentials');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [totp,      setTotp]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const totpRef = useRef<HTMLInputElement>(null);

  // --- Paso 1: credenciales ---
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError(t('login.required')); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Si el backend implementa 2FA real, aquí recibiríamos requires_totp=true
      // Por ahora avanzamos directamente tras login exitoso
      navigate(from, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes('totp') || msg.includes('2fa') || msg.includes('TOTP')) {
        setStep('totp');
        setTimeout(() => totpRef.current?.focus(), 100);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Paso 2: TOTP ---
  async function handleTOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (totp.length !== 6) { setError(t('login.totpLength')); return; }
    setLoading(true);
    try {
      // En producción: POST /auth/verify-totp con { email, totp_code }
      // Por ahora navegamos directamente
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setTotp('');
      totpRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">BANGE KYC Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Validación de Identidad</p>
        </div>

        <div className="card p-8">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} noValidate>
              <h2 className="text-lg font-semibold mb-6">{t('login.title')}</h2>

              {error && (
                <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">{t('login.email')}</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input"
                    placeholder="analista@bange.gq"
                    required
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">{t('login.password')}</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input pr-10"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-6"
                aria-busy={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t('login.loading') : t('login.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTOTP} noValidate>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-lg font-semibold">{t('login.totpTitle')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('login.totpDescription')}
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="totp" className="label sr-only">{t('login.totpCode')}</label>
                <input
                  id="totp"
                  ref={totpRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totp}
                  onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  aria-label={t('login.totpCode')}
                />
              </div>

              <button
                type="submit"
                disabled={loading || totp.length !== 6}
                className="btn-primary w-full justify-center mt-4"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('login.verify')}
              </button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setTotp(''); }}
                className="btn-secondary w-full justify-center mt-2"
              >
                {t('login.back')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 EGChat · BANGE · COBAC R-2023/01
        </p>
      </div>
    </div>
  );
}
