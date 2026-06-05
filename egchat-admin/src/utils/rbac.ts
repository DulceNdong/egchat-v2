export type AdminRole = 'super_admin' | 'operations' | 'support' | 'finance' | 'security' | 'auditor';
export type Module =
  // FASE A — Dirección
  'executive' | 'financial' | 'strategic' | 'risk' |
  // FASE B — Operaciones
  'users' | 'support' | 'mini_apps' | 'operational' | 'chat' | 'wallet' | 'security' | 'infrastructure' | 'sqlite_sync' |
  // Otros
  'audit' | 'admin_users';

export type Action = 'read' | 'write' | 'delete';

// Phase metadata for sidebar grouping
export interface ModuleItem { id: Module; label: string; icon: string }
export interface PhaseGroup { phase: string; label: string; modules: ModuleItem[] }

const PERMISSIONS: Record<AdminRole, Partial<Record<Module | '*', Action[]>>> = {
  super_admin: { '*': ['read', 'write', 'delete'] },
  operations: {
    executive: ['read'],
    users: ['read', 'write'],
    operational: ['read', 'write'],
    chat: ['read', 'write'],
    infrastructure: ['read', 'write'],
    sqlite_sync: ['read', 'write'],
    wallet: ['read'],
    security: ['read'],
    audit: ['read'],
  },
  support: {
    users: ['read'],
    support: ['read', 'write'],
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
    users: ['read'],
    operational: ['read'],
  },
  auditor: { '*': ['read'] },
};

// Flat list per role (for DefaultRedirect)
export const MODULES_FOR_ROLE: Record<AdminRole, ModuleItem[]> = {
  super_admin: [
    // A
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'financial',      label: 'Financiero',      icon: '💹' },
    { id: 'strategic',      label: 'Estratégico',     icon: '🎯' },
    { id: 'risk',           label: 'Riesgo',          icon: '⚠️' },
    // B
    { id: 'users',          label: 'Usuarios',        icon: '👤' },
    { id: 'support',        label: 'Soporte',         icon: '🎧' },
    { id: 'mini_apps',      label: 'Mini Apps',       icon: '📱' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'wallet',         label: 'Wallet',          icon: '💰' },
    { id: 'security',       label: 'Seguridad',       icon: '🔒' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
    // Other
    { id: 'audit',          label: 'Auditoría',       icon: '📋' },
    { id: 'admin_users',    label: 'Administradores', icon: '👥' },
  ],
  operations: [
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'users',          label: 'Usuarios',        icon: '👤' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
  ],
  support: [
    { id: 'support',     label: 'Soporte',     icon: '🎧' },
    { id: 'users',       label: 'Usuarios',    icon: '👤' },
    { id: 'chat',        label: 'Chat',        icon: '💬' },
    { id: 'operational', label: 'Operacional', icon: '📊' },
  ],
  finance: [
    { id: 'financial', label: 'Financiero', icon: '💹' },
    { id: 'wallet',    label: 'Wallet',     icon: '💰' },
    { id: 'audit',     label: 'Auditoría',  icon: '📋' },
  ],
  security: [
    { id: 'security',    label: 'Seguridad',   icon: '🔒' },
    { id: 'users',       label: 'Usuarios',    icon: '👤' },
    { id: 'audit',       label: 'Auditoría',   icon: '📋' },
    { id: 'operational', label: 'Operacional', icon: '📊' },
  ],
  auditor: [
    { id: 'executive',      label: 'Ctrl. Ejecutivo', icon: '🏛️' },
    { id: 'financial',      label: 'Financiero',      icon: '💹' },
    { id: 'strategic',      label: 'Estratégico',     icon: '🎯' },
    { id: 'risk',           label: 'Riesgo',          icon: '⚠️' },
    { id: 'users',          label: 'Usuarios',        icon: '👤' },
    { id: 'operational',    label: 'Operacional',     icon: '📊' },
    { id: 'chat',           label: 'Chat',            icon: '💬' },
    { id: 'wallet',         label: 'Wallet',          icon: '💰' },
    { id: 'security',       label: 'Seguridad',       icon: '🔒' },
    { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
    { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
    { id: 'audit',          label: 'Auditoría',       icon: '📋' },
  ],
};

// Phase groups for sidebar display
export const PHASE_GROUPS: PhaseGroup[] = [
  {
    phase: 'A', label: 'FASE A — Dirección',
    modules: [
      { id: 'executive',  label: 'Ctrl. Ejecutivo', icon: '🏛️' },
      { id: 'financial',  label: 'Financiero',      icon: '💹' },
      { id: 'strategic',  label: 'Estratégico',     icon: '🎯' },
      { id: 'risk',       label: 'Riesgo',          icon: '⚠️' },
    ],
  },
  {
    phase: 'B', label: 'FASE B — Operaciones',
    modules: [
      { id: 'users',          label: 'Usuarios',        icon: '👤' },
      { id: 'support',        label: 'Soporte',         icon: '🎧' },
      { id: 'mini_apps',      label: 'Mini Apps',       icon: '📱' },
      { id: 'operational',    label: 'Operacional',     icon: '📊' },
      { id: 'chat',           label: 'Chat',            icon: '💬' },
      { id: 'wallet',         label: 'Wallet',          icon: '💰' },
      { id: 'security',       label: 'Seguridad',       icon: '🔒' },
      { id: 'infrastructure', label: 'Infraestructura', icon: '⚙️' },
      { id: 'sqlite_sync',    label: 'Sincronización',  icon: '🔄' },
    ],
  },
  {
    phase: 'C', label: 'Sistema',
    modules: [
      { id: 'audit',       label: 'Auditoría',       icon: '📋' },
      { id: 'admin_users', label: 'Administradores', icon: '👥' },
    ],
  },
];

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
