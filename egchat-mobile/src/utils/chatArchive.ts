import AsyncStorage from '@react-native-async-storage/async-storage';

const ARCHIVED_KEY = 'egchat_archived_chats';
const ARCHIVE_PWD_KEY = 'egchat_archive_pwd';

export type ArchivedChat = {
  id: string;
  type?: 'private' | 'group' | string;
  name?: string;
  title?: string;
  avatar_url?: string;
  avatarUrl?: string;
  isGroup?: boolean;
  participants?: unknown[];
  last_message?: { text?: string; created_at?: string };
  unread_count?: number;
  updated_at?: string;
};

export async function loadArchivedChats(): Promise<ArchivedChat[]> {
  try {
    const raw = await AsyncStorage.getItem(ARCHIVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveArchivedChats(chats: ArchivedChat[]): Promise<void> {
  await AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(chats));
}

export async function getArchivePassword(): Promise<string> {
  return (await AsyncStorage.getItem(ARCHIVE_PWD_KEY)) || '';
}

export async function setArchivePassword(pwd: string): Promise<void> {
  await AsyncStorage.setItem(ARCHIVE_PWD_KEY, pwd);
}
