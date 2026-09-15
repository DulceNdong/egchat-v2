/**
 * Redirige al dashboard correcto según la entidad del admin.
 * Si no está autenticado, muestra selector de portal.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';

export default function RootRedirect() {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (admin) {
    return <Navigate to={admin.entity === 'BANGE' ? '/bange/queue' : '/company/home'} replace />;
  }

  // Portal selector
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-6">🏦</div>
        <h1 className="text-3xl font-bold text-white mb-2">EGChat KYC Admin</h1>
        <p className="text-slate-400 mb-10">Selecciona el portal de acceso</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/bange/login"
            className="flex flex-col items-center gap-2 px-8 py-6 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <span className="text-3xl">🏛️</span>
            <span className="font-semibold">Portal BANGE</span>
            <span className="text-xs text-slate-400">Validación de identidad</span>
          </a>
          <a
            href="/company/login"
            className="flex flex-col items-center gap-2 px-8 py-6 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-white transition-colors border border-brand-500/30"
          >
            <span className="text-3xl">📊</span>
            <span className="font-semibold">Portal Empresa</span>
            <span className="text-xs text-slate-400">Monitorización AML</span>
          </a>
        </div>
      </div>
    </div>
  );
}
