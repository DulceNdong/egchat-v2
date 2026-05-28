// ══════════════════════════════════════════════════════════════════
// API CLIENT — Conecta todo el proyecto a VITE_API_URL
// ══════════════════════════════════════════════════════════════════

// __API_URL__ se inyecta por Vite en tiempo de build (vite.config.ts → define)
// Esto garantiza que funcione en Android WebView donde import.meta.env puede ser undefined
declare const __API_URL__: string;

// Detecta si estamos corriendo dentro del emulador de Android Studio.
// En el emulador, el host de la máquina es accesible en 10.0.2.2.
// Señales: protocolo file: (Capacitor APK) + userAgent con Android.
const _isAndroidEmulator = (() => {
  try {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    // En Capacitor la app corre en https://localhost o capacitor://localhost
    const isCapacitor = window.location.hostname === 'localhost' ||
                        window.location.protocol === 'capacitor:';
    return isAndroid && isCapacitor;
  } catch { return false; }
})();

const BASE = (() => {
  // 1. Si estamos en el emulador de Android Studio y la URL inyectada apunta a localhost
  //    o a 10.0.2.2, usar 10.0.2.2 directamente (el emulador no puede resolver "localhost"
  //    del host — necesita la IP especial 10.0.2.2).
  try {
    if (typeof __API_URL__ !== 'undefined' && __API_URL__) {
      let u = __API_URL__.replace(/\/$/, '');
      // Si la URL apunta a localhost y estamos en el emulador, redirigir a 10.0.2.2
      if (_isAndroidEmulator && (u.includes('localhost') || u.includes('127.0.0.1'))) {
        u = u.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
      }
      return u.endsWith('/api') ? u : u + '/api';
    }
  } catch {}
  // 2. Variable de entorno Vite (funciona en web/dev)
  const url = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (url && !url.startsWith('/')) {
    let u = url.replace(/\/$/, '');
    if (_isAndroidEmulator && (u.includes('localhost') || u.includes('127.0.0.1'))) {
      u = u.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
    }
    return u.endsWith('/api') ? u : u + '/api';
  }
  // 3. Fallback: producción en Render
  return 'https://egchat-api.onrender.com/api';
})();

// ── Token JWT — usa la misma clave que el backend espera ──────────
const TOKEN_KEY = 'token';
const TOKEN_BACKUP_KEY = 'egchat_token_backup';

const getToken = () => {
  const primary = localStorage.getItem(TOKEN_KEY) || '';
  if (primary) return primary;
  const backup = localStorage.getItem(TOKEN_BACKUP_KEY) || '';
  if (backup) {
    // Restaurar automáticamente sesión si el token principal desaparece tras actualización.
    localStorage.setItem(TOKEN_KEY, backup);
    return backup;
  }
  return '';
};
const setToken = (t: string) => {
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(TOKEN_BACKUP_KEY, t);
};
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_BACKUP_KEY);
};

// ── Headers con token ─────────────────────────────────────────────
const getHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// ── Helper base con timeout y reintento para redes lentas (2G/3G) ────────────
async function request<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  
  // En Android WebView el token va SOLO en el header Authorization, nunca en la URL
  // (el query string con JWT causa "Failed to fetch" en algunos WebViews de Android)
  const url = `${BASE}${path}`;
  
  const headers = { ...getHeaders(), ...(options.headers as Record<string,string> || {}) };

  // Timeout adaptativo: GET = 20s, POST = 25s — redes móviles africanas pueden ser lentas
  const timeoutMs = method === 'GET' ? 20000 : 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers,
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      const err = await res.json().catch(() => ({ message: '' }));
      const message = err.message || 'No autorizado';
      // No cerrar sesión automáticamente aquí: en Android WebView algunos 401
      // transitorios provocan rebote inmediato al login.
      throw new Error(message);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Error ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Reintentar en caso de timeout o error de red (no en errores 4xx)
    const isNetworkError = err.name === 'AbortError' || err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed');
    if (isNetworkError && retries > 0) {
      // Backoff: 2s, 4s entre reintentos
      await new Promise(r => setTimeout(r, (3 - retries) * 2000));
      return request<T>(path, options, retries - 1);
    }
    throw err;
  }
}

