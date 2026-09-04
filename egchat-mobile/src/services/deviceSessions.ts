/**
 * EGChat — Gestión de sesiones multi-dispositivo
 *
 * Funcionalidades:
 *  - Registrar el dispositivo actual al iniciar sesión
 *  - Listar todos los dispositivos activos del usuario
 *  - Cerrar una sesión remota (otro dispositivo)
 *  - Cerrar todas las sesiones excepto la actual
 *  - Sincronización bilateral: cuando llega un mensaje SSE con
 *    type='sync_message', lo procesa y actualiza el state local
 *
 * Igual que WhatsApp: cada dispositivo tiene un ID único persistido
 * en SecureStore, no regenerable. Si el usuario reinstala, genera uno nuevo.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getToken, getApiBase } from '../api';

const DEVICE_ID_KEY = 'egchat_device_id';

// ── Device ID persistente ─────────────────────────────────────────

export async function getDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;
    const newId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    return `dev_fallback_${Date.now()}`;
  }
}

export async function getDeviceInfo(): Promise<{
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
}> {
  const deviceId   = await getDeviceId();
  // Inferir tipo y nombre sin expo-device
  const deviceType = Platform.OS === 'ios' ? 'ios'
    : Platform.OS === 'android' ? 'android'
    : 'web';
  const deviceName = Platform.OS === 'ios'     ? 'iPhone / iPad'
    : Platform.OS === 'android' ? 'Android'
    : 'Navegador Web';
  const osVersion  = (Platform as any).Version
    ? `${deviceType} ${(Platform as any).Version}`
    : deviceType;
  return { deviceId, deviceName, platform: osVersion, deviceType };
}

// ── Tipos ──────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  platform: string;
  lastSeen: string;
  isCurrentDevice: boolean;
  location?: string;    // IP / país aproximado
  createdAt: string;
}

// ── API helper ─────────────────────────────────────────────────────

async function sessionsAPI<T = any>(method: string, path: string, body?: object): Promise<T> {
  const token = await getToken();
  const BASE  = getApiBase();
  const res   = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Registrar / actualizar sesión al abrir la app ─────────────────

/**
 * Llamar al iniciar la app (después de autenticar).
 * Registra o actualiza el heartbeat de este dispositivo.
 */
export async function registerSession(): Promise<void> {
  try {
    const info = await getDeviceInfo();
    await sessionsAPI('POST', '/api/auth/sessions/register', info);
  } catch { /* silencioso — no bloquear arranque */ }
}

/**
 * Actualizar el heartbeat de la sesión actual.
 * Llamar cada 5 minutos para marcar el dispositivo como activo.
 */
export async function heartbeatSession(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await sessionsAPI('POST', '/api/auth/sessions/heartbeat', { deviceId });
  } catch {}
}

// ── Listar sesiones activas ────────────────────────────────────────

export async function getActiveSessions(): Promise<ActiveSession[]> {
  try {
    const deviceId = await getDeviceId();
    const data = await sessionsAPI<ActiveSession[]>('GET', '/api/auth/sessions');
    return data.map(s => ({ ...s, isCurrentDevice: s.deviceId === deviceId }));
  } catch { return []; }
}

// ── Cerrar sesión remota ───────────────────────────────────────────

/**
 * Cierra la sesión de OTRO dispositivo (revoca su token).
 * El dispositivo remoto recibirá un evento SSE 'session_revoked'
 * y cerrará sesión automáticamente.
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    await sessionsAPI('DELETE', `/api/auth/sessions/${sessionId}`);
    return true;
  } catch { return false; }
}

/**
 * Cierra TODAS las sesiones excepto el dispositivo actual.
 */
export async function revokeAllOtherSessions(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    await sessionsAPI('DELETE', '/api/auth/sessions/all-except-current', { deviceId });
    return true;
  } catch { return false; }
}

// ── Sincronización bilateral de mensajes ──────────────────────────

/**
 * Handler del evento SSE 'sync_message'.
 * Cuando el usuario envía un mensaje desde otro dispositivo (web, desktop),
 * este evento llega al dispositivo móvil para que actualice su lista de chats.
 *
 * Usar en el listener SSE del _layout.tsx:
 *   if (event.type === 'sync_message') handleSyncMessage(event, setChats, setMessages)
 */
export function handleSyncMessage(
  event: {
    type: string;
    chatId?: string;
    message?: any;
    deviceId?: string;
  },
  callbacks: {
    onNewMessage?: (chatId: string, message: any) => void;
    onChatUpdated?: (chatId: string) => void;
  },
): void {
  if (!event.chatId) return;
  if (event.message) {
    callbacks.onNewMessage?.(event.chatId, event.message);
  } else {
    callbacks.onChatUpdated?.(event.chatId);
  }
}

/**
 * Handler del evento SSE 'session_revoked'.
 * Cuando el usuario cierra este dispositivo desde otro, hay que hacer logout.
 */
export async function handleSessionRevoked(
  event: { type: string; deviceId?: string },
  onLogout: () => void,
): Promise<void> {
  const myDeviceId = await getDeviceId();
  if (!event.deviceId || event.deviceId === myDeviceId) {
    onLogout();
  }
}
