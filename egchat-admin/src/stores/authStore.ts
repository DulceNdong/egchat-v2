import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminRole } from '../utils/rbac';

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  name?: string;
}

interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  requireTotp: boolean;
  pendingEmail: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const API = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api-xlxj.onrender.com';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      requireTotp: false,
      pendingEmail: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API}/api/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          // Guard: if response is not JSON (e.g. Render sleeping → HTML 503)
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error('El servidor está iniciando, espera 30 segundos e intenta de nuevo');
          }
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

          if (data.requireTotp) {
            set({ requireTotp: true, pendingEmail: email, isLoading: false });
          } else {
            set({ admin: data.admin, token: data.token, requireTotp: false, isLoading: false });
          }
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      verifyTotp: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const { pendingEmail } = get();
          const res = await fetch(`${API}/api/admin/auth/totp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingEmail, code }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Código incorrecto');
          set({ admin: data.admin, token: data.token, requireTotp: false, pendingEmail: null, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      logout: () => {
        const { token } = get();
        if (token) {
          fetch(`${API}/api/admin/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ admin: null, token: null, requireTotp: false, pendingEmail: null });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'egchat-admin-auth', partialize: (s) => ({ admin: s.admin, token: s.token }) }
  )
);
