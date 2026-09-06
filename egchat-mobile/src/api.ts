// ══════════════════════════════════════════════════════════════════
// EGCHAT Mobile API Client
// Idéntico al web pero adaptado a React Native
// ══════════════════════════════════════════════════════════════════
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SessionManager from './sessionManager';
import { saveLocalProfile, getLocalProfile } from './utils/profileEvents';

const BASE = (() => {
  const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!url) return 'https://egchat-api-xlxj.onrender.com';
  return url.replace(/\/$/, '');
})();

// ── Token seguro (SecureStore en nativo, localStorage en web) ──────
const TOKEN_KEY = 'egchat_token';
const sessionManager = SessionManager.getInstance();

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
};

export const setToken = async (t: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(TOKEN_KEY, t); return; } catch {}
  }
  try { await SecureStore.setItemAsync(TOKEN_KEY, t); } catch {}
};

export const clearToken = async (): Promise<void> => {
  // Limpiar en todos los storages posibles
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { localStorage.removeItem('egchat_session'); } catch {}
    try { sessionStorage.clear(); } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
  }
  try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {}
  try { await AsyncStorage.removeItem('egchat_token'); } catch {}
  try { await AsyncStorage.removeItem('egchat_session'); } catch {}
  try { await AsyncStorage.removeItem('token'); } catch {}
  try { await AsyncStorage.removeItem('user'); } catch {}
  await sessionManager.clearSession();
};

// ── Callback global para manejar 401 (se setea desde _layout.tsx) ─
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export const getApiBase = () => BASE;

/** Rutas de auth: un 401 es credencial incorrecta, no sesión expirada */
const AUTH_PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/check-phone',
  '/api/auth/reset-password',
  '/api/auth/verify-code',
  '/api/auth/send-verification',
];

const isAuthPublicPath = (path: string) =>
  AUTH_PUBLIC_PATHS.some(p => path.startsWith(p));

const CONNECTION_ERROR =
  'No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.';

function toFriendlyNetworkError(err: any): Error {
  if (
    err?.name === 'AbortError'
    || err?.name === 'TypeError'
    || String(err?.message || '').toLowerCase().includes('network')
    || String(err?.message || '').toLowerCase().includes('fetch')
  ) {
    return new Error(CONNECTION_ERROR);
  }
  return err instanceof Error ? err : new Error(String(err?.message || CONNECTION_ERROR));
}

/** Despierta Render (plan gratis) antes de login — evita timeout en el primer intento */
export async function wakeServer(maxAttempts = 3): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(`${BASE}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
  }
  return false;
}

const STORIES_STORAGE_KEY = 'egchat_local_stories_v1';

async function readLocalStories(): Promise<any[]> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const raw = window.localStorage.getItem(STORIES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    const raw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLocalStories(stories: any[]): Promise<void> {
  try {
    const payload = JSON.stringify(stories);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORIES_STORAGE_KEY, payload);
      }
      return;
    }
    await AsyncStorage.setItem(STORIES_STORAGE_KEY, payload);
  } catch {}
}

async function getLocalUser() {
  try {
    const cached = await sessionManager.getUser();
    if (cached?.id) return cached;
  } catch {}
  return { id: 'local-user', full_name: 'Yo', avatar_url: '' };
}

const getRequestBases = () => {
  const bases = [BASE];
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      bases.push(`http://${host}:5000`);
    }
  }
  return Array.from(new Set(bases.map(base => base.replace(/\/$/, '')).filter(Boolean)));
};

