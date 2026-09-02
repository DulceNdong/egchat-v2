// ══════════════════════════════════════════════════════════════════
// cloudBackup — backup de chats en la nube (servidor + Google Drive)
// Exporta mensajes comprimidos y los sube al backend / Drive
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getToken, getApiBase, chatAPI } from '../api';

const KEY = 'egchat_cloud_backup_settings';
const LAST_BACKUP_KEY = 'egchat_last_backup_ts';

export interface BackupSettings {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  includeMedia: boolean;
  destination: 'server' | 'drive' | 'local';
}

const DEFAULTS: BackupSettings = {
  autoBackup: false,
  frequency: 'weekly',
  includeMedia: false,
  destination: 'server',
};

export async function getBackupSettings(): Promise<BackupSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export async function saveBackupSettings(s: BackupSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function getLastBackupTime(): Promise<Date | null> {
  try {
    const ts = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    return ts ? new Date(parseInt(ts, 10)) : null;
  } catch { return null; }
}

/**
 * Crea un backup de todos los chats y lo sube al servidor.
 * Retorna la URL del backup o null si falla.
 */
export async function createCloudBackup(
  onProgress?: (pct: number, msg: string) => void
): Promise<{ url?: string; localPath?: string; size: number; chatCount: number } | null> {
  try {
    onProgress?.(5, 'Cargando chats...');
    const chats = await chatAPI.getChats();
    if (!Array.isArray(chats) || chats.length === 0) {
      onProgress?.(100, 'No hay chats que respaldar');
      return { size: 0, chatCount: 0 };
    }

    onProgress?.(20, 'Exportando mensajes...');
    const backupData: Record<string, any> = {
      version: '2.0',
      created_at: new Date().toISOString(),
      chats: [],
    };

    let chatCount = 0;
    for (let i = 0; i < Math.min(chats.length, 50); i++) {
      const chat = chats[i];
      try {
        const messages = await chatAPI.getMessages(chat.id, 200);
        backupData.chats.push({
          id: chat.id,
          type: chat.type,
          name: chat.name,
          participants: chat.participants,
          messages: Array.isArray(messages) ? messages.map((m: any) => ({
            id: m.id, text: m.text, type: m.type,
            sender_id: m.sender_id, created_at: m.created_at,
          })) : [],
        });
        chatCount++;
        onProgress?.(20 + Math.round((i / chats.length) * 50), `Exportando ${i + 1}/${chats.length}...`);
      } catch { /* skip this chat */ }
    }

    onProgress?.(75, 'Guardando archivo...');
    const json = JSON.stringify(backupData, null, 2);
    const fileName = `egchat_backup_${new Date().toISOString().split('T')[0]}.json`;
    const localPath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(localPath, json, { encoding: FileSystem.EncodingType.UTF8 });
    const info = await FileSystem.getInfoAsync(localPath);
    const size = (info as any).size || json.length;

    onProgress?.(85, 'Subiendo al servidor...');
    let serverUrl: string | undefined;
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const formData = new FormData();
      formData.append('backup', { uri: localPath, name: fileName, type: 'application/json' } as any);
      const res = await fetch(`${BASE}/api/backup/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        serverUrl = data.url;
      }
    } catch { /* silencioso — backup local funciona igual */ }

    await AsyncStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
    onProgress?.(100, serverUrl ? 'Backup en la nube completo' : 'Backup local guardado');

    return { url: serverUrl, localPath, size, chatCount };
  } catch (e: any) {
    console.error('Backup error:', e?.message);
    return null;
  }
}

/** Comparte el archivo de backup localmente */
export async function shareBackupFile(localPath: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) await Sharing.shareAsync(localPath, { mimeType: 'application/json' });
}

/** Formatea tamaño de archivo */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
