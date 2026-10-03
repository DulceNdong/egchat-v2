-- ══════════════════════════════════════════════════════════════════
-- EGChat — Historial de llamadas: RPCs y schema
-- Ejecutar en Supabase SQL Editor
-- Seguro de re-ejecutar (CREATE OR REPLACE / IF NOT EXISTS)
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── Columna metadata en messages (si no existe) ──────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- ── Índices para historial ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_call_sessions_history_caller
  ON call_sessions (caller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_sessions_history_callee
  ON call_sessions (target_user_id, status, created_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- RPC: get_call_history
-- Devuelve historial paginado de llamadas finalizadas para un usuario.
-- Solo devuelve llamadas donde p_user_id es caller o callee (seguridad).
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_call_history(
  p_user_id UUID,
  p_limit   INT DEFAULT 50,
  p_offset  INT DEFAULT 0
)
RETURNS TABLE (
  call_id          TEXT,
  call_type        TEXT,
  caller_id        TEXT,
  target_user_id   TEXT,
  status           TEXT,
  end_reason       TEXT,
  duration_seconds INT,
  connected_at     TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ,
  chat_id          UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar límites para evitar abuso
  p_limit  := LEAST(GREATEST(p_limit,  1),  200);
  p_offset := GREATEST(p_offset, 0);

  RETURN QUERY
    SELECT
      cs.call_id,
      cs.type          AS call_type,
      cs.caller_id::TEXT,
      cs.target_user_id::TEXT,
      cs.status,
      cs.end_reason,
      cs.duration_seconds,
      cs.connected_at,
      cs.ended_at,
      cs.created_at,
      cs.chat_id
    FROM call_sessions cs
    WHERE
      (cs.caller_id::TEXT = p_user_id::TEXT
       OR cs.target_user_id::TEXT = p_user_id::TEXT)
      AND cs.status IN ('ended', 'rejected', 'missed', 'failed')
    ORDER BY cs.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- RPC: log_call_history_message
-- Inserta un mensaje tipo 'call' en messages con metadata estructurada.
-- SECURITY DEFINER para bypasear RLS del cliente en la tabla messages.
-- Idempotente: ON CONFLICT DO NOTHING.
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION log_call_history_message(
  p_call_id    TEXT,
  p_chat_id    UUID,
  p_caller_id  UUID,
  p_callee_id  UUID,
  p_call_type  TEXT DEFAULT 'audio',
  p_status     TEXT DEFAULT 'ended',
  p_duration   INT  DEFAULT NULL,
  p_end_reason TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id UUID := gen_random_uuid();
  v_text   TEXT;
BEGIN
  -- Texto legible para clientes legacy / notificaciones
  v_text := CASE
    WHEN p_status = 'missed' THEN
      CASE WHEN p_call_type = 'video'
        THEN '📹 Llamada de vídeo perdida'
        ELSE '📞 Llamada perdida'
      END
    WHEN p_status = 'rejected' THEN
      CASE WHEN p_call_type = 'video'
        THEN '📹 Llamada de vídeo rechazada'
        ELSE '📞 Llamada rechazada'
      END
    WHEN p_status = 'failed' THEN
      CASE WHEN p_call_type = 'video'
        THEN '📹 Llamada de vídeo fallida'
        ELSE '📞 Llamada fallida'
      END
    WHEN p_end_reason = 'cancelled_by_caller' THEN
      CASE WHEN p_call_type = 'video'
        THEN '📹 Llamada de vídeo cancelada'
        ELSE '📞 Llamada cancelada'
      END
    ELSE
      CASE WHEN p_call_type = 'video'
        THEN '📹 Llamada de vídeo'
        ELSE '📞 Llamada de voz'
      END
      || CASE
           WHEN p_duration IS NOT NULL AND p_duration > 0
           THEN ' (' || (p_duration / 60)::TEXT || ':' || LPAD((p_duration % 60)::TEXT, 2, '0') || ')'
           ELSE ''
         END
  END;

  INSERT INTO messages (
    id, chat_id, sender_id, text, type, metadata, created_at, updated_at
  ) VALUES (
    v_msg_id,
    p_chat_id,
    p_caller_id,
    v_text,
    'call',
    jsonb_build_object(
      'callId',           p_call_id,
      'callType',         p_call_type,
      'status',           p_status,
      'duration_seconds', p_duration,
      'end_reason',       p_end_reason,
      'caller_id',        p_caller_id::TEXT,
      'callee_id',        p_callee_id::TEXT
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN v_msg_id;
EXCEPTION WHEN OTHERS THEN
  -- No romper la llamada si falla el historial
  RETURN NULL;
END;
$$;

COMMIT;

-- ══════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ══════════════════════════════════════════════════════════════════
SELECT 'get_call_history OK' WHERE EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'get_call_history'
);
SELECT 'log_call_history_message OK' WHERE EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'log_call_history_message'
);
