/*
# Create gallery storage bucket and policies

1. Storage
- Create a public bucket named `gallery` for gallery images.
2. Security
- Allow all authenticated users to SELECT (read) files in the gallery bucket.
- Allow all authenticated users to INSERT (upload) files.
- Allow all authenticated users to DELETE files.
3. Notes
- Admin-only gating is enforced in the frontend, matching the notices pattern.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gallery_bucket_read" ON storage.objects;
CREATE POLICY "gallery_bucket_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_bucket_upload" ON storage.objects;
CREATE POLICY "gallery_bucket_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_bucket_delete" ON storage.objects;
CREATE POLICY "gallery_bucket_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery');
