/**
 * transferEvents.ts — Canal de eventos para transferencias resueltas
 *
 * Cuando IncomingTransferModal (en _layout.tsx) acepta o rechaza una
 * transferencia, emite un evento aquí. El chat [id].tsx lo escucha y
 * actualiza el texto del mensaje pendiente para quitar los botones.
 */

type TransferResolvedListener = (payload: {
  transferId: string;
  status: 'accepted' | 'cancelled';
}) => void;

const listeners = new Set<TransferResolvedListener>();

export function onTransferResolved(fn: TransferResolvedListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitTransferResolved(transferId: string, status: 'accepted' | 'cancelled') {
  listeners.forEach(fn => fn({ transferId, status }));
}
