/**
 * EGChat — Cifrado E2E con TweetNaCl (box = X25519 + XSalsa20-Poly1305)
 *
 * Arquitectura:
 * - Cada usuario tiene un par de claves (pública + privada) generado en el dispositivo
 * - La clave privada se guarda en SecureStore (nunca sale del dispositivo)
 * - La clave pública se sube al servidor y la ven todos los contactos
 * - Para cifrar: se usa la clave pública del destinatario + clave privada del emisor
 * - Para descifrar: se usa la clave pública del emisor + clave privada del receptor
 *
 * El servidor NUNCA ve el contenido de los mensajes E2E.
 * Solo ve el mensaje cifrado (base64) y las claves públicas.
 */
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { getToken, getApiBase } from '../api';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function utf8ToBytes(value: string): Uint8Array {
  return textEncoder.encode(value);
}

function bytesToUtf8(value: Uint8Array): string {
  return textDecoder.decode(value);
}

const PRIVATE_KEY_STORE = 'egchat_e2e_private_key';
const PUBLIC_KEY_STORE  = 'egchat_e2e_public_key';

export interface E2EKeyPair {
  publicKey: string;   // base64
  privateKey: string;  // base64 — solo local
}

// ── Gestión de claves ─────────────────────────────────────────────

/** Genera un par de claves nuevas y las guarda localmente */
export async function generateKeyPair(): Promise<E2EKeyPair> {
  const keyPair = nacl.box.keyPair();
  const pub  = encodeBase64(keyPair.publicKey);
  const priv = encodeBase64(keyPair.secretKey);

  await SecureStore.setItemAsync(PUBLIC_KEY_STORE,  pub);
  await SecureStore.setItemAsync(PRIVATE_KEY_STORE, priv);

  return { publicKey: pub, privateKey: priv };
}

/** Carga el par de claves existente, o genera uno nuevo si no existe */
export async function loadOrGenerateKeyPair(): Promise<E2EKeyPair> {
  const pub  = await SecureStore.getItemAsync(PUBLIC_KEY_STORE);
  const priv = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);

  if (pub && priv) return { publicKey: pub, privateKey: priv };
  return generateKeyPair();
}

