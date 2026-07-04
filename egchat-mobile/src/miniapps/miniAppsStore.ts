/**
 * EGChat Mini-Apps Store — Catálogo de mini-apps disponibles
 * Cada mini-app tiene: id, nombre, icono, URL, categoría, permisos requeridos
 */

export type MiniAppPermission = 'location' | 'payment' | 'share' | 'qr' | 'camera';
export type MiniAppCategory = 'transport' | 'shopping' | 'finance' | 'services' | 'entertainment' | 'government';

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;       // emoji
  color: string;      // color de fondo del icono
  url: string;        // URL de la mini-app
  category: MiniAppCategory;
  permissions: MiniAppPermission[];
  verified: boolean;
  developer: string;
}

export const MINI_APPS: MiniApp[] = [
  // ── Transporte ──────────────────────────────────────────────────
  {
    id: 'mitaxi',
    name: 'MiTaxi GQ',
    description: 'Pide un taxi en Guinea Ecuatorial con GPS en tiempo real',
    icon: '🚕',
    color: '#fef3c7',
    url: 'https://egchat-v2.vercel.app/mitaxi',
    category: 'transport',
    permissions: ['location', 'payment'],
    verified: true,
    developer: 'EGChat',
  },

  // ── Servicios ───────────────────────────────────────────────────
  {
    id: 'seguros',
    name: 'Seguros GQ',
    description: 'Contrata seguros de salud, vida y vehículo',
    icon: '🛡️',
    color: '#dbeafe',
    url: 'https://egchat-v2.vercel.app/seguros-salud',
    category: 'services',
    permissions: ['payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'cemac',
    name: 'CEMAC Pay',
    description: 'Transferencias internacionales zona CEMAC',
    icon: '🏦',
    color: '#dcfce7',
    url: 'https://egchat-v2.vercel.app/cemac',
    category: 'finance',
    permissions: ['payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    description: 'Compra online con entrega a domicilio',
    icon: '🛒',
    color: '#fce7f3',
    url: 'https://egchat-v2.vercel.app/supermercados',
    category: 'shopping',
    permissions: ['location', 'payment'],
    verified: true,
    developer: 'EGChat',
  },

  // ── Gobierno ────────────────────────────────────────────────────
  {
    id: 'servicios_gov',
    name: 'Servicios Gov',
    description: 'Trámites gubernamentales: agua, luz, impuestos',
    icon: '🏛️',
    color: '#e0e7ff',
    url: 'https://egchat-v2.vercel.app/servicios-diarios',
    category: 'government',
    permissions: ['payment'],
    verified: true,
    developer: 'Gobierno GQ',
  },

  // ── Entretenimiento ─────────────────────────────────────────────
  {
    id: 'apuestas',
    name: 'Apuestas GQ',
    description: 'Apuestas deportivas y loterías',
    icon: '🎰',
    color: '#fef9c3',
    url: 'https://egchat-v2.vercel.app/apuestas',
    category: 'entertainment',
    permissions: ['payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'ocio',
    name: 'Ocio & Eventos',
    description: 'Eventos, conciertos y actividades en GQ',
    icon: '🎭',
    color: '#fce7f3',
    url: 'https://egchat-v2.vercel.app/ocio',
    category: 'entertainment',
    permissions: [],
    verified: true,
    developer: 'EGChat',
  },
];

export const CATEGORIES: Record<MiniAppCategory, { label: string; emoji: string }> = {
  transport:     { label: 'Transporte',     emoji: '🚗' },
  shopping:      { label: 'Compras',        emoji: '🛍️' },
  finance:       { label: 'Finanzas',       emoji: '💰' },
  services:      { label: 'Servicios',      emoji: '⚙️' },
  entertainment: { label: 'Entretenimiento',emoji: '🎉' },
  government:    { label: 'Gobierno',       emoji: '🏛️' },
};

export function getMiniAppById(id: string): MiniApp | undefined {
  return MINI_APPS.find(a => a.id === id);
}

export function getMiniAppsByCategory(category: MiniAppCategory): MiniApp[] {
  return MINI_APPS.filter(a => a.category === category);
}

export function searchMiniApps(query: string): MiniApp[] {
  const q = query.toLowerCase();
  return MINI_APPS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q)
  );
}
