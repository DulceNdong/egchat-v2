/**
 * WebSocketClient.ts  —  Cliente WebSocket para EGCHAT
 *
 * Reemplaza el polling HTTP de 30 segundos por push real-time.
 * Incluye reconexión automática con backoff exponencial.
 *
 * Uso:
 *   WebSocketClient.connect(token)
 *   WebSocketClient.subscribeChat(chatId)
 *   WebSocketClient.onMessage(handler)
 *   WebSocketClient.disconnect()
 */

// ── Constantes ────────────────────────────────────────────────────

const WS_BASE = (() => {
  const api = (import.meta as any).env?.VITE_API_URL
    || 'https://egchat-api-xlxj.onrender.com';
  // http → ws  |  https → wss
  return api.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws';
})();

const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;
const MAX_RECONNECTS   = 10;
const PING_INTERVAL_MS = 20_000;

// ── Tipos ─────────────────────────────────────────────────────────

export type WSEventType =
  | 'new_message'
  | 'chat_updated'
  | 'message_status'
  | 'wallet_updated'
  | 'user_online'
  | 'user_offline'
  | 'typing'
  | 'authenticated'
  | 'error'
  | 'connected'
  | 'disconnected';

export type WSHandler = (data: any) => void;

// ── Estado interno ────────────────────────────────────────────────

let ws:            WebSocket | null = null;
let token:         string           = '';
let reconnects:    number           = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pingTimer:     ReturnType<typeof setInterval> | null = null;
let isConnecting:  boolean          = false;
let destroyed:     boolean          = false;

const handlers = new Map<WSEventType | '*', Set<WSHandler>>();
const subscribedChats = new Set<string>();

// ── Helpers ───────────────────────────────────────────────────────

function emit(type: WSEventType, data: any) {
  handlers.get(type)?.forEach(fn => fn(data));
  handlers.get('*')?.forEach(fn => fn({ type, ...data }));
}

function send(msg: object) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function scheduleReconnect() {
  if (destroyed || reconnects >= MAX_RECONNECTS) return;
  const delay = RECONNECT_DELAYS[Math.min(reconnects, RECONNECT_DELAYS.length - 1)];
  console.log(`[WS] Reconectando en ${delay}ms (intento ${reconnects + 1})`);
  reconnectTimer = setTimeout(() => connect(token), delay);
  reconnects++;
}

function startPing() {
  stopPing();
  pingTimer = setInterval(() => send({ type: 'ping' }), PING_INTERVAL_MS);
}

function stopPing() {
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
}

// ── API Pública ───────────────────────────────────────────────────

/** Conectar al servidor WebSocket y autenticarse */
export function connect(authToken: string): void {
  if (destroyed || isConnecting || !authToken) return;
  if (ws?.readyState === WebSocket.OPEN) return;

  token       = authToken;
  isConnecting = true;

  try {
    ws = new WebSocket(WS_BASE);
  } catch (err) {
    console.warn('[WS] No se pudo crear conexión:', err);
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    isConnecting = false;
    reconnects   = 0;
    console.log('[WS] Conectado →', WS_BASE);
    emit('connected', {});

    // Autenticarse inmediatamente
    send({ type: 'auth', token });
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      const { type, ...data } = msg;

      switch (type) {

        case 'authenticated':
          // Re-suscribir a chats activos tras reconexión
          for (const chatId of subscribedChats) {
            send({ type: 'subscribe_chat', chatId });
          }
          break;

        case 'new_message':
          emit('new_message', data);
          window.dispatchEvent(
            new CustomEvent('egchat:messages-updated', { detail: { chatId: data.chatId } })
          );
          break;

        case 'chat_updated':
          emit('chat_updated', data);
          window.dispatchEvent(new CustomEvent('egchat:conversations-updated'));
          break;

        case 'message_status':
          emit('message_status', data);
          break;

        case 'wallet_updated':
          emit('wallet_updated', data);
          window.dispatchEvent(
            new CustomEvent('egchat:wallet-updated', { detail: { balance: data.balance } })
          );
          break;

        case 'user_online':
          emit('user_online', data);
          break;

        case 'user_offline':
          emit('user_offline', data);
          break;

        case 'typing':
          emit('typing', data);
          break;

        case 'pong':
          // keepalive OK
          break;

        case 'ping':
          send({ type: 'pong' });
          break;

        case 'error':
          console.warn('[WS] Error del servidor:', data);
          emit('error', data);
          break;
      }
    } catch {}
  };

  ws.onclose = (event) => {
    isConnecting = false;
    stopPing();
    emit('disconnected', { code: event.code });
    if (!destroyed) scheduleReconnect();
  };

  ws.onerror = () => {
    isConnecting = false;
  };

  startPing();
}

/** Suscribirse a eventos de un chat */
export function subscribeChat(chatId: string): void {
  subscribedChats.add(chatId);
  send({ type: 'subscribe_chat', chatId });
}

/** Desuscribirse de un chat */
export function unsubscribeChat(chatId: string): void {
  subscribedChats.delete(chatId);
  send({ type: 'unsubscribe_chat', chatId });
}

/** Enviar indicador de "escribiendo..." */
export function sendTyping(chatId: string, isTyping: boolean): void {
  send({ type: 'typing', chatId, isTyping });
}

/** Registrar handler para un tipo de evento */
export function on(type: WSEventType | '*', handler: WSHandler): () => void {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler);
}

/** Desconectar y limpiar */
export function disconnect(): void {
  destroyed = true;
  stopPing();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  handlers.clear();
  subscribedChats.clear();
}

/** Obtener estado de la conexión */
export function getStatus(): 'connected' | 'connecting' | 'disconnected' {
  if (ws?.readyState === WebSocket.OPEN)      return 'connected';
  if (ws?.readyState === WebSocket.CONNECTING) return 'connecting';
  return 'disconnected';
}

/** Reset para reconexión (p.ej. tras login) */
export function reset(authToken: string): void {
  destroyed = false;
  stopPing();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try { ws?.close(); } catch {}
  ws = null;
  reconnects = 0;
  connect(authToken);
}
