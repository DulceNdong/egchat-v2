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
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { getToken, getApiBase } from '../api';

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
  const messageUint = encodeUTF8(message);
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

    return decodeUTF8(decrypted);
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
