/**
 * messageStatus.ts — Sistema de lecturas reales (doble check)
 *
 * Flujo real (igual que WhatsApp):
 *  1. Mensaje enviado → status: 'sent'       (un check gris)
 *  2. Mensaje entregado al device → 'delivered' (dos checks grises)
 *  3. Receptor ABRE el chat → llama markChatAsRead() → 'read' (dos checks azules)
 *
 * NO usamos timers falsos. El estado 'read' solo llega cuando el receptor
 * realmente abre el chat y el backend emite el evento via SSE/Supabase.
 */
import type { ChatMessageStatus } from '../../types/chat';
import { getToken, getApiBase } from '../../api';

const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

export function clearMessageStatusTimers(messageId: string) {
  const list = timers.get(messageId);
  if (!list) return;
  list.forEach(clearTimeout);
  timers.delete(messageId);
}

export function clearAllMessageStatusTimers() {
  timers.forEach(list => list.forEach(clearTimeout));
  timers.clear();
}

/**
 * Marca los mensajes de un chat como leídos en el servidor.
 * Llama al endpoint POST /api/chats/:chatId/read-all
 * El backend actualiza la DB y emite evento SSE 'read' a los otros participantes.
 */
export async function markChatAsRead(chatId: string): Promise<void> {
  try {
    const token = await getToken();
    const BASE = getApiBase();
    await fetch(`${BASE}/api/chats/${chatId}/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch { /* silencioso — no bloquear la UI */ }
}

/**
 * Marca un mensaje individual como leído.
 * Usa el endpoint existente POST /api/chats/:chatId/read con el último messageId.
 */
export async function markMessageRead(chatId: string, messageId: string): Promise<void> {
  try {
    const token = await getToken();
    const BASE = getApiBase();
    await fetch(`${BASE}/api/chats/${chatId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId }),
    });
  } catch { /* silencioso */ }
}

/**
 * @deprecated Usar markChatAsRead() + eventos SSE en su lugar.
 * Mantenido por compatibilidad temporal. Ya no programa timers falsos —
 * simplemente llama el endpoint real con un pequeño delay para que el
 * mensaje llegue primero al receptor.
 */
export function scheduleReadReceipt(
  messageId: string,
  _onStatus: (id: string, status: ChatMessageStatus) => void,
  chatId?: string,
) {
  clearMessageStatusTimers(messageId);
  if (!chatId) return;
  // Delay de 500ms para no bloquear el flujo de envío
  const timer = setTimeout(() => markMessageRead(chatId, messageId), 500);
  timers.set(messageId, [timer]);
}
