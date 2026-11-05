// ── Supabase Storage — subida de media para estados/stories ─────
// Los estados (fotos/videos) se guardan en Supabase Storage (bucket 'stories').
// Esto garantiza que las URLs sean públicas y accesibles desde cualquier
// dispositivo, resolviendo el bug donde los estados se veían en negro
// porque se guardaba la URI local del dispositivo emisor (file://).

import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const BUCKET = 'stories';

/**
 * Sube la media de un estado a Supabase Storage y devuelve la URL pública.
 * @param userId  ID del usuario (para organizar los archivos por carpeta)
 * @param uri     URI local (file://, blob: o data:)
 * @param type    'image' | 'video'
 * @returns URL pública permanente, o null si falla
 */
export async function uploadStoryMediaToSupabase(
  userId: string,
  uri: string,
  type: 'image' | 'video' = 'image',
): Promise<string | null> {
  try {
    console.log('[storyMedia] Iniciando subida:', { userId, type, uri: uri.slice(0, 100) });

    // ── 1. Determinar MIME type ───────────────────────────────────
    let mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    const cleanUri = uri.split('?')[0].split('#')[0].toLowerCase();

    if (type === 'image') {
      if (cleanUri.endsWith('.png')) mimeType = 'image/png';
      else if (cleanUri.endsWith('.webp')) mimeType = 'image/webp';
      else if (cleanUri.endsWith('.gif')) mimeType = 'image/gif';
      else if (cleanUri.endsWith('.heic') || cleanUri.endsWith('.heif')) mimeType = 'image/jpeg';
    } else {
      if (cleanUri.endsWith('.mov')) mimeType = 'video/quicktime';
      else if (cleanUri.endsWith('.webm')) mimeType = 'video/webm';
      else if (cleanUri.endsWith('.m4v')) mimeType = 'video/mp4';
    }

    // ── 2. Leer el archivo ────────────────────────────────────────
    let fileData: ArrayBuffer | null = null;

    if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
      console.log('[storyMedia] Leyendo archivo (web/blob/data)');
      const response = await fetch(uri);
      fileData = await response.arrayBuffer();
    } else {
      console.log('[storyMedia] Leyendo archivo (nativo)');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[storyMedia] Base64 leído, tamaño:', base64.length);
      fileData = base64ToArrayBuffer(base64);
    }

    if (!fileData) {
      console.error('[storyMedia] No se pudo leer el archivo');
      return null;
    }

    console.log('[storyMedia] Archivo leído, tamaño:', fileData.byteLength, 'bytes');

    // ── 3. Construir path único en el bucket ──────────────────────
    // stories/<userId>/<timestamp>.<ext>
    const ext = mimeType.split('/')[1]?.replace('quicktime', 'mov') || (type === 'video' ? 'mp4' : 'jpg');
    const filePath = `${userId}/${Date.now()}.${ext}`;

    // ── 4. Subir a Supabase Storage ───────────────────────────────
    console.log('[storyMedia] Subiendo a Supabase:', filePath);
    const { data: uploadData, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileData, {
        contentType: mimeType,
        upsert: false,       // cada estado es un archivo nuevo con timestamp único
        cacheControl: '86400',
      });

    if (error) {
      console.error('[storyMedia] Error de Supabase Storage:', error.message);
      // Si el bucket no existe, el error lo indica claramente en el log
      return null;
    }

    console.log('[storyMedia] Subida exitosa:', uploadData?.path);

    // ── 5. Obtener URL pública ────────────────────────────────────
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      console.error('[storyMedia] No se pudo obtener URL pública');
      return null;
    }

    console.log('[storyMedia] URL pública:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('[storyMedia] Excepción:', err);
    return null;
  }
}

// ── Helper: base64 → ArrayBuffer (compatible con React Native Hermes) ──
function base64ToArrayBuffer(base64: string): ArrayBuffer {
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
