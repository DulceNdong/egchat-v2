import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';

const KEY = 'egchat_chat_wallpapers';

// El catálogo de fondos vive en el teléfono (src/data/chatWallpapers) y el fondo
// propio es una URI del carrete. El backend solo admite default/image/color, así
// que la forma del id decide el tipo: una URI va como imagen y cualquier id del
// catálogo va como color.
function aBackend(wallpaperId: string): { wallpaper_type: string; wallpaper_value: string | null } {
  if (wallpaperId === 'default') return { wallpaper_type: 'default', wallpaper_value: null };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(wallpaperId) || wallpaperId.startsWith('/')) {
    return { wallpaper_type: 'image', wallpaper_value: wallpaperId };
  }
  return { wallpaper_type: 'color', wallpaper_value: wallpaperId };
}

async function leerMapa(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  } catch {
    return {};
  }
}

async function escribirMapa(chatId: string, wallpaperId: string): Promise<void> {
  try {
    const map = await leerMapa();
    map[chatId] = wallpaperId;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch { /* el fondo sigue valiendo en esta sesión */ }
}

export async function getChatWallpaperId(chatId: string): Promise<string> {
  const map = await leerMapa();
  return map[chatId] ?? 'default';
}

export async function setChatWallpaperId(chatId: string, wallpaperId: string): Promise<void> {
  await escribirMapa(chatId, wallpaperId);
  try {
    const token = await getToken();
    const base = getApiBase();
    await fetch(`${base}/api/chats/${chatId}/wallpaper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(aBackend(wallpaperId)),
    });
  } catch { /* sin conexión: queda el fondo local y se subirá al volver */ }
}

// Se llama justo después de la lectura local. El servidor manda sobre el teléfono
// porque es el que comparte el fondo entre dispositivos, salvo en el caso antiguo:
// quien eligió un fondo antes de que esto existiera solo lo tiene guardado aquí, y
// el servidor contesta «default» tanto si no hay fila como si alguien lo puso a
// cero. Si el teléfono tiene entrada y el servidor dice default, se sube el local.
export async function sincronizarWallpaper(chatId: string, localId: string): Promise<string | null> {
  try {
    const token = await getToken();
    const base = getApiBase();
    const res = await fetch(`${base}/api/chats/${chatId}/wallpaper`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const fila = await res.json();
    const tipo = fila?.wallpaper_type;
    if (typeof tipo !== 'string') return null;
    const remoto = tipo === 'default'
      ? 'default'
      : (typeof fila?.wallpaper_value === 'string' && fila.wallpaper_value ? fila.wallpaper_value : null);
    if (!remoto) return null;
    if (remoto === localId) return null;

    const tieneEntradaLocal = Object.prototype.hasOwnProperty.call(await leerMapa(), chatId);
    if (tieneEntradaLocal && remoto === 'default' && localId !== 'default') {
      await setChatWallpaperId(chatId, localId);
      return null;
    }
    await escribirMapa(chatId, remoto);
    return remoto;
  } catch {
    return null;
  }
}
