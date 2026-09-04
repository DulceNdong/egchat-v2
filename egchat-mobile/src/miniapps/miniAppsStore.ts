/**
 * EGChat Mini-Apps Store
 * - Catálogo local integrado
 * - Carga dinámica desde servidor
 * - Historial de recientes
 * - Favoritos
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';

export type MiniAppPermission = 'location' | 'payment' | 'share' | 'qr' | 'camera' | 'contacts' | 'storage';
export type MiniAppCategory   = 'transport' | 'shopping' | 'finance' | 'services' | 'entertainment' | 'government' | 'utilities';

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  url: string;
  category: MiniAppCategory;
  permissions: MiniAppPermission[];
  verified: boolean;
  developer: string;
  installsCount?: number;
  version?: string;
}

// ── Catálogo integrado ─────────────────────────────────────────────
export const MINI_APPS: MiniApp[] = [
  {
    id: 'djangue',
    name: 'Mi Djangue',
    description: 'Caja de ahorro grupal por turnos',
    icon: 'djangue', accentColor: '#6366f1',
    url: '',
    category: 'finance',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 0,
  },
  {
    id: 'mitaxi',
    name: 'MiTaxi GQ',
    description: 'Pide un taxi con GPS en tiempo real',
    icon: 'taxi', accentColor: '#f59e0b',
    url: 'https://egchat-v2.vercel.app/mitaxi',
    category: 'transport',
    permissions: ['location', 'payment'],
    verified: true, developer: 'EGChat', installsCount: 4200,
  },
  {
    id: 'cemac',
    name: 'CEMAC Pay',
    description: 'Transferencias zona CEMAC al instante',
    icon: 'bank', accentColor: '#10b981',
    url: 'https://egchat-v2.vercel.app/cemac',
    category: 'finance',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 3800,
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    description: 'Compra online con entrega a domicilio',
    icon: 'cart', accentColor: '#ec4899',
    url: 'https://egchat-v2.vercel.app/supermercados',
    category: 'shopping',
    permissions: ['location', 'payment'],
    verified: true, developer: 'EGChat', installsCount: 2900,
  },
  {
    id: 'servicios_gov',
    name: 'Servicios Gov',
    description: 'Trámites: agua, luz, impuestos',
    icon: 'government', accentColor: '#6366f1',
    url: 'https://egchat-v2.vercel.app/servicios-diarios',
    category: 'government',
    permissions: ['payment'],
    verified: true, developer: 'Gobierno GQ', installsCount: 1500,
  },
  {
    id: 'seguros',
    name: 'Seguros GQ',
    description: 'Seguros de salud, vida y vehículo',
    icon: 'shield', accentColor: '#3b82f6',
    url: 'https://egchat-v2.vercel.app/seguros-salud',
    category: 'services',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 1100,
  },
  {
    id: 'apuestas',
    name: 'Apuestas GQ',
    description: 'Apuestas deportivas y loterías',
    icon: 'trophy', accentColor: '#8b5cf6',
    url: 'https://egchat-v2.vercel.app/apuestas',
    category: 'entertainment',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 2100,
  },
  {
    id: 'ocio',
    name: 'Ocio & Eventos',
    description: 'Eventos y actividades en Guinea Ecuatorial',
    icon: 'star', accentColor: '#f97316',
    url: 'https://egchat-v2.vercel.app/ocio',
    category: 'entertainment',
    permissions: [],
    verified: true, developer: 'EGChat', installsCount: 870,
  },
  {
    id: 'barcos',
    name: 'Mi Barco',
    description: 'Reserva de pasajes marítimos',
    icon: 'anchor', accentColor: '#0284c7',
    url: 'https://egchat-v2.vercel.app/barcos',
    category: 'transport',
    permissions: ['payment', 'location'],
    verified: true, developer: 'EGChat', installsCount: 540,
  },
];

export const CATEGORIES: Record<MiniAppCategory, { label: string; emoji: string }> = {
  transport:     { label: 'Transporte',     emoji: '🚗' },
  shopping:      { label: 'Compras',        emoji: '🛍️' },
  finance:       { label: 'Finanzas',       emoji: '💰' },
  services:      { label: 'Servicios',      emoji: '⚙️' },
  entertainment: { label: 'Ocio',           emoji: '🎉' },
  government:    { label: 'Gobierno',       emoji: '🏛️' },
  utilities:     { label: 'Utilidades',     emoji: '🔧' },
};

// ── Historial y favoritos ──────────────────────────────────────────
const RECENTS_KEY   = 'egchat_miniapps_recents';
const FAVORITES_KEY = 'egchat_miniapps_favorites';

export async function getRecentApps(): Promise<MiniApp[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.map(id => MINI_APPS.find(a => a.id === id)).filter(Boolean) as MiniApp[];
  } catch { return []; }
}

export async function addRecentApp(appId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [appId, ...ids.filter(id => id !== appId)].slice(0, 12);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {}
}

export async function getFavoriteApps(): Promise<MiniApp[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.map(id => MINI_APPS.find(a => a.id === id)).filter(Boolean) as MiniApp[];
  } catch { return []; }
}

export async function toggleFavoriteApp(appId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const exists = ids.includes(appId);
    const next = exists ? ids.filter(id => id !== appId) : [...ids, appId];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return !exists;
  } catch { return false; }
}

export async function isFavoriteApp(appId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(appId);
  } catch { return false; }
}

// ── Catálogo dinámico desde servidor ──────────────────────────────
export async function fetchRemoteApps(): Promise<MiniApp[]> {
  try {
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/mini-apps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// ── Helpers ────────────────────────────────────────────────────────
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
    a.description.toLowerCase().includes(q) ||
    a.developer.toLowerCase().includes(q),
  );
}

// Texto descriptivo de cada permiso (para la pantalla de consentimiento)
export const PERMISSION_LABELS: Record<MiniAppPermission, { icon: string; label: string; desc: string }> = {
  location:  { icon: '📍', label: 'Ubicación',          desc: 'Acceder a tu ubicación GPS para mostrar servicios cercanos' },
  payment:   { icon: '💳', label: 'Pagos EGChat',        desc: 'Realizar pagos con tu wallet de EGChat' },
  share:     { icon: '💬', label: 'Compartir en chat',   desc: 'Enviar contenido a tus chats de EGChat' },
  qr:        { icon: '📷', label: 'Escáner QR',          desc: 'Usar la cámara para escanear códigos QR' },
  camera:    { icon: '📸', label: 'Cámara',              desc: 'Acceder a la cámara y galería de fotos' },
  contacts:  { icon: '👥', label: 'Contactos',           desc: 'Ver tu lista de contactos de EGChat' },
  storage:   { icon: '💾', label: 'Almacenamiento local',desc: 'Guardar datos en este dispositivo (solo para esta app)' },
};
