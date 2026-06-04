/**
 * useMessages.ts  —  FASE 5: Chat Profesional
 *
 * Hook que implementa la estrategia Offline-First para mensajes:
 *  1. Lee de SQLite INMEDIATAMENTE (sin esperar red)
 *  2. Muestra los datos en pantalla al instante
 *  3. Sincroniza en background con el servidor
 *  4. Actualiza la UI cuando llegan cambios del servidor
 *
 * Compatible con el estado actual de App.tsx (no requiere refactor masivo).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageRepository, type Message } from '../db/index';
import { syncChatMessages, enqueuePendingMessage, getSyncState } from '../sync/SyncManager';

export interface UseMessagesOptions {
  chatId: string;
  currentUserId: string;
  enabled?: boolean;
}

export interface UseMessagesReturn {
  messages:     Message[];
  isLoading:    boolean;
  hasMore:      boolean;
  loadMore:     () => Promise<void>;
  sendOffline:  (msg: Omit<Message, 'synced' | 'retries' | 'deleted_for_me'>) => Promise<void>;
  refresh:      () => Promise<void>;
}

export function useMessages({
  chatId,
  currentUserId,
  enabled = true,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const mountedRef                = useRef(true);

  // ── Cargar desde SQLite (instantáneo) ──────────────────────────

  const loadLocal = useCallback(async (p = 1) => {
    if (!chatId || !enabled) return;
    try {
      const rows = await MessageRepository.getByConversation(chatId, p, 50);
      if (!mountedRef.current) return;
      if (p === 1) {
        setMessages(rows);
      } else {
        setMessages(prev => {
          // Evitar duplicados al paginar
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = rows.filter(m => !existingIds.has(m.id));
          return [...newMsgs, ...prev];
        });
      }
      setHasMore(rows.length === 50);
    } catch (err) {
      console.warn('[useMessages] Error cargando local:', err);
    }
  }, [chatId, enabled]);

  // ── Sincronizar con servidor (background) ───────────────────────

  const refresh = useCallback(async () => {
    if (!chatId || !enabled) return;
    setIsLoading(true);
    try {
      await syncChatMessages(chatId);
      await loadLocal(1);
      setPage(1);
    } catch (err) {
      console.warn('[useMessages] Error en refresh:', err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [chatId, enabled, loadLocal]);

  // ── Inicialización ──────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    if (!chatId || !enabled) return;

    // 1. Mostrar datos locales inmediatamente
    loadLocal(1);

    // 2. Sincronizar con servidor en background si hay conexión
    if (getSyncState().isOnline) {
      syncChatMessages(chatId).then(() => loadLocal(1)).catch(() => {});
    }

    // 3. Escuchar actualizaciones del SyncManager
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.chatId === chatId) loadLocal(1);
    };
    window.addEventListener('egchat:messages-updated', handler);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('egchat:messages-updated', handler);
    };
  }, [chatId, enabled, loadLocal]);

  // ── Paginación ──────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadLocal(nextPage);
  }, [hasMore, isLoading, page, loadLocal]);

  // ── Envío offline ───────────────────────────────────────────────

  const sendOffline = useCallback(async (
    msg: Omit<Message, 'synced' | 'retries' | 'deleted_for_me'>
  ) => {
    const fullMsg: Message = {
      ...msg,
      synced:         0,
      retries:        0,
      deleted_for_me: 0,
    };
    // Mostrar en UI inmediatamente (optimistic update)
    setMessages(prev => [...prev, fullMsg]);
    // Guardar en SQLite y encolar para envío
    await enqueuePendingMessage(fullMsg);
  }, []);

  return { messages, isLoading, hasMore, loadMore, sendOffline, refresh };
}
