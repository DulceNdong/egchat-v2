/**
 * EGChat — Servicio de stickers
 *
 * Funcionalidades:
 * - Catálogo de paquetes descargables (local + servidor)
 * - Descarga y caché local de paquetes
 * - Stickers de fotos propias (crear desde galería)
 * - Favoritos persistidos en AsyncStorage
 * - Búsqueda en Tenor GIF API (gratuita sin key, con key para producción)
 * - Recientes (últimos 20 enviados)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getToken, getApiBase } from '../api';

// ── Tipos ──────────────────────────────────────────────────────────

export interface Sticker {
  id: string;
  url: string;        // URL remota o path local
  label?: string;
  isAnimated?: boolean;
  packId?: string;
}

export interface StickerPack {
  id: string;
  name: string;
  author: string;
  coverUrl: string;
  stickers: Sticker[];
  isDownloaded: boolean;
  isBuiltIn?: boolean;
  downloadCount?: number;
}

// ── Paquetes integrados (siempre disponibles) ─────────────────────

export const BUILTIN_PACKS: StickerPack[] = [
  {
    id: 'egchat_classic',
    name: 'EGChat Clásico',
    author: 'EGChat',
    coverUrl: 'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif',
    isBuiltIn: true,
    isDownloaded: true,
    stickers: [
      { id: 'eg_hi',    url: 'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif',         label: '👋', isAnimated: true },
      { id: 'eg_bye',   url: 'https://media.tenor.com/3i9CnChAkuUAAAAi/bye-bye-wave.gif',     label: '✌️', isAnimated: true },
      { id: 'eg_love',  url: 'https://media.tenor.com/bLyaMAGQg-MAAAAi/heart-love.gif',      label: '❤️', isAnimated: true },
      { id: 'eg_ok',    url: 'https://media.tenor.com/wnHZYF7RCQIAAAAi/ok-okay.gif',          label: '👍', isAnimated: true },
      { id: 'eg_laugh', url: 'https://media.tenor.com/wnRH0YZDlmAAAAAi/laugh-lol.gif',        label: '😂', isAnimated: true },
      { id: 'eg_wow',   url: 'https://media.tenor.com/3PZe-5wRa-gAAAAi/wow-omg.gif',         label: '😮', isAnimated: true },
      { id: 'eg_sad',   url: 'https://media.tenor.com/GHtaKk4n53kAAAAi/sad-cry.gif',          label: '😢', isAnimated: true },
      { id: 'eg_angry', url: 'https://media.tenor.com/JJPB4SIKNkYAAAAi/angry-mad.gif',        label: '😠', isAnimated: true },
      { id: 'eg_clap',  url: 'https://media.tenor.com/fRQXPTpRZqUAAAAi/clapping-applause.gif',label: '👏', isAnimated: true },
      { id: 'eg_fire',  url: 'https://media.tenor.com/VHMfFGNJgbgAAAAi/fire-flame.gif',       label: '🔥', isAnimated: true },
      { id: 'eg_100',   url: 'https://media.tenor.com/Prc53TP0rHEAAAAi/100-one-hundred.gif',  label: '💯', isAnimated: true },
      { id: 'eg_cool',  url: 'https://media.tenor.com/5_pvTovfQgkAAAAi/cool-sunglasses.gif',  label: '😎', isAnimated: true },
    ],
  },
  {
    id: 'egchat_reactions',
    name: 'Reacciones',
    author: 'EGChat',
    coverUrl: 'https://media.tenor.com/ek5mFEwFj0IAAAAi/thanks-thank-you.gif',
    isBuiltIn: true,
    isDownloaded: true,
    stickers: [
      { id: 'r_thanks',  url: 'https://media.tenor.com/ek5mFEwFj0IAAAAi/thanks-thank-you.gif',   label: '🙏', isAnimated: true },
      { id: 'r_wow2',    url: 'https://media.tenor.com/6H0LFo5kCOwAAAAi/surprised-shocked.gif',   label: '🤯', isAnimated: true },
      { id: 'r_skull',   url: 'https://media.tenor.com/ioKEo7i_6JIAAAAi/skull-dead.gif',           label: '💀', isAnimated: true },
      { id: 'r_nope',    url: 'https://media.tenor.com/e_c-kVmExjEAAAAi/no-nope.gif',              label: '🙅', isAnimated: true },
      { id: 'r_yes',     url: 'https://media.tenor.com/FXEh3SH7wUQAAAAi/yes-yep.gif',              label: '✅', isAnimated: true },
      { id: 'r_sleep',   url: 'https://media.tenor.com/0M9pf6RgGckAAAAi/sleepy-tired.gif',         label: '😴', isAnimated: true },
      { id: 'r_party',   url: 'https://media.tenor.com/KWBXqCNb-0AAAAAi/party-celebration.gif',    label: '🎉', isAnimated: true },
      { id: 'r_money',   url: 'https://media.tenor.com/3QLsS8wuUf0AAAAi/money-cash.gif',           label: '💰', isAnimated: true },
    ],
  },
];

// ── Claves AsyncStorage ───────────────────────────────────────────
const FAVORITES_KEY  = 'egchat_sticker_favorites';
const RECENTS_KEY    = 'egchat_sticker_recents';
const INSTALLED_KEY  = 'egchat_sticker_packs_installed';
const CUSTOM_KEY     = 'egchat_sticker_custom';
const MAX_RECENTS    = 24;

// ── Favoritos ─────────────────────────────────────────────────────

export async function getFavoriteStickers(): Promise<Sticker[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function toggleFavoriteSticker(sticker: Sticker): Promise<boolean> {
  const favs = await getFavoriteStickers();
  const exists = favs.find(f => f.id === sticker.id);
  const next = exists ? favs.filter(f => f.id !== sticker.id) : [sticker, ...favs].slice(0, 50);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return !exists;
}

export async function isFavoriteSticker(id: string): Promise<boolean> {
  const favs = await getFavoriteStickers();
  return favs.some(f => f.id === id);
}

// ── Recientes ──────────────────────────────────────────────────────

export async function getRecentStickers(): Promise<Sticker[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addRecentSticker(sticker: Sticker): Promise<void> {
  try {
    const recents = await getRecentStickers();
    const filtered = recents.filter(r => r.id !== sticker.id);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify([sticker, ...filtered].slice(0, MAX_RECENTS)));
  } catch {}
}

// ── Paquetes instalados ───────────────────────────────────────────

export async function getInstalledPackIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INSTALLED_KEY);
    return raw ? JSON.parse(raw) : BUILTIN_PACKS.map(p => p.id);
  } catch { return BUILTIN_PACKS.map(p => p.id); }
}

export async function installPack(pack: StickerPack): Promise<void> {
  const ids = await getInstalledPackIds();
  if (!ids.includes(pack.id)) {
    await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify([...ids, pack.id]));
  }
  // Guardar metadatos del paquete
  await AsyncStorage.setItem(`egchat_pack_${pack.id}`, JSON.stringify({ ...pack, isDownloaded: true }));
}

export async function uninstallPack(packId: string): Promise<void> {
  if (BUILTIN_PACKS.find(p => p.id === packId)) return; // no desinstalar built-ins
  const ids = await getInstalledPackIds();
  await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify(ids.filter(id => id !== packId)));
  await AsyncStorage.removeItem(`egchat_pack_${packId}`);
}

export async function getInstalledPacks(): Promise<StickerPack[]> {
  const ids = await getInstalledPackIds();
  const packs: StickerPack[] = [];
  for (const id of ids) {
    const builtin = BUILTIN_PACKS.find(p => p.id === id);
    if (builtin) { packs.push(builtin); continue; }
    try {
      const raw = await AsyncStorage.getItem(`egchat_pack_${id}`);
      if (raw) packs.push(JSON.parse(raw));
    } catch {}
  }
  return packs;
}

// ── Catálogo del servidor ─────────────────────────────────────────

export async function fetchPackCatalog(): Promise<StickerPack[]> {
  try {
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/stickers/catalog`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Catalog unavailable');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    // Fallback: paquetes extra hardcodeados como catálogo offline
    return [
      {
        id: 'guinea_eq',
        name: 'Guinea Ecuatorial',
        author: 'EGChat',
        coverUrl: 'https://media.tenor.com/KWBXqCNb-0AAAAAi/party-celebration.gif',
        isDownloaded: false,
        downloadCount: 1420,
        stickers: [
          { id: 'ge1', url: 'https://media.tenor.com/KWBXqCNb-0AAAAAi/party-celebration.gif', label: '🇬🇶', isAnimated: true },
          { id: 'ge2', url: 'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif', label: '👋', isAnimated: true },
        ],
      },
      {
        id: 'africa_vibes',
        name: 'África Vibes',
        author: 'EGChat',
        coverUrl: 'https://media.tenor.com/fRQXPTpRZqUAAAAi/clapping-applause.gif',
        isDownloaded: false,
        downloadCount: 890,
        stickers: [
          { id: 'av1', url: 'https://media.tenor.com/fRQXPTpRZqUAAAAi/clapping-applause.gif', label: '👏', isAnimated: true },
          { id: 'av2', url: 'https://media.tenor.com/VHMfFGNJgbgAAAAi/fire-flame.gif', label: '🔥', isAnimated: true },
        ],
      },
    ];
  }
}

// ── Stickers personalizados (desde fotos) ────────────────────────

export interface CustomSticker {
  id: string;
  uri: string;      // path local del archivo
  createdAt: number;
}

export async function getCustomStickers(): Promise<CustomSticker[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/**
 * Guarda una imagen local como sticker personalizado.
 * Copia el archivo al directorio de documentos para persistencia.
 */
