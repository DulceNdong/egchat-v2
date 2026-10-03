// ══════════════════════════════════════════════════════════════════
// EGChat — callHistory.ts
// Servicio de historial de llamadas sobre Supabase RPCs
//
// REGLAS:
//  • get_call_history: RPC SECURITY DEFINER, filtra por user_id en DB
//  • log_call_history_message: RPC SECURITY DEFINER, inserta en messages
//  • saveCallMessage() nunca lanza — error silencioso para no romper llamadas
// ══════════════════════════════════════════════════════════════════

import { supabase } from '../supabase';

// ── Tipos públicos ────────────────────────────────────────────────

export type CallHistoryStatus = 'ended' | 'rejected' | 'missed' | 'failed';
export type CallDirection     = 'outgoing' | 'incoming' | 'missed';

export interface CallHistoryEntry {
  call_id:          string;
  call_type:        'audio' | 'video';
  caller_id:        string;
  target_user_id:   string;
  status:           CallHistoryStatus;
  end_reason:       string | null;
  duration_seconds: number | null;
  connected_at:     string | null;
  ended_at:         string | null;
  created_at:       string;
  chat_id:          string | null;
}

export interface SaveCallMessageParams {
  callId:           string;
  chatId:           string;
  callerId:         string;
  calleeId:         string;
  callType:         'audio' | 'video';
  status:           string;
  durationSeconds?: number | null;
  endReason?:       string;
}

/** Metadata estructurada que se guarda en messages.metadata */
export interface CallMessageMetadata {
  callId:           string;
  callType:         'audio' | 'video';
  status:           string;
  duration_seconds: number | null;
  end_reason:       string;
  caller_id:        string;
  callee_id:        string;
}

// ── get_call_history ──────────────────────────────────────────────

/**
 * Devuelve el historial de llamadas paginado para un usuario.
 * La RPC ya garantiza que solo se devuelven llamadas del usuario (seguridad).
 */
export async function getCallHistory(
  userId:  string,
  limit:   number = 50,
  offset:  number = 0,
): Promise<CallHistoryEntry[]> {
  const { data, error } = await supabase.rpc('get_call_history', {
    p_user_id: userId,
    p_limit:   limit,
    p_offset:  offset,
  });

  if (error) {
    console.warn('[callHistory] get_call_history error:', error.message);
    return [];
  }

  return (data as CallHistoryEntry[]) ?? [];
}

// ── log_call_history_message ──────────────────────────────────────

/**
 * Inserta un mensaje de historial de llamada en el hilo del chat.
 * Silencioso en caso de error — nunca debe romper el flujo de llamada.
 */
export async function saveCallMessage(params: SaveCallMessageParams): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_call_history_message', {
      p_call_id:   params.callId,
      p_chat_id:   params.chatId,
      p_caller_id: params.callerId,
      p_callee_id: params.calleeId,
      p_call_type: params.callType,
      p_status:    params.status,
      p_duration:  params.durationSeconds ?? null,
      p_end_reason: params.endReason ?? 'normal',
    });

    if (error) {
      console.warn('[callHistory] log_call_history_message error:', error.message);
    }
  } catch (e) {
    console.warn('[callHistory] saveCallMessage exception:', e);
  }
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Determina la dirección de una llamada desde la perspectiva del usuario.
 * - missed:   el usuario era callee y no contestó
 * - outgoing: el usuario era caller
 * - incoming: el usuario era callee y contestó
 */
export function getCallDirection(
  entry:    CallHistoryEntry,
  myUserId: string,
): CallDirection {
  const isCaller = entry.caller_id === myUserId;
  if (entry.status === 'missed' && !isCaller) return 'missed';
  return isCaller ? 'outgoing' : 'incoming';
}

/**
 * Formatea segundos → "m:ss" (ej. "2:35") o "Xs" si < 1 min.
 */
export function formatCallDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parsea message.metadata de forma segura.
 * Acepta string JSON u objeto directo.
 */
export function parseCallMetadata(
  raw: unknown,
): CallMessageMetadata | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (obj && typeof obj === 'object' && 'callId' in obj) {
      return obj as CallMessageMetadata;
    }
    return null;
  } catch {
    return null;
  }
}
