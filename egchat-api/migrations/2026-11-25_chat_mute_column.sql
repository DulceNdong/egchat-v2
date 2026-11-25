-- EGCHAT: elimina el aviso ensureChatMuteColumn y habilita Silenciar chat.
-- Seguro de ejecutar más de una vez.
ALTER TABLE public.chat_participants
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_chat_participants_muted_until
  ON public.chat_participants (user_id, muted_until)
  WHERE muted_until IS NOT NULL;
