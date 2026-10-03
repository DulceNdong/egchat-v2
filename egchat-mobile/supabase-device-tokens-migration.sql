-- ══════════════════════════════════════════════════════════════════
-- EGChat — Migración: Tabla de dispositivos y tokens push
--
-- CONSERVA: expo_push_tokens existente (se amplía)
-- CONSERVA: push_subscriptions existente (Web Push, no tocar)
-- AÑADE:    device_push_tokens (tabla unificada con tipo de token)
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. AMPLIAR expo_push_tokens EXISTENTE
--    Sin DROP — solo ALTER para compatibilidad hacia atrás
-- ══════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- token_type: distingue expo / fcm / apns / voip
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'token_type'
  ) THEN
    ALTER TABLE expo_push_tokens
      ADD COLUMN token_type TEXT NOT NULL DEFAULT 'expo'
        CHECK (token_type IN ('expo','fcm','apns','voip'));
  END IF;

  -- device_id: fingerprint del dispositivo (para multi-device)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE expo_push_tokens ADD COLUMN device_id TEXT;
  END IF;

  -- is_active: permite invalidar tokens sin borrarlos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE expo_push_tokens ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- last_used_at: para limpieza de tokens inactivos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE expo_push_tokens ADD COLUMN last_used_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE expo_push_tokens ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- failure_count: para detectar tokens inválidos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expo_push_tokens' AND column_name = 'failure_count'
  ) THEN
    ALTER TABLE expo_push_tokens ADD COLUMN failure_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_active
  ON expo_push_tokens (user_id, is_active, token_type)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_device
  ON expo_push_tokens (user_id, device_id)
  WHERE device_id IS NOT NULL;

-- Marcar tokens Expo existentes con token_type = 'expo'
UPDATE expo_push_tokens
SET token_type = 'expo'
WHERE token LIKE 'ExponentPushToken[%]'
  AND token_type = 'expo';

