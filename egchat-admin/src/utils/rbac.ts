export type AdminRole = 'super_admin' | 'operations' | 'support' | 'finance' | 'security' | 'auditor';
export type Module = 'executive' | 'financial' | 'strategic' | 'operational' | 'chat' | 'wallet' | 'security' | 'infrastructure' | 'sqlite_sync' | 'audit' | 'admin_users';
export type Action = 'read' | 'write' | 'delete';

const PERMISSIONS: Record<AdminRole, Partial<Record<Module | '*', Action[]>>> = {
  super_admin: { '*': ['read', 'write', 'delete'] },
  operations: {
    executive: ['read'],
    operational: ['read', 'write'],
    chat: ['read', 'write'],
    infrastructure: ['read', 'write'],
    sqlite_sync: ['read', 'write'],
    wallet: ['read'],
    security: ['read'],
    audit: ['read'],
  },
  support: {
    chat: ['read', 'write'],
    operational: ['read'],
  },
  finance: {
    financial: ['read'],
    wallet: ['read', 'write'],
    audit: ['read'],
  },
  security: {
    security: ['read', 'write'],
    audit: ['read', 'write'],
    operational: ['read'],
  },
  auditor: { '*': ['read'] },
};

export const MODULES_FOR_ROLE: Record<AdminRole, { id: Module; label: string; icon: string }[]> = {
  super_admin: [
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'financial',      label: 'Financiero',      icon: '💹' },
    { id: 'strategic',      label: 'Estratégico',     icon: '🎯' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'wallet',         label: 'Wallet',          icon: '💰' },
    { id: 'security',       label: 'Seguridad',       icon: '🔒' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
    { id: 'audit',          label: 'Auditoría',       icon: '📋' },
    { id: 'admin_users',    label: 'Administradores', icon: '👥' },
  ],
  operations: [
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
  ],
  support: [
    { id: 'chat',        label: 'Chat',       icon: '💬' },
    { id: 'operational', label: 'Operacional', icon: '📊' },
  ],
  finance: [
    { id: 'financial', label: 'Financiero', icon: '💹' },
    { id: 'wallet',    label: 'Wallet',     icon: '💰' },
    { id: 'audit',     label: 'Auditoría',  icon: '📋' },
  ],
  security: [
    { id: 'security',    label: 'Seguridad',   icon: '🔒' },
    { id: 'audit',       label: 'Auditoría',   icon: '📋' },
    { id: 'operational', label: 'Operacional', icon: '📊' },
  ],
  auditor: [
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'financial',      label: 'Financiero',      icon: '💹' },
    { id: 'strategic',      label: 'Estratégico',     icon: '🎯' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'wallet',         label: 'Wallet',          icon: '💰' },
    { id: 'security',       label: 'Seguridad',       icon: '🔒' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
    { id: 'audit',          label: 'Auditoría',       icon: '📋' },
  ],
};

export function can(role: AdminRole, module: Module, action: Action): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms['*']?.includes(action)) return true;
  return perms[module]?.includes(action) ?? false;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  operations: 'Operaciones',
  support: 'Soporte',
  finance: 'Finanzas',
  security: 'Seguridad',
  auditor: 'Auditor',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: '#ef4444',
  operations: '#3b82f6',
  support: '#22c55e',
  finance: '#f59e0b',
  security: '#a855f7',
  auditor: '#6b7280',
};