// ── Cliente HTTP base con timeout y reintentos ────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const token = await getToken();
  const method = (options.method || 'GET').toUpperCase();

  const isNgrok = BASE.includes('ngrok');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Render gratis puede tardar ~30–50 s al despertar
  const timeoutMs = method === 'GET' ? 60000 : 60000;
  try {
    let res: Response | null = null;
    let lastNetworkError: any = null;
    for (const base of getRequestBases()) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        res = await fetch(`${base}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        break;
      } catch (e: any) {
        clearTimeout(timeoutId);
        lastNetworkError = e;
        res = null;
      }
    }

    if (!res) throw lastNetworkError || new Error(CONNECTION_ERROR);

    if (res.status === 401) {
      const err = await res.json().catch(() => ({ message: 'No autorizado' }));
      const message = err.message || 'No autorizado';
      // Login/registro: devolver mensaje real (ej. credenciales incorrectas)
      if (isAuthPublicPath(path)) {
        throw new Error(message);
      }
      // Para rutas protegidas, verificar que el token realmente es inválido
      // antes de desconectar. Render en plan gratis puede devolver 401 transitorio
      // mientras el servidor se despierta (cold start). Solo desconectar si el
      // mensaje indica explícitamente que el token es inválido o no existe.
      const isReallyInvalid =
        message.toLowerCase().includes('inválido') ||
        message.toLowerCase().includes('invalido') ||
        message.toLowerCase().includes('expirado') ||
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('no token') ||
        message.toLowerCase().includes('token not') ||
        message.toLowerCase().includes('unauthorized');

      if (isReallyInvalid) {
        await clearToken();
        onUnauthorized?.();
        throw new Error('Sesión expirada. Inicia sesión de nuevo.');
      }

      // 401 ambiguo (servidor Render despertando, etc.) → lanzar error sin desconectar
      throw new Error(message || 'No autorizado');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Error ${res.status}`);
    }

    return res.json();
  } catch (err: any) {
    const isNetwork = err.name === 'AbortError'
      || err.name === 'TypeError'
      || err.message?.includes('fetch')
      || err.message?.includes('Network');
    if (isNetwork && retries > 0) {
      await new Promise(r => setTimeout(r, (4 - retries) * 2000));
      return request<T>(path, options, retries - 1);
    }
    throw toFriendlyNetworkError(err);
  }
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ── apiFetch: acceso público a request() para pantallas nativas ───
export const apiFetch = <T = any>(path: string, options: RequestInit = {}): Promise<T> =>
  request<T>(path, options);

