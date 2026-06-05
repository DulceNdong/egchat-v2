import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const Login: React.FC = () => {
  const { admin, login, verifyTotp, requireTotp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking'|'ok'|'sleeping'>('checking');

  // Check backend status on mount
  useEffect(() => {
    const API = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api.onrender.com';
    fetch(`${API}/health`, { signal: AbortSignal.timeout(8000) })
      .then(r => setServerStatus(r.ok ? 'ok' : 'sleeping'))
      .catch(() => setServerStatus('sleeping'));
  }, []);

  if (admin) return <Navigate to="/dashboard/operational" replace />;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    login(email, password);
  };

  const handleTotp = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    verifyTotp(code);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: '#fff' }}>E</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9' }}>EGCHAT Admin</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Portal de administración</div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
          {/* Server status banner */}
          {serverStatus === 'checking' && (
            <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#eab308', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              ⏳ Verificando conexión con el servidor...
            </div>
          )}
          {serverStatus === 'sleeping' && (
            <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#eab308', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              ⚡ Servidor iniciando (free tier) — espera ~30 segundos antes de entrar
            </div>
          )}
          {serverStatus === 'ok' && (
            <div style={{ background: 'rgba(0,200,160,0.1)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#00c8a0', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              ✅ Servidor conectado
            </div>
          )}
          {!requireTotp ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@egchat.gq"
                  style={{ width: '100%', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: '100%', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}
              <button type="submit" disabled={isLoading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔐</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>Verificación 2FA</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Introduce el código de tu app autenticadora</div>
              </div>
              <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} autoFocus
                style={{ width: '100%', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '12px', color: '#f1f5f9', fontSize: '24px', fontWeight: '800', letterSpacing: '8px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}
              <button type="submit" disabled={isLoading || code.length < 6}
                style={{ width: '100%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: (isLoading || code.length < 6) ? 0.5 : 1 }}>
                {isLoading ? 'Verificando...' : 'Verificar'}
              </button>
            </form>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>EGCHAT Admin Portal v1.0 — Guinea Ecuatorial</div>
      </div>
    </div>
  );
};
