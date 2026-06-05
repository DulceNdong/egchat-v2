import { useAuthStore } from '../stores/authStore';
import { can, type Module, type Action } from '../utils/rbac';

export function usePermission(module: Module, action: Action = 'read'): boolean {
  const role = useAuthStore((s) => s.admin?.role);
  if (!role) return false;
  return can(role, module, action);
}
