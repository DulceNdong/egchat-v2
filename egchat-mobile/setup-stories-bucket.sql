-- ══════════════════════════════════════════════════════════════
-- EGCHAT — Bucket de estados/stories en Supabase Storage
-- Ejecuta esto en: Supabase → SQL Editor → Run
--
-- NECESARIO para que los estados (fotos/videos) sean visibles
-- para otros usuarios. Sin este bucket, las imágenes se guardaban
-- como rutas locales (file://...) y aparecían en NEGRO.
-- ══════════════════════════════════════════════════════════════

-- 1. Crear bucket público "stories" (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,                          -- público: cualquiera puede ver los estados
  52428800,                      -- máximo 50 MB por archivo (para videos)
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ];

-- 2. Política: cualquiera puede VER los estados (lectura pública)
DROP POLICY IF EXISTS "Stories públicos lectura" ON storage.objects;
CREATE POLICY "Stories públicos lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

-- 3. Política: cualquier petición puede SUBIR estados
--    (la app usa la anon key, no Supabase Auth directa en storage)
DROP POLICY IF EXISTS "Stories subida anon" ON storage.objects;
CREATE POLICY "Stories subida anon"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories');

-- 4. Política: permitir UPDATE (upsert)
DROP POLICY IF EXISTS "Stories actualizar anon" ON storage.objects;
CREATE POLICY "Stories actualizar anon"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'stories');

-- 5. Política: permitir DELETE (para cuando el usuario borre su estado)
DROP POLICY IF EXISTS "Stories eliminar anon" ON storage.objects;
CREATE POLICY "Stories eliminar anon"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories');

-- 6. Verificar que el bucket quedó creado correctamente
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'stories';
