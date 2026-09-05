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
const PROFILE_CACHE_PREFIX = 'egchat_profile_name:';
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

const isGenericName = (name?: string | null) =>
  !name ||
  name === 'Usuario EGCHAT' ||
  name.startsWith('Usuario +') ||
  name.startsWith('Usuario ');

export const emitProfileUpdated = (patch: ProfileUpdatePatch) => {
  // Si el patch trae un nombre real, guardarlo localmente
  if (patch.id && patch.full_name && !isGenericName(patch.full_name)) {
    saveLocalProfile(patch.id, patch.full_name);
  }
  listeners.forEach(listener => listener(patch));
};

export const onProfileUpdated = (listener: ProfileUpdateListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isBrokenAvatarUrl = (url?: string | null) =>
  !url || String(url).includes('egchat-api-xlxj.onrender.com/static/avatars/');

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
    // Verificar que el archivo origen existe antes de copiar
    const srcInfo = await FileSystem.getInfoAsync(avatarUrl);
    if (!srcInfo.exists) {
      // Archivo local ya no existe — usar la URL directamente
      return avatarUrl;
    }
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

// ── Persistencia local del nombre de perfil ───────────────────────
export const saveLocalProfile = async (userId: string, full_name: string) => {
  if (!userId || isGenericName(full_name)) return;
  try {
    await AsyncStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, full_name);
  } catch {}
};

export const getLocalProfile = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  try {
    return await AsyncStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
  } catch {
    return null;
  }
};

export const mergePersistentAvatar = async <T extends { id?: string; avatar_url?: string | null; full_name?: string }>(
  user: T | null | undefined,
) => {
  if (!user?.id) return user;

  // Preservar nombre real: si el servidor devuelve un nombre genérico,
  // usar el guardado localmente (puesto por el usuario o por una sesión anterior con Supabase OK)
  let resolvedName = user.full_name;
  
  if (isGenericName(resolvedName)) {
    const cachedName = await getLocalProfile(user.id);
    if (cachedName) resolvedName = cachedName;
  } else if (resolvedName) {
    // Nombre real recibido del servidor → guardarlo para uso futuro offline
    await saveLocalProfile(user.id, resolvedName);
  }

  const userWithName = resolvedName !== user.full_name ? { ...user, full_name: resolvedName } : user;

  // En web: no usamos FileSystem — devolver avatar_url directamente de Supabase
  if (Platform.OS === 'web') {
    if (userWithName.avatar_url && !isBrokenAvatarUrl(userWithName.avatar_url)) {
      return { ...userWithName, avatar_url: cacheBustAvatarUrl(userWithName.avatar_url) };
    }
    // Intentar recuperar del AsyncStorage (guardado como URL, no como file://)
    const stored = await AsyncStorage.getItem(`${AVATAR_CACHE_PREFIX}${userWithName.id}`);
    if (stored && stored.startsWith('http')) return { ...userWithName, avatar_url: stored };
    return userWithName;
  }

  const localAvatar = await getLocalAvatar(userWithName.id!);
  if (localAvatar && FileSystem.documentDirectory && localAvatar.startsWith(FileSystem.documentDirectory)) {
    return { ...userWithName, avatar_url: localAvatar };
  }
  if (localAvatar && isBrokenAvatarUrl(userWithName.avatar_url)) {
    return { ...userWithName, avatar_url: localAvatar };
  }
  if (userWithName.avatar_url && !isBrokenAvatarUrl(userWithName.avatar_url)) {
    await saveLocalAvatar(userWithName.id!, cacheBustAvatarUrl(userWithName.avatar_url));
    const savedAvatar = await getLocalAvatar(userWithName.id!);
    return { ...userWithName, avatar_url: savedAvatar || cacheBustAvatarUrl(userWithName.avatar_url) };
  }
  return userWithName;
};