// ══════════════════════════════════════════════════════════════════
// AUTH — idéntico al web
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; user: any }>('/api/auth/login', { phone, password });
    if (res.token) {
      await setToken(res.token);
      const user = { ...res.user };
      const isGeneric = !user.full_name || user.full_name === 'Usuario EGCHAT' || user.full_name.startsWith('Usuario ');
      if (!isGeneric) {
        // Nombre real recibido del servidor → persistirlo para uso offline futuro
        await saveLocalProfile(user.id, user.full_name);
      } else {
        // Nombre genérico → intentar recuperar el nombre real guardado previamente
        const cachedName = await getLocalProfile(user.id);
        if (cachedName) {
          user.full_name = cachedName;
        } else {
          // Último recurso: recuperar de sessionManager
          const cachedUser = await sessionManager.getUser();
          const prevName = cachedUser?.full_name;
          if (prevName && prevName !== 'Usuario EGCHAT' && !prevName.startsWith('Usuario ')) {
            user.full_name = prevName;
            user.avatar_url = user.avatar_url || cachedUser?.avatar_url;
          }
        }
      }
      await sessionManager.saveSession(user, res.token);
      res.user = user;
    }
    return res;
  },

  register: async (data: {
    full_name: string;
    phone: string;
    password: string;
    avatar_url?: string;
  }) => {
    const res = await post<{ token: string; user: any }>('/api/auth/register', data);
    if (res.token) {
      await setToken(res.token);
      await sessionManager.saveSession(res.user, res.token);
    }
    return res;
  },

  logout: async () => {
    try { await post('/api/auth/logout', {}); } catch {}
    await clearToken();
  },

  me: async () => {
    try {
      const serverUser = await get<any>('/api/auth/me');
      const token = await getToken();

      // Siempre intentar recuperar nombre y avatar reales de la caché local
      // si el servidor devuelve nombre genérico (Supabase sin cuota, usuario nuevo, etc.)
      const isGenericName = !serverUser?.full_name || 
        serverUser.full_name === 'Usuario EGCHAT' || 
        serverUser.full_name.startsWith('Usuario +') ||
        serverUser.full_name.startsWith('Usuario ');

      if (isGenericName || serverUser?._offline) {
        const cached = await sessionManager.getUser();
        const cachedNameFromProfile = serverUser?.id ? await getLocalProfile(serverUser.id) : null;

        const isRealName = (n?: string | null) =>
          !!n && n !== 'Usuario EGCHAT' && !n.startsWith('Usuario +') && !n.startsWith('Usuario ');

        // Prioridad: 1) perfil local (AsyncStorage), 2) sesión guardada, 3) nombre del servidor (genérico)
        const realName =
          (isRealName(cachedNameFromProfile) ? cachedNameFromProfile : null) ||
          (isRealName(cached?.full_name) ? cached!.full_name : null) ||
          serverUser.full_name;

        const merged = {
          ...cached,
          ...serverUser,
          full_name: realName,
          // Siempre usar phone e id del servidor si están disponibles
          phone: serverUser.phone || cached?.phone,
          id: serverUser.id || cached?.id,
          // Preferir avatar del servidor si es válido, si no usar el cacheado
          avatar_url: serverUser.avatar_url || cached?.avatar_url,
        };

        if (token) await sessionManager.saveSession(merged, token);
        return merged;
      }

      // Si recibimos nombre real del servidor, guardarlo en caché local
      if (serverUser?.id && serverUser.full_name) {
        await saveLocalProfile(serverUser.id, serverUser.full_name);
      }

      // Siempre fusionar con caché para preservar campos que el servidor podría omitir
      const cachedSession = await sessionManager.getUser();
      const finalUser = {
        ...cachedSession,
        ...serverUser,
        phone: serverUser.phone || cachedSession?.phone,
        id: serverUser.id || cachedSession?.id,
      };

      if (token) await sessionManager.saveSession(finalUser, token);
      return finalUser;
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();

      // Solo desconectar si el servidor devolvió explícitamente que el usuario
      // no existe Y el token es inválido — no por errores de red o Supabase caído
      const isHardAuthError =
        (msg.includes('usuario no encontrado') || msg.includes('user not found')) &&
        !msg.includes('network') &&
        !msg.includes('fetch') &&
        !msg.includes('conexión') &&
        !msg.includes('timeout') &&
        !msg.includes('abort');

      if (isHardAuthError) {
        // Antes de desconectar, comprobar si tenemos sesión en caché válida
        const cached = await sessionManager.getUser();
        if (cached?.id) {
          console.warn('[authAPI.me] Usuario no encontrado en servidor pero hay caché válida — usando caché');
          return cached;
        }
        await clearToken();
        onUnauthorized?.();
        throw err;
      }

      // Cualquier otro error (red, Supabase caído, timeout) → usar caché
      const cached = await sessionManager.getUser();
      if (cached) return cached;
      throw err;
    }
  },

  updateProfile: (data: { full_name?: string; avatar_url?: string }) =>
    put<any>('/api/auth/profile', data),

  sendVerification: (phone: string) =>
    post<{ sent: boolean; message?: string }>('/api/auth/send-verification', { phone }),

  verifyCode: (phone: string, code: string) =>
    post<{ verified: boolean; message?: string }>('/api/auth/verify-code', { phone, code }),

  resetPassword: (phone: string, code: string, newPassword: string) =>
    post<{ success: boolean; message?: string }>('/api/auth/reset-password', { phone, code, newPassword }),

  verifyPin: (pin: string) =>
    post<{ valid: boolean; message?: string }>('/api/auth/verify-pin', { pin }),

  setupPin: (pin: string) =>
    post<{ success: boolean; message?: string }>('/api/auth/setup-pin', { pin }),

  hasPinConfigured: () =>
    get<{ hasPin: boolean }>('/api/auth/has-pin'),

  checkPhone: (phone: string) =>
    post<{ exists: boolean }>('/api/auth/check-phone', { phone }),

  isAuthenticated: async () => !!(await getToken()),
};

