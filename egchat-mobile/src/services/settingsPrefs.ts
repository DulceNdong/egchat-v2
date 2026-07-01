import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCfg<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getCfgString(key: string, fallback: string): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setCfg(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export async function getCfgBool(key: string, fallback: boolean): Promise<boolean> {
  return getCfg(key, fallback);
}

export async function setCfgBool(key: string, value: boolean): Promise<void> {
  await setCfg(key, value);
}

export const CFG = {
  gender: 'cfg_gender',
  bio: 'cfg_bio',
  lastSeen: 'cfg_last_seen',
  photoVis: 'cfg_photo_vis',
  statusVis: 'cfg_status_vis',
  notifMessages: 'cfg_notif_messages',
  notifGroups: 'cfg_notif_groups',
  notifCalls: 'cfg_notif_calls',
  notifStories: 'cfg_notif_stories',
  notifPreview: 'cfg_notif_preview',
  chatBg: 'cfg_chat_bg',
  permAdd: 'cfg_perm_add',
  permMsg: 'cfg_perm_msg',
  permFind: 'cfg_perm_find',
  autoAccept: 'cfg_auto_accept',
  muteUnknown: 'cfg_mute_unknown',
  autoDlWifi: 'cfg_auto_dl_wifi',
  autoDlData: 'cfg_auto_dl_data',
  enterSend: 'cfg_enter_send',
  readReceipts: 'cfg_read_receipts',
  savePhotos: 'cfg_save_photos',
  fontSizeChat: 'cfg_font_size_chat',
  hdCall: 'cfg_hd_call',
  saveDataCall: 'cfg_save_data_call',
  muteCallUnknown: 'cfg_mute_call_unknown',
  backupWifi: 'cfg_backup_wifi',
} as const;
