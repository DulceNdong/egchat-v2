import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'egchat_chat_wallpapers';

export async function getChatWallpaperId(chatId: string): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 'default';
    const map = JSON.parse(raw) as Record<string, string>;
    return map[chatId] ?? 'default';
  } catch {
    return 'default';
  }
}

export async function setChatWallpaperId(chatId: string, wallpaperId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const map = raw ? JSON.parse(raw) as Record<string, string> : {};
    map[chatId] = wallpaperId;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}
