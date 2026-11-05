/**
 * scheduledMessages — mensajes programados para envío futuro
 * Persiste en AsyncStorage y usa un intervalo de 30s para disparar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatAPI } from '../api';

const KEY = 'egchat_scheduled_messages';

export interface ScheduledMessage {
  id: string;
  chatId: string;
  text: string;
  type: string;
  scheduledAt: string; // ISO
  createdAt: string;
}

export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveScheduledMessage(msg: Omit<ScheduledMessage, 'id' | 'createdAt'>): Promise<ScheduledMessage> {
  const full: ScheduledMessage = {
    ...msg,
    id: `sched_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  const all = await getScheduledMessages();
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, full]));
  return full;
}

export async function deleteScheduledMessage(id: string): Promise<void> {
  const all = await getScheduledMessages();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(m => m.id !== id)));
}

/**
 * Llama a esto en un intervalo (cada 30s) para procesar mensajes vencidos.
 * Devuelve los IDs que se enviaron.
 */
export async function processScheduledMessages(): Promise<string[]> {
  const all = await getScheduledMessages();
  const now = Date.now();
  const due = all.filter(m => new Date(m.scheduledAt).getTime() <= now);
  if (!due.length) return [];

  const sent: string[] = [];
  for (const msg of due) {
    try {
      await chatAPI.sendMessage(msg.chatId, { text: msg.text, type: msg.type });
      sent.push(msg.id);
    } catch { /* dejar para el próximo ciclo */ }
  }

  if (sent.length) {
    const remaining = all.filter(m => !sent.includes(m.id));
    await AsyncStorage.setItem(KEY, JSON.stringify(remaining));
  }
  return sent;
}
