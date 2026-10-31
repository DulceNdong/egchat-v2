// ══════════════════════════════════════════════════════════════════
// chatTones — tono de notificación personalizado por chat
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as tr } from '../translations';

const KEY = 'egchat_chat_tones';

export interface ToneOption {
  id: string;
  label: string;
  emoji: string;
  sound?: string; // nombre del asset de audio (sin extensión)
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: 'default', get label() { return tr('xtPorDefecto'); }, emoji: '🔔' },
  { id: 'none', get label() { return tr('xtSinSonido'); }, emoji: '🔇' },
  { id: 'ding', label: 'Ding', emoji: '🔔' },
  { id: 'chime', label: 'Chime', emoji: '🎵' },
  { id: 'pop', label: 'Pop', emoji: '💬' },
  { id: 'whoosh', label: 'Whoosh', emoji: '💨' },
  { id: 'bell', get label() { return tr('xtCampana'); }, emoji: '🔕' },
];

type ToneSettings = Record<string, string>; // chatId → toneId

export async function getChatTone(chatId: string): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const settings: ToneSettings = raw ? JSON.parse(raw) : {};
    return settings[chatId] ?? 'default';
  } catch { return 'default'; }
}

export async function setChatTone(chatId: string, toneId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const settings: ToneSettings = raw ? JSON.parse(raw) : {};
    settings[chatId] = toneId;
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}
