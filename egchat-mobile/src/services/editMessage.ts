// ══════════════════════════════════════════════════════════════════
// editMessage — editar mensajes enviados con marca "editado"
// ══════════════════════════════════════════════════════════════════
import { getToken, getApiBase } from '../api';

export interface EditResult {
  success: boolean;
  message?: any;
  error?: string;
}

/**
 * Edita el texto de un mensaje enviado.
 * El backend debe exponer PATCH /api/messages/:messageId
 */
export async function editMessage(messageId: string, newText: string): Promise<EditResult> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: newText, edited: true }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
      return { success: false, error: err.message };
    }
    const data = await res.json();
    return { success: true, message: data };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo editar el mensaje' };
  }
}

/** Actualiza localmente la lista de mensajes con el texto editado */
export function applyEditLocally<T extends { id: string; text?: string; edited?: boolean }>(
  messages: T[],
  messageId: string,
  newText: string
): T[] {
  return messages.map(m =>
    m.id === messageId ? { ...m, text: newText, edited: true } : m
  );
}
