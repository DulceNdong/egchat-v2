/**
 * EGChat — Login QR desde PC
 * El usuario abre egchat-v2.vercel.app en el PC y ve un QR.
 * Escanea con la app móvil y la sesión del PC queda autenticada.
 *
 * Flujo:
 * 1. PC genera un sessionId y lo muestra en un QR: egchat://qr-login/SESSION_ID
 * 2. App escanea el QR → llama confirmQRLogin(sessionId, token)
 * 3. Backend almacena el token vinculado al sessionId
 * 4. PC hace polling → recibe el token → sesión iniciada
 */
import { getToken, getApiBase } from '../api';

export interface QRSession {
  sessionId: string;
  expiresAt: number;
  status: 'pending' | 'confirmed' | 'expired';
}

export const qrSessionService = {
  /**
   * Confirmar login desde el móvil después de escanear el QR.
   * @param sessionId — ID del QR escaneado
   */
  async confirmQRLogin(sessionId: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const token = await getToken();
      if (!token) return { ok: false, message: 'No hay sesión activa' };

      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/qr-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) return { ok: true };
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err.message || 'Error confirmando sesión' };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  },

  /**
   * Parsear el QR escaneado y extraer el sessionId.
   * URLs válidas:
   *   egchat://qr-login/SESSION_ID
   *   https://egchat-v2.vercel.app/qr/SESSION_ID
   */
  parseQRUrl(url: string): string | null {
    try {
      // Formato deep link
      const deepLink = url.match(/egchat:\/\/qr-login\/([a-zA-Z0-9_-]+)/);
      if (deepLink) return deepLink[1];

      // Formato URL web
      const webLink = url.match(/\/qr\/([a-zA-Z0-9_-]+)/);
      if (webLink) return webLink[1];

      return null;
    } catch { return null; }
  },
};
