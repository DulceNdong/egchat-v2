// ── Supabase Storage — subida de avatares ────────────────────────
// Los avatares se guardan en Supabase Storage (bucket 'avatars').
// Esto evita el problema de Render free-tier que borra archivos
// en cada reinicio del servidor (ephemeral filesystem).

import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const BUCKET = 'avatars';

/**
 * Sube un avatar a Supabase Storage y devuelve la URL pública permanente.
 * @param userId  ID del usuario (usado como nombre de archivo)
 * @param uri     URI local (file://, blob: o data:)
 * @returns URL pública del avatar, o null si falla
 */
export async function uploadAvatarToSupabase(
  userId: string,
  uri: string,
): Promise<string | null> {
  try {
    console.log('[avatarStorage] Iniciando subida:', { userId, uri: uri.slice(0, 100) });

    // ── 1. Leer el archivo como ArrayBuffer ──────────────────────
    let fileData: ArrayBuffer | null = null;
    let mimeType = 'image/jpeg';

    // Detectar tipo por extensión
    const cleanUri = uri.split('?')[0].split('#')[0].toLowerCase();
    if (cleanUri.endsWith('.png')) mimeType = 'image/png';
    else if (cleanUri.endsWith('.webp')) mimeType = 'image/webp';
    else if (cleanUri.endsWith('.gif')) mimeType = 'image/gif';

    if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
      // Web: fetch directo
      console.log('[avatarStorage] Leyendo archivo (web)');
      const response = await fetch(uri);
      fileData = await response.arrayBuffer();
    } else {
      // Nativo: leer con expo-file-system como base64, convertir a ArrayBuffer
      console.log('[avatarStorage] Leyendo archivo (nativo)');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[avatarStorage] Base64 leído, tamaño:', base64.length);
      fileData = base64ToArrayBuffer(base64);
    }

    if (!fileData) {
      console.error('[avatarStorage] No se pudo leer el archivo');
      return null;
    }

    console.log('[avatarStorage] Archivo leído, tamaño:', fileData.byteLength, 'bytes');

    // ── 2. Determinar extensión y path en el bucket ──────────────
    const ext = mimeType.split('/')[1] || 'jpg';
    const filePath = `${userId}.${ext}`;

    // ── 3. Subir a Supabase Storage (upsert para sobreescribir) ──
    console.log('[avatarStorage] Subiendo a Supabase:', filePath);
    const { data: uploadData, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileData, {
        contentType: mimeType,
        upsert: true,        // sobreescribe si ya existe
        cacheControl: '3600',
      });

    if (error) {
      console.error('[avatarStorage] Error de Supabase:', error);
      return null;
    }

    console.log('[avatarStorage] Subida exitosa:', uploadData);

    // ── 4. Obtener URL pública ───────────────────────────────────
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      console.error('[avatarStorage] No se pudo obtener URL pública');
      return null;
    }

    const finalUrl = `${data.publicUrl}?v=${Date.now()}`;
    console.log('[avatarStorage] URL final:', finalUrl);
    return finalUrl;
  } catch (err) {
    console.error('[avatarStorage] Excepción:', err);
    return null;
  }
}

// ── Helper: base64 → ArrayBuffer (compatible con React Native Hermes) ──
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // React Native (Hermes) no tiene atob global → usar decodificación manual
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') bufferLength--;
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = chars.indexOf(base64[i]);
    const encoded2 = chars.indexOf(base64[i + 1]);
    const encoded3 = chars.indexOf(base64[i + 2]);
    const encoded4 = chars.indexOf(base64[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== 64) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (encoded4 !== 64) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }

  return bytes.buffer;
}
