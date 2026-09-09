/**
 * useOfflineQueue.ts — Cola persistente de mensajes offline
 *
 * Los mensajes enviados sin conexión se guardan en AsyncStorage
 * y se envían automáticamente al reconectar, aunque la app
 * se haya cerrado y vuelto a abrir.
 *
 * Uso:
 *   const queue = useOfflineQueue(chatId);
 *   await queue.enqueue({ text, type, reply_to });
 *   // Al reconectar, procesarQueue() se llama automáticamente
 */

import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeNetworkStatus, getNetworkStatus } from '../store/offlineStore';

const QUEUE_KEY = 'egchat_offline_queue_v1';

// ── Tipos ─────────────────────────────────────────────────────────

export interface QueuedMessage {
  queueId: string;        // ID único en la cola
  chatId: string;
  tempId: string;         // ID optimista ya insertado en la UI
  text: string;
  type: string;
  reply_to?: string;
  mediaUri?: string;      // URI local si es media
  mimeType?: string;
  createdAt: string;      // ISO timestamp del momento en que se encoló
  attempts: number;       // cuántos intentos fallidos ha tenido
}

// ── Helpers de AsyncStorage ───────────────────────────────────────

async function loadQueue(): Promise<QueuedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

/** Añade un mensaje a la cola persistente */
export async function enqueueMessage(msg: Omit<QueuedMessage, 'queueId' | 'attempts'>): Promise<void> {
  const queue = await loadQueue();
  queue.push({ ...msg, queueId: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`, attempts: 0 });
  await saveQueue(queue);
}

/** Elimina un mensaje de la cola por su queueId */
export async function dequeueMessage(queueId: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter(m => m.queueId !== queueId));
}

/** Incrementa el contador de intentos */
export async function incrementAttempts(queueId: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.map(m => m.queueId === queueId ? { ...m, attempts: m.attempts + 1 } : m));
}

/** Devuelve los mensajes pendientes de un chat específico */
export async function getQueueForChat(chatId: string): Promise<QueuedMessage[]> {
  const queue = await loadQueue();
  return queue.filter(m => m.chatId === chatId);
}

/** Devuelve todos los mensajes pendientes */
export async function getAllQueued(): Promise<QueuedMessage[]> {
  return loadQueue();
}

// ── Hook ──────────────────────────────────────────────────────────

interface ProcessResult {
  success: boolean;
  queueId: string;
  tempId: string;
}

interface UseOfflineQueueOptions {
  chatId: string;
  /** Función que envía un mensaje de texto al servidor. Devuelve el mensaje real. */
  sendText: (payload: { text: string; type: string; reply_to?: string }) => Promise<{ id: string; [key: string]: any }>;
  /** Se llama cuando un mensaje encolado se envió con éxito */
  onSent?: (result: ProcessResult & { realMessage: any }) => void;
  /** Se llama cuando un mensaje encolado falla definitivamente (>3 intentos) */
  onFailed?: (result: ProcessResult) => void;
}

export function useOfflineQueue({ chatId, sendText, onSent, onFailed }: UseOfflineQueueOptions) {
  const processingRef = useRef(false);
  const onSentRef = useRef(onSent);
  const onFailedRef = useRef(onFailed);
  const sendTextRef = useRef(sendText);

  // Mantener refs actualizadas sin re-crear el effect
  useEffect(() => { onSentRef.current = onSent; }, [onSent]);
  useEffect(() => { onFailedRef.current = onFailed; }, [onFailed]);
  useEffect(() => { sendTextRef.current = sendText; }, [sendText]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const { isOnline } = getNetworkStatus();
    if (!isOnline) return;

    const pending = await getQueueForChat(chatId);
    if (!pending.length) return;

    processingRef.current = true;

    // Enviar en orden, uno a la vez para preservar el orden de los mensajes
    for (const msg of pending) {
      const { isOnline: stillOnline } = getNetworkStatus();
      if (!stillOnline) break; // si se cayó la red, parar

      try {
        const real = await sendTextRef.current({
          text: msg.text,
          type: msg.type,
          reply_to: msg.reply_to,
        });
        await dequeueMessage(msg.queueId);
        onSentRef.current?.({ success: true, queueId: msg.queueId, tempId: msg.tempId, realMessage: real });
      } catch {
        await incrementAttempts(msg.queueId);
        // Descartar después de 5 intentos fallidos
        if (msg.attempts + 1 >= 5) {
          await dequeueMessage(msg.queueId);
          onFailedRef.current?.({ success: false, queueId: msg.queueId, tempId: msg.tempId });
        }
        break; // parar al primer fallo para no perder el orden
      }
    }

    processingRef.current = false;
  }, [chatId]);

  // Procesar al reconectar
  useEffect(() => {
    const unsub = subscribeNetworkStatus(() => {
      const { isOnline } = getNetworkStatus();
      if (isOnline) {
        // Pequeño delay para que la conexión se estabilice
        setTimeout(() => processQueue(), 800);
      }
    });
    return unsub;
  }, [processQueue]);

  // Procesar al montar (por si había mensajes de una sesión anterior)
  useEffect(() => {
    const { isOnline } = getNetworkStatus();
    if (isOnline) {
      setTimeout(() => processQueue(), 500);
    }
  }, [processQueue]);

  return { processQueue, enqueue: enqueueMessage, getQueue: () => getQueueForChat(chatId) };
}