const get  = <T>(path: string, headers?: Record<string,string>) => request<T>(path, { method:'GET', headers });
const post = <T>(path: string, body: unknown) => request<T>(path, { method:'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method:'PUT',  body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method:'PATCH', body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method:'DELETE' });

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{token:string; user:any}>('/auth/login', { phone, password });
    if (res.token) setToken(res.token);
    return res;
  },
  register: async (data: {full_name:string; phone:string; password:string; avatar_url?: string}) => {
    const res = await post<{token:string; user:any}>('/auth/register', data);
    if (res.token) setToken(res.token);
    return res;
  },
  logout: async () => {
    try {
      await post<void>('/auth/logout', {});
    } catch {}
    clearToken();
  },
  me: () => get<any>('/auth/me'),
  updateProfile: (data: {full_name?: string; avatar_url?: string}) => put<any>('/auth/profile', data),
  sendVerification: (phone: string, method: string = 'sms', platform?: string) => post<{sent:boolean; message?:string; code?:string}>('/auth/send-verification', { phone, method, platform }),
  verifyCode: (phone: string, code: string, platform?: string) => post<{verified:boolean; message?:string}>('/auth/verify-code', { phone, code, platform }),
  registerWindow: (data: {phone:string; full_name:string; verification_code:string; window_registration?: boolean}) => post<{token:string; user:any}>('/auth/register-window', data),
  registerSocial: (data: {phone:string; full_name:string; email:string; password:string; birthday:string; gender:string; region:string; security_question:string; security_answer:string; verification_code:string; platform:string}) => post<{token:string; user:any}>('/auth/register-social', data),
  sendSMS: (phone: string, message: string) => post<{success:boolean; message?:string}>('/auth/send-notification', { phone, message }),
  resetPassword: (phone: string, code: string, newPassword: string) =>
    post<{success:boolean; message?:string}>('/auth/reset-password', { phone, code, newPassword }),
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => !!getToken(),
};

// ══════════════════════════════════════════════════════════════════
// WALLET / MONEDERO
// ══════════════════════════════════════════════════════════════════
export const walletAPI = {
  getBalance:      () => get<{balance:number}>('/wallet/balance'),
  getTransactions: (page=1, limit=20) => get<{transactions:any[]; total:number}>(`/wallet/transactions?page=${page}&limit=${limit}`),
  deposit:         (amount:number, method:string, reference:string) => post<{balance:number; transaction:any}>('/wallet/deposit', { amount, method, reference }),
  withdraw:        (amount:number, method:string, destination:string) => post<{balance:number; transaction:any}>('/wallet/withdraw', { amount, method, destination }),
  transfer:        (to:string, amount:number, concept?:string) => post<{balance:number; transaction:any}>('/wallet/transfer', { to, amount, concept }),
  redeemCode:      (code:string) => post<{balance:number; amount:number; message:string}>('/wallet/recharge-code', { code }),
};

