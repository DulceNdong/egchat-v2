// ══════════════════════════════════════════════════════════════════
// chatLabels — etiquetas de chats (trabajo, familia, amigos, etc.)
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'egchat_chat_labels';

export interface ChatLabel {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export const DEFAULT_LABELS: ChatLabel[] = [
  { id: 'family', name: 'Familia', color: '#ef4444', emoji: '👨‍👩‍👧' },
  { id: 'work', name: 'Trabajo', color: '#3b82f6', emoji: '💼' },
  { id: 'friends', name: 'Amigos', color: '#f59e0b', emoji: '👫' },
  { id: 'important', name: 'Importante', color: '#8b5cf6', emoji: '⭐' },
  { id: 'client', name: 'Cliente', color: '#06b6d4', emoji: '🤝' },
  { id: 'personal', name: 'Personal', color: '#07a472', emoji: '🔒' },
];

type LabelMap = Record<string, string[]>; // chatId → labelIds[]

export async function getChatLabels(chatId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const map: LabelMap = raw ? JSON.parse(raw) : {};
    return map[chatId] ?? [];
  } catch { return []; }
}

export async function toggleChatLabel(chatId: string, labelId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const map: LabelMap = raw ? JSON.parse(raw) : {};
    const current = map[chatId] ?? [];
    const next = current.includes(labelId)
      ? current.filter(id => id !== labelId)
      : [...current, labelId];
    map[chatId] = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
    return next;
  } catch { return []; }
}

export async function getAllLabels(): Promise<LabelMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getLabelById(id: string): ChatLabel | undefined {
  return DEFAULT_LABELS.find(l => l.id === id);
}
