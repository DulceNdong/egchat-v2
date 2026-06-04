/**
 * FileCache.ts  —  FASE 7: Caché de Archivos
 *
 * Descarga y almacena localmente:
 *  - Avatares de usuarios y grupos
 *  - Imágenes de mensajes
 *  - Archivos adjuntos
 *  - Logos de servicios
 *
 * Estrategia:
 *  1. Comprobar si ya existe en caché → devolver URL local
 *  2. Si no → descargar, guardar en Filesystem, registrar en SQLite
 *  3. Limpieza automática de archivos >7 días sin acceso
 *
 * En web usa Cache API como fallback (sin Filesystem).
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { query, run } from '../db/database';

// ── Constantes ────────────────────────────────────────────────────

const CACHE_DIR      = 'egchat_files';
const MAX_AGE_MS     = 7 * 24 * 60 * 60 * 1000;   // 7 días
const MAX_CACHE_MB   = 200;                          // 200 MB máximo
const WEB_CACHE_NAME = 'egchat-files-v1';

// ── Helpers ───────────────────────────────────────────────────────

function urlToFilename(url: string): string {
  // Hash simple de la URL para nombre de archivo único
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash |= 0;
  }
  const ext = url.split('?')[0].split('.').pop()?.slice(0, 5) ?? 'bin';
  return `${Math.abs(hash).toString(36)}.${ext}`;
}

async function fetchWithTimeout(url: string, ms = 15_000): Promise<Response> {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

// ── API principal ─────────────────────────────────────────────────

export const FileCache = {

  /**
   * Obtener URL local de un archivo remoto.
   * Si no está en caché, lo descarga automáticamente.
   * @returns URL local o la URL original si falla todo.
   */
  async get(remoteUrl: string): Promise<string> {
    if (!remoteUrl) return remoteUrl;
    // Ignorar URLs de datos (base64)
    if (remoteUrl.startsWith('data:')) return remoteUrl;
    // Ignorar URLs locales
    if (remoteUrl.startsWith('blob:') || remoteUrl.startsWith('capacitor://')) return remoteUrl;

    try {
      // 1. Comprobar en SQLite
      const cached = await this._getFromDB(remoteUrl);
      if (cached) {
        await this._touchAccess(remoteUrl);
        return cached;
      }

      // 2. Descargar y guardar
      const localPath = await this._download(remoteUrl);
      return localPath ?? remoteUrl;
    } catch {
      return remoteUrl;
    }
  },

  /**
   * Precargar una lista de URLs en background (para avatares, logos, etc.)
   */
  async prefetch(urls: string[]): Promise<void> {
    const unique = [...new Set(urls.filter(Boolean))];
    // Procesar en paralelo pero con límite de concurrencia = 3
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 3) {
      chunks.push(unique.slice(i, i + 3));
    }
    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(url => this.get(url)));
    }
  },

  /**
   * Limpiar archivos no accedidos en más de MAX_AGE_MS.
   * Llamar periódicamente (p.ej. al arrancar la app).
   */
  async prune(): Promise<number> {
    const cutoff = Date.now() - MAX_AGE_MS;
    let deleted  = 0;
    try {
      const rows = await query(
        `SELECT url, local_path FROM file_cache WHERE last_accessed < ?`,
        [cutoff]
      );
      for (const row of rows as any[]) {
        try {
          if (Capacitor.getPlatform() !== 'web') {
            await Filesystem.deleteFile({
              path:      row.local_path,
              directory: Directory.Cache,
            });
          }
          await run(`DELETE FROM file_cache WHERE url = ?`, [row.url]);
          deleted++;
        } catch {}
      }
    } catch {}
    return deleted;
  },

  /** Borrar toda la caché */
  async clear(): Promise<void> {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        await Filesystem.rmdir({
          path:      CACHE_DIR,
          directory: Directory.Cache,
          recursive: true,
        });
      } else {
        const c = await caches.open(WEB_CACHE_NAME);
        const keys = await c.keys();
        await Promise.all(keys.map(k => c.delete(k)));
      }
      await run(`DELETE FROM file_cache`);
    } catch {}
  },

  // ── Internos ───────────────────────────────────────────────────

  async _getFromDB(url: string): Promise<string | null> {
    const rows = await query(
      `SELECT local_path FROM file_cache WHERE url = ? LIMIT 1`, [url]
    );
    if (!rows.length) return null;
    const localPath = (rows[0] as any).local_path;

    // Verificar que el archivo sigue existiendo
    try {
      if (Capacitor.getPlatform() !== 'web') {
        await Filesystem.stat({ path: localPath, directory: Directory.Cache });
        const uri = await Filesystem.getUri({ path: localPath, directory: Directory.Cache });
        return Capacitor.convertFileSrc(uri.uri);
      }
      // En web, verificar en Cache API
      const cache = await caches.open(WEB_CACHE_NAME);
      const match = await cache.match(url);
      if (match) return url; // en web devolver la URL original (el SW la sirve desde caché)
    } catch {
      // Archivo eliminado externamente — limpiar registro
      await run(`DELETE FROM file_cache WHERE url = ?`, [url]);
    }
    return null;
  },

  async _download(url: string): Promise<string | null> {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) return null;

      const filename = urlToFilename(url);
      const filePath = `${CACHE_DIR}/${filename}`;
      const now      = Date.now();

      if (Capacitor.getPlatform() !== 'web') {
        // Guardar en Filesystem nativo
        const blob   = await res.blob();
        const base64 = await _blobToBase64(blob);
        await Filesystem.writeFile({
          path:      filePath,
          data:      base64,
          directory: Directory.Cache,
          recursive: true,
        });
        const uriRes = await Filesystem.getUri({ path: filePath, directory: Directory.Cache });
        const localUrl = Capacitor.convertFileSrc(uriRes.uri);

        await run(
          `INSERT INTO file_cache (url, local_path, size, mime_type, downloaded_at, last_accessed, access_count)
           VALUES (?,?,?,?,?,?,1)
           ON CONFLICT(url) DO UPDATE SET local_path=excluded.local_path, last_accessed=excluded.last_accessed`,
          [url, filePath, blob.size, blob.type, now, now]
        );
        return localUrl;
      } else {
        // En web usar Cache API
        const cache = await caches.open(WEB_CACHE_NAME);
        const blob  = await res.clone().blob();
        await cache.put(url, new Response(blob, { headers: res.headers }));
        await run(
          `INSERT INTO file_cache (url, local_path, size, mime_type, downloaded_at, last_accessed, access_count)
           VALUES (?,?,?,?,?,?,1)
           ON CONFLICT(url) DO UPDATE SET last_accessed=excluded.last_accessed`,
          [url, url, blob.size, blob.type, now, now]
        );
        return url;
      }
    } catch (err) {
      console.warn('[FileCache] Error descargando:', url, err);
      return null;
    }
  },

  async _touchAccess(url: string): Promise<void> {
    await run(
      `UPDATE file_cache SET last_accessed = ?, access_count = access_count + 1 WHERE url = ?`,
      [Date.now(), url]
    );
  },
};

// ── Helper blob → base64 ──────────────────────────────────────────

function _blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Quitar el prefijo data:...;base64,
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
