const BASE = import.meta.env.VITE_API_URL ?? 'https://egchat-api-xlxj.onrender.com';
let _token = '';
export const setToken = (t: string) => { _token = t; };
export const getStoredToken = () => localStorage.getItem('empresa_token') ?? '';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_token}`,
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Stats {
  kyc: {
    total: number; pending: number; manual_review: number;
    approved: number; rejected: number;
    high_risk: number; medium_risk: number; low_risk: number;
    avg_risk_score: number; new_today: number; new_this_week: number;
  };
  aml: { pending_alerts: number; total_alerts: number; };
}

export interface KycCase {
  application_id: string; status: string; risk_level: string;
  risk_score: number; submitted_at: string; full_name: string;
  nationality: string; document_type: string;
  face_match_score: number; liveness_passed: boolean; screening_hits: number;
}

export const adminApi = {
  login: async (email: string, password: string) => {
    // Credenciales válidas para acceso local
    const ADMINS: Record<string, { password: string; role: string; name: string }> = {
      'admin@egchat.gq':  { password: 'Admin2025!',  role: 'Super Admin',        name: 'Admin EGCHAT' },
      'bange@egchat.gq':  { password: 'Bange2025!',  role: 'Compliance Officer', name: 'Admin BANGE' },
    };
    const user = ADMINS[email.toLowerCase()];
    if (!user || user.password !== password) {
      throw new Error('Credenciales inválidas');
    }
    const token = btoa(`${email}:${Date.now()}`);
    const admin = { email, role: user.role, name: user.name };
    return { token, admin, requires2FA: false };
  },
  me: () => {
    const token = localStorage.getItem('empresa_token');
    if (!token) return Promise.reject(new Error('No autenticado'));
    const email = atob(token).split(':')[0];
    return Promise.resolve({ email, role: 'Super Admin' });
  },
  stats: () => req<Stats>('/api/admin/stats'),
  setup2fa:  () => req<{ secret: string; qrCode: string }>('/api/admin/2fa/setup', { method: 'POST' }),
  verify2fa: (token: string) =>
    req('/api/admin/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  cases: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req<{ cases: KycCase[]; total: number }>(`/api/kyc/dashboard?${qs}`);
  },
  decide: (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) =>
    req(`/api/kyc/application/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),
};
