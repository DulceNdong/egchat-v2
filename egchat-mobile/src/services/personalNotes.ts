// ══════════════════════════════════════════════════════════════════
// personalNotes — chat de notas personales (consigo mismo)
// ══════════════════════════════════════════════════════════════════
import { chatAPI, authAPI, getToken, getApiBase } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_CHAT_KEY = 'egchat_notes_chat_id';

export async function getOrCreateNotesChat(): Promise<string | null> {
  try {
    // 1. ID cacheado localmente
    const cached = await AsyncStorage.getItem(NOTES_CHAT_KEY);
    if (cached) return cached;

    const me = await authAPI.me();
    if (!me?.id) return null;

    // 2. Buscar en chats existentes uno que sea de notas (solo yo)
    try {
      const chats = await chatAPI.getChats();
      const notesChat = chats.find((c: any) =>
        c.type === 'private' &&
        Array.isArray(c.participants) &&
        c.participants.length <= 2 &&
        c.participants.every((p: any) => String(p.user_id) === String(me.id))
      );
      if (notesChat?.id) {
        await AsyncStorage.setItem(NOTES_CHAT_KEY, notesChat.id);
        return notesChat.id;
      }
    } catch {}

    // 3. Crear via endpoint dedicado /api/chats/notes
    try {
      const token = await getToken();
      const base  = getApiBase();
      const res = await fetch(`${base}/api/chats/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          await AsyncStorage.setItem(NOTES_CHAT_KEY, data.id);
          return data.id;
        }
      }
    } catch {}

    // 4. Fallback: crear chat privado con un nombre especial
    try {
      const token = await getToken();
      const base  = getApiBase();
      const res = await fetch(`${base}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'private',
          participantIds: [me.id],
          name: '📝 Mis Notas',
          isNotesChat: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          await AsyncStorage.setItem(NOTES_CHAT_KEY, data.id);
          return data.id;
        }
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

/** Borra el ID cacheado (útil al cerrar sesión) */
export async function clearNotesChatCache(): Promise<void> {
  await AsyncStorage.removeItem(NOTES_CHAT_KEY).catch(() => {});
}
