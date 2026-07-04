/**
 * EGChat — Modo Incógnito
 * Los chats abiertos en modo incógnito:
 * - No se guardan en el historial local
 * - No actualizan el cache
 * - No muestran vista previa en la lista de chats
 * - No envían confirmación de lectura
 * - Los mensajes se borran al cerrar la app
 *
 * Similar al modo incógnito de Telegram "Chats secretos"
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const INCOGNITO_KEY = 'egchat_incognito_chats';

export async function getIncognitoChats(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INCOGNITO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function setIncognitoMode(chatId: string, enabled: boolean): Promise<void> {
  const current = await getIncognitoChats();
  const updated = enabled
    ? [...new Set([...current, chatId])]
    : current.filter(id => id !== chatId);
  await AsyncStorage.setItem(INCOGNITO_KEY, JSON.stringify(updated));
}

export async function isIncognitoChat(chatId: string): Promise<boolean> {
  const chats = await getIncognitoChats();
  return chats.includes(chatId);
}

/** Limpiar todos los mensajes de chats incógnito al salir de la app */
export async function clearIncognitoData(): Promise<void> {
  const chats = await getIncognitoChats();
  for (const chatId of chats) {
    await AsyncStorage.removeItem(`chat_messages_${chatId}`);
  }
}

/** Hook-helper para usar en el chat screen */
export async function handleIncognitoMessage(chatId: string): Promise<{
  saveToCache: boolean;
  sendReadReceipt: boolean;
  showPreview: boolean;
}> {
  const incognito = await isIncognitoChat(chatId);
  return {
    saveToCache:      !incognito,
    sendReadReceipt:  !incognito,
    showPreview:      !incognito,
  };
}
