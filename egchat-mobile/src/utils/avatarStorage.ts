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
      const response = await fetch(uri);
      fileData = await response.arrayBuffer();
    } else {
      // Nativo: leer con expo-file-system como base64, convertir a ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileData = base64ToArrayBuffer(base64);
    }

    if (!fileData) return null;

    // ── 2. Determinar extensión y path en el bucket ──────────────
    const ext = mimeType.split('/')[1] || 'jpg';
    const filePath = `${userId}.${ext}`;

    // ── 3. Subir a Supabase Storage (upsert para sobreescribir) ──
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileData, {
        contentType: mimeType,
        upsert: true,        // sobreescribe si ya existe
        cacheControl: '3600',
      });

    if (error) {
      console.warn('[avatarStorage] upload error:', error.message);
      return null;
    }

    // ── 4. Obtener URL pública ───────────────────────────────────
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) return null;

    // Añadir cache-buster para forzar recarga en los clientes
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (err) {
    console.warn('[avatarStorage] error:', err);
    return null;
  }
}

// ── Helper: base64 → ArrayBuffer ─────────────────────────────────
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
