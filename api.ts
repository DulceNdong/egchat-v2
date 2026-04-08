// ══════════════════════════════════════════════════════════════════
// API CLIENT — Conecta todo el proyecto a VITE_API_URL
// ══════════════════════════════════════════════════════════════════

const BASE = (import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com';

// ── Token JWT — usa la misma clave que el backend espera ──────────
const getToken = () => localStorage.getItem('token') || '';
const setToken = (t: string) => localStorage.setItem('token', t);
const clearToken = () => localStorage.removeItem('token');

// ── Headers con token ─────────────────────────────────────────────
const getHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Helper base ───────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...getHeaders(), ...(options.headers as Record<string,string> || {}) },
    ...options,
  });
  if (res.status === 401) { clearToken(); throw new Error('Sesión expirada'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

const get  = <T>(path: string, headers?: Record<string,string>) => request<T>(path, { method:'GET', headers });
const post = <T>(path: string, body: unknown) => request<T>(path, { method:'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method:'PUT',  body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method:'DELETE' });

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{token:string; user:any}>('/api/auth/login', { phone, password });
    if (res.token) setToken(res.token);
    return res;
  },
  register: async (data: {full_name:string; phone:string; password:string}) => {
    const res = await post<{token:string; user:any}>('/api/auth/register', data);
    if (res.token) setToken(res.token);
    return res;
  },
  logout: async () => { clearToken(); return post<void>('/api/auth/logout', {}); },
  me: () => get<any>('/api/auth/me'),
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => !!getToken(),
};

// ══════════════════════════════════════════════════════════════════
// WALLET / MONEDERO
// ══════════════════════════════════════════════════════════════════
export const walletAPI = {
  getBalance:      () => get<{balance:number}>('/api/wallet/balance'),
  getTransactions: (page=1, limit=20) => get<{transactions:any[]; total:number}>(`/api/wallet/transactions?page=${page}&limit=${limit}`),
  deposit:         (amount:number, method:string, reference:string) => post<{balance:number; transaction:any}>('/api/wallet/deposit', { amount, method, reference }),
  withdraw:        (amount:number, method:string, destination:string) => post<{balance:number; transaction:any}>('/api/wallet/withdraw', { amount, method, destination }),
  transfer:        (to:string, amount:number, concept?:string) => post<{balance:number; transaction:any}>('/api/wallet/transfer', { to, amount, concept }),
  redeemCode:      (code:string) => post<{balance:number; amount:number; message:string}>('/api/wallet/recharge-code', { code }),
};

// ══════════════════════════════════════════════════════════════════
// MENSAJERÍA / CHAT - COMPLETO
// ══════════════════════════════════════════════════════════════════
export const chatAPI = {
  // Obtener todos los chats del usuario
  getChats: () => get<any[]>('/api/chats'),
  
  // Obtener mensajes de un chat específico
  getMessages: (chatId:string, page=1, limit=50) => 
    get<any[]>(`/api/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  
  // Enviar mensaje
  sendMessage: (chatId:string, data: {
    text?: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
    reply_to?: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    thumbnail_url?: string;
  }) => post<any>(`/api/chats/${chatId}/messages`, data),
  
  // Crear chat privado
  createPrivate: (participant_id: string) => 
    post<any>('/api/chats/private', { participant_id }),
  
  // Crear chat grupal
  createGroup: (name:string, participant_ids: string[], avatar_url?: string) => 
    post<any>('/api/chats/group', { name, participant_ids, avatar_url }),
  
  // Marcar mensajes como leídos
  markAsRead: (chatId:string, message_id: string) => 
    post<any>(`/api/chats/${chatId}/read`, { message_id }),
  
  // Subir archivo
  uploadFile: async (chatId:string, file:File) => {
    const fd = new FormData(); 
    fd.append('file', file);
    const res = await fetch(`${BASE}/api/chats/${chatId}/upload`, { 
      method:'POST', 
      body: fd,
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },
  
  // Eliminar mensaje
  deleteMessage: (messageId:string) => del<void>(`/api/messages/${messageId}`),
  
  // Buscar usuarios para chat
  searchUsers: (query:string) => get<any[]>(`/api/contacts/search?q=${encodeURIComponent(query)}`),
  
  // Archivar chat
  archiveChat: (chatId:string) => put<void>(`/chats/${chatId}/archive`, {}),
  
  // Eliminar chat
  deleteChat: (chatId:string) => del<void>(`/chats/${chatId}`),
};

// ══════════════════════════════════════════════════════════════════
// CONTACTOS
// ══════════════════════════════════════════════════════════════════
export const contactsAPI = {
  getAll:   () => get<any[]>('/api/contacts'),
  add:      (phone:string, name?:string) => post<any>('/api/contacts', { phone, name }),
  remove:   (id:string) => del<void>(`/contacts/${id}`),
  block:    (id:string) => put<void>(`/contacts/${id}/block`, {}),
  unblock:  (id:string) => put<void>(`/contacts/${id}/unblock`, {}),
};

// ══════════════════════════════════════════════════════════════════
// LIA-25 (Asistente IA)
// ══════════════════════════════════════════════════════════════════
export const liaAPI = {
  chat: (message:string, history?:{role:string;content:string}[]) =>
    post<{reply:string; action?:string; data?:any}>('/api/lia/chat', { message, history }),
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
  consultarFacturaElec: (contrato:string) => post<any>('/api/servicios/segesa/consultar', { contrato }),
  pagarElectricidad:    (contrato:string, importe:number, metodo:string) => post<any>('/api/servicios/segesa/pagar', { contrato, importe, metodo }),
  // Agua SNGE
  consultarFacturaAgua: (contrato:string) => post<any>('/api/servicios/snge/consultar', { contrato }),
  pagarAgua:            (contrato:string, importe:number, metodo:string) => post<any>('/api/servicios/snge/pagar', { contrato, importe, metodo }),
  // Impuestos DGI
  consultarImpuesto:    (nif:string, tipo:string) => post<any>('/api/servicios/dgi/consultar', { nif, tipo }),
  pagarImpuesto:        (nif:string, importe:number, referencia:string) => post<any>('/api/servicios/dgi/pagar', { nif, importe, referencia }),
  // Correos
  enviarPaquete:        (data:any) => post<any>('/api/servicios/correos/enviar', data),
};

// ══════════════════════════════════════════════════════════════════
// SUPERMERCADOS
// ══════════════════════════════════════════════════════════════════
export const superAPI = {
  getSupermarkets: (city?:string) => get<any[]>(`/supermarkets${city?`?city=${city}`:''}`),
  getProducts:     (smId:string, catId?:string) => get<any[]>(`/supermarkets/${smId}/products${catId?`?cat=${catId}`:''}`),
  createOrder:     (order:any) => post<{orderId:string; status:string}>('/api/supermarkets/orders', order),
  getOrders:       () => get<any[]>('/api/supermarkets/orders'),
  getOrderById:    (id:string) => get<any>(`/supermarkets/orders/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// SALUD
// ══════════════════════════════════════════════════════════════════
export const saludAPI = {
  getHospitals:   (city?:string) => get<any[]>(`/salud/hospitales${city?`?city=${city}`:''}`),
  getPharmacies:  (city?:string) => get<any[]>(`/salud/farmacias${city?`?city=${city}`:''}`),
  requestCita:    (data:any) => post<{citaId:string}>('/api/salud/citas', data),
  getMedicamentos:(query:string) => get<any[]>(`/salud/medicamentos?q=${encodeURIComponent(query)}`),
  orderMeds:      (order:any) => post<{orderId:string}>('/api/salud/medicamentos/pedido', order),
};

// ══════════════════════════════════════════════════════════════════
// TAXI
// ══════════════════════════════════════════════════════════════════
export const taxiAPI = {
  requestRide:    (origin:any, dest:any, type:string) => post<{rideId:string; driver:any; eta:number}>('/api/taxi/request', { origin, dest, type }),
  cancelRide:     (rideId:string) => post<void>(`/taxi/${rideId}/cancel`, {}),
  getRideStatus:  (rideId:string) => get<any>(`/taxi/${rideId}/status`),
  rateDriver:     (rideId:string, rating:number, comment?:string) => post<void>(`/taxi/${rideId}/rate`, { rating, comment }),
};

// ══════════════════════════════════════════════════════════════════
// SEGUROS
// ══════════════════════════════════════════════════════════════════
export const segurosAPI = {
  getCompanies:   () => get<any[]>('/api/seguros/companias'),
  getProducts:    (companyId:string) => get<any[]>(`/seguros/companias/${companyId}/productos`),
  applyInsurance: (data:any) => post<{solicitudId:string}>('/api/seguros/solicitar', data),
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
  getProfile:     () => get<any>('/api/user/profile'),
  updateProfile:  (data:any) => put<any>('/api/user/profile', data),
  changePassword: (oldPassword:string, newPassword:string) => post<void>('/api/user/change-password', { oldPassword, newPassword }),
  uploadAvatar:   async (file:File) => {
    const fd = new FormData(); fd.append('avatar', file);
    const res = await fetch(`${BASE}/api/user/avatar`, {
      method:'POST', body:fd,
      headers: getToken() ? { Authorization:`Bearer ${getToken()}` } : {}
    });
    return res.json();
  },
};

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
  seguros:  segurosAPI,
  noticias: noticiasAPI,
  user:     userAPI,
  BASE,
};
