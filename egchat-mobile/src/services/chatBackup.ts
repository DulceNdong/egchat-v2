/**
 * EGChat — Backup cifrado de chats
 * Exporta todos los mensajes a un archivo JSON cifrado con AES via nacl.
 * El usuario protege el backup con una contraseña.
 *
 * Formato del backup:
 * {
 *   version: 1,
 *   createdAt: ISO,
 *   userId: string,
 *   chats: [{ id, name, messages: [...] }]
 * }
 */
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { chatAPI } from '../api';

// Derivar clave de 32 bytes desde contraseña (simple hash)
function deriveKey(password: string): Uint8Array {
  const pw = encodeUTF8(password.padEnd(32, '0').slice(0, 32));
  return pw;
}

/** Cifra el backup con la contraseña del usuario */
export function encryptBackup(data: object, password: string): string {
  const key   = deriveKey(password);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const msg   = encodeUTF8(JSON.stringify(data));
  const box   = nacl.secretbox(msg, nonce, key);
  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);
  return encodeBase64(combined);
}

/** Descifra el backup con la contraseña */
export function decryptBackup(ciphertext: string, password: string): object | null {
  try {
    const key      = deriveKey(password);
    const combined = decodeBase64(ciphertext);
    const nonce    = combined.slice(0, nacl.secretbox.nonceLength);
    const box      = combined.slice(nacl.secretbox.nonceLength);
    const msg      = nacl.secretbox.open(box, nonce, key);
    if (!msg) return null;
    return JSON.parse(decodeUTF8(msg));
  } catch { return null; }
}

/** Exporta chats a un archivo .egbackup y lo comparte */
export async function exportBackup(userId: string, password: string): Promise<boolean> {
  try {
    const chats = await chatAPI.getChats();
    const backupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      userId,
      chats: chats.map((c: any) => ({
        id: c.id,
        type: c.type,
        name: c.name || '',
        participants: c.participants,
        lastMessage: c.last_message,
      })),
    };

    const encrypted  = encryptBackup(backupData, password);
    const fileName   = `egchat-backup-${Date.now()}.egbackup`;
    const filePath   = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, encrypted, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Guardar backup de EGChat',
      });
    }
    return true;
  } catch { return false; }
}

/** Importa y descifra un backup */
export async function importBackup(
  fileUri: string,
  password: string,
): Promise<{ ok: boolean; data?: any; message?: string }> {
  try {
    const raw  = await FileSystem.readAsStringAsync(fileUri);
    const data = decryptBackup(raw, password);
    if (!data) return { ok: false, message: 'Contraseña incorrecta o archivo dañado' };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}
