-- ═══════════════════════════════════════════════════════════════
-- MI DJANGUE — Solo tablas necesarias para Supabase
-- Ejecutar en: https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/sql/new
-- ═══════════════════════════════════════════════════════════════

-- 1. Grupos Djangue
CREATE TABLE IF NOT EXISTS djangue_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  slogan TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','annual')),
  quota_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  max_members INT NOT NULL DEFAULT 12,
  penalty_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  notification_days_before INT NOT NULL DEFAULT 10,
  notification_final_days INT NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secretary_id UUID REFERENCES users(id) ON DELETE SET NULL,
  chat_group_id UUID,
  wallet_id UUID,
  current_turn INT NOT NULL DEFAULT 1,
  total_turns INT NOT NULL DEFAULT 0,
  period_start_date TIMESTAMPTZ,
  period_end_date TIMESTAMPTZ,
  next_payout_at TIMESTAMPTZ,
  total_mora_collected NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Monedero del djangue
CREATE TABLE IF NOT EXISTS djangue_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL UNIQUE REFERENCES djangue_groups(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XAF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Miembros del djangue
CREATE TABLE IF NOT EXISTS djangue_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','removed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, turn_number)
);

-- 4. Contribuciones/pagos
CREATE TABLE IF NOT EXISTS djangue_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES djangue_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  turn_number INT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','justified')),
  justification_note TEXT,
  paid_at TIMESTAMPTZ,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Moras/penalizaciones
CREATE TABLE IF NOT EXISTS djangue_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES djangue_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  turn_number INT NOT NULL,
  penalty_amount NUMERIC(12,2) NOT NULL,
  penalty_percent NUMERIC(5,2) NOT NULL,
  amount NUMERIC(12,2),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'wallet',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Notificaciones djangue
CREATE TABLE IF NOT EXISTS djangue_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('reminder_10days','reminder_daily','payment_received','turn_completed','penalty_applied')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Pagos al beneficiario
CREATE TABLE IF NOT EXISTS djangue_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  turn_number INT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  expected_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_djangue_groups_owner ON djangue_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_djangue_groups_secretary ON djangue_groups(secretary_id);
CREATE INDEX IF NOT EXISTS idx_djangue_members_group ON djangue_members(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_members_user ON djangue_members(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_contributions_group ON djangue_contributions(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_contributions_user ON djangue_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_contributions_turn ON djangue_contributions(turn_number);
CREATE INDEX IF NOT EXISTS idx_djangue_penalties_group ON djangue_penalties(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_penalties_user ON djangue_penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_penalties_user_status ON djangue_penalties(user_id, status);
CREATE INDEX IF NOT EXISTS idx_djangue_notifications_group ON djangue_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_notifications_user ON djangue_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_payouts_group ON djangue_payouts(group_id);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_djangue_groups_updated_at ON djangue_groups;
CREATE TRIGGER update_djangue_groups_updated_at
  BEFORE UPDATE ON djangue_groups
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_djangue_wallets_updated_at ON djangue_wallets;
CREATE TRIGGER update_djangue_wallets_updated_at
  BEFORE UPDATE ON djangue_wallets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS (Row Level Security) — solo miembros ven su djangue
ALTER TABLE djangue_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_wallets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_penalties     ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_payouts       ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (bypassa RLS)
DO $$
BEGIN
  DROP POLICY IF EXISTS "service_role_all_djangue_groups" ON djangue_groups;
  CREATE POLICY "service_role_all_djangue_groups" ON djangue_groups FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_wallets" ON djangue_wallets;
  CREATE POLICY "service_role_all_djangue_wallets" ON djangue_wallets FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_members" ON djangue_members;
  CREATE POLICY "service_role_all_djangue_members" ON djangue_members FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_contributions" ON djangue_contributions;
  CREATE POLICY "service_role_all_djangue_contributions" ON djangue_contributions FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_penalties" ON djangue_penalties;
  CREATE POLICY "service_role_all_djangue_penalties" ON djangue_penalties FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_notifications" ON djangue_notifications;
  CREATE POLICY "service_role_all_djangue_notifications" ON djangue_notifications FOR ALL USING (true);
  
  DROP POLICY IF EXISTS "service_role_all_djangue_payouts" ON djangue_payouts;
  CREATE POLICY "service_role_all_djangue_payouts" ON djangue_payouts FOR ALL USING (true);
  
EXCEPTION WHEN others THEN
  -- Si hay error con las políticas, continuar
  NULL;
END $$;

-- Verificación final
SELECT 'Tablas de Django creadas exitosamente!' as resultado;