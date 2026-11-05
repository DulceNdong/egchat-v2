import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUP_FAV_KEY = 'egchat_favorite_group_ids';

export async function getFavoriteGroupIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(GROUP_FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleFavoriteGroup(chatId: string): Promise<string[]> {
  const ids = await getFavoriteGroupIds();
  const next = ids.includes(chatId) ? ids.filter(id => id !== chatId) : [...ids, chatId];
  await AsyncStorage.setItem(GROUP_FAV_KEY, JSON.stringify(next));
  return next;
}
