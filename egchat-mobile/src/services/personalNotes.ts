// ══════════════════════════════════════════════════════════════════
// personalNotes — chat con uno mismo (notas personales)
// Crea/obtiene el chat privado del usuario consigo mismo
// ══════════════════════════════════════════════════════════════════
import { chatAPI, authAPI, getToken, getApiBase } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_CHAT_KEY = 'egchat_notes_chat_id';

/**
 * Obtiene el ID del chat de notas personales.
 * Si no existe, lo crea.
 */
export async function getOrCreateNotesChat(): Promise<string | null> {
  try {
    // Ver si ya tenemos el ID guardado
    const cached = await AsyncStorage.getItem(NOTES_CHAT_KEY);
    if (cached) return cached;

    // Obtener mi usuario
    const me = await authAPI.me();
    if (!me?.id) return null;

    // Intentar crear un chat privado consigo mismo
    try {
      const chat = await chatAPI.createPrivate(me.id);
      if (chat?.id) {
        await AsyncStorage.setItem(NOTES_CHAT_KEY, chat.id);
        return chat.id;
      }
    } catch {}

    // Fallback: buscar en la lista de chats uno que solo tenga al usuario actual
    const chats = await chatAPI.getChats();
    const notesChat = chats.find((c: any) =>
      c.type === 'private' &&
      c.participants?.every((p: any) => p.user_id === me.id) &&
      c.participants?.length === 1
    );
    if (notesChat?.id) {
      await AsyncStorage.setItem(NOTES_CHAT_KEY, notesChat.id);
      return notesChat.id;
    }

    return null;
  } catch {
    return null;
  }
}
