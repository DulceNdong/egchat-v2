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
  icon: string;         // nombre del icono SVG (ver MiniAppIcon)
  accentColor: string;  // color del icono y acento
  url: string;
  category: MiniAppCategory;
  permissions: MiniAppPermission[];
  verified: boolean;
  developer: string;
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'mitaxi',
    name: 'MiTaxi GQ',
    description: 'Pide un taxi con GPS en tiempo real',
    icon: 'taxi',
    accentColor: '#f59e0b',
    url: 'https://egchat-v2.vercel.app/mitaxi',
    category: 'transport',
    permissions: ['location', 'payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'seguros',
    name: 'Seguros GQ',
    description: 'Seguros de salud, vida y vehículo',
    icon: 'shield',
    accentColor: '#3b82f6',
    url: 'https://egchat-v2.vercel.app/seguros-salud',
    category: 'services',
    permissions: ['payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'cemac',
    name: 'CEMAC Pay',
    description: 'Transferencias zona CEMAC al instante',
    icon: 'bank',
    accentColor: '#10b981',
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
    icon: 'cart',
    accentColor: '#ec4899',
    url: 'https://egchat-v2.vercel.app/supermercados',
    category: 'shopping',
    permissions: ['location', 'payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'servicios_gov',
    name: 'Servicios Gov',
    description: 'Trámites: agua, luz, impuestos',
    icon: 'government',
    accentColor: '#6366f1',
    url: 'https://egchat-v2.vercel.app/servicios-diarios',
    category: 'government',
    permissions: ['payment'],
    verified: true,
    developer: 'Gobierno GQ',
  },
  {
    id: 'apuestas',
    name: 'Apuestas GQ',
    description: 'Apuestas deportivas y loterías',
    icon: 'trophy',
    accentColor: '#8b5cf6',
    url: 'https://egchat-v2.vercel.app/apuestas',
    category: 'entertainment',
    permissions: ['payment'],
    verified: true,
    developer: 'EGChat',
  },
  {
    id: 'ocio',
    name: 'Ocio & Eventos',
    description: 'Eventos y actividades en Guinea Ecuatorial',
    icon: 'star',
    accentColor: '#f97316',
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
