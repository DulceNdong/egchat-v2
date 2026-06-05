const API = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api.onrender.com';

function getToken(): string {
  try {
    const s = JSON.parse(localStorage.getItem('egchat-admin-auth') || '{}');
    return s?.state?.token || '';
  } catch { return ''; }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('egchat-admin-auth');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

export const adminAPI = {
  // Métricas
  getOperational: () => req<any>('/api/admin/metrics/operational'),
  getChat:        () => req<any>('/api/admin/metrics/chat'),
  getWallet:      () => req<any>('/api/admin/metrics/wallet'),
  getSecurity:    () => req<any>('/api/admin/metrics/security'),
  getInfra:       () => req<any>('/api/admin/metrics/infra'),
  getSqliteSync:  () => req<any>('/api/admin/metrics/sqlite-sync'),

  // Auditoría
  getAuditLog: (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return req<any>(`/api/admin/audit/log?${q}`);
  },
  exportAudit: (format: 'csv' | 'json') =>
    req<any>(`/api/admin/audit/export?format=${format}`),

  // Seguridad
  blockIp:   (ip: string, duration: string, reason: string) =>
    req<any>('/api/admin/security/block-ip', { method: 'POST', body: JSON.stringify({ ip, duration, reason }) }),
  blockUser: (userId: string, reason: string) =>
    req<any>('/api/admin/security/block-user', { method: 'POST', body: JSON.stringify({ userId, reason }) }),

  // Admins
  getAdmins: () => req<any[]>('/api/admin/users'),
  createAdmin: (data: any) =>
    req<any>('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminRole: (id: string, role: string) =>
    req<any>(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deactivateAdmin: (id: string) =>
    req<any>(`/api/admin/users/${id}`, { method: 'DELETE' }),
};
