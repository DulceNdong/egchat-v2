import type { ChatMessageStatus } from '../../types/chat';

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

/** Tras envío exitoso: delivered ya aplicado → read a los 3s (paridad App.tsx web). */
export function scheduleReadReceipt(
  messageId: string,
  onStatus: (id: string, status: ChatMessageStatus) => void,
) {
  clearMessageStatusTimers(messageId);
  const readTimer = setTimeout(() => onStatus(messageId, 'read'), 3000);
  timers.set(messageId, [readTimer]);
}
