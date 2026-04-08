// Gestor de sesiones robusto para EGCHAT
interface SessionData {
  user: any;
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

interface SessionConfig {
  maxAge: number; // Tiempo máximo de sesión en segundos
  refreshThreshold: number; // Tiempo antes de expiración para refrescar
  storageKey: string;
  backupStorageKey: string;
}

class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig = {
    maxAge: 30 * 24 * 60 * 60, // 30 días
    refreshThreshold: 5 * 60, // 5 minutos
    storageKey: 'egchat_session',
    backupStorageKey: 'egchat_session_backup'
  };

  private refreshTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.setupEventListeners();
    this.startRefreshTimer();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Guardar sesión de forma segura
  public saveSession(user: any, token: string, refreshToken?: string): void {
    try {
      const payload = this.parseJWT(token);
      const expiresAt = payload.exp * 1000; // Convertir a milisegundos

      const sessionData: SessionData = {
        user,
        token,
        expiresAt,
        refreshToken
      };

      // Guardar en localStorage
      localStorage.setItem(this.config.storageKey, JSON.stringify(sessionData));
      
      // Backup en sessionStorage
      sessionStorage.setItem(this.config.backupStorageKey, JSON.stringify(sessionData));

      // Disparar evento de sesión guardada
      this.emit('session:saved', sessionData);

      console.log('✅ Sesión guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }
  }

  // Obtener sesión actual
  public getSession(): SessionData | null {
    try {
      // Intentar leer del localStorage primero
      let sessionData = localStorage.getItem(this.config.storageKey);
      
      if (!sessionData) {
        // Si no hay en localStorage, intentar del backup
        sessionData = sessionStorage.getItem(this.config.backupStorageKey);
        if (sessionData) {
          // Restaurar al localStorage si encontró backup
          localStorage.setItem(this.config.storageKey, sessionData);
        }
      }

      if (!sessionData) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionData);
      
      // Verificar que la sesión no esté expirada
      if (this.isSessionExpired(session)) {
        console.warn('⚠️ Sesión expirada, limpiando...');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error);
      this.clearSession();
      return null;
    }
  }

  // Verificar si hay sesión activa
  public hasActiveSession(): boolean {
    return this.getSession() !== null;
  }

  // Obtener token actual
  public getToken(): string | null {
    const session = this.getSession();
    return session ? session.token : null;
  }

  // Obtener usuario actual
  public getUser(): any | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  // Verificar si la sesión está por expirar
  public isSessionExpiringSoon(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    
    return timeUntilExpiry <= (this.config.refreshThreshold * 1000);
  }

  // Limpiar sesión completamente
  public clearSession(): void {
    try {
      // Limpiar localStorage
      localStorage.removeItem(this.config.storageKey);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Limpiar sessionStorage
      sessionStorage.removeItem(this.config.backupStorageKey);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Limpiar cualquier cache relacionado
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('egchat') || cacheName.includes('api')) {
              caches.delete(cacheName);
            }
          });
        });
      }

      // Detener timer de refresco
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Disparar evento de sesión limpiada
      this.emit('session:cleared');

      console.log('🧹 Sesión limpiada exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando sesión:', error);
    }
  }

  // Refrescar sesión (llamar al backend si es necesario)
  public async refreshSession(): Promise<boolean> {
    try {
      const session = this.getSession();
      if (!session) return false;

      // Si no está por expirar, no hacer nada
      if (!this.isSessionExpiringSoon()) {
        return true;
      }

      console.log('🔄 Refrescando sesión...');

      // Aquí podrías implementar refresh token endpoint
      // Por ahora, verificamos si el token actual sigue siendo válido
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Token todavía válido');
        return true;
      } else {
        console.log('❌ Token inválido, limpiando sesión');
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('❌ Error refrescando sesión:', error);
      this.clearSession();
      return false;
    }
  }

  // Verificar sesión periódicamente
  private startRefreshTimer(): void {
    // Verificar cada minuto
    this.refreshTimer = setInterval(async () => {
      const session = this.getSession();
      if (!session) return;

      const now = Date.now();
      const timeUntilExpiry = session.expiresAt - now;

      // Si expira en menos de 5 minutos, intentar refrescar
      if (timeUntilExpiry <= (this.config.refreshThreshold * 1000)) {
        await this.refreshSession();
      }
      // Si ya expiró, limpiar
      else if (timeUntilExpiry <= 0) {
        this.clearSession();
      }
    }, 60000); // Cada minuto
  }

  // Parsear JWT de forma segura
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parseando JWT:', error);
      return { exp: 0 };
    }
  }

  // Verificar si sesión está expirada
  private isSessionExpired(session: SessionData): boolean {
    return Date.now() >= session.expiresAt;
  }

  // Configurar event listeners del storage
  private setupEventListeners(): void {
    // Escuchar cambios en storage (para sincronizar entre tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === this.config.storageKey || e.key === this.config.backupStorageKey) {
        if (e.newValue === null) {
          // Sesión eliminada en otro tab
          this.emit('session:cleared');
        } else {
          // Sesión actualizada en otro tab
          this.emit('session:updated');
        }
      }
    });

    // Escuchar eventos de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // La página se hizo visible, verificar sesión
        this.verifySessionOnFocus();
      }
    });

    // Escuchar eventos online/offline
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada, verificando sesión...');
      this.verifySessionOnFocus();
    });
  }

  // Verificar sesión cuando la página gana foco
  private async verifySessionOnFocus(): Promise<void> {
    try {
      const session = this.getSession();
      if (!session) return;

      // Verificar que el token siga siendo válido
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });

      if (!response.ok) {
        console.log('❌ Sesión inválida al recuperar foco');
        this.clearSession();
        this.emit('session:invalid');
      }
    } catch (error) {
      console.error('Error verificando sesión al recuperar foco:', error);
    }
  }

  // Sistema de eventos simple
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
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en evento ${event}:`, error);
        }
      });
    }
  }

  // Obtener información de la sesión actual
  public getSessionInfo(): {
    isValid: boolean;
    expiresAt: Date | null;
    timeUntilExpiry: number | null;
    isExpiringSoon: boolean;
  } {
    const session = this.getSession();
    
    if (!session) {
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isExpiringSoon: false
      };
    }

    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    const expiresAt = new Date(session.expiresAt);

    return {
      isValid: timeUntilExpiry > 0,
      expiresAt,
      timeUntilExpiry,
      isExpiringSoon: timeUntilExpiry <= (this.config.refreshThreshold * 1000)
    };
  }

  // Forzar renovación de sesión
  public async forceRefresh(): Promise<boolean> {
    return await this.refreshSession();
  }

  // Destruir el gestor de sesiones
  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.eventListeners.clear();
    this.clearSession();
  }
}

export default SessionManager;
export { SessionData, SessionConfig };
