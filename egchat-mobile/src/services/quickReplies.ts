// ══════════════════════════════════════════════════════════════════
// quickReplies — respuestas rápidas guardadas localmente
// El usuario puede crear, editar y borrar plantillas de texto
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'egchat_quick_replies_v1';

export interface QuickReply {
  id: string;
  shortcut: string;   // ej: "/hola"
  text: string;       // texto completo que se inserta
  createdAt: string;
}

// Respuestas predeterminadas para nuevos usuarios
const DEFAULTS: QuickReply[] = [
  { id: 'qr_1', shortcut: '/hola', text: '¡Hola! ¿Cómo estás?', createdAt: new Date().toISOString() },
  { id: 'qr_2', shortcut: '/gracias', text: 'Muchas gracias por tu mensaje, te responderé pronto.', createdAt: new Date().toISOString() },
  { id: 'qr_3', shortcut: '/ok', text: '¡Perfecto, entendido! 👍', createdAt: new Date().toISOString() },
  { id: 'qr_4', shortcut: '/pronto', text: 'Te respondo en cuanto pueda, estoy ocupado ahora mismo.', createdAt: new Date().toISOString() },
  { id: 'qr_5', shortcut: '/precio', text: '¿Podrías indicarme tu presupuesto o lo que necesitas exactamente?', createdAt: new Date().toISOString() },
];

export async function getAllQuickReplies(): Promise<QuickReply[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      await AsyncStorage.setItem(KEY, JSON.stringify(DEFAULTS));
      return DEFAULTS;
    }
    return JSON.parse(raw) as QuickReply[];
  } catch { return DEFAULTS; }
}

export async function saveQuickReply(reply: Omit<QuickReply, 'id' | 'createdAt'>): Promise<QuickReply> {
  const all = await getAllQuickReplies();
  const newReply: QuickReply = {
    ...reply,
    id: `qr_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, newReply]));
  return newReply;
}

export async function updateQuickReply(id: string, patch: Partial<Omit<QuickReply, 'id' | 'createdAt'>>): Promise<void> {
  const all = await getAllQuickReplies();
  const updated = all.map(r => r.id === id ? { ...r, ...patch } : r);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function deleteQuickReply(id: string): Promise<void> {
  const all = await getAllQuickReplies();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(r => r.id !== id)));
}

/** Busca respuestas rápidas que coincidan con el texto escrito (ej: "/ho" → /hola) */
export function searchQuickReplies(replies: QuickReply[], query: string): QuickReply[] {
  if (!query.startsWith('/')) return [];
  const q = query.toLowerCase();
  return replies.filter(r => r.shortcut.toLowerCase().startsWith(q));
}
