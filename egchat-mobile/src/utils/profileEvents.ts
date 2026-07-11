import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type ProfileUpdatePatch = {
  id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  country?: string;
  address?: string;
};

type ProfileUpdateListener = (patch: ProfileUpdatePatch) => void;

const listeners = new Set<ProfileUpdateListener>();
const AVATAR_CACHE_PREFIX = 'egchat_profile_avatar:';
const AVATAR_DIR = 'egchat-profile-avatars/';

export const cacheBustAvatarUrl = (url?: string, version = Date.now()) => {
  if (!url || url.startsWith('file:') || url.startsWith('data:')) return url;
  const [withoutHash, hash] = url.split('#');
  const clean = withoutHash.replace(/([?&])egchatAvatarVersion=\d+(&?)/, (_, prefix, tail) =>
    tail ? prefix : '',
  );
  const separator = clean.includes('?') ? '&' : '?';
  return `${clean}${separator}egchatAvatarVersion=${version}${hash ? `#${hash}` : ''}`;
};

export const emitProfileUpdated = (patch: ProfileUpdatePatch) => {
  listeners.forEach(listener => listener(patch));
};

export const onProfileUpdated = (listener: ProfileUpdateListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isBrokenAvatarUrl = (url?: string | null) => {
  if (!url) return true;
  const s = String(url);
  // URLs de Render/static son efímeras (Render borra archivos en cada reinicio)
  if (s.includes('egchat-api.onrender.com/static/avatars/')) return true;
  // URLs de Supabase Storage son permanentes → no están rotas
  if (s.includes('.supabase.co/storage/')) return false;
  return false;
};

const getAvatarExtension = (uri: string) => {
  const clean = uri.split('?')[0].split('#')[0];
  const ext = clean.includes('.') ? clean.split('.').pop()?.toLowerCase() : undefined;
  return ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
};

export const persistAvatarFile = async (userId: string | undefined, avatarUrl?: string) => {
  if (!userId || !avatarUrl) return avatarUrl;
  if (!FileSystem.documentDirectory) return avatarUrl;
  if (avatarUrl.startsWith(`${FileSystem.documentDirectory}${AVATAR_DIR}`)) return avatarUrl;

  const dir = `${FileSystem.documentDirectory}${AVATAR_DIR}`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const destination = `${dir}${userId}.${getAvatarExtension(avatarUrl)}`;
  const oldInfo = await FileSystem.getInfoAsync(destination);

  if (avatarUrl.startsWith('file:')) {
    if (oldInfo.exists) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: avatarUrl, to: destination });
    return destination;
  }

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    // Si la URL tiene un cache-buster nuevo, forzar re-descarga
    const hasNewVersion = avatarUrl.includes('egchatAvatarVersion=');
    if (oldInfo.exists && !hasNewVersion) {
      return destination;
    }
    // Borrar el archivo viejo si existe para forzar la descarga del nuevo
    if (oldInfo.exists) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }
    try {
      const result = await FileSystem.downloadAsync(avatarUrl, destination);
      return result.uri;
    } catch {
      return avatarUrl;
    }
  }

  return avatarUrl;
};

export const saveLocalAvatar = async (userId: string | undefined, avatarUrl?: string) => {
  if (!userId || !avatarUrl) return;
  // Borrar archivo local anterior para forzar descarga de la nueva foto
  const dir = `${FileSystem.documentDirectory}${AVATAR_DIR}`;
  const exts = ['jpg', 'jpeg', 'png', 'webp'];
  for (const ext of exts) {
    const oldPath = `${dir}${userId}.${ext}`;
    const info = await FileSystem.getInfoAsync(oldPath);
    if (info.exists) await FileSystem.deleteAsync(oldPath, { idempotent: true });
  }
  const persistentAvatar = await persistAvatarFile(userId, avatarUrl);
  if (persistentAvatar) {
    await AsyncStorage.setItem(`${AVATAR_CACHE_PREFIX}${userId}`, persistentAvatar);
  }
};

export const getLocalAvatar = async (userId: string | undefined) => {
  if (!userId) return undefined;
  return AsyncStorage.getItem(`${AVATAR_CACHE_PREFIX}${userId}`);
};

export const mergePersistentAvatar = async <T extends { id?: string; avatar_url?: string | null }>(
  user: T | null | undefined,
) => {
  if (!user?.id) return user;

  // En web: no usamos FileSystem — devolver avatar_url directamente de Supabase
  if (Platform.OS === 'web') {
    if (user.avatar_url && !isBrokenAvatarUrl(user.avatar_url)) {
      return { ...user, avatar_url: cacheBustAvatarUrl(user.avatar_url) };
    }
    // Intentar recuperar del AsyncStorage (guardado como URL, no como file://)
    const stored = await AsyncStorage.getItem(`${AVATAR_CACHE_PREFIX}${user.id}`);
    if (stored && stored.startsWith('http')) return { ...user, avatar_url: stored };
    return user;
  }

  const localAvatar = await getLocalAvatar(user.id);
  if (localAvatar && FileSystem.documentDirectory && localAvatar.startsWith(FileSystem.documentDirectory)) {
    return { ...user, avatar_url: localAvatar };
  }
  if (localAvatar && isBrokenAvatarUrl(user.avatar_url)) {
    return { ...user, avatar_url: localAvatar };
  }
  if (user.avatar_url && !isBrokenAvatarUrl(user.avatar_url)) {
    await saveLocalAvatar(user.id, cacheBustAvatarUrl(user.avatar_url));
    const savedAvatar = await getLocalAvatar(user.id);
    return { ...user, avatar_url: savedAvatar || cacheBustAvatarUrl(user.avatar_url) };
  }
  return user;
};
