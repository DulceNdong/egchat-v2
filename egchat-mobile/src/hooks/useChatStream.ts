/**
 * useChatStream — Conecta al SSE stream del backend Render
 * para recibir mensajes en tiempo real sin depender de Supabase Realtime.
 * El backend emite: { type: 'new_message', chatId, message }
 * Latencia: < 300ms (mismo servidor que envía el mensaje)
 */
import { useEffect, useRef, useCallback } from 'react';
import { getToken, getApiBase } from '../api';

type StreamEvent = {
  type: 'new_message' | 'chat_updated' | 'connected' | 'heartbeat';
  chatId?: string;
  message?: any;
  ts?: number;
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
          const json = JSON.parse(line.replace(/^data:\s*/, ''));
          if (mountedRef.current) onEvent(json);
        } catch {}
      }
    };

    xhr.onerror = () => {
      if (!mountedRef.current) return;
      // Reconectar en 3 segundos
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    xhr.onloadend = () => {
      if (!mountedRef.current) return;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    xhr.send();
    xhrRef.current = xhr;
  }, [userId, onEvent]);

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
