-- ══════════════════════════════════════════════════════════════
-- EGCHAT NATIVA — Setup producción
-- Ejecuta esto en Supabase → SQL Editor antes del build APK/IPA
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla de tokens Expo Push (notificaciones con teléfono hibernado)
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(200) UNIQUE NOT NULL,
  platform VARCHAR(10) DEFAULT 'android',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user ON expo_push_tokens(user_id);

-- 2. Política RLS — cada usuario solo ve y gestiona sus propios tokens
ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON expo_push_tokens;
CREATE POLICY "Users manage own push tokens" ON expo_push_tokens
  FOR ALL USING (auth.uid()::text = user_id::text);

-- 3. Asegurarse de que la tabla stories tiene reactions (si no existe)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]';

-- 4. Índice de presencia online (solo si la columna existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_seen') THEN
    CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
  END IF;
END $$;

-- 5. Índice de mensajes por chat (rendimiento)
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);

-- Verificar tablas críticas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'users', 'wallets', 'chats', 'chat_participants', 'messages',
  'expo_push_tokens', 'stories', 'call_sessions', 'contacts'
)
ORDER BY table_name;
