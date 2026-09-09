-- ══════════════════════════════════════════════════════════════════
-- EGCHAT — Bucket de momentos en Supabase Storage
-- Ejecutar en: Supabase → SQL Editor → Run
--
-- NECESARIO para que los momentos (fotos) sean visibles para todos.
-- Sin este bucket las imágenes se guardaban como file:// locales
-- y aparecían en blanco para otros usuarios.
-- ══════════════════════════════════════════════════════════════════

-- 1. El bucket 'stories' ya existe — los momentos usan la misma
--    carpeta 'moments/' dentro del bucket 'stories'.
--    Solo necesitamos asegurarnos de que el bucket existe y es público.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- 2. Políticas de acceso (idempotentes)
DROP POLICY IF EXISTS "Stories públicos lectura" ON storage.objects;
CREATE POLICY "Stories públicos lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Stories subida anon" ON storage.objects;
CREATE POLICY "Stories subida anon"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories');

DROP POLICY IF EXISTS "Stories actualizar anon" ON storage.objects;
CREATE POLICY "Stories actualizar anon"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Stories eliminar anon" ON storage.objects;
CREATE POLICY "Stories eliminar anon"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories');

-- 3. Añadir columna banner_url a users (si no existe)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL;

COMMENT ON COLUMN users.banner_url IS 'URL de la portada/banner del perfil del usuario';

-- 4. Verificar
SELECT id, name, public FROM storage.buckets WHERE id = 'stories';
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'users' AND column_name IN ('banner_url', 'avatar_url');
