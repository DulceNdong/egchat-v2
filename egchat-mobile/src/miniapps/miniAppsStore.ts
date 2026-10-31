/**
 * EGChat Mini-Apps Store
 * - Catálogo local integrado
 * - Carga dinámica desde servidor
 * - Historial de recientes
 * - Favoritos
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';
import { t as tr } from '../translations';

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
    get description() { return tr('xtCajaDeAhorroGrupalPorTurnos'); },
    icon: 'djangue', accentColor: '#6366f1',
    url: '',
    category: 'finance',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 0,
  },
  {
    id: 'mitaxi',
    name: 'MiTaxi GQ',
    get description() { return tr('xtPideUnTaxiConGPSEnTiempoReal'); },
    icon: 'taxi', accentColor: '#f59e0b',
    url: 'https://egchat-v2.vercel.app/mitaxi',
    category: 'transport',
    permissions: ['location', 'payment'],
    verified: true, developer: 'EGChat', installsCount: 4200,
  },
  {
    id: 'cemac',
    name: 'CEMAC Pay',
    get description() { return tr('xtTransferenciasZonaCEMACAlInstante'); },
    icon: 'bank', accentColor: '#10b981',
    url: 'https://egchat-v2.vercel.app/cemac',
    category: 'finance',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 3800,
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    get description() { return tr('xtCompraOnlineConEntregaADomicilio'); },
    icon: 'cart', accentColor: '#ec4899',
    url: 'https://egchat-v2.vercel.app/supermercados',
    category: 'shopping',
    permissions: ['location', 'payment'],
    verified: true, developer: 'EGChat', installsCount: 2900,
  },
  {
    id: 'servicios_gov',
    name: 'Servicios Gov',
    get description() { return tr('xtTramitesAguaLuzImpuestos'); },
    icon: 'government', accentColor: '#6366f1',
    url: 'https://egchat-v2.vercel.app/servicios-diarios',
    category: 'government',
    permissions: ['payment'],
    verified: true, developer: 'Gobierno GQ', installsCount: 1500,
  },
  {
    id: 'seguros',
    name: 'Seguros GQ',
    get description() { return tr('xtSegurosDeSaludVidaYVehiculo'); },
    icon: 'shield', accentColor: '#3b82f6',
    url: 'https://egchat-v2.vercel.app/seguros-salud',
    category: 'services',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 1100,
  },
  {
    id: 'apuestas',
    name: 'Apuestas GQ',
    get description() { return tr('xtApuestasDeportivasYLoterias'); },
    icon: 'trophy', accentColor: '#8b5cf6',
    url: 'https://egchat-v2.vercel.app/apuestas',
    category: 'entertainment',
    permissions: ['payment'],
    verified: true, developer: 'EGChat', installsCount: 2100,
  },
  {
    id: 'ocio',
    name: 'Ocio & Eventos',
    get description() { return tr('xtEventosYActividadesEnGuineaEcuatorial'); },
    icon: 'star', accentColor: '#f97316',
    url: 'https://egchat-v2.vercel.app/ocio',
    category: 'entertainment',
    permissions: [],
    verified: true, developer: 'EGChat', installsCount: 870,
  },
  {
    id: 'barcos',
    name: 'Mi Barco',
    get description() { return tr('xtReservaDePasajesMaritimos'); },
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
  location:  { icon: '📍', get label() { return tr('liaAttachLocation'); },          get desc() { return tr('xtAccederATuUbicacionGPSParaMostrarServiciosCe'); } },
  payment:   { icon: '💳', get label() { return tr('xtPagosEGChat'); },        get desc() { return tr('xtRealizarPagosConTuWalletDeEGChat'); } },
  share:     { icon: '💬', get label() { return tr('xtCompartirEnChat'); },   get desc() { return tr('xtEnviarContenidoATusChatsDeEGChat'); } },
  qr:        { icon: '📷', get label() { return tr('setQrScanner'); },          get desc() { return tr('xtUsarLaCamaraParaEscanearCodigosQR'); } },
  camera:    { icon: '📸', get label() { return tr('chtCamera'); },              get desc() { return tr('xtAccederALaCamaraYGaleriaDeFotos'); } },
  contacts:  { icon: '👥', get label() { return tr('contacts'); },           get desc() { return tr('xtVerTuListaDeContactosDeEGChat'); } },
  storage:   { icon: '💾', get label() { return tr('xtAlmacenamientoLocal'); },get desc() { return tr('xtGuardarDatosEnEsteDispositivoSoloParaEstaApp'); } },
};
