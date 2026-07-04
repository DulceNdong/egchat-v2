/**
 * EGChat — Mensajes fijados en chats grupales
 * Permite fijar hasta 3 mensajes en un chat que todos ven en la parte superior.
 * Se guarda en Supabase en la tabla chat_participants.wallpaper_settings (reutilizando el campo)
 * o en AsyncStorage como fallback local.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';

const PIN_KEY = (chatId: string) => `egchat_pinned_messages_${chatId}`;
const MAX_PINNED = 3;

export interface PinnedMessage {
  id: string;
  text: string;
  senderName: string;
  pinnedAt: string;
}

export async function getPinnedMessages(chatId: string): Promise<PinnedMessage[]> {
  try {
    // Intentar obtener del backend
    const token = await getToken();
    const base  = getApiBase();
    const res   = await fetch(`${base}/api/chats/${chatId}/pinned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data?.pinned || [];
    }
  } catch {}
  // Fallback local
  try {
    const raw = await AsyncStorage.getItem(PIN_KEY(chatId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function pinMessage(
  chatId: string,
  message: PinnedMessage,
): Promise<boolean> {
  try {
    const current = await getPinnedMessages(chatId);
    if (current.find(m => m.id === message.id)) return true; // ya fijado
    if (current.length >= MAX_PINNED) current.shift(); // eliminar el más antiguo

    const updated = [...current, { ...message, pinnedAt: new Date().toISOString() }];

    // Guardar en backend
    const token = await getToken();
    const base  = getApiBase();
    await fetch(`${base}/api/chats/${chatId}/pinned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pinned: updated }),
    }).catch(() => {});

    // Siempre guardar local también
    await AsyncStorage.setItem(PIN_KEY(chatId), JSON.stringify(updated));
    return true;
  } catch { return false; }
}

export async function unpinMessage(chatId: string, messageId: string): Promise<void> {
  const current = await getPinnedMessages(chatId);
  const updated = current.filter(m => m.id !== messageId);
  await AsyncStorage.setItem(PIN_KEY(chatId), JSON.stringify(updated));

  const token = await getToken();
  const base  = getApiBase();
  fetch(`${base}/api/chats/${chatId}/pinned`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pinned: updated }),
  }).catch(() => {});
}
