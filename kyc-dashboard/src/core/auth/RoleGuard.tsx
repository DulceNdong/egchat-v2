/**
 * Guard de rutas por entidad y rol.
 * Usado como layout wrapper en las rutas protegidas de App.tsx.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { AdminEntity, AdminRole } from '@/types';

interface RoleGuardProps {
  entities?: AdminEntity[];
  roles?:    AdminRole[];
}

export function RoleGuard({ entities, roles }: RoleGuardProps) {
  const { admin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (!admin) {
    // Redirigir al login correspondiente según el path
    const loginPath = location.pathname.startsWith('/bange') ? '/bange/login' : '/company/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Verificar entidad
  if (entities && !entities.includes(admin.entity)) {
    const redirectPath = admin.entity === 'BANGE' ? '/bange/queue' : '/company/home';
    return <Navigate to={redirectPath} replace />;
  }

  // Verificar rol (opcional)
  if (roles && !roles.includes(admin.role)) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center" role="alert">
        <div>
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acceso denegado</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Tu rol <strong>{admin.role}</strong> no tiene permisos para esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Hook para verificar permisos a nivel de componente.
 * Uso: const canApprove = useCanDo(['COMPLIANCE_OFFICER', 'SUPER_ADMIN']);
 */
export function useCanDo(roles: AdminRole[]): boolean {
  const { admin } = useAuth();
  if (!admin) return false;
  return roles.includes(admin.role);
}

export function useIsBange(): boolean {
  const { admin } = useAuth();
  return admin?.entity === 'BANGE';
}
