-- ══════════════════════════════════════════════════════════════
-- EGCHAT — Bucket de avatares en Supabase Storage
-- Ejecuta esto en: Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Crear bucket público "avatars" (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                          -- público: cualquiera puede leer las imágenes
  5242880,                       -- máximo 5 MB por archivo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- 2. Política: cualquiera puede VER los avatares (lectura pública)
DROP POLICY IF EXISTS "Avatares públicos lectura" ON storage.objects;
CREATE POLICY "Avatares públicos lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Política: cualquier petición puede SUBIR avatares
--    (la app usa la anon key, no Supabase Auth)
DROP POLICY IF EXISTS "Avatares subida anon" ON storage.objects;
CREATE POLICY "Avatares subida anon"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- 4. Política: sobreescribir (UPDATE/upsert)
DROP POLICY IF EXISTS "Avatares actualizar anon" ON storage.objects;
CREATE POLICY "Avatares actualizar anon"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

-- 5. Verificar que el bucket quedó creado
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'avatars';