// ══════════════════════════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════════════════════════
export const chatAPI = {
  getChats: () => get<any[]>('/api/chats'),
  getMessages: (chatId: string, page = 1, limit = 50) =>
    get<any[]>(`/api/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (chatId: string, data: {
    text?: string;
    type?: string;
    reply_to?: string;
    file_url?: string;
    album_urls?: string[];
    forwarded_from?: string;
  }) => post<any>(`/api/chats/${chatId}/messages`, data),
  createPrivate: (participant_id?: string, phone?: string) =>
    post<any>('/api/chats/private', { participant_id, phone }),
  createGroup: (name: string, participant_ids: string[], avatar_url?: string) =>
    post<any>('/api/chats/group', { name, participant_ids, avatar_url }),
  markAsRead: (chatId: string, message_id: string) =>
    post<any>(`/api/chats/${chatId}/read`, { message_id }),
  searchUsers: (query: string) =>
    get<any[]>(`/api/contacts/search?q=${encodeURIComponent(query)}`),
  deleteMessage: (messageId: string) => del<void>(`/api/messages/${messageId}`),
  deleteMessageForMe: (messageId: string) => del<void>(`/api/messages/${messageId}/for-me`),
  sendTyping: (chatId: string) => post<void>(`/api/chats/${chatId}/typing`, {}),
  stopTyping: (chatId: string) => del<void>(`/api/chats/${chatId}/typing`),

  uploadFile: async (chatId: string, uri: string, fileName: string, mimeType: string) => {
    const token = await getToken();
    const formData = new FormData();

    // En web (blob: o http: local), necesitamos obtener el blob real
    if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: mimeType });
        formData.append('file', file, fileName);
      } catch {
        // Fallback: adjuntar como blob directo
        formData.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
      }
    } else {
      // Nativo: usar el objeto {uri, name, type} que React Native entiende
      formData.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`${BASE}/api/chats/${chatId}/upload`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 401) {
        await clearToken();
        onUnauthorized?.();
        throw new Error('Sesión expirada');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Error ${res.status}`);
      }
      return res.json() as Promise<{ file_url: string }>;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  },
};

// ══════════════════════════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════════════════════════
export const walletAPI = {
  getBalance: () => get<{ balance: number; currency: string }>('/api/wallet/balance'),
  getTransactions: (page = 1) =>
    get<{ transactions: any[]; total: number }>(`/api/wallet/transactions?page=${page}&limit=20`),
  deposit: (amount: number, method: string, reference: string) =>
    post<any>('/api/wallet/deposit', { amount, method, reference }),
  withdraw: (amount: number, method: string, destination: string) =>
    post<any>('/api/wallet/withdraw', { amount, method, destination }),
  transfer: (to: string, amount: number, concept?: string) =>
    post<any>('/api/wallet/transfer', { to, amount, concept }),
  redeemCode: (code: string) =>
    post<any>('/api/wallet/recharge-code', { code }),
};

// ══════════════════════════════════════════════════════════════════
// CONTACTOS
// ══════════════════════════════════════════════════════════════════
export const contactsAPI = {
  getAll: () => get<any[]>('/api/contacts'),
  getFavorites: () => get<any[]>('/api/contacts/favorites'),
  favorite: (contactId: string) => post<any>(`/api/contacts/${contactId}/favorite`, {}),
  unfavorite: (contactId: string) => del<void>(`/api/contacts/${contactId}/favorite`),
  add: (contact_user_id?: string, phone?: string, name?: string) =>
    post<any>('/api/contacts', { contact_user_id, phone, nickname: name }),
  /** Eliminar por ID de fila (tabla contacts) */
  remove: (id: string) => del<void>(`/api/contacts/${id}`),
  /**
   * Eliminar contacto desde el chat usando el user_id del otro participante.
   * Primero busca el registro en contacts y luego lo elimina.
   * Devuelve true si se eliminó, false si no estaba en contactos.
   */
  removeByUserId: async (targetUserId: string): Promise<boolean> => {
    try {
      const contacts = await get<any[]>('/api/contacts');
      const entry = contacts?.find(
        (c: any) => (c.contact_user_id || c.user?.id || c.id) === targetUserId
      );
      if (!entry) return false;
      const rowId = entry.id;
      await del<void>(`/api/contacts/${rowId}`);
      return true;
    } catch {
      return false;
    }
  },
};

