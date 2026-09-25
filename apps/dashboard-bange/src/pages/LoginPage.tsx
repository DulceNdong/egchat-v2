// LoginPage — Pantalla de login
import React, { useState } from 'react';
import { authApi, setToken } from '../api/kycApi';

interface Props { onLogin: (admin: any) => void; }

export function LoginPage({ onLogin }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email y contraseña obligatorios'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, admin } = await authApi.login(email, password);
      setToken(token);
      localStorage.setItem('bange_token', token);
      onLogin(admin);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏦</div>
          <h1 className="text-2xl font-bold text-gray-900">BANGE KYC Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de Cumplimiento</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">
              Email corporativo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@bange.gq"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Acceso restringido al personal autorizado de BANGE
        </p>
      </div>
    </div>
  );
}