/** Sube la clave pública al servidor para que los contactos la vean */
export async function uploadPublicKey(publicKey: string): Promise<void> {
  try {
    const token = await getToken();
    const base  = getApiBase();
    await fetch(`${base}/api/auth/e2e-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publicKey }),
    });
  } catch {}
}

/** Obtiene la clave pública de un usuario desde el servidor */
export async function getContactPublicKey(userId: string): Promise<string | null> {
  try {
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/users/${userId}/e2e-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data?.publicKey || null;
  } catch { return null; }
}

// ── Cifrado / Descifrado ──────────────────────────────────────────

/**
 * Cifra un mensaje para un destinatario.
 * @param message  Texto plano
 * @param theirPublicKey Clave pública del destinatario (base64)
 * @param myPrivateKey   Clave privada del emisor (base64)
 * @returns Texto cifrado en base64 (nonce + ciphertext concatenados)
 */
export function encryptMessage(
  message: string,
  theirPublicKey: string,
  myPrivateKey: string,
): string {
  const nonce       = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint = utf8ToBytes(message);
  const theirKey    = decodeBase64(theirPublicKey);
  const myKey       = decodeBase64(myPrivateKey);

  const encrypted   = nacl.box(messageUint, nonce, theirKey, myKey);

  // Concatenar nonce + encrypted para enviar como un solo string
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);

  return encodeBase64(combined);
}

/**
 * Descifra un mensaje recibido.
 * @param ciphertext   Texto cifrado en base64 (nonce + ciphertext)
 * @param theirPublicKey Clave pública del emisor (base64)
 * @param myPrivateKey   Clave privada del receptor (base64)
 * @returns Texto descifrado, o null si falla
 */
export function decryptMessage(
  ciphertext: string,
  theirPublicKey: string,
  myPrivateKey: string,
): string | null {
  try {
    const combined  = decodeBase64(ciphertext);
    const nonce     = combined.slice(0, nacl.box.nonceLength);
    const encrypted = combined.slice(nacl.box.nonceLength);
    const theirKey  = decodeBase64(theirPublicKey);
    const myKey     = decodeBase64(myPrivateKey);

    const decrypted = nacl.box.open(encrypted, nonce, theirKey, myKey);
    if (!decrypted) return null;

    return bytesToUtf8(decrypted);
  } catch { return null; }
}

/** Detecta si un mensaje está cifrado E2E (empieza con e2e:) */
export function isE2EMessage(text: string): boolean {
  return text?.startsWith('e2e:') || false;
}

/** Wrapper: cifra y añade prefijo e2e: */
export function encryptForSend(
  text: string,
  theirPublicKey: string,
  myPrivateKey: string,
): string {
  return 'e2e:' + encryptMessage(text, theirPublicKey, myPrivateKey);
}

/** Wrapper: descifra si tiene prefijo e2e:, devuelve texto plano si no */
export function decryptIfNeeded(
  text: string,
  theirPublicKey: string,
  myPrivateKey: string,
): string {
  if (!isE2EMessage(text)) return text;
  const cipher    = text.slice(4); // quitar "e2e:"
  const decrypted = decryptMessage(cipher, theirPublicKey, myPrivateKey);
  return decrypted ?? '🔒 Mensaje cifrado (clave no disponible)';
}

// ══════════════════════════════════════════════════════════════════
// BACKUP / RESTORE de claves E2E — multi-dispositivo
//
// Problema: SecureStore es local al dispositivo. Si el usuario reinstala
// o cambia de teléfono, pierde su clave privada y no puede leer mensajes
// cifrados anteriores.
//
// Solución (igual que WhatsApp):
//  1. La clave privada se cifra con una contraseña de recuperación
//     usando NaCl secretbox (XSalsa20-Poly1305 simétrico, clave derivada
//     de la contraseña con PBKDF2-SHA512).
//  2. El blob cifrado se sube al servidor del usuario. El servidor
//     NUNCA ve la clave privada en texto claro.
//  3. En un dispositivo nuevo, el usuario ingresa su contraseña,
//     el servidor devuelve el blob, y se descifra localmente.
// ══════════════════════════════════════════════════════════════════

const BACKUP_SALT_STORE = 'egchat_e2e_backup_salt';
const BACKUP_TS_STORE   = 'egchat_e2e_backup_ts';

// ── Derivación de clave desde contraseña ─────────────────────────

/**
 * Deriva una clave de 32 bytes a partir de una contraseña usando
 * PBKDF2-SHA-512 con 100 000 iteraciones.
 * Usa la Web Crypto API (disponible en RN >= 0.71 y Expo SDK >= 49).
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-512', salt: salt as unknown as BufferSource, iterations: 100_000 },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

// ── Cifrado simétrico del blob de clave privada ───────────────────

function encryptBlob(data: Uint8Array, key: Uint8Array): string {
  const nonce     = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(data, nonce, key);
  const combined  = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

function decryptBlob(ciphertext: string, key: Uint8Array): Uint8Array | null {
  try {
    const combined  = decodeBase64(ciphertext);
    const nonce     = combined.slice(0, nacl.secretbox.nonceLength);
    const encrypted = combined.slice(nacl.secretbox.nonceLength);
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);
    return decrypted;
  } catch { return null; }
}

// ── API pública de backup ─────────────────────────────────────────

export interface E2EBackupResult {
  ok: boolean;
  error?: string;
}

/**
 * Sube la clave privada cifrada al servidor.
 *
 * @param password  Contraseña de recuperación elegida por el usuario.
 *                  No se envía ni almacena en el servidor.
 *
 * Proceso:
 *  1. Genera o recupera un salt aleatorio de 16 bytes (persistido en SecureStore)
 *  2. Deriva una clave de cifrado con PBKDF2(password, salt, 100k, SHA-512)
 *  3. Cifra la clave privada con NaCl secretbox
 *  4. Sube { encryptedKey, salt, publicKey } al servidor
 */
export async function backupE2EKey(password: string): Promise<E2EBackupResult> {
  if (!password || password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  try {
    // 1. Cargar clave privada local
    const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
    const publicKeyB64  = await SecureStore.getItemAsync(PUBLIC_KEY_STORE);
    if (!privateKeyB64 || !publicKeyB64) {
      return { ok: false, error: 'No hay claves E2E generadas en este dispositivo' };
    }

    // 2. Salt (generar nuevo o reusar el existente del primer backup)
    let saltB64 = await SecureStore.getItemAsync(BACKUP_SALT_STORE);
    let salt: Uint8Array;
    if (saltB64) {
      salt = decodeBase64(saltB64);
    } else {
      salt = nacl.randomBytes(16);
      saltB64 = encodeBase64(salt);
      await SecureStore.setItemAsync(BACKUP_SALT_STORE, saltB64);
    }

    // 3. Derivar clave y cifrar la clave privada
    const derivedKey   = await deriveKey(password, salt);
    const privateBytes = decodeBase64(privateKeyB64);
    const encryptedKey = encryptBlob(privateBytes, derivedKey);

    // 4. Subir al servidor
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/auth/e2e-key-backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        encryptedKey,
        salt: saltB64,
        publicKey: publicKeyB64,
        version: 1,
        algorithm: 'nacl-secretbox-pbkdf2-sha512-100k',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error del servidor' }));
      return { ok: false, error: err.message };
    }

    // Guardar timestamp del último backup
    await SecureStore.setItemAsync(BACKUP_TS_STORE, Date.now().toString());

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error al hacer backup' };
  }
}

/**
 * Restaura la clave privada desde el servidor en un dispositivo nuevo.
 *
 * @param password  Contraseña de recuperación que el usuario ingresó al hacer el backup.
 */
export async function restoreE2EKey(password: string): Promise<E2EBackupResult> {
  if (!password || password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  try {
    // 1. Descargar blob cifrado desde el servidor
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/auth/e2e-key-backup`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 404) return { ok: false, error: 'No hay backup de claves en el servidor' };
      return { ok: false, error: 'No se pudo obtener el backup' };
    }

    const data = await res.json();
    const { encryptedKey, salt: saltB64, publicKey } = data;

    if (!encryptedKey || !saltB64 || !publicKey) {
      return { ok: false, error: 'Backup inválido o corrupto' };
    }

    // 2. Derivar clave desde contraseña + salt guardado
    const salt       = decodeBase64(saltB64);
    const derivedKey = await deriveKey(password, salt);

    // 3. Descifrar
    const decrypted = decryptBlob(encryptedKey, derivedKey);
    if (!decrypted) {
      return { ok: false, error: 'Contraseña incorrecta o backup corrupto' };
    }

    // 4. Guardar en SecureStore del nuevo dispositivo
    const privateKeyB64 = encodeBase64(decrypted);
    await SecureStore.setItemAsync(PRIVATE_KEY_STORE, privateKeyB64);
    await SecureStore.setItemAsync(PUBLIC_KEY_STORE,  publicKey);
    await SecureStore.setItemAsync(BACKUP_SALT_STORE, saltB64);
    await SecureStore.setItemAsync(BACKUP_TS_STORE,   Date.now().toString());

    // 5. Re-subir la clave pública (por si este dispositivo no la tenía)
    await uploadPublicKey(publicKey);

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error al restaurar' };
  }
}

/** Fecha del último backup de clave E2E, o null si nunca se hizo */
export async function getLastE2EBackupDate(): Promise<Date | null> {
  try {
    const ts = await SecureStore.getItemAsync(BACKUP_TS_STORE);
    return ts ? new Date(parseInt(ts, 10)) : null;
  } catch { return null; }
}

/** Verifica si hay backup disponible en el servidor */
export async function hasE2EBackupOnServer(): Promise<boolean> {
  try {
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/auth/e2e-key-backup`, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}
