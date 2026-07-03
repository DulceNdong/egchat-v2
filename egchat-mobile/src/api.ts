// ══════════════════════════════════════════════════════════════════
// EGCHAT Mobile API Client
// Idéntico al web pero adaptado a React Native
// ══════════════════════════════════════════════════════════════════
import * as SecureStore from 'expo-secure-store';
import SessionManager from './sessionManager';

const BASE = (() => {
  const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!url) return 'https://egchat-api.onrender.com';
  return url.replace(/\/$/, '');
})();

// ── Token seguro (SecureStore en nativo, localStorage en web) ──────
const TOKEN_KEY = 'egchat_token';
const sessionManager = SessionManager.getInstance();

import { Platform } from 'react-native';

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
  }
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

// ── Cliente HTTP base con timeout y reintentos ────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const token = await getToken();
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Render gratis puede tardar ~30–50 s al despertar
  const timeoutMs = method === 'GET' ? 25000 : 40000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      const err = await res.json().catch(() => ({ message: 'No autorizado' }));
      const message = err.message || 'No autorizado';
      // Login/registro: devolver mensaje real (ej. credenciales incorrectas)
      if (isAuthPublicPath(path)) {
        throw new Error(message);
      }
      await clearToken();
      onUnauthorized?.();
      throw new Error('Sesión expirada. Inicia sesión de nuevo.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Error ${res.status}`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
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

// ══════════════════════════════════════════════════════════════════
// AUTH — idéntico al web
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; user: any }>('/api/auth/login', { phone, password });
    if (res.token) {
      await setToken(res.token);
      await sessionManager.saveSession(res.user, res.token);
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
      const user = await get<any>('/api/auth/me');
      const token = await getToken();
      if (token) await sessionManager.saveSession(user, token);
      return user;
    } catch (err) {
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
    formData.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
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
  remove: (id: string) => del<void>(`/api/contacts/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// LLAMADAS (señalización WebRTC)
// ══════════════════════════════════════════════════════════════════
export const callAPI = {
  offer: (data: { callId: string; offer: object; targetUserId: string; type: string }) =>
    post<{ ok: boolean }>('/api/call/offer', data),
  answer: (data: { callId: string; answer: object }) =>
    post<{ ok: boolean }>('/api/call/answer', data),
  get: (callId: string) => get<any>(`/api/call/${callId}`),
  end: (callId: string) => del<{ ok: boolean }>(`/api/call/${callId}`),
  incoming: (userId: string) => get<any[]>(`/api/call/incoming/${userId}`),
  ice: (data: { callId: string; candidate: object; role: string }) =>
    post<{ ok: boolean }>('/api/call/ice', data),
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

// Keep-alive agresivo para que Render no duerma nunca (plan gratuito duerme a los 15 min)
const keepAlive = async () => {
  try { await fetch(`${BASE}/health`, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined }); } catch {}
};
// Cada 90 segundos — muy por debajo del límite de 15 min de Render
setInterval(keepAlive, 90 * 1000);
// También al iniciar por si el servidor estaba dormido
keepAlive();

// ══════════════════════════════════════════════════════════════════
// STORIES
// ══════════════════════════════════════════════════════════════════
export const storiesAPI = {
  getAll: () => get<any[]>('/api/stories'),
  create: (data: { media: Array<{ url: string; type?: string; caption?: string }> | string; type?: string }) =>
    post<any>('/api/stories', data),
  delete: (id: string) => del<void>(`/api/stories/${id}`),
  registerView: (storyId: string) => post<void>(`/api/stories/${storyId}/view`, {}),
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
  requestRide: (
    origin: { address: string; lat?: number; lng?: number },
    destination: { address: string; lat?: number; lng?: number },
    rideType: string
  ) => post<any>('/api/taxi/request', {
    origin: origin.address,
    dest: destination.address,
    type: rideType,
  }),
  cancelRide: (rideId: string) => post<any>(`/api/taxi/${rideId}/cancel`, {}),
  getRideStatus: (rideId: string) => get<any>(`/api/taxi/${rideId}/status`),
  rateDriver: (rideId: string, rating: number) =>
    post<any>(`/api/taxi/${rideId}/rate`, { rating }),
};
