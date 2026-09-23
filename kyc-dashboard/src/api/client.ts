/**
 * Cliente HTTP centralizado — axios con interceptores JWT.
 * Todas las llamadas al backend KYC/AML pasan por aquí.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45_000, // 45s — aguanta cold start de Render (free tier ~25-30s)
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inyectar JWT ────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('kyc_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: manejo global de errores ───────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpiar sesión y redirigir a login
      localStorage.removeItem('kyc_admin_token');
      localStorage.removeItem('kyc_admin_user');
      // Determinar qué login cargar según la URL actual
      const path = window.location.pathname;
      const loginPath = path.startsWith('/bange') ? '/bange/login' : '/company/login';
      if (!path.endsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  },
);

// ── Helpers ───────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.message ?? data?.error ?? error.message ?? 'Error desconocido';
  }
  return String(error);
}
