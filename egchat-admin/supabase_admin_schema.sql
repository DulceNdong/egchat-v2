-- ─── EGCHAT ADMIN PORTAL — Schema SQL ───────────────────────────────────────
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de administradores del portal
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin','operations','support','finance','security','auditor'
  )),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sesiones de admin (para invalidación)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);

-- 3. Log de auditoría (append-only, NO UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  result TEXT CHECK (result IN ('success','failure')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS: solo INSERT (append-only)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY audit_select ON admin_audit_log
  FOR SELECT TO authenticated USING (true);

-- 4. Alertas del sistema
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT CHECK (severity IN ('critical','warning','info')) DEFAULT 'info',
  module TEXT,
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON admin_alerts(is_resolved) WHERE is_resolved = false;

-- 5. IPs bloqueadas
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES admin_users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);

-- 6. Views de métricas

-- Usuarios activos por hora (últimas 24h)
CREATE OR REPLACE VIEW v_active_users_24h AS
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(DISTINCT sender_id) AS users
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1 ORDER BY 1;

-- Volumen wallet hoy
CREATE OR REPLACE VIEW v_wallet_today AS
SELECT
  COUNT(*) AS tx_count,
  COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 0) AS volume_xaf,
  COUNT(CASE WHEN status='failed' THEN 1 END) AS failed_count,
  ROUND(
    COUNT(CASE WHEN status='completed' THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS success_rate
FROM transactions
WHERE created_at > DATE_TRUNC('day', NOW());

-- Logins fallidos última hora
CREATE OR REPLACE VIEW v_failed_logins_1h AS
SELECT
  ip_address,
  COUNT(*) AS attempts,
  MAX(created_at) AS last_attempt,
  array_agg(DISTINCT (metadata->>'target')::TEXT) AS targets
FROM admin_audit_log
WHERE action = 'auth.login_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC;

-- Insertar primer Super Admin (cambiar password después)
-- INSERT INTO admin_users (email, password_hash, role)
-- VALUES ('superadmin@egchat.gq', '$2b$10$HASH_AQUI', 'super_admin');
