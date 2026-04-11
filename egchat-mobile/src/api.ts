import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE = 'https://egchat-api.onrender.com';
const BASE = typeof process !== 'undefined' && process.env?.API_URL
  ? process.env.API_URL
  : DEFAULT_BASE;

const getToken = async () => AsyncStorage.getItem('token');
const setToken = async (t: string) => AsyncStorage.setItem('token', t);
const clearToken = async () => AsyncStorage.removeItem('token');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
    ...options,
  });
  if (res.status === 401) { await clearToken(); throw new Error('Sesión expirada'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; user: any }>('/api/auth/login', { phone, password });
    if (res.token) await setToken(res.token);
    return res;
  },
  register: async (data: { full_name: string; phone: string; password: string }) => {
    const res = await post<{ token: string; user: any }>('/api/auth/register', data);
    if (res.token) await setToken(res.token);
    return res;
  },
  logout: async () => { await clearToken(); },
  me: () => get<any>('/api/auth/me'),
  isAuthenticated: async () => !!(await getToken()),
};

export const walletAPI = {
  getBalance: () => get<{ balance: number; currency: string }>('/api/wallet/balance'),
  getTransactions: (page = 1) => get<{ transactions: any[]; total: number }>(`/api/wallet/transactions?page=${page}&limit=20`),
  deposit: (amount: number, method: string, reference: string) => post<any>('/api/wallet/deposit', { amount, method, reference }),
  withdraw: (amount: number, method: string, destination: string) => post<any>('/api/wallet/withdraw', { amount, method, destination }),
  transfer: (to: string, amount: number, concept?: string) => post<any>('/api/wallet/transfer', { to, amount, concept }),
  redeemCode: (code: string) => post<any>('/api/wallet/recharge-code', { code }),
};

export const liaAPI = {
  chat: (message: string, history?: any[]) => post<{ reply: string }>('/api/lia/chat', { message, history }),
};

export const userAPI = {
  getProfile: () => get<any>('/api/user/profile'),
  updateProfile: (data: any) => put<any>('/api/user/profile', data),
};

export { getToken, setToken, clearToken };
