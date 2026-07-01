// Interceptor de peticiones HTTP con manejo de autenticación
import { authAPI } from './api';

interface ApiError {
  message: string;
  status?: number;
  response?: {
    status: number;
    data: any;
  };
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private refreshPromise: Promise<boolean> | null = null;

  private constructor() {
    this.setupInterceptors();
  }

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  private setupInterceptors() {
    // Interceptar fetch global
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Solo interceptar peticiones a nuestra API
      if (!url.includes('/api/')) {
        return originalFetch(input, init);
      }

      try {
        // Clonar el init para poder modificarlo
        const modifiedInit = { ...init };
        
        // Agregar token si existe
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          modifiedInit.headers = {
            ...modifiedInit.headers,
            'Authorization': `Bearer ${token}`,
          };
        }

        // Hacer la petición original
        const response = await originalFetch(input, modifiedInit);

        // Manejar respuestas de error
        if (!response.ok) {
          await this.handleErrorResponse(response, url, modifiedInit);
        }

        return response;
      } catch (error) {
        console.error('Error en petición interceptada:', error);
        
        // Manejar errores de red
        if (error instanceof Error && error.message.includes('Failed precondition')) {
          this.handleCascadeSessionError();
        }
        
        throw error;
      }
    };
  }

  private async handleErrorResponse(
    response: Response, 
    url: string, 
    originalRequest: RequestInit
  ): Promise<void> {
    try {
      const errorData = await response.clone().json();
      
      // Errores de autenticación
      if (response.status === 401) {
        console.warn('Error 401 detectado:', errorData);
        
        // Intentar refrescar el token solo una vez
        if (!this.refreshPromise) {
          this.refreshPromise = this.attemptTokenRefresh();
        }
        
        const refreshSuccess = await this.refreshPromise;
        this.refreshPromise = null;
        
        if (refreshSuccess) {
          // Reintentar la petición original con nuevo token
          console.log('Reintentando petición con nuevo token...');
          const newToken = localStorage.getItem('token');
          
          if (newToken) {
            const newRequest = {
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            
            // Reintentar la petición (esto es asíncrono, no bloqueamos)
            fetch(url, newRequest).catch(console.error);
          }
        } else {
          // No se pudo refrescar, limpiar sesión
          this.handleAuthError(errorData);
        }
      }
      
      // Otros errores
      else if (response.status >= 400) {
        console.warn(`Error ${response.status}:`, errorData);
        
        // Errores específicos de Cascade
        if (errorData.message?.includes('Cascade session')) {
          this.handleCascadeSessionError();
        }
      }
    } catch (error) {
      console.error('Error manejando respuesta de error:', error);
    }
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return false;

      // Verificar si el token está por expirar
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;

        // Si expira en menos de 5 minutos, intentar refrescar
        if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
          console.log('Token por expirar, intentando refrescar...');
          
          // Aquí podrías implementar refresh token endpoint
          // Por ahora, verificamos si el token sigue válido
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            console.log('Token todavía válido');
            return true;
          } else {
            console.log('Token inválido, limpiando sesión');
            return false;
          }
        }
        
        return timeUntilExpiry > 0;
      } catch (error) {
        console.error('Error verificando token:', error);
        return false;
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
      return false;
    }
  }

  private handleAuthError(errorData: any): void {
    console.error('Error de autenticación:', errorData);
    
    // Limpiar sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Disparar evento de logout global
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { message: errorData.message || 'Sesión expirada' }
    }));

    // Mostrar notificación amigable
    this.showAuthErrorNotification(errorData.message || 'Sesión expirada');
  }

  private handleCascadeSessionError(): void {
    console.error('Error de sesión Cascade detectado');
    
    // Limpiar sesión inmediatamente
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Disparar evento específico de Cascade
    window.dispatchEvent(new CustomEvent('cascade:session-error', {
      detail: { 
        message: 'Failed precondition: Could not find Cascade session, please try again',
        errorId: 'fa90439326254c1c92492706b615d310'
      }
    }));

    // Mostrar notificación específica
    this.showCascadeErrorNotification();
  }

  private showAuthErrorNotification(message: string): void {
    // Crear notificación no intrusiva
    if (typeof document !== 'undefined') {
      // Remover notificaciones existentes
      const existingNotification = document.getElementById('auth-error-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      const notification = document.createElement('div');
      notification.id = 'auth-error-notification';
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Error de Sesión</strong>
              <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">${message}</div>
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            opacity: 0.7;
          ">✕</button>
        </div>
      `;

      // Agregar estilos de animación
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(notification);

      // Auto-remover después de 5 segundos
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 5000);
    }
  }

  private showCascadeErrorNotification(): void {
    if (typeof document !== 'undefined') {
      // Remover notificaciones existentes
      const existingNotification = document.getElementById('cascade-error-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      const notification = document.createElement('div');
      notification.id = 'cascade-error-notification';
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 350px;
          animation: slideIn 0.3s ease-out;
          border-left: 4px solid #991b1b;
        ">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong style="display: block; margin-bottom: 4px; font-size: 15px;">Error de Sessión EGCHAT</strong>
              <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">
                No se pudo validar tu sesión. Por favor, inicia sesión nuevamente.
              </div>
              <button onclick="window.location.reload()" style="
                margin-top: 12px;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 6px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s;
              " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                 onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                Reintentar
              </button>
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            opacity: 0.7;
            font-size: 16px;
            padding: 4px;
          ">✕</button>
        </div>
      `;

      // Agregar estilos de animación
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(notification);

      // Auto-remover después de 10 segundos
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
    }
  }
}

// Inicializar el interceptor
export const initializeApiInterceptor = () => {
  ApiInterceptor.getInstance();
  console.log('🔐 API Interceptor inicializado');
};

// Exportar para uso manual si es necesario
export default ApiInterceptor;