export async function addCustomSticker(sourceUri: string): Promise<CustomSticker | null> {
  try {
    const id = `custom_${Date.now()}`;
    const dest = `${FileSystem.documentDirectory}stickers/${id}.jpg`;

    // Crear directorio si no existe
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}stickers/`, {
      intermediates: true,
    });

    await FileSystem.copyAsync({ from: sourceUri, to: dest });

    const sticker: CustomSticker = { id, uri: dest, createdAt: Date.now() };
    const existing = await getCustomStickers();
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify([sticker, ...existing].slice(0, 100)));
    return sticker;
  } catch (e) {
    console.warn('[Stickers] addCustomSticker error:', e);
    return null;
  }
}

export async function deleteCustomSticker(id: string): Promise<void> {
  const stickers = await getCustomStickers();
  const target = stickers.find(s => s.id === id);
  if (target) {
    await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(() => {});
  }
  await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(stickers.filter(s => s.id !== id)));
}

// ── Búsqueda GIF via Tenor ────────────────────────────────────────

// Tenor API key pública de desarrollo (sin límite estricto para uso bajo)
// Para producción: obtener key en https://tenor.com/developer/keyregistration
const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCyk'; // key pública de demo

export async function searchGifs(query: string, limit = 16): Promise<Sticker[]> {
  if (!query.trim()) return [];
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=${limit}&media_filter=gif&contentfilter=medium`;
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!res.ok) throw new Error('Tenor error');
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: `tenor_${r.id}`,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      label: r.title || query,
      isAnimated: true,
    })).filter((s: Sticker) => !!s.url);
  } catch {
    // Fallback hardcodeado si Tenor no responde
    return [];
  }
}

export async function getTrendingGifs(limit = 16): Promise<Sticker[]> {
  try {
    const url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=${limit}&media_filter=gif&contentfilter=medium`;
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!res.ok) throw new Error('Tenor error');
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: `tenor_${r.id}`,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      label: r.title || 'Trending',
      isAnimated: true,
    })).filter((s: Sticker) => !!s.url);
  } catch {
    return [];
  }
}
