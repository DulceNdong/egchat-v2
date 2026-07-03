// Cliente Supabase para React Native
// Usado para: Realtime subscriptions (mensajes en tiempo real)
// NO usado para: auth (usamos JWT custom via Render API)

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from './types/chat';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dptpdifjqgzccjauhodq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,  // No usamos Supabase Auth
    persistSession: false,    // No usamos Supabase Auth
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ── Suscripción a mensajes nuevos en un chat ──────────────────────
export const subscribeToChat = (
  chatId: string,
  onNewMessage: (message: ChatMessage, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  const channel = supabase
    .channel(`chat:${chatId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const message = event === 'DELETE' ? payload.old : payload.new;
        onNewMessage(message as ChatMessage, event);
      }
    );

  // IMPORTANTE: subscribe() debe llamarse DESPUÉS de todos los .on()
  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn('[Supabase] Error en canal chat:', chatId);
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
};

// ── Suscripción a actualizaciones de chats del usuario ───────────
export const subscribeToUserChats = (
  userId: string,
  onChatUpdated: () => void
) => {
  const channel = supabase
    .channel(`user-chats:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id=eq.${userId}`,
      },
      () => onChatUpdated()
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
      },
      () => onChatUpdated()
    );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

const getPresenceUserIds = (state: Record<string, Array<{ user_id?: string }>>) =>
  Object.entries(state).flatMap(([key, presences]) =>
    presences.map(presence => presence.user_id || key),
  );

const getOnlineUsersChannel = () =>
  supabase.getChannels().find(channel =>
    String((channel as { topic?: string }).topic || '').endsWith('online-users'),
  );

export const trackUserPresence = (userId: string) => {
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });

  return () => {
    channel.untrack();
    supabase.removeChannel(channel);
  };
};

export const subscribeToOnlineUsers = (
  onSync: (onlineUserIds: string[]) => void,
) => {
  const readPresence = () => {
    const channel = getOnlineUsersChannel();
    if (!channel) {
      onSync([]);
      return;
    }

    onSync(getPresenceUserIds(
      channel.presenceState() as Record<string, Array<{ user_id?: string }>>,
    ));
  };

  readPresence();
  const interval = setInterval(readPresence, 3000);

  return () => {
    clearInterval(interval);
  };
};

export const createChatTypingChannel = (
  chatId: string,
  currentUserId: string,
  onTyping: (isTyping: boolean, userId: string) => void,
) => {
  const channel = supabase
    .channel(`chat-typing:${chatId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      const userId = String(payload?.user_id || '');
      if (!userId || userId === currentUserId) return;
      onTyping(!!payload?.is_typing, userId);
    });

  channel.subscribe();

  return {
    sendTyping: (isTyping: boolean) =>
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chat_id: chatId,
          user_id: currentUserId,
          is_typing: isTyping,
          ts: Date.now(),
        },
      }),
    unsubscribe: () => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chat_id: chatId,
          user_id: currentUserId,
          is_typing: false,
          ts: Date.now(),
        },
      });
      supabase.removeChannel(channel);
    },
  };
};
