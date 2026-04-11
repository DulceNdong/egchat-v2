import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (phone: string, password: string, full_name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para limpiar sesión completamente
  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }, []);

  // Función para guardar sesión
  const saveSession = useCallback((userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // También guardar en sessionStorage como backup
    sessionStorage.setItem('token', userToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // Función para restaurar sesión desde localStorage
  const restoreSession = useCallback(() => {
    try {
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (savedToken) {
        // Verificar que el token no esté expirado
        try {
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp > currentTime) {
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              setUser(userData);
            }
            setToken(savedToken);
            return true;
          }
        } catch (error) {
          console.warn('Token inválido al restaurar sesión:', error);
        }
      }
    } catch (error) {
      console.warn('Error restaurando sesión:', error);
    }
    
    // Solo limpiar cuando hay datos corruptos/expirados, no por ausencia de "user".
    if (localStorage.getItem('token') || sessionStorage.getItem('token')) {
      clearSession();
    }
    return false;
  }, [clearSession]);

  // Login
  const login = useCallback(async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validaciones básicas
      if (!phone || !password) {
        return { success: false, error: 'Teléfono y contraseña son requeridos' };
      }

      if (phone.length < 8) {
        return { success: false, error: 'El teléfono debe tener al menos 8 dígitos' };
      }

      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const response = await authAPI.login(phone, password);
      
      if (response.token && response.user) {
        saveSession(response.user, response.token);
        return { success: true };
      } else {
        return { success: false, error: 'Respuesta inválida del servidor' };
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Manejo específico de errores
      if (error.message?.includes('401')) {
        return { success: false, error: 'Credenciales incorrectas' };
      } else if (error.message?.includes('429')) {
        return { success: false, error: 'Demasiados intentos. Intenta más tarde' };
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        return { success: false, error: 'Error de conexión. Verifica tu internet' };
      } else if (error.message?.includes('Cascade session')) {
        return { success: false, error: 'Sesión no válida. Inicia sesión nuevamente' };
      } else {
        return { success: false, error: error.message || 'Error al iniciar sesión' };
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  // Register
  const register = useCallback(async (phone: string, password: string, full_name: string) => {
    try {
      setIsLoading(true);
      
      // Validaciones básicas
      if (!phone || !password || !full_name) {
        return { success: false, error: 'Todos los campos son requeridos' };
      }

      if (phone.length < 8) {
        return { success: false, error: 'El teléfono debe tener al menos 8 dígitos' };
      }

      if (!/^\+?[0-9\s\-()]+$/.test(phone)) {
        return { success: false, error: 'Formato de teléfono inválido' };
      }

      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      if (full_name.length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
      }

      const response = await authAPI.register({ phone, password, full_name });
      
      if (response.token && response.user) {
        saveSession(response.user, response.token);
        return { success: true };
      } else {
        return { success: false, error: 'Respuesta inválida del servidor' };
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      // Manejo específico de errores
      if (error.message?.includes('409')) {
        return { success: false, error: 'El teléfono ya está registrado' };
      } else if (error.message?.includes('400')) {
        return { success: false, error: 'Datos inválidos. Verifica la información' };
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        return { success: false, error: 'Error de conexión. Verifica tu internet' };
      } else {
        return { success: false, error: error.message || 'Error al registrarse' };
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  // Logout
  const logout = useCallback(() => {
    try {
      // Llamar al endpoint de logout si existe token
      if (token) {
        authAPI.logout().catch(console.error);
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearSession();
    }
  }, [token, clearSession]);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;

      // Verificar si el token está por expirar (dentro de 5 minutos)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;

      if (timeUntilExpiry > 300) { // Más de 5 minutos
        return true;
      }

      // Aquí podrías implementar refresh token si tu backend lo soporta
      // Por ahora, si está por expirar, requerimos login nuevo
      clearSession();
      return false;
    } catch (error) {
      console.error('Error refrescando token:', error);
      clearSession();
      return false;
    }
  }, [token, clearSession]);

  // Verificar token periódicamente
  useEffect(() => {
    if (!token) return;

    const checkToken = () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;

        // Si el token expira en menos de 10 minutos, intentar refrescar
        if (timeUntilExpiry < 600 && timeUntilExpiry > 0) {
          refreshToken();
        } else if (timeUntilExpiry <= 0) {
          // Token expirado, limpiar sesión
          clearSession();
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        clearSession();
      }
    };

    // Verificar inmediatamente
    checkToken();

    // Verificar cada minuto
    const interval = setInterval(checkToken, 60000);

    return () => clearInterval(interval);
  }, [token, refreshToken, clearSession]);

  // Restaurar sesión al montar
  useEffect(() => {
    const restored = restoreSession();
    if (restored) {
      // Verificar token válido
      refreshToken();
    }
    setIsLoading(false);
  }, [restoreSession, refreshToken]);

  // Escuchar cambios de storage (para sincronizar entre tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        if (e.newValue === null) {
          // Sesión eliminada en otro tab
          clearSession();
        } else {
          // Sesión actualizada en otro tab
          restoreSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearSession, restoreSession]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshToken,
    clearSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para manejar errores de autenticación
export const useAuthErrorHandler = () => {
  const { clearSession } = useAuth();

  const handleAuthError = useCallback((error: any) => {
    console.error('Error de autenticación:', error);
    
    // Limpiar sesión para errores críticos
    if (
      error?.message?.includes('Cascade session') ||
      error?.message?.includes('Token inválido') ||
      error?.message?.includes('Sesión expirada') ||
      error?.status === 401 ||
      error?.response?.status === 401
    ) {
      clearSession();
      
      // Mostrar mensaje amigable
      const errorMessage = error?.message || 'Sesión expirada';
      if (typeof window !== 'undefined') {
        // Evitar alertas duplicadas
        if (!window.sessionStorage.getItem('auth_error_shown')) {
          window.sessionStorage.setItem('auth_error_shown', 'true');
          
          if (window.confirm(`${errorMessage}\n\n¿Deseas iniciar sesión nuevamente?`)) {
            window.location.reload();
          }
          
          // Limpiar la bandera después de 5 segundos
          setTimeout(() => {
            window.sessionStorage.removeItem('auth_error_shown');
          }, 5000);
        }
      }
    }
  }, [clearSession]);

  return { handleAuthError };
};

export default AuthContext;
