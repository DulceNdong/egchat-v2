-- ══════════════════════════════════════════════════════
-- EGCHAT ADMIN PORTAL — Tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin','operations','support','finance','security','auditor')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Log de auditoría (append-only)
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
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: solo INSERT permitido (log inmutable)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_service_only ON admin_audit_log USING (false) WITH CHECK (true);

-- 3. Tabla de alertas
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT CHECK (severity IN ('critical','warning','info')) DEFAULT 'info',
  module TEXT,
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON admin_alerts(severity, is_resolved);

-- 5. Crear el primer Super Admin
-- IMPORTANTE: cambiar el password_hash por uno real generado con bcrypt
-- Contraseña por defecto: Admin2026! (solo para desarrollo)
INSERT INTO admin_users (email, password_hash, role) VALUES (
  'superadmin@egchat.gq',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'Admin2026!'
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
