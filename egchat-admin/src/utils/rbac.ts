export type AdminRole = 'super_admin' | 'operations' | 'support' | 'finance' | 'security' | 'auditor';
export type Module =
  'executive' | 'financial' | 'strategic' | 'risk' |
  'users' | 'chat' | 'wallet' | 'support' | 'mini_apps' |
  'infrastructure' | 'devops' | 'security' | 'audit' | 'sqlite_sync' |
  'operational' | 'admin_users';

export type Action = 'read' | 'write' | 'delete';
export interface ModuleItem  { id: Module; label: string; icon: string }
export interface PhaseGroup  { phase: string; label: string; modules: ModuleItem[] }

const PERMISSIONS: Record<AdminRole, Partial<Record<Module | '*', Action[]>>> = {
  super_admin: { '*': ['read', 'write', 'delete'] },
  operations: {
    executive: ['read'], users: ['read','write'], chat: ['read','write'],
    wallet: ['read'], support: ['read'], operational: ['read','write'],
    infrastructure: ['read','write'], sqlite_sync: ['read','write'], audit: ['read'],
  },
  support:  { users: ['read'], chat: ['read','write'], support: ['read','write'], operational: ['read'] },
  finance:  { financial: ['read'], wallet: ['read','write'], audit: ['read'] },
  security: { security: ['read','write'], audit: ['read','write'], users: ['read'], operational: ['read'] },
  auditor:  { '*': ['read'] },
};

export const MODULES_FOR_ROLE: Record<AdminRole, ModuleItem[]> = {
  super_admin: [
    { id:'executive',      label:'Ejecutivo',       icon:'🏛️' },
    { id:'financial',      label:'Financiero',      icon:'💹' },
    { id:'strategic',      label:'Estratégico',     icon:'🎯' },
    { id:'risk',           label:'Riesgo',          icon:'⚠️' },
    { id:'users',          label:'Usuarios',        icon:'👤' },
    { id:'chat',           label:'Chat',            icon:'💬' },
    { id:'wallet',         label:'Wallet',          icon:'💰' },
    { id:'support',        label:'Soporte',         icon:'🎧' },
    { id:'mini_apps',      label:'Mini Apps',       icon:'📱' },
    { id:'infrastructure', label:'Infraestructura', icon:'⚙️' },
    { id:'devops',         label:'DevOps',          icon:'🛠️' },
    { id:'security',       label:'Seguridad',       icon:'🔒' },
    { id:'audit',          label:'Auditoría',       icon:'📋' },
    { id:'sqlite_sync',    label:'Sincronización',  icon:'🔄' },
  ],
  operations: [
    { id:'executive',      label:'Ejecutivo',       icon:'🏛️' },
    { id:'users',          label:'Usuarios',        icon:'👤' },
    { id:'chat',           label:'Chat',            icon:'💬' },
    { id:'infrastructure', label:'Infraestructura', icon:'⚙️' },
    { id:'sqlite_sync',    label:'Sincronización',  icon:'🔄' },
  ],
  support: [
    { id:'users',   label:'Usuarios', icon:'👤' },
    { id:'chat',    label:'Chat',     icon:'💬' },
    { id:'support', label:'Soporte',  icon:'🎧' },
  ],
  finance: [
    { id:'financial', label:'Financiero', icon:'💹' },
    { id:'wallet',    label:'Wallet',     icon:'💰' },
    { id:'audit',     label:'Auditoría',  icon:'📋' },
  ],
  security: [
    { id:'security', label:'Seguridad',   icon:'🔒' },
    { id:'users',    label:'Usuarios',    icon:'👤' },
    { id:'audit',    label:'Auditoría',   icon:'📋' },
  ],
  auditor: [
    { id:'executive',      label:'Ejecutivo',       icon:'🏛️' },
    { id:'financial',      label:'Financiero',      icon:'💹' },
    { id:'strategic',      label:'Estratégico',     icon:'🎯' },
    { id:'risk',           label:'Riesgo',          icon:'⚠️' },
    { id:'users',          label:'Usuarios',        icon:'👤' },
    { id:'chat',           label:'Chat',            icon:'💬' },
    { id:'wallet',         label:'Wallet',          icon:'💰' },
    { id:'security',       label:'Seguridad',       icon:'🔒' },
    { id:'infrastructure', label:'Infraestructura', icon:'⚙️' },
    { id:'sqlite_sync',    label:'Sincronización',  icon:'🔄' },
    { id:'audit',          label:'Auditoría',       icon:'📋' },
  ],
};

// ── Sidebar phase groups — EXACT layout requested ─────────────────────────────
export const PHASE_GROUPS: PhaseGroup[] = [
  {
    phase: '1', label: 'NIVEL 1 — DIRECCIÓN',
    modules: [
      { id:'executive', label:'Ejecutivo',   icon:'🏛️' },
      { id:'financial', label:'Financiero',  icon:'💹' },
      { id:'strategic', label:'Estratégico', icon:'🎯' },
      { id:'risk',      label:'Riesgo',      icon:'⚠️' },
    ],
  },
  {
    phase: '2', label: 'NIVEL 2 — OPERACIONES',
    modules: [
      { id:'users',     label:'Usuarios',  icon:'👤' },
      { id:'chat',      label:'Chat',      icon:'💬' },
      { id:'wallet',    label:'Wallet',    icon:'💰' },
      { id:'support',   label:'Soporte',   icon:'🎧' },
      { id:'mini_apps', label:'Mini Apps', icon:'📱' },
    ],
  },
  {
    phase: '3', label: 'NIVEL 3 — TECNOLOGÍA',
    modules: [
      { id:'infrastructure', label:'Infraestructura', icon:'⚙️' },
      { id:'devops',         label:'DevOps',          icon:'🛠️' },
      { id:'security',       label:'Seguridad',       icon:'🔒' },
      { id:'audit',          label:'Auditoría',       icon:'📋' },
      { id:'sqlite_sync',    label:'Sincronización',  icon:'🔄' },
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
  super_admin: 'Super Admin', operations: 'Operaciones', support: 'Soporte',
  finance: 'Finanzas', security: 'Seguridad', auditor: 'Auditor',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: '#ef4444', operations: '#3b82f6', support: '#22c55e',
  finance: '#f59e0b', security: '#a855f7', auditor: '#6b7280',
};