// ══════════════════════════════════════════════════════════════════
// LLAMADAS (señalización WebRTC)
// ══════════════════════════════════════════════════════════════════
export const callAPI = {
  offer: (data: { callId: string; offer: object; targetUserId: string; type: string; groupId?: string }) =>
    post<{ ok: boolean }>('/api/call/offer', data),
  answer: (data: { callId: string; answer: object }) =>
    post<{ ok: boolean }>('/api/call/answer', data),
  get: (callId: string) => get<any>(`/api/call/${callId}`),
  end: (callId: string) => del<{ ok: boolean }>(`/api/call/${callId}`),
  incoming: (userId: string) => get<any[]>(`/api/call/incoming/${userId}`),
  ice: (data: { callId: string; candidate: object; role: string; targetUserId?: string }) =>
    post<{ ok: boolean }>('/api/call/ice', data),
  /**
   * Envía un VoIP push al destinatario para despertarlo y mostrar
   * la UI de llamada entrante nativa (CallKit en iOS, notificación en Android).
   * Llamar esto ANTES de enviar el offer WebRTC para que la app esté lista.
   */
  sendVoipPush: (data: {
    targetUserId: string;
    callId: string;
    callerName?: string;
    callType: 'audio' | 'video';
    offer?: object;
  }) => post<{ voipPushSent: boolean; expoPushSent: boolean }>('/api/push/voip-call', data),
};

// ══════════════════════════════════════════════════════════════════
// LIA-25
// ══════════════════════════════════════════════════════════════════
export const liaAPI = {
  chat: (message: string, history?: any[]) =>
    post<{ reply: string }>('/api/lia/chat', { message, history }),
};

// ══════════════════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════════════════
export const userAPI = {
  getProfile: () => get<any>('/api/user/profile'),
  updateProfile: (data: any) => put<any>('/api/user/profile', data),
};

// Keep-alive para Render — solo se activa cuando el usuario está autenticado
// NO se ejecuta al importar el módulo
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
export function startKeepAlive() {
  if (keepAliveInterval) return;
  const ping = async () => {
    try { await fetch(`${BASE}/health`, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined }); } catch {}
  };
  keepAliveInterval = setInterval(ping, 90 * 1000);
}
export function stopKeepAlive() {
  if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
}

// ══════════════════════════════════════════════════════════════════
// STORIES
// ══════════════════════════════════════════════════════════════════
const buildLocalStory = async (data: { media: Array<{ url: string; type?: string; caption?: string }> | string; type?: string }, fallbackUser?: any) => {
  const user = fallbackUser || await getLocalUser();
  const media = Array.isArray(data.media)
    ? data.media.map((item: any) => typeof item === 'string' ? { url: item, type: data.type || 'image' } : item)
    : [{ url: String(data.media), type: data.type || 'image' }];

  const story = {
    id: `local-${Date.now()}`,
    userId: user.id || 'local-user',
    userName: user.full_name || 'Mi estado',
    avatarUrl: user.avatar_url || '',
    media,
    views: 0,
    reactions: [],
    replies: [],
    seen: false,
    publishedAt: Date.now(),
    expiresAt: Date.now() + 24 * 3600 * 1000,
    isMe: true,
  };

  const next = [story, ...(await readLocalStories())].slice(0, 20);
  await writeLocalStories(next);
  return story;
};

