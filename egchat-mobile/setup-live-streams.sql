-- ══════════════════════════════════════════════════════════════════
-- Tabla live_streams — para que los viewers puedan ver y unirse
-- a los streams activos desde la pestaña "Vivos"
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS live_streams (
  id           TEXT PRIMARY KEY,
  host_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name    TEXT NOT NULL DEFAULT '',
  host_avatar  TEXT,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  title        TEXT DEFAULT 'En vivo'
);

-- Índice para consultas rápidas de streams activos
CREATE INDEX IF NOT EXISTS idx_live_streams_active ON live_streams (is_active, started_at DESC);

-- RLS: cualquier usuario autenticado puede leer streams activos
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver streams activos" ON live_streams
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Host puede insertar su stream" ON live_streams
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host puede actualizar su stream" ON live_streams
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid());

-- Limpieza automática: borrar streams inactivos de más de 24h
-- (opcional, ejecutar como cron job o manualmente)
-- DELETE FROM live_streams WHERE is_active = false AND ended_at < now() - interval '24 hours';
