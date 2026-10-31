// useAuth — equivalente al ViewModel/ObservableObject del spec
// Maneja estado de sesión, login, registro y logout
// Usado por todas las pantallas de auth

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { authAPI, clearToken, setToken, wakeServer } from '../api';
import SessionManager from '../sessionManager';
import { registerForPushNotifications } from '../notifications';
import { WALLET_KYC_REQUIRED } from '../config/walletConfig';
import { t as tr } from '../translations';

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
  app_version?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
}

// ── Hook principal ────────────────────────────────────────────────
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: '',
  });

  const setError = (error: string) =>
    setState(s => ({ ...s, error, isLoading: false }));

  const setLoading = (isLoading: boolean) =>
    setState(s => ({ ...s, isLoading, error: '' }));

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (phone: string, password: string) => {
    if (!phone || !password) {
      setError(tr('setFillAllFields'));
      return false;
    }
    // Normalizar teléfono: quitar espacios y guiones
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    setLoading(true);
    try {
      await wakeServer();
      const res = await authAPI.login(cleanPhone, password);
      if (!res?.token && !res?.user) {
        setError(tr('xtRespuestaInesperadaDelServidor'));
        return false;
      }
      setState({ user: res.user, isAuthenticated: true, isLoading: false, error: '' });
      if (Platform.OS !== 'web') {
        void registerForPushNotifications().catch((pushErr) => {
          console.warn('[Login push bootstrap skipped]', pushErr);
        });
      }
      // Limpiar flag de añadir cuenta (se establece cuando se navega intencionalmente al login)
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem('egchat_adding_account').catch(() => {});
      } catch {}
      router.replace('/(tabs)');
      return true;
    } catch (e: any) {
      const msg = e.message || '';
      console.log('[Login error]', msg);
      if (
        msg.includes('credenciales') || msg.includes('Credenciales')
        || msg.includes('incorrectos') || msg.includes('invalid')
        || msg.includes('No autorizado')
      ) {
        setError(tr('xtTelefonoOContrasenaIncorrectos'));
      } else if (msg.includes('Sesión expirada')) {
        setError(tr('xtSesionExpiradaIntentaloDeNuevo'));
      } else if (
        msg.includes('No se pudo conectar al servidor')
        || msg.includes('fetch') || msg.includes('network')
        || msg.includes('Network') || msg.includes('AbortError')
      ) {
        setError(tr('xtNoSePudoConectarAlServidorVerificaTuConexionEInten'));
      } else if (msg.includes('500')) {
        setError(tr('xtErrorDelServidorIntentaEnUnosMinutos'));
      } else {
        setError(msg || tr('xtErrorAlIniciarSesion'));
      }
      return false;
    }
  }, []);

  // ── Registro ──────────────────────────────────────────────────
  const register = useCallback(async (data: {
    full_name: string;
    phone: string;
    password: string;
    avatar_url?: string;
  }) => {
    setLoading(true);
    try {
      await wakeServer();
      const res = await authAPI.register(data);
      setState({ user: res.user, isAuthenticated: true, isLoading: false, error: '' });
      if (Platform.OS !== 'web') {
        void registerForPushNotifications().catch((pushErr) => {
          console.warn('[Register push bootstrap skipped]', pushErr);
        });
      }
      // ── KYC: tras registro, si el monedero requiere KYC obligatorio,
      // mostrar la pantalla de activación. Si no (modo pruebas), ir directo a tabs.
      // Para reactivar: cambiar WALLET_KYC_REQUIRED a true en src/config/walletConfig.ts
      // En web redirigimos directo a tabs (KYC es solo para la app nativa).
      if (Platform.OS === 'web' || !WALLET_KYC_REQUIRED) {
        router.replace('/(tabs)');
      } else {
        router.replace('/kyc-wallet-prompt' as any);
      }
      return true;
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('ya está registrado') || msg.includes('409')) {
        setError(tr('xtEsteNumeroYaEstaRegistradoUsaYaTengoCuenta'));
      } else if (msg.includes('fetch') || msg.includes('network')) {
        setError(tr('xtErrorDeConexionVerificaTuInternet'));
      } else {
        setError(msg || tr('xtErrorAlRegistrarseIntentaDeNuevo'));
      }
      return false;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    await authAPI.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false, error: '' });
    router.replace('/(auth)/login');
  }, []);

  // ── Recuperar contraseña ──────────────────────────────────────
  const sendVerification = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      await authAPI.sendVerification(phone);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      return true;
    } catch (e: any) {
      setError(e.message || tr('authSendCodeError'));
      return false;
    }
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string) => {
    setLoading(true);
    try {
      const { verified } = await authAPI.verifyCode(phone, code);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      if (!verified) setError(tr('authCodeWrong'));
      return verified;
    } catch (e: any) {
      setError(e.message || tr('authCodeInvalid'));
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (phone: string, code: string, newPassword: string) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(phone, code, newPassword);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      return true;
    } catch (e: any) {
      setError(e.message || tr('authPasswordChangeError'));
      return false;
    }
  }, []);

  // ── Limpiar error ─────────────────────────────────────────────
  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: '' }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    sendVerification,
    verifyCode,
    resetPassword,
    clearError,
  };
};

// ── Hook para verificar sesión al arrancar ────────────────────────
export const useSessionCheck = () => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          await authAPI.me();
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch {
        await clearToken();
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  return { checking };
};