export const storiesAPI = {
  getAll: async () => {
    try {
      const remote = await get<any[]>('/api/stories');
      if (Array.isArray(remote) && remote.length > 0) {
        await writeLocalStories(remote);
        return remote;
      }
      const local = await readLocalStories();
      return local.length > 0 ? local : [];
    } catch {
      return readLocalStories();
    }
  },
  create: async (data: { media: Array<{ url: string; type?: string; caption?: string }> | string; type?: string }) => {
    try {
      const remote = await post<any>('/api/stories', data);
      if (remote && (remote.id || remote.media)) {
        const user = await getLocalUser();
        const story = {
          id: remote.id || `local-${Date.now()}`,
          userId: user.id || 'local-user',
          userName: user.full_name || 'Mi estado',
          avatarUrl: user.avatar_url || '',
          media: remote.media || (Array.isArray(data.media) ? data.media : [{ url: String(data.media), type: data.type || 'image' }]),
          views: 0,
          reactions: [],
          replies: [],
          seen: false,
          publishedAt: Date.now(),
          expiresAt: Date.now() + 24 * 3600 * 1000,
          isMe: true,
        };
        const next = [story, ...(await readLocalStories())].slice(0, 20);
        await writeLocalStories(next);
        return story;
      }
      return remote;
    } catch {
      return buildLocalStory(data);
    }
  },
  delete: async (id: string) => {
    try {
      return await del<void>(`/api/stories/${id}`);
    } catch {
      const stories = (await readLocalStories()).filter((s: any) => s.id !== id);
      await writeLocalStories(stories);
      return;
    }
  },
  registerView: async (storyId: string) => {
    try {
      return await post<void>(`/api/stories/${storyId}/view`, {});
    } catch {
      const stories = await readLocalStories();
      const next = stories.map((s: any) => s.id === storyId ? { ...s, views: (s.views || 0) + 1, seen: true } : s);
      await writeLocalStories(next);
      return;
    }
  },
  reply: async (storyId: string, text: string) => {
    try {
      return await post<any>(`/api/stories/${storyId}/reply`, { text });
    } catch {
      const stories = await readLocalStories();
      const next = stories.map((s: any) => s.id === storyId ? {
        ...s,
        replies: [...(s.replies || []), {
          id: `local-reply-${Date.now()}`,
          storyId,
          text,
          createdAt: new Date().toISOString(),
        }],
      } : s);
      await writeLocalStories(next);
      return { ok: true, replies: next.find((s: any) => s.id === storyId)?.replies || [] };
    }
  },
  // D3 — reaccionar a una story
  react: async (storyId: string, emoji: string) => {
    try {
      return await post<void>(`/api/stories/${storyId}/react`, { emoji });
    } catch { /* silencioso — reacción optimista */ }
  },
};

export const cemacAPI = {
  getRates: () => get<any>('/api/cemac/rates'),
  getTransfers: () => get<any[]>('/api/cemac/transfers'),
  createTransfer: (data: {
    from_country: string;
    to_country: string;
    beneficiary_name: string;
    beneficiary_account: string;
    amount: number;
    external_id?: string;
  }) => post<any>('/api/cemac/transfers', data),
};

// ══════════════════════════════════════════════════════════════════
// SERVICIOS (electricidad, agua, etc.)
// ══════════════════════════════════════════════════════════════════
export const serviciosAPI = {
  consultarFacturaElec: (contrato: string) =>
    post<any>('/api/servicios/segesa/consultar', { contrato }),
  pagarElectricidad: (contrato: string, amount: number, method: string) =>
    post<any>('/api/servicios/segesa/pagar', { contrato, importe: amount, metodo: method }),
  consultarFacturaAgua: (contrato: string) =>
    post<any>('/api/servicios/snge/consultar', { contrato }),
  pagarAgua: (contrato: string, amount: number, method: string) =>
    post<any>('/api/servicios/snge/pagar', { contrato, importe: amount, metodo: method }),
  consultarDGI: (nif: string) =>
    post<any>('/api/servicios/dgi/consultar', { nif }),
  pagarDGI: (nif: string, amount: number, referencia: string) =>
    post<any>('/api/servicios/dgi/pagar', { nif, importe: amount, referencia }),
  enviarPaquete: (data: any) =>
    post<any>('/api/servicios/correos/enviar', data),
};

