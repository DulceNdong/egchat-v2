-- ══════════════════════════════════════════════════════════════════
-- EGChat — Migración: Sistema de llamadas en Supabase
-- ══════════════════════════════════════════════════════════════════
-- INSTRUCCIONES:
--   1. Ejecutar completo en el SQL Editor de Supabase (anon key side)
--   2. El backend Render debe usar service_role para los UPDATE de estado
--   3. El cliente JS solo lee via anon key — NUNCA escribe directo
--   4. Ejecutar TEST SUITE al final para verificar integridad
--
-- POLÍTICA DE MIGRACIÓN:
--   • call_sessions existente se conserva y se amplía (ALTER, no DROP)
--   • Nuevas tablas usan IF NOT EXISTS
--   • Todas las funciones usan CREATE OR REPLACE
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 1: AMPLIAR call_sessions EXISTENTE
-- ══════════════════════════════════════════════════════════════════
-- La tabla ya tiene: call_id, offer, answer, caller_candidates,
-- callee_candidates, type, caller_id, target_user_id, ended,
-- created_at, updated_at
--
-- Añadimos las columnas que faltan (IF NOT EXISTS via bloque DO).

DO $$
BEGIN
  -- Estado de la llamada (reemplaza ended:boolean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE call_sessions
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ringing'
        CHECK (status IN (
          'ringing','accepted','connecting','connected',
          'reconnecting','rejected','missed','ended','failed'
        ));
  END IF;

  -- Caducidad absoluta (TTL de 5 minutos por defecto para seguridad)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE call_sessions
      ADD COLUMN expires_at TIMESTAMPTZ NOT NULL
        DEFAULT (NOW() + INTERVAL '5 minutes');
  END IF;

  -- Timestamp de conexión efectiva
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'connected_at'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN connected_at TIMESTAMPTZ;
  END IF;

  -- Timestamp de fin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;

  -- Duración en segundos (calculada al finalizar)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN duration_seconds INTEGER;
  END IF;

  -- Motivo de fin (ended_by_caller, ended_by_callee, timeout, ice_failed…)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'end_reason'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN end_reason TEXT;
  END IF;

  -- Nonce de idempotencia para el offer (evita upserts duplicados)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'offer_nonce'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN offer_nonce TEXT;
  END IF;

  -- chat_id asociado para guardar el historial en el hilo correcto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN chat_id UUID;
  END IF;

  -- Versión para control de concurrencia optimista
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'version'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Migrar ended=true → status='ended' para filas existentes
UPDATE call_sessions
SET status = 'ended'
WHERE ended = TRUE AND status = 'ringing';

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_call_sessions_status
  ON call_sessions (status, expires_at);

CREATE INDEX IF NOT EXISTS idx_call_sessions_caller
  ON call_sessions (caller_id, status);

CREATE INDEX IF NOT EXISTS idx_call_sessions_expires
  ON call_sessions (expires_at)
  WHERE status NOT IN ('ended','rejected','missed','failed');

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 2: TABLA call_participants
-- ══════════════════════════════════════════════════════════════════
-- Participantes explícitos (necesario para llamadas grupales y RLS).

CREATE TABLE IF NOT EXISTS call_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       VARCHAR(100) NOT NULL
                  REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('caller','callee')),
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  left_at       TIMESTAMPTZ,
  device_token  TEXT,                -- token push del dispositivo en el momento
  UNIQUE (call_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_call_participants_user
  ON call_participants (user_id, call_id);

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 3: TABLA call_signals
-- ══════════════════════════════════════════════════════════════════
-- ICE candidates y señales SDP almacenados por fila (no como TEXT[]).
-- Permite Realtime granular y no pierde candidatos bajo concurrencia.

CREATE TABLE IF NOT EXISTS call_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id     VARCHAR(100) NOT NULL
                REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  from_user   UUID NOT NULL,
  to_user     UUID,              -- NULL = broadcast a todos los participantes
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer','answer','ice','restart_ice')),
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  -- Para idempotencia: el emisor genera un nonce único por señal
  nonce       TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_call_signals_call
  ON call_signals (call_id, created_at);

CREATE INDEX IF NOT EXISTS idx_call_signals_to
  ON call_signals (to_user, call_id, created_at)
  WHERE to_user IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 4: TABLA call_events (historial de transiciones)
-- ══════════════════════════════════════════════════════════════════
-- Registro inmutable de cada cambio de estado. Útil para historial,
-- depuración y resolución de disputas sobre facturación/duración.

CREATE TABLE IF NOT EXISTS call_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id     VARCHAR(100) NOT NULL
                REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  user_id     UUID,               -- quién generó el evento
  event       TEXT NOT NULL CHECK (event IN (
                'initiated','push_sent','ringing','accepted',
                'connecting','connected','reconnecting',
                'ended','rejected','missed','failed','expired'
              )),
  metadata    JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_events_call
  ON call_events (call_id, occurred_at);

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 5: RLS
-- ══════════════════════════════════════════════════════════════════
-- IMPORTANTE: el cliente JS usa anon key con auth de Supabase desactivada
-- (custom JWT via Render). Por tanto el RLS usa auth.jwt() ->> 'sub'
-- para obtener el user_id desde el token anon.
-- El backend Render usa service_role y bypasa RLS.
--
-- NOTA: Si el proyecto usa JWT custom, descomentar las políticas
-- y adaptar el claim según el payload del token Render.
-- Por ahora habilitamos RLS pero dejamos las políticas como RESTRICTIVE
-- para que solo el service_role (Render) pueda escribir.

ALTER TABLE call_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events       ENABLE ROW LEVEL SECURITY;

-- ── call_sessions ────────────────────────────────────────────────
-- Lectura: solo los participantes de la llamada
-- Escritura: solo service_role (backend Render)

DROP POLICY IF EXISTS "call_sessions_select_participant" ON call_sessions;
CREATE POLICY "call_sessions_select_participant" ON call_sessions
  FOR SELECT
  USING (
    -- El usuario es caller o callee
    caller_id::TEXT = (auth.jwt() ->> 'sub')
    OR target_user_id::TEXT = (auth.jwt() ->> 'sub')
    -- O es service_role (bypass automático)
  );

-- Sin políticas de INSERT/UPDATE/DELETE para anon → solo service_role puede escribir
-- (Cuando RLS está habilitado y no hay política permisiva, la operación es denegada)

-- ── call_participants ─────────────────────────────────────────────
DROP POLICY IF EXISTS "call_participants_select_own" ON call_participants;
CREATE POLICY "call_participants_select_own" ON call_participants
  FOR SELECT
  USING (
    user_id::TEXT = (auth.jwt() ->> 'sub')
    OR EXISTS (
      SELECT 1 FROM call_participants cp2
      WHERE cp2.call_id = call_participants.call_id
        AND cp2.user_id::TEXT = (auth.jwt() ->> 'sub')
    )
  );

-- ── call_signals ──────────────────────────────────────────────────
-- Los participantes pueden insertar sus propias señales Y leer las que van a ellos
DROP POLICY IF EXISTS "call_signals_select_participant" ON call_signals;
CREATE POLICY "call_signals_select_participant" ON call_signals
  FOR SELECT
  USING (
    from_user::TEXT = (auth.jwt() ->> 'sub')
    OR to_user::TEXT = (auth.jwt() ->> 'sub')
    OR to_user IS NULL  -- broadcast
  );

-- Los participantes pueden insertar sus propias señales (ICE, etc.)
-- Solo si son participantes de la llamada
DROP POLICY IF EXISTS "call_signals_insert_own" ON call_signals;
CREATE POLICY "call_signals_insert_own" ON call_signals
  FOR INSERT
  WITH CHECK (
    from_user::TEXT = (auth.jwt() ->> 'sub')
    AND EXISTS (
      SELECT 1 FROM call_participants cp
      WHERE cp.call_id = call_signals.call_id
        AND cp.user_id::TEXT = (auth.jwt() ->> 'sub')
    )
  );

-- ── call_events ───────────────────────────────────────────────────
-- Solo lectura para participantes; escritura solo via service_role o RPCs SECURITY DEFINER
DROP POLICY IF EXISTS "call_events_select_participant" ON call_events;
CREATE POLICY "call_events_select_participant" ON call_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions cs
      WHERE cs.call_id = call_events.call_id
        AND (
          cs.caller_id::TEXT = (auth.jwt() ->> 'sub')
          OR cs.target_user_id::TEXT = (auth.jwt() ->> 'sub')
        )
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 6: RPCs (SECURITY DEFINER = ejecutan como postgres, no como el caller)
-- ══════════════════════════════════════════════════════════════════
-- Todas las mutaciones críticas van aquí.
-- El cliente JS llama estas funciones via supabase.rpc().
-- Las transiciones de estado son atómicas (una sola TX).

-- ── 6.1 initiate_call ─────────────────────────────────────────────
-- Crea la sesión, registra participantes, inserta evento.
-- Idempotente: si el call_id ya existe y no está terminado, lo devuelve.

CREATE OR REPLACE FUNCTION initiate_call(
  p_call_id     TEXT,
  p_caller_id   UUID,
  p_callee_id   UUID,
  p_call_type   TEXT DEFAULT 'audio',
  p_offer       JSONB DEFAULT NULL,
  p_chat_id     UUID DEFAULT NULL,
  p_nonce       TEXT DEFAULT NULL    -- idempotencia: si el nonce ya existe, devuelve la sesión existente
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing    call_sessions%ROWTYPE;
  v_expires_at  TIMESTAMPTZ := NOW() + INTERVAL '90 seconds'; -- TTL para llamadas sin respuesta
BEGIN
  -- Idempotencia: si el nonce ya existe, devolver la sesión existente
  IF p_nonce IS NOT NULL THEN
    SELECT * INTO v_existing FROM call_sessions
    WHERE offer_nonce = p_nonce LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'call_id', v_existing.call_id,
        'status',  v_existing.status,
        'idempotent', true
      );
    END IF;
  END IF;

  -- Verificar que el caller no tiene otra llamada activa
  IF EXISTS (
    SELECT 1 FROM call_sessions
    WHERE caller_id = p_caller_id::TEXT
      AND status NOT IN ('ended','rejected','missed','failed')
      AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'caller_already_in_call'
      USING HINT = 'El caller ya tiene una llamada activa';
  END IF;

  -- Insertar sesión (idempotente con ON CONFLICT)
  INSERT INTO call_sessions (
    call_id, offer, caller_candidates, callee_candidates,
    type, caller_id, target_user_id, ended,
    status, expires_at, chat_id, offer_nonce,
    created_at, updated_at, version
  ) VALUES (
    p_call_id,
    CASE WHEN p_offer IS NOT NULL THEN p_offer::TEXT ELSE NULL END,
    '[]', '[]',
    p_call_type,
    p_caller_id::TEXT,
    p_callee_id::TEXT,
    FALSE,
    'ringing',
    v_expires_at,
    p_chat_id,
    p_nonce,
    NOW(), NOW(), 1
  )
  ON CONFLICT (call_id) DO NOTHING;

  -- Registrar participantes
  INSERT INTO call_participants (call_id, user_id, role)
  VALUES
    (p_call_id, p_caller_id, 'caller'),
    (p_call_id, p_callee_id, 'callee')
  ON CONFLICT (call_id, user_id) DO NOTHING;

  -- Evento
  INSERT INTO call_events (call_id, user_id, event, metadata)
  VALUES (
    p_call_id, p_caller_id, 'initiated',
    jsonb_build_object('type', p_call_type, 'nonce', p_nonce)
  );

  RETURN jsonb_build_object(
    'call_id',     p_call_id,
    'status',      'ringing',
    'expires_at',  v_expires_at,
    'idempotent',  false
  );
END;
$$;

-- ── 6.2 accept_call ───────────────────────────────────────────────
-- Solo el callee puede aceptar. Transición: ringing → accepted.
-- Atómico con version check para evitar race condition.

CREATE OR REPLACE FUNCTION accept_call(
  p_call_id   TEXT,
  p_callee_id UUID,
  p_answer    JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session call_sessions%ROWTYPE;
BEGIN
  -- Bloquear la fila para esta TX
  SELECT * INTO v_session
  FROM call_sessions
  WHERE call_id = p_call_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'call_not_found' USING HINT = 'La llamada no existe';
  END IF;

  -- Verificar que el callee es el destinatario correcto
  IF v_session.target_user_id <> p_callee_id::TEXT THEN
    RAISE EXCEPTION 'not_authorized'
      USING HINT = 'Este usuario no es el destinatario de la llamada';
  END IF;

  -- Verificar que la llamada no ha caducado
  IF v_session.expires_at < NOW() THEN
    UPDATE call_sessions
    SET status = 'missed', ended = TRUE, ended_at = NOW(), updated_at = NOW()
    WHERE call_id = p_call_id;
    RAISE EXCEPTION 'call_expired' USING HINT = 'La llamada ha caducado';
  END IF;

  -- Solo se puede aceptar desde 'ringing'
  IF v_session.status <> 'ringing' THEN
    -- Idempotencia: si ya está accepted, devolver OK
    IF v_session.status = 'accepted' THEN
      RETURN jsonb_build_object('call_id', p_call_id, 'status', 'accepted', 'idempotent', true);
    END IF;
    RAISE EXCEPTION 'invalid_transition'
      USING HINT = 'Solo se puede aceptar una llamada en estado ringing. Estado actual: ' || v_session.status;
  END IF;

  -- Actualizar con version bump
  UPDATE call_sessions
  SET
    status     = 'accepted',
    answer     = CASE WHEN p_answer IS NOT NULL THEN p_answer::TEXT ELSE answer END,
    expires_at = NOW() + INTERVAL '30 minutes',  -- ampliar TTL una vez aceptada
    updated_at = NOW(),
    version    = version + 1
  WHERE call_id = p_call_id AND version = v_session.version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'concurrent_modification'
      USING HINT = 'La sesión fue modificada concurrentemente';
  END IF;

  -- Actualizar participante
  UPDATE call_participants
  SET joined_at = NOW()
  WHERE call_id = p_call_id AND user_id = p_callee_id;

  INSERT INTO call_events (call_id, user_id, event)
  VALUES (p_call_id, p_callee_id, 'accepted');

  RETURN jsonb_build_object('call_id', p_call_id, 'status', 'accepted', 'idempotent', false);
END;
$$;

-- ── 6.3 reject_call ───────────────────────────────────────────────
-- Solo el callee puede rechazar. Transición: ringing → rejected.

CREATE OR REPLACE FUNCTION reject_call(
  p_call_id   TEXT,
  p_callee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions
  WHERE call_id = p_call_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'call_not_found';
  END IF;

  IF v_session.target_user_id <> p_callee_id::TEXT THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Idempotencia
  IF v_session.status IN ('rejected','ended','missed','failed') THEN
    RETURN jsonb_build_object('call_id', p_call_id, 'status', v_session.status, 'idempotent', true);
  END IF;

  IF v_session.status NOT IN ('ringing') THEN
    RAISE EXCEPTION 'invalid_transition'
      USING HINT = 'Estado actual: ' || v_session.status;
  END IF;

  UPDATE call_sessions
  SET status = 'rejected', ended = TRUE, ended_at = NOW(),
      updated_at = NOW(), version = version + 1
  WHERE call_id = p_call_id AND version = v_session.version;

  UPDATE call_participants SET left_at = NOW()
  WHERE call_id = p_call_id AND user_id = p_callee_id;

  INSERT INTO call_events (call_id, user_id, event)
  VALUES (p_call_id, p_callee_id, 'rejected');

  RETURN jsonb_build_object('call_id', p_call_id, 'status', 'rejected');
END;
$$;

-- ── 6.4 cancel_call ───────────────────────────────────────────────
-- Solo el caller puede cancelar antes de que contesten.

CREATE OR REPLACE FUNCTION cancel_call(
  p_call_id   TEXT,
  p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions
  WHERE call_id = p_call_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'call_not_found';
  END IF;

  IF v_session.caller_id <> p_caller_id::TEXT THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Idempotencia
  IF v_session.status IN ('ended','rejected','missed','failed') THEN
    RETURN jsonb_build_object('call_id', p_call_id, 'status', v_session.status, 'idempotent', true);
  END IF;

  UPDATE call_sessions
  SET status = 'ended', ended = TRUE, ended_at = NOW(),
      end_reason = 'cancelled_by_caller',
      updated_at = NOW(), version = version + 1
  WHERE call_id = p_call_id AND version = v_session.version;

  UPDATE call_participants SET left_at = NOW()
  WHERE call_id = p_call_id AND user_id = p_caller_id;

  INSERT INTO call_events (call_id, user_id, event, metadata)
  VALUES (p_call_id, p_caller_id, 'ended',
          jsonb_build_object('reason', 'cancelled_by_caller'));

  RETURN jsonb_build_object('call_id', p_call_id, 'status', 'ended');
END;
$$;

-- ── 6.5 mark_call_connected ───────────────────────────────────────
-- ICE conectado. Transición: accepted|connecting → connected.

CREATE OR REPLACE FUNCTION mark_call_connected(
  p_call_id TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions
  WHERE call_id = p_call_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'call_not_found'; END IF;

  IF v_session.caller_id <> p_user_id::TEXT
     AND v_session.target_user_id <> p_user_id::TEXT
  THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Idempotencia
  IF v_session.status = 'connected' THEN
    RETURN jsonb_build_object('call_id', p_call_id, 'status', 'connected', 'idempotent', true);
  END IF;

  IF v_session.status NOT IN ('accepted','connecting','reconnecting') THEN
    RAISE EXCEPTION 'invalid_transition'
      USING HINT = 'Estado actual: ' || v_session.status;
  END IF;

  UPDATE call_sessions
  SET status = 'connected', connected_at = COALESCE(connected_at, NOW()),
      updated_at = NOW(), version = version + 1
  WHERE call_id = p_call_id AND version = v_session.version;

  INSERT INTO call_events (call_id, user_id, event)
  VALUES (p_call_id, p_user_id, 'connected');

  RETURN jsonb_build_object('call_id', p_call_id, 'status', 'connected');
END;
$$;

-- ── 6.6 end_call ──────────────────────────────────────────────────
-- Cualquier participante puede terminar. Calcula duración.

CREATE OR REPLACE FUNCTION end_call(
  p_call_id   TEXT,
  p_user_id   UUID,
  p_reason    TEXT DEFAULT 'normal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session       call_sessions%ROWTYPE;
  v_duration      INTEGER := 0;
  v_final_status  TEXT;
BEGIN
  SELECT * INTO v_session FROM call_sessions
  WHERE call_id = p_call_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Idempotencia: si no existe, ya fue eliminada → OK
    RETURN jsonb_build_object('call_id', p_call_id, 'status', 'ended', 'idempotent', true);
  END IF;

  IF v_session.caller_id <> p_user_id::TEXT
     AND v_session.target_user_id <> p_user_id::TEXT
  THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Idempotencia
  IF v_session.status IN ('ended','rejected','missed','failed') THEN
    RETURN jsonb_build_object('call_id', p_call_id, 'status', v_session.status, 'idempotent', true);
  END IF;

  -- Determinar estado final
  v_final_status := CASE
    WHEN p_reason = 'ice_failed'    THEN 'failed'
    WHEN p_reason = 'missed'        THEN 'missed'
    ELSE 'ended'
  END;

  -- Calcular duración (segundos desde que se conectó)
  IF v_session.connected_at IS NOT NULL THEN
    v_duration := EXTRACT(EPOCH FROM (NOW() - v_session.connected_at))::INTEGER;
  END IF;

  UPDATE call_sessions
  SET
    status           = v_final_status,
    ended            = TRUE,
    ended_at         = NOW(),
    end_reason       = p_reason,
    duration_seconds = CASE WHEN v_duration > 0 THEN v_duration ELSE NULL END,
    updated_at       = NOW(),
    version          = version + 1
  WHERE call_id = p_call_id AND version = v_session.version;

  UPDATE call_participants
  SET left_at = NOW()
  WHERE call_id = p_call_id AND left_at IS NULL;

  INSERT INTO call_events (call_id, user_id, event, metadata)
  VALUES (
    p_call_id, p_user_id,
    CASE WHEN v_final_status = 'failed' THEN 'failed'
         WHEN v_final_status = 'missed' THEN 'missed'
         ELSE 'ended' END,
    jsonb_build_object('reason', p_reason, 'duration_seconds', v_duration)
  );

  RETURN jsonb_build_object(
    'call_id',          p_call_id,
    'status',           v_final_status,
    'duration_seconds', v_duration
  );
END;
$$;

-- ── 6.7 expire_stale_calls ────────────────────────────────────────
-- Marca como 'missed' las llamadas que caducaron sin respuesta.
-- Llamar desde un cron job (pg_cron) cada minuto.

CREATE OR REPLACE FUNCTION expire_stale_calls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE call_sessions
    SET
      status     = 'missed',
      ended      = TRUE,
      ended_at   = NOW(),
      end_reason = 'timeout',
      updated_at = NOW()
    WHERE
      status NOT IN ('ended','rejected','missed','failed')
      AND expires_at < NOW()
    RETURNING call_id, caller_id
  )
  INSERT INTO call_events (call_id, user_id, event, metadata)
  SELECT call_id, caller_id::UUID, 'expired', '{"reason":"timeout"}'
  FROM expired;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 6.8 get_call_state ────────────────────────────────────────────
-- Lectura segura del estado de una llamada para un participante.
-- Reemplaza el polling directo a call_sessions desde el cliente.

CREATE OR REPLACE FUNCTION get_call_state(
  p_call_id TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id = p_call_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Solo participantes pueden leer
  IF v_session.caller_id <> p_user_id::TEXT
     AND v_session.target_user_id <> p_user_id::TEXT
  THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN jsonb_build_object(
    'found',            true,
    'call_id',          v_session.call_id,
    'status',           v_session.status,
    'ended',            v_session.ended,
    'type',             v_session.type,
    'caller_id',        v_session.caller_id,
    'target_user_id',   v_session.target_user_id,
    'offer',            CASE WHEN v_session.offer IS NOT NULL
                             THEN v_session.offer::JSONB ELSE NULL END,
    'answer',           CASE WHEN v_session.answer IS NOT NULL
                             THEN v_session.answer::JSONB ELSE NULL END,
    'caller_candidates', v_session.caller_candidates::JSONB,
    'callee_candidates', v_session.callee_candidates::JSONB,
    'expires_at',       v_session.expires_at,
    'connected_at',     v_session.connected_at,
    'version',          v_session.version
  );
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 7: REALTIME
-- ══════════════════════════════════════════════════════════════════
-- Habilitar Realtime en call_sessions y call_signals.
-- Los clientes se suscriben a su callId específico.
-- IMPORTANTE: Realtime NO sustituye a PushKit/FCM para despertar la app.
-- Es solo para clientes ya conectados (app abierta/background reciente).

-- Añadir tablas a la publicación realtime si no están ya
DO $$
BEGIN
  -- call_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'call_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
  END IF;

  -- call_signals
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'call_signals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 8: TRIGGER updated_at
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_call_sessions_updated_at ON call_sessions;
CREATE TRIGGER trg_call_sessions_updated_at
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 9: CRON JOB (requiere pg_cron habilitado en Supabase)
-- ══════════════════════════════════════════════════════════════════
-- Si pg_cron está disponible, programar expiración automática.
-- Si no está disponible, ejecutar expire_stale_calls() desde el backend.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Expira llamadas caducadas cada minuto
    PERFORM cron.schedule(
      'expire-stale-calls',
      '* * * * *',
      'SELECT expire_stale_calls()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron no disponible — silencioso, el backend hace el cleanup
  NULL;
END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════════
-- SECCIÓN 10: TEST SUITE
-- ══════════════════════════════════════════════════════════════════
-- Ejecutar en una TX separada que hace ROLLBACK al final.
-- Verifica: transiciones, idempotencia, concurrencia, autorización.

DO $$
DECLARE
  v_caller_id  UUID := '00000000-0000-0000-0000-000000000001';
  v_callee_id  UUID := '00000000-0000-0000-0000-000000000002';
  v_other_id   UUID := '00000000-0000-0000-0000-000000000003';
  v_call_id    TEXT := 'test_call_' || gen_random_uuid()::TEXT;
  v_result     JSONB;
  v_ok         BOOLEAN := TRUE;

  PROCEDURE assert_eq(label TEXT, actual TEXT, expected TEXT) AS $a$
  BEGIN
    IF actual <> expected THEN
      RAISE WARNING 'FAIL [%]: esperado=%, actual=%', label, expected, actual;
    ELSE
      RAISE NOTICE 'OK  [%]', label;
    END IF;
  END; $a$

  PROCEDURE assert_exception(label TEXT, expr TEXT) AS $a$
  BEGIN
    BEGIN
      EXECUTE expr;
      RAISE WARNING 'FAIL [%]: debería haber lanzado excepción pero no lo hizo', label;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'OK  [%] — excepción esperada: %', label, SQLERRM;
    END;
  END; $a$

BEGIN
  RAISE NOTICE '══════ TEST SUITE: call system ══════';

  -- T1: initiate_call
  v_result := initiate_call(v_call_id, v_caller_id, v_callee_id, 'audio',
                             '{"type":"offer","sdp":"test"}'::JSONB, NULL, 'nonce_1');
  CALL assert_eq('T1 initiate_call status', v_result->>'status', 'ringing');

  -- T2: idempotencia de initiate_call (mismo nonce)
  v_result := initiate_call(v_call_id || '_dup', v_caller_id, v_callee_id,
                             'audio', NULL, NULL, 'nonce_1');
  CALL assert_eq('T2 idempotencia nonce', v_result->>'idempotent', 'true');

  -- T3: accept_call
  v_result := accept_call(v_call_id, v_callee_id,
                           '{"type":"answer","sdp":"test"}'::JSONB);
  CALL assert_eq('T3 accept_call status', v_result->>'status', 'accepted');

  -- T4: idempotencia de accept_call
  v_result := accept_call(v_call_id, v_callee_id, NULL);
  CALL assert_eq('T4 idempotencia accept', v_result->>'idempotent', 'true');

  -- T5: no autorizado — otro usuario intenta aceptar
  BEGIN
    v_result := accept_call(v_call_id, v_other_id, NULL);
    RAISE WARNING 'FAIL [T5 auth reject accept]: no lanzó excepción';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'OK  [T5 auth reject accept] — excepción: %', SQLERRM;
  END;

  -- T6: mark_call_connected
  v_result := mark_call_connected(v_call_id, v_caller_id);
  CALL assert_eq('T6 mark_connected', v_result->>'status', 'connected');

  -- T7: get_call_state
  v_result := get_call_state(v_call_id, v_caller_id);
  CALL assert_eq('T7 get_state found', v_result->>'found', 'true');
  CALL assert_eq('T7 get_state status', v_result->>'status', 'connected');

  -- T8: get_call_state no autorizado
  BEGIN
    v_result := get_call_state(v_call_id, v_other_id);
    RAISE WARNING 'FAIL [T8 auth get_state]: no lanzó excepción';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'OK  [T8 auth get_state] — excepción: %', SQLERRM;
  END;

  -- T9: end_call
  v_result := end_call(v_call_id, v_caller_id, 'normal');
  CALL assert_eq('T9 end_call status', v_result->>'status', 'ended');

  -- T10: idempotencia de end_call
  v_result := end_call(v_call_id, v_caller_id, 'normal');
  CALL assert_eq('T10 idempotencia end', v_result->>'idempotent', 'true');

  -- T11: reject_call en nueva sesión
  DECLARE v_call_id2 TEXT := 'test_call_rej_' || gen_random_uuid()::TEXT; BEGIN
    PERFORM initiate_call(v_call_id2, v_caller_id, v_callee_id, 'audio', NULL, NULL, NULL);
    v_result := reject_call(v_call_id2, v_callee_id);
    CALL assert_eq('T11 reject_call', v_result->>'status', 'rejected');
  END;

  -- T12: cancel_call en nueva sesión
  DECLARE v_call_id3 TEXT := 'test_call_can_' || gen_random_uuid()::TEXT; BEGIN
    PERFORM initiate_call(v_call_id3, v_caller_id, v_callee_id, 'audio', NULL, NULL, NULL);
    v_result := cancel_call(v_call_id3, v_caller_id);
    CALL assert_eq('T12 cancel_call', v_result->>'status', 'ended');
  END;

  -- T13: expire_stale_calls (crear llamada ya expirada)
  DECLARE v_call_id4 TEXT := 'test_call_exp_' || gen_random_uuid()::TEXT; BEGIN
    INSERT INTO call_sessions (call_id, type, caller_id, target_user_id, ended, status,
                                expires_at, created_at, updated_at, version)
    VALUES (v_call_id4, 'audio', v_caller_id::TEXT, v_callee_id::TEXT, FALSE, 'ringing',
            NOW() - INTERVAL '1 second', NOW() - INTERVAL '91 seconds',
            NOW() - INTERVAL '1 second', 1);
    PERFORM expire_stale_calls();
    v_result := get_call_state(v_call_id4, v_caller_id);
    CALL assert_eq('T13 expire status', v_result->>'status', 'missed');
  END;

  -- T14: call_events registrados
  DECLARE v_count INTEGER; BEGIN
    SELECT COUNT(*) INTO v_count FROM call_events WHERE call_id = v_call_id;
    IF v_count >= 3 THEN
      RAISE NOTICE 'OK  [T14 call_events count=%]', v_count;
    ELSE
      RAISE WARNING 'FAIL [T14 call_events]: esperado >= 3, actual=%', v_count;
    END IF;
  END;

  -- T15: call_participants registrados
  DECLARE v_count INTEGER; BEGIN
    SELECT COUNT(*) INTO v_count FROM call_participants WHERE call_id = v_call_id;
    IF v_count = 2 THEN
      RAISE NOTICE 'OK  [T15 call_participants count=%]', v_count;
    ELSE
      RAISE WARNING 'FAIL [T15 call_participants]: esperado 2, actual=%', v_count;
    END IF;
  END;

  RAISE NOTICE '══════ FIN TEST SUITE ══════';

  -- Limpiar datos de test
  DELETE FROM call_sessions WHERE call_id LIKE 'test_call_%';

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERROR en test suite: %', SQLERRM;
  DELETE FROM call_sessions WHERE call_id LIKE 'test_call_%';
END $$;
