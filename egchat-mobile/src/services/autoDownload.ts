// ══════════════════════════════════════════════════════════════════
// autoDownload.ts — Descarga automática de media según conexión
//
// Funciona igual que WhatsApp/Telegram:
//  - Fotos/imágenes: descarga automática en WiFi (configurable)
//  - Videos: NO se descargan automáticamente por defecto (mucho peso)
//  - Audios/documentos: según configuración del usuario
//  - En datos móviles: desactivado por defecto
// ══════════════════════════════════════════════════════════════════
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCfgBool, CFG } from './settingsPrefs';

const CACHE_DIR = `${FileSystem.cacheDirectory}egchat_media/`;
const CACHE_INDEX_KEY = 'egchat_media_cache_index';
const MAX_CACHE_MB = 200; // 200 MB máximo de cache

type MediaType = 'image' | 'video' | 'audio' | 'document';

interface CacheEntry {
  url: string;
  localUri: string;
  size: number;
  downloadedAt: number;
  type: MediaType;
}

// ── Helpers de red ────────────────────────────────────────────────

/** Detecta si hay WiFi disponible */
async function isOnWifi(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi' && !!state.isConnected;
  } catch {
    return false;
  }
}

/** Detecta si hay cualquier conexión a internet */
async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !!state.isConnected && !!state.isInternetReachable;
  } catch {
    return false;
  }
}

// ── Cache index ───────────────────────────────────────────────────

async function getCacheIndex(): Promise<Record<string, CacheEntry>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCacheIndex(index: Record<string, CacheEntry>): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch {}
}

/** Clave para el cache: hash simple de la URL */
function cacheKey(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash |= 0;
  }
  return `media_${Math.abs(hash)}`;
}

// ── Ensura que el directorio de cache exista ──────────────────────

async function ensureCacheDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch {}
}

// ── API pública ───────────────────────────────────────────────────

/**
 * Obtiene la URI local de un archivo de media.
 * Si está en cache, retorna la URI local.
 * Si no, retorna la URI remota original.
 */
export async function getMediaUri(url: string): Promise<string> {
  if (!url) return url;
  const index = await getCacheIndex();
  const key = cacheKey(url);
  const entry = index[key];
  if (entry) {
    try {
      const info = await FileSystem.getInfoAsync(entry.localUri);
      if (info.exists) return entry.localUri;
      // Archivo no existe — limpiar del índice
      delete index[key];
      await saveCacheIndex(index);
    } catch {}
  }
  return url;
}

/**
 * ¿Debe descargarse automáticamente este tipo de media?
 * Verifica las preferencias del usuario y el tipo de conexión.
 */
export async function shouldAutoDownload(type: MediaType): Promise<boolean> {
  const [wifi, data] = await Promise.all([
    isOnWifi(),
    isOnline(),
  ]);

  const [autoDlWifi, autoDlData] = await Promise.all([
    getCfgBool(CFG.autoDlWifi, true),    // WiFi: activado por defecto
    getCfgBool(CFG.autoDlData, false),   // Datos: desactivado por defecto
  ]);

  // Videos nunca se auto-descargan (demasiado peso)
  if (type === 'video') return false;

  if (wifi && autoDlWifi) return true;
  if (!wifi && data && autoDlData) return true;

  return false;
}

/**
 * Descarga un archivo de media al cache local si corresponde.
 * Retorna la URI local si se descargó, o la remota si no.
 *
 * @param url URL remota del archivo
 * @param type Tipo de media
 * @param forceDownload Forzar descarga independiente de la configuración
 */
export async function downloadMediaIfNeeded(
  url: string,
  type: MediaType,
  forceDownload = false
): Promise<string> {
  if (!url) return url;

  // Verificar cache primero
  const cachedUri = await getMediaUri(url);
  if (cachedUri !== url) return cachedUri;

  // Verificar si debe descargarse
  const should = forceDownload || await shouldAutoDownload(type);
  if (!should) return url;

  try {
    await ensureCacheDir();
    const key = cacheKey(url);
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'bin';
    const localUri = `${CACHE_DIR}${key}.${ext}`;

    const result = await FileSystem.downloadAsync(url, localUri);
    if (result.status === 200) {
      const info = await FileSystem.getInfoAsync(localUri);
      const size = (info as any).size || 0;

      // Actualizar índice
      const index = await getCacheIndex();
      index[key] = {
        url,
        localUri,
        size,
        downloadedAt: Date.now(),
        type,
      };
      await saveCacheIndex(index);

      // Verificar límite de cache
      await enforeCacheLimit(index);

      return localUri;
    }
  } catch {
    // Silencioso — fallback a URI remota
  }

  return url;
}

/**
 * Limpia archivos del cache si supera MAX_CACHE_MB.
 * Elimina los más antiguos primero (LRU).
 */
async function enforeCacheLimit(index: Record<string, CacheEntry>): Promise<void> {
  try {
    const totalBytes = Object.values(index).reduce((sum, e) => sum + e.size, 0);
    const maxBytes = MAX_CACHE_MB * 1024 * 1024;

    if (totalBytes <= maxBytes) return;

    // Ordenar por fecha de descarga (más antiguos primero)
    const sorted = Object.entries(index).sort((a, b) => a[1].downloadedAt - b[1].downloadedAt);

    let freed = 0;
    const toFree = totalBytes - maxBytes;

    for (const [key, entry] of sorted) {
      if (freed >= toFree) break;
      try {
        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        freed += entry.size;
        delete index[key];
      } catch {}
    }

    await saveCacheIndex(index);
  } catch {}
}

/**
 * Limpia todo el cache de media.
 * Llamar desde Ajustes > Almacenamiento.
 */
export async function clearMediaCache(): Promise<number> {
  try {
    const index = await getCacheIndex();
    const totalBytes = Object.values(index).reduce((sum, e) => sum + e.size, 0);

    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    } catch {}

    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    return totalBytes;
  } catch {
    return 0;
  }
}

/**
 * Tamaño total del cache en bytes.
 */
export async function getMediaCacheSize(): Promise<number> {
  try {
    const index = await getCacheIndex();
    return Object.values(index).reduce((sum, e) => sum + e.size, 0);
  } catch {
    return 0;
  }
}

/** Detectar tipo de media a partir de URL o mimeType */
export function detectMediaType(url: string, mimeType?: string): MediaType {
  const mime = mimeType?.toLowerCase() || '';
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
  if (mime.startsWith('video') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (mime.startsWith('audio') || ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'opus'].includes(ext)) return 'audio';
  return 'document';
}