export const superAPI = {
  getSupermarkets: (city?: string) => get<any[]>(`/supermarkets${city ? `?city=${city}` : ''}`),
  getProducts: (smId: string, catId?: string) => get<any[]>(`/supermarkets/${smId}/products${catId ? `?cat=${catId}` : ''}`),
  createOrder: (order: any) => post<{ orderId: string; status: string; total?: number }>('/supermarkets/orders', order),
  getOrders: () => get<any[]>('/supermarkets/orders'),
  getOrderById: (id: string) => get<any>(`/supermarkets/orders/${id}`),
};

export const saludAPI = {
  getHospitals: (city?: string) => get<any[]>(`/salud/hospitales${city ? `?city=${city}` : ''}`),
  getPharmacies: (city?: string) => get<any[]>(`/salud/farmacias${city ? `?city=${city}` : ''}`),
  requestCita: (data: any) => post<{ citaId: string }>('/salud/citas', data),
  getMedicamentos: (query: string) => get<any[]>(`/salud/medicamentos?q=${encodeURIComponent(query)}`),
  orderMeds: (order: any) => post<{ orderId: string }>('/salud/medicamentos/pedido', order),
};

// ══════════════════════════════════════════════════════════════════
// TAXI
// ══════════════════════════════════════════════════════════════════
export const taxiAPI = {
  /** Solicitar viaje */
  requestRide: (
    origin: { address: string; lat?: number; lng?: number },
    destination: { address: string; lat?: number; lng?: number },
    rideType: string,
    paymentMethod: 'wallet' | 'cash' | 'card' = 'wallet',
  ) => post<{
    rideId: string; driver: any; eta: number; tarifa: number;
    distanceKm: number; type: string; status: string; paymentMethod: string;
  }>('/api/taxi/request', {
    origin:        origin.address,
    dest:          destination.address,
    type:          rideType,
    paymentMethod,
    originLat:     origin.lat,
    originLng:     origin.lng,
    destLat:       destination.lat,
    destLng:       destination.lng,
  }),

  /** Cancelar viaje */
  cancelRide: (rideId: string) =>
    post<{ message: string }>(`/api/taxi/${rideId}/cancel`, {}),

  /** Estado del viaje (polling) */
  getRideStatus: (rideId: string) =>
    get<{
      rideId: string; status: string; eta: number; distanceKm: number;
      fare: number; driver: any; driver_location: { lat: number; lng: number };
      paymentMethod: string;
    }>(`/api/taxi/${rideId}/status`),

  /** Valorar conductor */
  rateDriver: (rideId: string, rating: number, comment?: string) =>
    post<{ message: string; rating: number }>(`/api/taxi/${rideId}/rate`, { rating, comment }),

  /** Historial de viajes */
  getRides: (page = 1, limit = 20) =>
    get<any[]>(`/api/taxi/rides?page=${page}&limit=${limit}`),

  /** Estimación de precio sin pedir viaje */
  estimateFare: (
    rideType: string,
    origin: { lat?: number; lng?: number },
    dest: { lat?: number; lng?: number },
    distanceKm?: number,
  ) => post<{ tarifa: number; distanceKm: number; eta: number; currency: string }>(
    '/api/taxi/estimate',
    {
      type: rideType,
      originLat: origin.lat, originLng: origin.lng,
      destLat: dest.lat,     destLng: dest.lng,
      distanceKm,
    },
  ),

  /** Registro de nuevo conductor */
  registerDriver: (data: {
    name: string;
    phone: string;
    license?: string;
    vehicle: {
      brand?: string;
      model?: string;
      year?: string;
      color?: string;
      plate: string;
      type?: string;
    };
  }) => post<{ message: string; driverId: string; status: string }>(
    '/api/taxi/drivers/register',
    data,
  ),

  /** Estado del perfil de conductor del usuario actual */
  getDriverProfile: () =>
    get<{
      id: string; name: string; status: 'pending' | 'approved' | 'rejected' | 'suspended';
      rating: number; trips: number; vehicle: any;
    }>('/api/taxi/drivers/me'),

  /** Activar/desactivar disponibilidad del conductor */
  setDriverAvailability: (available: boolean) =>
    post<{ message: string; available: boolean }>(
      '/api/taxi/drivers/availability',
      { available },
    ),
};
