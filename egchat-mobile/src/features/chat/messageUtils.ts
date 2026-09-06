import type { ChatMessage } from '../../types/chat';

const TEMP_PREFIX = 'temp-';

const getTime = (message: ChatMessage) => {
  const time = new Date(message.created_at).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const createTempMessageId = () =>
  `${TEMP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const isTempMessage = (messageId: string) => messageId.startsWith(TEMP_PREFIX);

export function normalizeMessage(raw: ChatMessage): ChatMessage {
  const status = raw.status ?? 'delivered';
  const imageUrl = raw.imageUrl ?? (raw.type === 'image' ? raw.file_url : undefined);

  return {
    ...raw,
    status,
    imageUrl,
  };
}

export function normalizeMessages(messages: ChatMessage[] = []) {
  return messages.map(normalizeMessage);
}

export function sortMessagesByCreatedAt(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => getTime(a) - getTime(b));
}

export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
  options?: { replaceAll?: boolean },
) {
  const byId = new Map<string, ChatMessage>();

  for (const message of current) {
    byId.set(message.id, normalizeMessage(message));
  }

  // Cuando replaceAll=true (respuesta de polling con lista completa), los IDs
  // no presentes en `incoming` son mensajes borrados — eliminarlos del mapa.
  if (options?.replaceAll) {
    const incomingIds = new Set(incoming.map(m => m.id));
    // Solo comparar mensajes no temporales (los temp siempre viven en current)
    for (const id of byId.keys()) {
      if (!isTempMessage(id) && !incomingIds.has(id)) {
        byId.delete(id);
      }
    }
  }

  for (const message of incoming) {
    const normalized = normalizeMessage(message);
    // Ignorar mensajes con soft-delete — no deben aparecer en la UI
    if ((normalized as any).deleted_at) {
      byId.delete(normalized.id);
      continue;
    }
    const existing = byId.get(normalized.id);
    byId.set(normalized.id, existing ? { ...existing, ...normalized } : normalized);
  }

  return sortMessagesByCreatedAt([...byId.values()]);
}

export function replaceTempMessage(
  messages: ChatMessage[],
  tempId: string,
  realMessage: ChatMessage,
) {
  const normalized = normalizeMessage({ ...realMessage, status: realMessage.status ?? 'delivered' });
  const withoutDuplicate = messages.filter(
    message => message.id !== normalized.id || message.id === tempId,
  );

  return sortMessagesByCreatedAt(
    withoutDuplicate.map(message => (message.id === tempId ? normalized : message)),
  );
}

export function markMessageFailed(messages: ChatMessage[], tempId: string) {
  return messages.map(message =>
    message.id === tempId ? { ...message, status: 'failed' as const } : message,
  );
}

export function getLastReadableMessageId(messages: ChatMessage[], currentUserId: string) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!isTempMessage(message.id) && message.sender_id !== currentUserId) {
      return message.id;
    }
  }

  return undefined;
}