// ══════════════════════════════════════════════════════════════════
// MENSAJERÍA / CHAT - COMPLETO
// ══════════════════════════════════════════════════════════════════
export const chatAPI = {
  // Obtener todos los chats del usuario
  getChats: () => get<any[]>('/chats'),
  
  // Obtener mensajes de un chat específico
  getMessages: (chatId:string, page=1, limit=50) => 
    get<any[]>(`/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  
  // Enviar mensaje
  sendMessage: (chatId:string, data: {
    text?: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
    reply_to?: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    thumbnail_url?: string;
  }) => post<any>(`/chats/${chatId}/messages`, data),
  
  // Crear chat privado
  createPrivate: (participant_id?: string, phone?: string) => 
    post<any>('/chats/private', { participant_id, phone }),
  
  // Crear chat grupal
  createGroup: (name:string, participant_ids: string[], avatar_url?: string) => 
    post<any>('/chats/group', { name, participant_ids, avatar_url }),

  // Añadir miembros a grupo existente
  addGroupMembers: async (groupId: string, user_ids: string[]) => {
    // Add each member one by one using existing endpoint
    const results = await Promise.allSettled(
      user_ids.map(uid => post<any>(`/chats/${groupId}/participants`, { user_id: uid }))
    );
    return results;
  },
  
  // Obtener lista de participantes de un grupo
  getGroupParticipants: (chatId: string) =>
    get<any[]>(`/chats/${chatId}/participants`),
  
  // Guardar fondo de chat personalizado (individual por usuario)
  saveWallpaper: (chatId: string, wallpaperData: {
    wallpaper_type: 'default' | 'color' | 'gradient' | 'image' | 'pattern';
    wallpaper_value?: string;
    wallpaper_settings?: any;
  }) => post<any>(`/chats/${chatId}/wallpaper`, wallpaperData),
  
  // Obtener fondo de chat del usuario actual
  getWallpaper: (chatId: string) =>
    get<any>(`/chats/${chatId}/wallpaper`),
  
  // Marcar mensajes como leídos
  markAsRead: (chatId:string, message_id: string) => 
    post<any>(`/chats/${chatId}/read`, { message_id }),
  
  // Subir archivo — usa FormData para máxima compatibilidad con Android/iOS
  uploadFile: async (chatId: string, file: File) => {
    const token = getToken();
    // Usar FormData para compatibilidad con Android WebView (Capacitor)
    const formData = new FormData();
    formData.append('file', file, file.name);
    const res = await fetch(`${BASE}/chats/${chatId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir Content-Type — el browser lo pone automáticamente con el boundary correcto
      },
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  
  // Eliminar mensaje para todos (solo remitente)
  deleteMessage: (messageId:string) => del<void>(`/messages/${messageId}`),
  
  // Eliminar mensaje solo para mí
  deleteMessageForMe: (messageId:string) => del<void>(`/messages/${messageId}/for-me`),
  
  // Buscar usuarios para chat
  searchUsers: (query:string) => get<any[]>(`/contacts/search?q=${encodeURIComponent(query)}`),
  
  // Archivar chat
  archiveChat: (chatId:string) => put<void>(`/chats/${chatId}/archive`, {}),
  
  // Eliminar chat
  deleteChat: (chatId:string) => del<void>(`/chats/${chatId}`),

  // Favoritos de grupos/chats
  getFavoriteChats: () => get<any[]>('/chats/favorites'),
  favoriteChat:     (chatId:string) => post<any>(`/chats/${chatId}/favorite`, {}),
  unfavoriteChat:   (chatId:string) => del<any>(`/chats/${chatId}/favorite`),
};

// ══════════════════════════════════════════════════════════════════
// CONTACTOS
// ══════════════════════════════════════════════════════════════════
export const contactsAPI = {
  getAll:       () => get<any[]>('/contacts'),
  add:          (contact_user_id?: string, phone?: string, name?: string) => post<any>('/contacts', { contact_user_id, phone, nickname: name }),
  remove:       (id:string) => del<void>(`/contacts/${id}`),
  block:        (id:string) => post<any>(`/contacts/${id}/block`, {}),
  getFavorites: () => get<any[]>('/contacts/favorites'),
  favorite:     (id:string) => post<any>(`/contacts/${id}/favorite`, {}),
  unfavorite:   (id:string) => del<any>(`/contacts/${id}/favorite`),
};

// ══════════════════════════════════════════════════════════════════
// LIA-25 (Asistente IA)
// ══════════════════════════════════════════════════════════════════
export const liaAPI = {
  chat: (message:string, history?:{role:string;content:string}[]) =>
    post<{reply:string; action?:string; data?:any}>('/lia/chat', { message, history }),
  analyzeFile: async (file:File) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${BASE}/lia/analyze`, { method:'POST', body:fd });
    return res.json() as Promise<{analysis:string}>;
  },
  transcribeAudio: async (blob:Blob) => {
    const fd = new FormData(); fd.append('audio', blob, 'audio.webm');
    const res = await fetch(`${BASE}/lia/transcribe`, { method:'POST', body:fd });
    return res.json() as Promise<{text:string}>;
  },
};

// ══════════════════════════════════════════════════════════════════
// SERVICIOS PÚBLICOS
// ══════════════════════════════════════════════════════════════════
export const serviciosAPI = {
  // Electricidad SEGESA
  consultarFacturaElec: (contrato:string) => post<any>('/servicios/segesa/consultar', { contrato }),
  pagarElectricidad:    (contrato:string, importe:number, metodo:string) => post<any>('/servicios/segesa/pagar', { contrato, importe, metodo }),
  // Agua SNGE
  consultarFacturaAgua: (contrato:string) => post<any>('/servicios/snge/consultar', { contrato }),
  pagarAgua:            (contrato:string, importe:number, metodo:string) => post<any>('/servicios/snge/pagar', { contrato, importe, metodo }),
  // Impuestos DGI
  consultarImpuesto:    (nif:string, tipo:string) => post<any>('/servicios/dgi/consultar', { nif, tipo }),
  pagarImpuesto:        (nif:string, importe:number, referencia:string) => post<any>('/servicios/dgi/pagar', { nif, importe, referencia }),
  // Correos
  enviarPaquete:        (data:any) => post<any>('/servicios/correos/enviar', data),
};

// ══════════════════════════════════════════════════════════════════
// SUPERMERCADOS
// ══════════════════════════════════════════════════════════════════
export const superAPI = {
  getSupermarkets: (city?:string) => get<any[]>(`/supermarkets${city?`?city=${city}`:''}`),
  getProducts:     (smId:string, catId?:string) => get<any[]>(`/supermarkets/${smId}/products${catId?`?cat=${catId}`:''}`),
  createOrder:     (order:any) => post<{orderId:string; status:string}>('/supermarkets/orders', order),
  getOrders:       () => get<any[]>('/supermarkets/orders'),
  getOrderById:    (id:string) => get<any>(`/supermarkets/orders/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// SALUD
// ══════════════════════════════════════════════════════════════════
export const saludAPI = {
  getHospitals:   (city?:string) => get<any[]>(`/salud/hospitales${city?`?city=${city}`:''}`),
  getPharmacies:  (city?:string) => get<any[]>(`/salud/farmacias${city?`?city=${city}`:''}`),
  requestCita:    (data:any) => post<{citaId:string}>('/salud/citas', data),
  getMedicamentos:(query:string) => get<any[]>(`/salud/medicamentos?q=${encodeURIComponent(query)}`),
  orderMeds:      (order:any) => post<{orderId:string}>('/salud/medicamentos/pedido', order),
};

// ══════════════════════════════════════════════════════════════════
// TAXI
// ══════════════════════════════════════════════════════════════════
export const taxiAPI = {
  requestRide:    (origin:any, dest:any, type:string) => post<{rideId:string; driver:any; eta:number}>('/taxi/request', { origin, dest, type }),
  cancelRide:     (rideId:string) => post<void>(`/taxi/${rideId}/cancel`, {}),
  getRideStatus:  (rideId:string) => get<any>(`/taxi/${rideId}/status`),
  rateDriver:     (rideId:string, rating:number, comment?:string) => post<void>(`/taxi/${rideId}/rate`, { rating, comment }),
  getRides:       () => get<any[]>('/taxi/rides'),
};

export const cemacAPI = {
  getRates:       () => get<any>('/cemac/rates'),
  getTransfers:   () => get<any[]>('/cemac/transfers'),
  createTransfer: (data: any) => post<any>('/cemac/transfers', data),
};

// ══════════════════════════════════════════════════════════════════
// SEGUROS
// ══════════════════════════════════════════════════════════════════
export const segurosAPI = {
  getCompanies:   () => get<any[]>('/seguros/companias'),
  getProducts:    (companyId:string) => get<any[]>(`/seguros/companias/${companyId}/productos`),
  applyInsurance: (data:any) => post<{solicitudId:string}>('/seguros/solicitar', data),
  uploadDoc:      async (solicitudId:string, file:File, tipo:string) => {
    const fd = new FormData(); fd.append('file', file); fd.append('tipo', tipo);
    const res = await fetch(`${BASE}/seguros/solicitudes/${solicitudId}/documentos`, { method:'POST', body:fd });
    return res.json();
  },
};

// ══════════════════════════════════════════════════════════════════
// NOTICIAS
// ══════════════════════════════════════════════════════════════════
export const noticiasAPI = {
  getAll:      (cat?:string) => get<any[]>(`/noticias${cat?`?cat=${cat}`:''}`),
  getById:     (id:string) => get<any>(`/noticias/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ══════════════════════════════════════════════════════════════════
export const userAPI = {
  getProfile:     () => get<any>('/user/profile'),
  updateProfile:  (data:any) => put<any>('/user/profile', data),
  changePassword: (oldPassword:string, newPassword:string) => post<void>('/user/change-password', { oldPassword, newPassword }),
  uploadAvatar:   async (file:File) => {
    const fd = new FormData(); fd.append('avatar', file);
    const res = await fetch(`${BASE}/user/avatar`, {
      method:'POST', body:fd,
      headers: getToken() ? { Authorization:`Bearer ${getToken()}` } : {}
    });
    return res.json();
  },
  // Obtener perfiles actualizados de múltiples usuarios (para sincronizar avatares)
  getBatch: (ids: string[]) => post<any[]>('/users/batch', { ids }),
};

// ══════════════════════════════════════════════════════════════════
// ESPACIO DULCE — Canales y Comunidades
// ══════════════════════════════════════════════════════════════════
export const spacesAPI = {
  getAll:          () => get<any[]>('/spaces'),
  create:          (data: { name: string; description?: string; type: string; cover?: string; emoji?: string }) => post<any>('/spaces', data),
  follow:          (id: string) => post<any>(`/spaces/${id}/follow`, {}),
  getPosts:        (id: string, page = 1) => get<any[]>(`/spaces/${id}/posts?page=${page}`),
  createPost:      (id: string, text: string, image_url?: string) => post<any>(`/spaces/${id}/posts`, { text, image_url }),
  likePost:        (postId: string) => post<any>(`/spaces/posts/${postId}/like`, {}),
  getComments:     (postId: string) => get<any[]>(`/spaces/posts/${postId}/comments`),
  addComment:      (postId: string, text: string) => post<any>(`/spaces/posts/${postId}/comments`, { text }),
  deletePost:      (postId: string) => del<void>(`/spaces/posts/${postId}`),
};

// ══════════════════════════════════════════════════════════════════
// NOTICIAS GOBIERNO GE
// ══════════════════════════════════════════════════════════════════
export const noticiasGobAPI = {
  getAll: () => get<{ noticias: any[]; fromCache: boolean; updatedAt: number }>('/noticias/gobierno'),
};

// ══════════════════════════════════════════════════════════════════
// STORIES / ESTADOS
// ══════════════════════════════════════════════════════════════════
export const storiesAPI = {
  getAll: () => get<any[]>('/stories'),
  publish: (media: { type: string; content: string; bg: string; emoji?: string; music?: string; duration?: number }[]) =>
    post<any>('/stories', { media }),
  deleteAll: () => del<void>('/stories'),
  deleteSlide: (storyId: string, slideIdx: number) => del<any>(`/stories/${storyId}/slide/${slideIdx}`),
  updateSlide: (storyId: string, slideIdx: number, fields: { content?: string; bg?: string; emoji?: string; music?: string }) =>
    patch<any>(`/stories/${storyId}/slide/${slideIdx}`, fields),
  registerView: (storyId: string) => post<void>(`/stories/${storyId}/view`, {}),
};

// ══════════════════════════════════════════════════════════════════
// GROUP STORIES / ESTADOS DE GRUPOS
// ══════════════════════════════════════════════════════════════════
export const groupStoriesAPI = {
  // Obtener estados de todos los grupos del usuario
  getAll: () => get<any[]>('/stories/groups'),
  // Publicar estado en un grupo
  publish: (groupId: string, media: { type: string; content: string; bg: string; emoji?: string; music?: string }[]) =>
    post<any>(`/stories/groups/${groupId}`, { media }),
  // Registrar vista de los estados de un grupo
  registerView: (groupId: string) => post<void>(`/stories/groups/${groupId}/view`, {}),
};

// ══════════════════════════════════════════════════════════════════
// KEEP-ALIVE — ping cada 4 min para que Render no duerma
// ══════════════════════════════════════════════════════════════════
const keepAlive = () => {
  fetch(`${BASE.replace('/api', '')}/health`).catch(() => {});
};
setInterval(keepAlive, 4 * 60 * 1000); // cada 4 minutos
keepAlive(); // ping inmediato al cargar

// ══════════════════════════════════════════════════════════════════
// EXPORT DEFAULT — objeto con todos los módulos
// ══════════════════════════════════════════════════════════════════
export default {
  auth:     authAPI,
  wallet:   walletAPI,
  chat:     chatAPI,
  contacts: contactsAPI,
  lia:      liaAPI,
  servicios:serviciosAPI,
  super:    superAPI,
  salud:    saludAPI,
  taxi:     taxiAPI,
  cemac:    cemacAPI,
  seguros:  segurosAPI,
  noticias: noticiasAPI,
  user:     userAPI,
  stories:  storiesAPI,
  groupStories: groupStoriesAPI,
  spaces:   spacesAPI,
  BASE,
};
