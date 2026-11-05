// sessionManager.ts — Gestor de sesiones para EGCHAT React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface SessionData {
  user: any;
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

const STORAGE_KEY = 'egchat_session';
const TOKEN_KEY   = 'egchat_token';

// ── Decodifica JWT sin atob (no existe en React Native Hermes) ────
// Solo lee el payload — NO valida la firma (eso lo hace el servidor).
function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Añadir padding si falta
    while (base64.length % 4 !== 0) base64 += '=';

    // React Native (Hermes) no tiene atob global → usar Buffer o decodificar manualmente
    let jsonStr: string;
    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      // Decodificación manual base64 → bytes → string UTF-8
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let bytes = '';
      for (let i = 0; i < base64.length; i += 4) {
        const c1 = chars.indexOf(base64[i]);
        const c2 = chars.indexOf(base64[i + 1]);
        const c3 = chars.indexOf(base64[i + 2]);
        const c4 = chars.indexOf(base64[i + 3]);
        bytes += String.fromCharCode((c1 << 2) | (c2 >> 4));
        if (base64[i + 2] !== '=') bytes += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
        if (base64[i + 3] !== '=') bytes += String.fromCharCode(((c3 & 3) << 6) | c4);
      }
      jsonStr = decodeURIComponent(
        bytes.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
    }

    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.startRefreshTimer();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async saveSession(user: any, token: string, refreshToken?: string): Promise<void> {
    try {
      const payload = decodeJWTPayload(token);

      // Si no se puede decodificar, usar 30 días desde ahora como fallback seguro
      // (el servidor emite tokens de 30d, así que esto siempre es correcto)
      const expiresAt = payload?.exp
        ? payload.exp * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000;

      const sessionData: SessionData = { user, token, expiresAt, refreshToken };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      this.emit('session:saved', sessionData);
    } catch (error) {
      console.error('[SessionManager] Error guardando sesión:', error);
    }
  }

  public async getSession(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!sessionData) return null;

      const session: SessionData = JSON.parse(sessionData);

      // Verificar que el objeto tiene los campos mínimos esperados
      if (!session?.token || !session?.user) {
        await this.clearSession();
        return null;
      }

      // Si expiresAt es 0 o inválido (bug de la versión anterior con atob),
      // recalcularlo desde el token y actualizar la sesión guardada
      if (!session.expiresAt || session.expiresAt === 0) {
        const payload = decodeJWTPayload(session.token);
        session.expiresAt = payload?.exp
          ? payload.exp * 1000
          : Date.now() + 30 * 24 * 60 * 60 * 1000;
        // Persistir el fix
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }

      // Margen de seguridad: considerar expirada solo si pasaron más de 5 minutos
      // del tiempo de expiración (evita falsos positivos por desincronización de reloj)
      const GRACE_PERIOD_MS = 5 * 60 * 1000;
      if (Date.now() > session.expiresAt + GRACE_PERIOD_MS) {
        console.warn('[SessionManager] Sesión realmente expirada, limpiando.');
        await this.clearSession();
        return null;
      }

      return session;
    } catch {
      return null; // No borrar la sesión en caso de error de lectura/parseo
    }
  }

  public async hasActiveSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  public async getToken(): Promise<string | null> {
    try {
      // SecureStore primero (más seguro)
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) return token;
      // Fallback a AsyncStorage
      const session = await this.getSession();
      return session?.token ?? null;
    } catch {
      try {
        const session = await this.getSession();
        return session?.token ?? null;
      } catch {
        return null;
      }
    }
  }

  public async getUser(): Promise<any | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  public async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});

      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }

      this.emit('session:cleared');
    } catch (error) {
      console.error('[SessionManager] Error limpiando sesión:', error);
    }
  }

  private startRefreshTimer(): void {
    // Verificar cada 5 minutos (no cada 1 minuto) para reducir I/O
    this.refreshTimer = setInterval(async () => {
      try {
        const session = await this.getSession();
        if (!session) return;

        const now = Date.now();
        const timeUntilExpiry = session.expiresAt - now;

        // Solo emitir expired si realmente expiró (con margen de 5 minutos)
        if (timeUntilExpiry < -5 * 60 * 1000) {
          console.warn('[SessionManager] Token expirado — emitiendo session:expired');
          await this.clearSession();
          this.emit('session:expired');
        }
      } catch {
        // Ignorar errores del timer — no desconectar por fallos de lectura
      }
    }, 5 * 60 * 1000); // cada 5 minutos
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => { try { cb(data); } catch {} });
    }
  }

  public async getSessionInfo() {
    const session = await this.getSession();
    if (!session) {
      return { isValid: false, expiresAt: null, timeUntilExpiry: null, isExpiringSoon: false };
    }
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    return {
      isValid: timeUntilExpiry > 0,
      expiresAt: new Date(session.expiresAt),
      timeUntilExpiry,
      isExpiringSoon: timeUntilExpiry <= 5 * 60 * 1000,
    };
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.eventListeners.clear();
  }
}

export default SessionManager;
export type { SessionData };
