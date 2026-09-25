import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { adminApi, setToken, getStoredToken } from './api/adminApi';
import { StatsPage } from './pages/StatsPage';
import { CasesPage } from './pages/CasesPage';
import { UpdateDialog } from './components/UpdateDialog';
import './index.css';

// ── Login ──────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (admin: any) => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Rellena todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const res = await adminApi.login(email, password);
      setToken(res.token);
      localStorage.setItem('empresa_token', res.token);
      onLogin(res.admin);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">EGCHAT KYC Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Panel interno de Tu Empresa</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@egchat.gq" required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
            aria-label="Email" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
            aria-label="Contraseña" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App principal ──────────────────────────────────────────────────
type Page = 'stats' | 'cases';

function App() {
  const [admin,   setAdmin]   = useState<any>(null);
  const [page,    setPage]    = useState<Page>('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getStoredToken();
    if (t) {
      setToken(t);
      adminApi.me().then(setAdmin).catch(() => localStorage.removeItem('empresa_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => { localStorage.removeItem('empresa_token'); setToken(''); setAdmin(null); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!admin) return <LoginPage onLogin={setAdmin} />;

  return (
    <>
    <UpdateDialog />
    <div className="flex h-screen bg-gray-50">
      <aside className="w-52 bg-indigo-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-indigo-800">
          <div className="font-bold text-lg">🏢 KYC Monitor</div>
          <div className="text-xs text-indigo-300 mt-0.5">{admin.role}</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {([
            { id: 'stats', icon: '📊', label: 'Dashboard' },
            { id: 'cases', icon: '📋', label: 'Casos KYC' },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition ${
                page === item.id ? 'bg-white/20 text-white' : 'text-indigo-200 hover:bg-white/10'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-indigo-800">
          <div className="text-xs text-indigo-300 truncate mb-2">{admin.email}</div>
          <button onClick={logout} className="text-xs text-indigo-300 hover:text-white">← Salir</button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        {page === 'stats' && <StatsPage />}
        {page === 'cases' && <CasesPage />}
      </main>
    </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
