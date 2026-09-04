/**
 * useChatStream — Conecta al SSE stream del backend Render
 * para recibir mensajes en tiempo real sin depender de Supabase Realtime.
 * El backend emite: { type: 'new_message', chatId, message }
 * Latencia: < 300ms (mismo servidor que envía el mensaje)
 */
import { useEffect, useRef, useCallback } from 'react';
import { getToken, getApiBase } from '../api';

type StreamEvent = {
  type: 'new_message' | 'chat_updated' | 'connected' | 'heartbeat' | 'typing' | 'read'
       | 'sync_message' | 'session_revoked' | 'wallet_updated' | 'presence'
       | 'group_call_participant_joined' | 'group_call_participant_left'
       | 'group_call_offer' | 'group_call_answer' | 'group_call_ice';
  chatId?: string;
  message?: any;
  online?: boolean;
  userId?: string;
  messageId?: string;
  messageIds?: string[];
  isTyping?: boolean;
  ts?: number;
  // sync_message
  senderDeviceId?: string;
  // session_revoked
  deviceId?: string;
  sessionId?: string;
  all?: boolean;
  exceptDeviceId?: string;
  // wallet_updated
  balance?: number;
  // group_call
  roomId?: string;
  fromUserId?: string;
  name?: string;
  avatar?: string;
  sdp?: any;
  candidate?: any;
};

type StreamHandler = (event: StreamEvent) => void;

export function useChatStream(
  userId: string | undefined,
  onEvent: StreamHandler,
) {
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef('');
  const mountedRef = useRef(true);
  const reconnectDelayRef = useRef(1000);
  const seenEventsRef = useRef<Set<string>>(new Set());

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    // Máx 30s de delay para no consumir memoria en loop cuando el servidor está caído
    const delay = Math.min(reconnectDelayRef.current * 2, 30000);
    reconnectDelayRef.current = delay;
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, delay);
  }, []);

  const connect = useCallback(async () => {
    if (!userId || !mountedRef.current) return;

    // Limpiar conexión anterior
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    const token = await getToken();
    if (!token) return;

    const BASE = getApiBase();
    const url = `${BASE}/api/chat/stream?_t=${encodeURIComponent(token)}`;

    // Usar XHR con streaming — sin header cache-control (causa CORS)
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 60000;
    // NO añadir Cache-Control — causa error CORS en preflight

    let lastIndex = 0;

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      bufferRef.current += chunk;

      // Parsear líneas SSE completas (terminan en \n\n)
      const parts = bufferRef.current.split('\n\n');
      bufferRef.current = parts.pop() || '';

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const json = JSON.parse(line.replace(/^data:\s*/, '')) as StreamEvent;
          if (json?.type === 'connected') {
            reconnectDelayRef.current = 1000;
          }
          const eventKey = [json.type, json.chatId || '', json.message?.id || json.messageId || '', json.userId || '', String(json.ts || '')].join(':');
          if (seenEventsRef.current.has(eventKey)) continue;
          seenEventsRef.current.add(eventKey);
          if (seenEventsRef.current.size > 200) {
            seenEventsRef.current.clear();
          }
          if (mountedRef.current) onEvent(json);
        } catch {}
      }
    };

    xhr.onerror = () => {
      if (!mountedRef.current) return;
      scheduleReconnect();
    };

    xhr.onloadend = () => {
      if (!mountedRef.current) return;
      scheduleReconnect();
    };

    xhr.send();
    xhrRef.current = xhr;
  }, [userId, onEvent, scheduleReconnect]);

  useEffect(() => {
    mountedRef.current = true;
    if (userId) connect();

    return () => {
      mountedRef.current = false;
      if (xhrRef.current) { xhrRef.current.abort(); xhrRef.current = null; }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [userId, connect]);
}
