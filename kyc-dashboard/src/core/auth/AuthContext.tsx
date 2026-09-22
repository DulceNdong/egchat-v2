/**
 * Contexto de autenticación — gestiona JWT, admin user y estado de sesión.
 * Persiste token en localStorage (no cookies para evitar CSRF en SPA).
 */
import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/endpoints';
import type { AdminUser, AuthState, LoginResponse } from '@/types';

interface AuthContextValue extends AuthState {
  login:  (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'kyc_admin_token';
const USER_KEY  = 'kyc_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    admin:     null,
    token:     null,
    isLoading: true,
  });

  // Rehidratar desde localStorage al arrancar
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    if (token && raw) {
      try {
        const admin = JSON.parse(raw) as AdminUser;
        setState({ admin, token, isLoading: false });
        return;
      } catch {}
    }
    setState(s => ({ ...s, isLoading: false }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    // Obtener perfil completo
    const admin = await authApi.me();
    localStorage.setItem(USER_KEY, JSON.stringify(admin));
    setState({ admin, token: res.access_token, isLoading: false });
    return res;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ admin: null, token: null, isLoading: false });
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const admin = await authApi.me();
      localStorage.setItem(USER_KEY, JSON.stringify(admin));
      setState(s => ({ ...s, admin }));
    } catch {
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