-- ══════════════════════════════════════════════════════════════════
-- 2. TABLA push_delivery_log
--    Registro de intentos de entrega. No almacena tokens ni secretos.
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS push_delivery_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id      TEXT,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  -- NO guardamos el token completo — solo últimos 8 chars para debug
  token_suffix TEXT,
  token_type   TEXT,
  platform     TEXT,
  channel      TEXT,          -- 'voip' | 'fcm' | 'expo' | 'web'
  status       TEXT NOT NULL CHECK (status IN ('sent','failed','invalid_token','no_token')),
  error_code   TEXT,          -- código de error sin PII
  attempt      INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_delivery_call
  ON push_delivery_log (call_id, delivered_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_delivery_user
  ON push_delivery_log (user_id, delivered_at DESC);

-- Retención: borrar logs de más de 30 días automáticamente
-- (requires pg_cron; si no está disponible, el backend lo hace)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-push-delivery-log',
      '0 3 * * *',   -- cada día a las 3am
      'DELETE FROM push_delivery_log WHERE delivered_at < NOW() - INTERVAL ''30 days'''
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 3. RLS
-- ══════════════════════════════════════════════════════════════════
-- expo_push_tokens: solo el propio usuario puede ver/modificar sus tokens
-- NUNCA exponer tokens de otros usuarios al cliente
ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tokens_own_user" ON expo_push_tokens;
CREATE POLICY "tokens_own_user" ON expo_push_tokens
  FOR ALL
  USING (user_id::TEXT = (auth.jwt() ->> 'sub'));

-- push_delivery_log: solo lectura para el propio usuario (sus propias entregas)
ALTER TABLE push_delivery_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_log_own" ON push_delivery_log;
CREATE POLICY "delivery_log_own" ON push_delivery_log
  FOR SELECT
  USING (user_id::TEXT = (auth.jwt() ->> 'sub'));

-- ══════════════════════════════════════════════════════════════════
-- 4. FUNCIÓN: register_device_token
--    Registro seguro de tokens. Idempotente.
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION register_device_token(
  p_user_id    UUID,
  p_token      TEXT,
  p_token_type TEXT,   -- 'expo' | 'fcm' | 'apns' | 'voip'
  p_platform   TEXT,   -- 'ios' | 'android'
  p_device_id  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 10 THEN
    RAISE EXCEPTION 'invalid_token' USING HINT = 'El token no puede estar vacío';
  END IF;

  IF p_token_type NOT IN ('expo','fcm','apns','voip') THEN
    RAISE EXCEPTION 'invalid_token_type';
  END IF;

  -- Upsert: si el token ya existe para otro usuario, ignorar (puede ser device reciclado)
  INSERT INTO expo_push_tokens (
    user_id, token, token_type, platform, device_id,
    is_active, failure_count, last_used_at, created_at, updated_at
  ) VALUES (
    p_user_id, p_token, p_token_type, p_platform, p_device_id,
    TRUE, 0, NOW(), NOW(), NOW()
  )
  ON CONFLICT (token) DO UPDATE
    SET user_id      = p_user_id,
        token_type   = p_token_type,
        platform     = p_platform,
        device_id    = COALESCE(p_device_id, expo_push_tokens.device_id),
        is_active    = TRUE,
        failure_count = 0,
        last_used_at = NOW(),
        updated_at   = NOW();

  RETURN jsonb_build_object('ok', true, 'token_type', p_token_type);
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 5. FUNCIÓN: get_call_delivery_tokens
--    Obtiene los tokens de un usuario para entrega de llamadas.
--    Solo accesible por service_role (backend Render).
--    No expone tokens directamente al cliente.
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_call_delivery_tokens(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voip_tokens   JSONB;
  v_fcm_tokens    JSONB;
  v_expo_tokens   JSONB;
BEGIN
  -- VoIP tokens (iOS) — máxima prioridad para llamadas
  SELECT jsonb_agg(jsonb_build_object(
    'token',      token,
    'device_id',  device_id,
    'platform',   platform,
    'token_type', token_type
  ))
  INTO v_voip_tokens
  FROM expo_push_tokens
  WHERE user_id = p_user_id
    AND token_type = 'voip'
    AND is_active = TRUE
    AND failure_count < 5;

  -- FCM tokens (Android)
  SELECT jsonb_agg(jsonb_build_object(
    'token',      token,
    'device_id',  device_id,
    'platform',   platform,
    'token_type', token_type
  ))
  INTO v_fcm_tokens
  FROM expo_push_tokens
  WHERE user_id = p_user_id
    AND token_type IN ('fcm','expo')
    AND platform = 'android'
    AND is_active = TRUE
    AND failure_count < 5;

  -- Expo tokens (fallback)
  SELECT jsonb_agg(jsonb_build_object(
    'token',      token,
    'device_id',  device_id,
    'platform',   platform,
    'token_type', token_type
  ))
  INTO v_expo_tokens
  FROM expo_push_tokens
  WHERE user_id = p_user_id
    AND token_type = 'expo'
    AND is_active = TRUE
    AND failure_count < 5;

  RETURN jsonb_build_object(
    'voip',  COALESCE(v_voip_tokens, '[]'::JSONB),
    'fcm',   COALESCE(v_fcm_tokens,  '[]'::JSONB),
    'expo',  COALESCE(v_expo_tokens, '[]'::JSONB)
  );
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 6. FUNCIÓN: mark_token_failed
--    Registra un fallo de entrega. Desactiva el token tras 5 fallos.
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION mark_token_failed(
  p_token      TEXT,
  p_error_code TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE expo_push_tokens
  SET
    failure_count = failure_count + 1,
    is_active     = CASE WHEN failure_count + 1 >= 5 THEN FALSE ELSE is_active END,
    updated_at    = NOW()
  WHERE token = p_token;
END;
$$;

COMMIT;
