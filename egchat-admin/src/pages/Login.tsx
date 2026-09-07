import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const Login: React.FC = () => {
  const { admin, login, verifyTotp, requireTotp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking'|'ok'|'sleeping'>('checking');

  useEffect(() => {
    const API = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api-xlxj.onrender.com';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(`${API}/health`, { signal: ctrl.signal })
      .then(r => { clearTimeout(timer); setServerStatus(r.ok ? 'ok' : 'sleeping'); })
      .catch(() => { clearTimeout(timer); setServerStatus('sleeping'); });
  }, []);

  if (admin) return <Navigate to="/dashboard/executive" replace />;

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); clearError(); login(email, password); };
  const handleTotp  = (e: React.FormEvent) => { e.preventDefault(); clearError(); verifyTotp(code); };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ margin: '0 auto 14px', width: 60, height: 60 }}>
            <svg width={60} height={60} viewBox="0 0 40 40" fill="none">
              <rect width={40} height={40} rx={10} fill="white"/>
              <rect x={4} y={4} width={32} height={32} rx={8} fill="url(#loginGrad)"/>
              <defs><linearGradient id="loginGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#00c8a0"/><stop offset="1" stopColor="#00b4e6"/></linearGradient></defs>
              <path d="M28 15a2 2 0 0 0-2-2H14a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8l4 3v-3h2V15z" fill="white" fillOpacity={0.95}/>
              <circle cx={15.5} cy={19} r={1.4} fill="#00c8a0"/>
              <circle cx={20}   cy={19} r={1.4} fill="#00c8a0"/>
              <circle cx={24.5} cy={19} r={1.4} fill="#00c8a0"/>
            </svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#e8edf4', letterSpacing: '-0.5px' }}>EGCHAT Admin</div>
          <div style={{ fontSize: '13px', color: '#3a5570', marginTop: '4px' }}>Portal de administracion</div>
        </div>

        <div style={{ background: '#0f1e30', borderRadius: '16px', padding: '24px', border: '1px solid #1a2e44' }}>

          {/* Server status */}
          {serverStatus === 'checking' && (
            <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '8px', padding: '8px 12px', color: '#eab308', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              Verificando conexion con el servidor...
            </div>
          )}
          {serverStatus === 'sleeping' && (
            <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '8px', padding: '8px 12px', color: '#eab308', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              Servidor iniciando (free tier) - espera ~30 segundos antes de entrar
            </div>
          )}
          {serverStatus === 'ok' && (
            <div style={{ background: 'rgba(0,200,160,0.08)', border: '1px solid rgba(0,200,160,0.25)', borderRadius: '8px', padding: '8px 12px', color: '#00c8a0', fontSize: '12px', marginBottom: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00c8a0', display: 'inline-block', boxShadow: '0 0 5px #00c8a0' }}/>
              Servidor conectado
            </div>
          )}

          {!requireTotp ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4a7090', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@egchat.gq"
                  style={{ width: '100%', background: '#06101a', border: '1px solid #1a2e44', borderRadius: '8px', padding: '10px 12px', color: '#c8dcea', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#00c8a0')}
                  onBlur={e => (e.target.style.borderColor = '#1a2e44')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4a7090', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contrasena</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: '100%', background: '#06101a', border: '1px solid #1a2e44', borderRadius: '8px', padding: '10px 12px', color: '#c8dcea', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#00c8a0')}
                  onBlur={e => (e.target.style.borderColor = '#1a2e44')}
                />
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={isLoading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#c8dcea' }}>Verificacion 2FA</div>
                <div style={{ fontSize: '12px', color: '#3a5570', marginTop: '4px' }}>Introduce el codigo de tu app autenticadora</div>
              </div>
              <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                placeholder="000000" maxLength={6} autoFocus
                style={{ width: '100%', background: '#06101a', border: '1px solid #1a2e44', borderRadius: '8px', padding: '12px', color: '#c8dcea', fontSize: '24px', fontWeight: '800', letterSpacing: '8px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}/>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={isLoading || code.length < 6}
                style={{ width: '100%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: (isLoading || code.length < 6) ? 0.5 : 1 }}>
                {isLoading ? 'Verificando...' : 'Verificar'}
              </button>
            </form>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#1e3a54' }}>
          EGCHAT Admin Portal v1.0 - Guinea Ecuatorial
        </div>
      </div>
    </div>
  );
};
