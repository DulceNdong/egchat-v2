-- ══════════════════════════════════════════════════════════════════
-- EGChat — Sistema de llamadas completo (SIN test suite)
-- Seguro de re-ejecutar. Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── SECCIÓN 1: Ampliar call_sessions ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='status') THEN
    ALTER TABLE call_sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'ringing'
      CHECK (status IN ('ringing','accepted','connecting','connected','reconnecting','rejected','missed','ended','failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='expires_at') THEN
    ALTER TABLE call_sessions ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='connected_at') THEN
    ALTER TABLE call_sessions ADD COLUMN connected_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='ended_at') THEN
    ALTER TABLE call_sessions ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='duration_seconds') THEN
    ALTER TABLE call_sessions ADD COLUMN duration_seconds INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='end_reason') THEN
    ALTER TABLE call_sessions ADD COLUMN end_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='offer_nonce') THEN
    ALTER TABLE call_sessions ADD COLUMN offer_nonce TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='chat_id') THEN
    ALTER TABLE call_sessions ADD COLUMN chat_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_sessions' AND column_name='version') THEN
    ALTER TABLE call_sessions ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

UPDATE call_sessions SET status = 'ended' WHERE ended = TRUE AND status = 'ringing';

CREATE INDEX IF NOT EXISTS idx_call_sessions_status  ON call_sessions (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller  ON call_sessions (caller_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_expires ON call_sessions (expires_at)
  WHERE status NOT IN ('ended','rejected','missed','failed');

-- ── SECCIÓN 2: call_participants ──────────────────────────────────
CREATE TABLE IF NOT EXISTS call_participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id      VARCHAR(100) NOT NULL REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('caller','callee')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  left_at      TIMESTAMPTZ,
  device_token TEXT,
  UNIQUE (call_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON call_participants (user_id, call_id);

-- ── SECCIÓN 3: call_signals ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id     VARCHAR(100) NOT NULL REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  from_user   UUID NOT NULL,
  to_user     UUID,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer','answer','ice','restart_ice')),
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  nonce       TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_call_signals_call ON call_signals (call_id, created_at);
CREATE INDEX IF NOT EXISTS idx_call_signals_to   ON call_signals (to_user, call_id, created_at) WHERE to_user IS NOT NULL;

-- ── SECCIÓN 4: call_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id     VARCHAR(100) NOT NULL REFERENCES call_sessions(call_id) ON DELETE CASCADE,
  user_id     UUID,
  event       TEXT NOT NULL CHECK (event IN (
                'initiated','push_sent','ringing','accepted','connecting','connected',
                'reconnecting','ended','rejected','missed','failed','expired')),
  metadata    JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_call_events_call ON call_events (call_id, occurred_at);

-- ── SECCIÓN 5: RLS ────────────────────────────────────────────────
ALTER TABLE call_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_sessions_select_participant" ON call_sessions;
CREATE POLICY "call_sessions_select_participant" ON call_sessions FOR SELECT
  USING (caller_id::TEXT = (auth.jwt() ->> 'sub') OR target_user_id::TEXT = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "call_participants_select_own" ON call_participants;
CREATE POLICY "call_participants_select_own" ON call_participants FOR SELECT
  USING (user_id::TEXT = (auth.jwt() ->> 'sub') OR EXISTS (
    SELECT 1 FROM call_participants cp2
    WHERE cp2.call_id = call_participants.call_id AND cp2.user_id::TEXT = (auth.jwt() ->> 'sub')
  ));

DROP POLICY IF EXISTS "call_signals_select_participant" ON call_signals;
CREATE POLICY "call_signals_select_participant" ON call_signals FOR SELECT
  USING (from_user::TEXT=(auth.jwt()->>'sub') OR to_user::TEXT=(auth.jwt()->>'sub') OR to_user IS NULL);

DROP POLICY IF EXISTS "call_signals_insert_own" ON call_signals;
CREATE POLICY "call_signals_insert_own" ON call_signals FOR INSERT
  WITH CHECK (from_user::TEXT = (auth.jwt() ->> 'sub') AND EXISTS (
    SELECT 1 FROM call_participants cp WHERE cp.call_id = call_signals.call_id AND cp.user_id::TEXT = (auth.jwt() ->> 'sub')
  ));

DROP POLICY IF EXISTS "call_events_select_participant" ON call_events;
CREATE POLICY "call_events_select_participant" ON call_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM call_sessions cs WHERE cs.call_id = call_events.call_id
      AND (cs.caller_id::TEXT=(auth.jwt()->>'sub') OR cs.target_user_id::TEXT=(auth.jwt()->>'sub'))
  ));

-- ── SECCIÓN 6: RPCs ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION initiate_call(
  p_call_id TEXT, p_caller_id UUID, p_callee_id UUID,
  p_call_type TEXT DEFAULT 'audio', p_offer JSONB DEFAULT NULL,
  p_chat_id UUID DEFAULT NULL, p_nonce TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing   call_sessions%ROWTYPE;
  v_expires_at TIMESTAMPTZ := NOW() + INTERVAL '90 seconds';
BEGIN
  IF p_nonce IS NOT NULL THEN
    SELECT * INTO v_existing FROM call_sessions WHERE offer_nonce = p_nonce LIMIT 1;
    IF FOUND THEN RETURN jsonb_build_object('call_id',v_existing.call_id,'status',v_existing.status,'idempotent',true); END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM call_sessions WHERE caller_id=p_caller_id::TEXT AND status NOT IN ('ended','rejected','missed','failed') AND expires_at>NOW()) THEN
    RAISE EXCEPTION 'caller_already_in_call' USING HINT='El caller ya tiene una llamada activa';
  END IF;
  INSERT INTO call_sessions (call_id,offer,caller_candidates,callee_candidates,type,caller_id,target_user_id,ended,status,expires_at,chat_id,offer_nonce,created_at,updated_at,version)
  VALUES (p_call_id,CASE WHEN p_offer IS NOT NULL THEN p_offer::TEXT ELSE NULL END,'[]','[]',p_call_type,p_caller_id::TEXT,p_callee_id::TEXT,FALSE,'ringing',v_expires_at,p_chat_id,p_nonce,NOW(),NOW(),1)
  ON CONFLICT (call_id) DO NOTHING;
  INSERT INTO call_participants (call_id,user_id,role) VALUES (p_call_id,p_caller_id,'caller'),(p_call_id,p_callee_id,'callee') ON CONFLICT (call_id,user_id) DO NOTHING;
  INSERT INTO call_events (call_id,user_id,event,metadata) VALUES (p_call_id,p_caller_id,'initiated',jsonb_build_object('type',p_call_type,'nonce',p_nonce));
  RETURN jsonb_build_object('call_id',p_call_id,'status','ringing','expires_at',v_expires_at,'idempotent',false);
END; $$;

CREATE OR REPLACE FUNCTION accept_call(p_call_id TEXT, p_callee_id UUID, p_answer JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'call_not_found'; END IF;
  IF v_session.target_user_id <> p_callee_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_session.expires_at < NOW() THEN
    UPDATE call_sessions SET status='missed',ended=TRUE,ended_at=NOW(),updated_at=NOW() WHERE call_id=p_call_id;
    RAISE EXCEPTION 'call_expired';
  END IF;
  IF v_session.status = 'accepted' THEN RETURN jsonb_build_object('call_id',p_call_id,'status','accepted','idempotent',true); END IF;
  IF v_session.status <> 'ringing' THEN RAISE EXCEPTION 'invalid_transition' USING HINT='Estado: '||v_session.status; END IF;
  UPDATE call_sessions SET status='accepted',answer=CASE WHEN p_answer IS NOT NULL THEN p_answer::TEXT ELSE answer END,
    expires_at=NOW()+INTERVAL '30 minutes',updated_at=NOW(),version=version+1 WHERE call_id=p_call_id AND version=v_session.version;
  IF NOT FOUND THEN RAISE EXCEPTION 'concurrent_modification'; END IF;
  UPDATE call_participants SET joined_at=NOW() WHERE call_id=p_call_id AND user_id=p_callee_id;
  INSERT INTO call_events (call_id,user_id,event) VALUES (p_call_id,p_callee_id,'accepted');
  RETURN jsonb_build_object('call_id',p_call_id,'status','accepted','idempotent',false);
END; $$;

CREATE OR REPLACE FUNCTION reject_call(p_call_id TEXT, p_callee_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'call_not_found'; END IF;
  IF v_session.target_user_id <> p_callee_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_session.status IN ('rejected','ended','missed','failed') THEN RETURN jsonb_build_object('call_id',p_call_id,'status',v_session.status,'idempotent',true); END IF;
  IF v_session.status NOT IN ('ringing') THEN RAISE EXCEPTION 'invalid_transition' USING HINT='Estado: '||v_session.status; END IF;
  UPDATE call_sessions SET status='rejected',ended=TRUE,ended_at=NOW(),updated_at=NOW(),version=version+1 WHERE call_id=p_call_id AND version=v_session.version;
  UPDATE call_participants SET left_at=NOW() WHERE call_id=p_call_id AND user_id=p_callee_id;
  INSERT INTO call_events (call_id,user_id,event) VALUES (p_call_id,p_callee_id,'rejected');
  RETURN jsonb_build_object('call_id',p_call_id,'status','rejected');
END; $$;

CREATE OR REPLACE FUNCTION cancel_call(p_call_id TEXT, p_caller_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'call_not_found'; END IF;
  IF v_session.caller_id <> p_caller_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_session.status IN ('ended','rejected','missed','failed') THEN RETURN jsonb_build_object('call_id',p_call_id,'status',v_session.status,'idempotent',true); END IF;
  UPDATE call_sessions SET status='ended',ended=TRUE,ended_at=NOW(),end_reason='cancelled_by_caller',updated_at=NOW(),version=version+1 WHERE call_id=p_call_id AND version=v_session.version;
  UPDATE call_participants SET left_at=NOW() WHERE call_id=p_call_id AND user_id=p_caller_id;
  INSERT INTO call_events (call_id,user_id,event,metadata) VALUES (p_call_id,p_caller_id,'ended',jsonb_build_object('reason','cancelled_by_caller'));
  RETURN jsonb_build_object('call_id',p_call_id,'status','ended');
END; $$;

CREATE OR REPLACE FUNCTION mark_call_connected(p_call_id TEXT, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'call_not_found'; END IF;
  IF v_session.caller_id<>p_user_id::TEXT AND v_session.target_user_id<>p_user_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_session.status='connected' THEN RETURN jsonb_build_object('call_id',p_call_id,'status','connected','idempotent',true); END IF;
  IF v_session.status NOT IN ('accepted','connecting','reconnecting') THEN RAISE EXCEPTION 'invalid_transition' USING HINT='Estado: '||v_session.status; END IF;
  UPDATE call_sessions SET status='connected',connected_at=COALESCE(connected_at,NOW()),updated_at=NOW(),version=version+1 WHERE call_id=p_call_id AND version=v_session.version;
  INSERT INTO call_events (call_id,user_id,event) VALUES (p_call_id,p_user_id,'connected');
  RETURN jsonb_build_object('call_id',p_call_id,'status','connected');
END; $$;

CREATE OR REPLACE FUNCTION end_call(p_call_id TEXT, p_user_id UUID, p_reason TEXT DEFAULT 'normal')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session      call_sessions%ROWTYPE;
  v_duration     INTEGER := 0;
  v_final_status TEXT;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('call_id',p_call_id,'status','ended','idempotent',true); END IF;
  IF v_session.caller_id<>p_user_id::TEXT AND v_session.target_user_id<>p_user_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_session.status IN ('ended','rejected','missed','failed') THEN RETURN jsonb_build_object('call_id',p_call_id,'status',v_session.status,'idempotent',true); END IF;
  v_final_status := CASE WHEN p_reason='ice_failed' THEN 'failed' WHEN p_reason='missed' THEN 'missed' ELSE 'ended' END;
  IF v_session.connected_at IS NOT NULL THEN v_duration := EXTRACT(EPOCH FROM (NOW()-v_session.connected_at))::INTEGER; END IF;
  UPDATE call_sessions SET status=v_final_status,ended=TRUE,ended_at=NOW(),end_reason=p_reason,
    duration_seconds=CASE WHEN v_duration>0 THEN v_duration ELSE NULL END,updated_at=NOW(),version=version+1
    WHERE call_id=p_call_id AND version=v_session.version;
  UPDATE call_participants SET left_at=NOW() WHERE call_id=p_call_id AND left_at IS NULL;
  INSERT INTO call_events (call_id,user_id,event,metadata) VALUES (p_call_id,p_user_id,
    CASE WHEN v_final_status='failed' THEN 'failed' WHEN v_final_status='missed' THEN 'missed' ELSE 'ended' END,
    jsonb_build_object('reason',p_reason,'duration_seconds',v_duration));
  RETURN jsonb_build_object('call_id',p_call_id,'status',v_final_status,'duration_seconds',v_duration);
END; $$;

CREATE OR REPLACE FUNCTION expire_stale_calls()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE call_sessions SET status='missed',ended=TRUE,ended_at=NOW(),end_reason='timeout',updated_at=NOW()
    WHERE status NOT IN ('ended','rejected','missed','failed') AND expires_at<NOW()
    RETURNING call_id, caller_id
  )
  INSERT INTO call_events (call_id,user_id,event,metadata)
  SELECT call_id, caller_id::UUID, 'expired', '{"reason":"timeout"}' FROM expired;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION get_call_state(p_call_id TEXT, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session call_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM call_sessions WHERE call_id=p_call_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('found',false); END IF;
  IF v_session.caller_id<>p_user_id::TEXT AND v_session.target_user_id<>p_user_id::TEXT THEN RAISE EXCEPTION 'not_authorized'; END IF;
  RETURN jsonb_build_object(
    'found',true,'call_id',v_session.call_id,'status',v_session.status,'ended',v_session.ended,
    'type',v_session.type,'caller_id',v_session.caller_id,'target_user_id',v_session.target_user_id,
    'offer',CASE WHEN v_session.offer IS NOT NULL THEN v_session.offer::JSONB ELSE NULL END,
    'answer',CASE WHEN v_session.answer IS NOT NULL THEN v_session.answer::JSONB ELSE NULL END,
    'caller_candidates',v_session.caller_candidates::JSONB,'callee_candidates',v_session.callee_candidates::JSONB,
    'expires_at',v_session.expires_at,'connected_at',v_session.connected_at,'version',v_session.version
  );
END; $$;

-- ── SECCIÓN 7: Realtime ───────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='call_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='call_signals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
  END IF;
END $$;

-- ── SECCIÓN 8: Trigger updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_call_sessions_updated_at ON call_sessions;
CREATE TRIGGER trg_call_sessions_updated_at BEFORE UPDATE ON call_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SECCIÓN 9: Cron (silencioso si no hay pg_cron) ────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.schedule('expire-stale-calls','* * * * *','SELECT expire_stale_calls()');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMIT;

-- Verificación final
SELECT proname, 'OK' AS estado FROM pg_proc
WHERE proname IN ('initiate_call','accept_call','reject_call','cancel_call','end_call','mark_call_connected','get_call_state','expire_stale_calls','get_call_history','log_call_history_message')
ORDER BY proname;
