// ══════════════════════════════════════════════════════════════════
// EGChat — callSupabase.ts
// Cliente de Supabase para el sistema de llamadas
//
// REGLAS:
//  • Solo lectura via RPC get_call_state (anon key)
//  • Escritura de señales SDP/ICE via INSERT en call_signals (anon + RLS)
//  • Todas las mutaciones de estado van al backend Render (que usa service_role)
//  • Realtime se usa para llamadas ya conectadas (no para despertar la app)
//  • NUNCA service_role en el cliente
// ══════════════════════════════════════════════════════════════════

import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Tipos ─────────────────────────────────────────────────────────

export type CallStatus =
  | 'ringing' | 'accepted' | 'connecting' | 'connected'
  | 'reconnecting' | 'rejected' | 'missed' | 'ended' | 'failed';

export interface CallState {
  found: boolean;
  call_id?: string;
  status?: CallStatus;
  ended?: boolean;
  type?: 'audio' | 'video';
  caller_id?: string;
  target_user_id?: string;
  offer?: object | null;
  answer?: object | null;
  caller_candidates?: object[];
  callee_candidates?: object[];
  expires_at?: string;
  connected_at?: string | null;
  version?: number;
}

export interface CallSignalPayload {
  call_id: string;
  from_user: string;
  to_user?: string;
  signal_type: 'offer' | 'answer' | 'ice' | 'restart_ice';
  payload: object;
  nonce?: string;
}

// ── Terminal states ────────────────────────────────────────────────
export const TERMINAL_STATES: CallStatus[] = ['ended', 'rejected', 'missed', 'failed'];
export const isTerminal = (status?: CallStatus) =>
  status != null && TERMINAL_STATES.includes(status);

// ══════════════════════════════════════════════════════════════════
// LECTURA DE ESTADO VIA RPC
// ══════════════════════════════════════════════════════════════════

/**
 * Lee el estado de una llamada de forma segura via RPC.
 * Solo los participantes pueden leer su propia llamada.
 */
export async function getCallState(
  callId: string,
  userId: string,
): Promise<CallState> {
  const { data, error } = await supabase.rpc('get_call_state', {
    p_call_id: callId,
    p_user_id: userId,
  });

  if (error) throw new Error(`get_call_state: ${error.message}`);
  return data as CallState;
}

// ══════════════════════════════════════════════════════════════════
// SEÑALIZACIÓN VIA call_signals (cliente → Supabase directo)
// ══════════════════════════════════════════════════════════════════

/**
 * Inserta una señal ICE/SDP en call_signals.
 * El receptor la recibe via Realtime o polling.
 * Idempotente: si el nonce ya existe, no falla (UNIQUE en DB).
 */
export async function insertCallSignal(signal: CallSignalPayload): Promise<void> {
  const { error } = await supabase.from('call_signals').insert({
    call_id:     signal.call_id,
    from_user:   signal.from_user,
    to_user:     signal.to_user ?? null,
    signal_type: signal.signal_type,
    payload:     signal.payload,
    nonce:       signal.nonce ?? null,
  });

  // Ignorar error de unicidad (nonce duplicado = idempotencia)
  if (error && !error.message.includes('duplicate') && !error.code?.includes('23505')) {
    throw new Error(`insertCallSignal: ${error.message}`);
  }
}

/**
 * Lee las señales pendientes para el usuario en una llamada.
 * Para usar como fallback cuando Realtime no está disponible.
 */
export async function getPendingSignals(
  callId: string,
  userId: string,
  afterId?: string,   // paginación por ID para no re-leer señales ya procesadas
): Promise<any[]> {
  let query = supabase
    .from('call_signals')
    .select('*')
    .eq('call_id', callId)
    .or(`to_user.eq.${userId},to_user.is.null`)
    .order('created_at', { ascending: true });

  if (afterId) {
    // Traer solo señales más nuevas que la última procesada
    query = query.gt('id', afterId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getPendingSignals: ${error.message}`);
  return data ?? [];
}

// ══════════════════════════════════════════════════════════════════
// REALTIME — Solo para clientes conectados (app abierta)
// ══════════════════════════════════════════════════════════════════

/**
 * Suscribe a cambios de estado de la llamada via Realtime.
 *
 * IMPORTANTE: Realtime requiere que la app esté activa.
 * Para despertar apps suspendidas/terminadas usa PushKit (iOS) o FCM (Android).
 *
 * Devuelve función de cleanup.
 */
export function subscribeToCallState(
  callId: string,
  onStatusChange: (status: CallStatus) => void,
  onEnded: () => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`call-state:${callId}`, {
      config: { broadcast: { self: false } },
    })
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'call_sessions',
        filter: `call_id=eq.${callId}`,
      },
      (payload) => {
        const row = payload.new as { status?: CallStatus; ended?: boolean };
        if (!row.status) return;
        onStatusChange(row.status);
        if (isTerminal(row.status) || row.ended) {
          onEnded();
        }
      },
    );

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn(`[callSupabase] Error en canal call-state:${callId}`);
    }
  });

  return () => { supabase.removeChannel(channel); };
}

/**
 * Suscribe a nuevas señales ICE/SDP via Realtime.
 * Se usa en paralelo al polling del backend para máxima velocidad.
 *
 * Devuelve función de cleanup.
 */
export function subscribeToCallSignals(
  callId: string,
  myUserId: string,
  onSignal: (signal: any) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`call-signals:${callId}:${myUserId}`, {
      config: { broadcast: { self: false } },
    })
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'call_signals',
        filter: `call_id=eq.${callId}`,
      },
      (payload) => {
        const row = payload.new as any;
        // Filtrar: solo señales para mí o broadcast
        if (row.to_user && row.to_user !== myUserId) return;
        // No procesar las propias
        if (row.from_user === myUserId) return;
        onSignal(row);
      },
    );

  channel.subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ══════════════════════════════════════════════════════════════════
// HELPERS DE ESTADO
// ══════════════════════════════════════════════════════════════════

/**
 * Convierte el status de Supabase al CallCommState del CallManager.
 * Supabase es la fuente de verdad; el CallManager usa esto para sincronizar.
 */
export function supabaseStatusToCommState(status: CallStatus) {
  // Los nombres son idénticos en ambos sistemas — mapeo directo
  return status;
}

/**
 * Verifica si una llamada ha caducado (cliente-side, sin consultar DB).
 */
export function isCallExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
