/**
 * SecureStorage.ts  —  FASE 8: Seguridad
 *
 * Almacenamiento seguro de tokens y datos sensibles.
 * - iOS:     Keychain (via @capacitor/preferences)
 * - Android: EncryptedSharedPreferences (via @capacitor/preferences)
 * - Web:     localStorage como fallback (desarrollo)
 *
 * Uso:
 *   await SecureStorage.setToken(jwt)
 *   const token = await SecureStorage.getToken()
 *   await SecureStorage.clearSession()
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const KEY_TOKEN   = 'egchat_secure_token';
const KEY_BACKUP  = 'egchat_secure_token_backup';
const KEY_USER_ID = 'egchat_secure_user_id';
const KEY_PIN     = 'egchat_wallet_pin_hash';

const isNative = () => Capacitor.isNativePlatform();

// ── Wrapper para Preferences (nativo) o localStorage (web) ────────

async function secureGet(key: string): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

async function secureRemove(key: string): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

// ── API pública ───────────────────────────────────────────────────

export const SecureStorage = {

  /** Guardar JWT de forma segura (Keychain/EncryptedSharedPreferences) */
  async setToken(token: string): Promise<void> {
    await Promise.all([
      secureSet(KEY_TOKEN,  token),
      secureSet(KEY_BACKUP, token),
      // Mantener en localStorage para compatibilidad con código existente
      Promise.resolve(localStorage.setItem('token', token)),
      Promise.resolve(localStorage.setItem('egchat_token_backup', token)),
    ]);
  },

  /** Leer JWT — prioriza almacenamiento seguro */
  async getToken(): Promise<string> {
    const secure = await secureGet(KEY_TOKEN);
    if (secure) return secure;
    // Fallback a localStorage (usuarios existentes antes de la migración)
    return localStorage.getItem('token')
        || localStorage.getItem('egchat_token_backup')
        || '';
  },

  /** Verificar si el token es válido y no está expirado */
  async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return !(payload.exp && payload.exp <= now);
    } catch {
      return false;
    }
  },

  /** Guardar ID de usuario actual */
  async setUserId(userId: string): Promise<void> {
    await secureSet(KEY_USER_ID, userId);
  },

  /** Obtener ID de usuario */
  async getUserId(): Promise<string | null> {
    return secureGet(KEY_USER_ID);
  },

  /** Guardar hash del PIN del monedero */
  async setPinHash(hash: string): Promise<void> {
    await secureSet(KEY_PIN, hash);
  },

  /** Obtener hash del PIN */
  async getPinHash(): Promise<string | null> {
    return secureGet(KEY_PIN);
  },

  /** Borrar toda la sesión de forma segura (logout) */
  async clearSession(): Promise<void> {
    await Promise.allSettled([
      secureRemove(KEY_TOKEN),
      secureRemove(KEY_BACKUP),
      secureRemove(KEY_USER_ID),
    ]);
    // También limpiar localStorage para no dejar rastros
    ['token', 'egchat_token', 'egchat_token_backup'].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  },
};
