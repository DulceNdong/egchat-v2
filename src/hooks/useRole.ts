/**
 * useRole.ts
 * Hook React para gestión de roles y permisos del usuario actual
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../api';

export type UserRole = 'user' | 'official' | 'business' | 'merchant' | 'moderator' | 'admin' | 'super_admin';

interface RoleInfo {
  role: UserRole;
  permissions: string[];
  is_verified: boolean;
  loading: boolean;
  error: string | null;
}

const ROLE_CACHE_KEY = 'egchat_user_role';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cache en memoria
let _cache: { role: UserRole; permissions: string[]; is_verified: boolean; expiresAt: number } | null = null;

export function useRole(isAuthenticated: boolean): RoleInfo & {
  hasPermission: (permission: string) => boolean;
  isAtLeast: (role: UserRole) => boolean;
  refresh: () => void;
} {
  const [state, setState] = useState<RoleInfo>(() => {
    // Cargar desde localStorage como inicio rápido
    try {
      const stored = localStorage.getItem(ROLE_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          return { role: parsed.role, permissions: parsed.permissions, is_verified: parsed.is_verified, loading: false, error: null };
        }
      }
    } catch {}
    return { role: 'user', permissions: ['chat.send'], is_verified: false, loading: true, error: null };
  });

  const fetchRole = useCallback(async () => {
    if (!isAuthenticated || !authAPI.getToken()) return;
    // Revisar caché en memoria
    if (_cache && _cache.expiresAt > Date.now()) {
      setState({ role: _cache.role, permissions: _cache.permissions, is_verified: _cache.is_verified, loading: false, error: null });
      return;
    }
    try {
      const BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
      const token = authAPI.getToken();
      const res = await fetch(`${BASE}/api/me/role`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener rol');
      const data = await res.json();
      const result = { role: data.role || 'user', permissions: data.permissions || ['chat.send'], is_verified: data.is_verified || false };
      const expiresAt = Date.now() + CACHE_TTL;
      _cache = { ...result, expiresAt };
      // Persistir en localStorage
      try { localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ ...result, expiresAt })); } catch {}
      setState({ ...result, loading: false, error: null });
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false, error: e.message }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const ROLE_HIERARCHY: UserRole[] = ['user', 'official', 'business', 'merchant', 'moderator', 'admin', 'super_admin'];

  const hasPermission = useCallback((permission: string) => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const isAtLeast = useCallback((role: UserRole) => {
    const currentLevel = ROLE_HIERARCHY.indexOf(state.role);
    const requiredLevel = ROLE_HIERARCHY.indexOf(role);
    return currentLevel >= requiredLevel;
  }, [state.role]);

  const refresh = useCallback(() => {
    _cache = null;
    try { localStorage.removeItem(ROLE_CACHE_KEY); } catch {}
    fetchRole();
  }, [fetchRole]);

  return { ...state, hasPermission, isAtLeast, refresh };
}

/** Limpiar caché de rol al hacer logout */
export function clearRoleCache() {
  _cache = null;
  try { localStorage.removeItem(ROLE_CACHE_KEY); } catch {}
}
