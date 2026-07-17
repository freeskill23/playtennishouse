/*
# Allow anon access to gallery_items and gallery storage bucket

The admin user authenticates via a hardcoded password in the frontend,
NOT through Supabase Auth. So the Supabase client uses the anon key.
Gallery RLS policies were scoped to `authenticated` only, causing
"new row violates row-level security policy" on upload.

Fix: broaden gallery_items table policies and gallery storage bucket
policies to include `anon` (same pattern as notices).
*/

-- gallery_items table: allow anon
DROP POLICY IF EXISTS "select_all_gallery_items" ON gallery_items;
CREATE POLICY "select_all_gallery_items" ON gallery_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_all_gallery_items" ON gallery_items;
CREATE POLICY "insert_all_gallery_items" ON gallery_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_all_gallery_items" ON gallery_items;
CREATE POLICY "update_all_gallery_items" ON gallery_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_all_gallery_items" ON gallery_items;
CREATE POLICY "delete_all_gallery_items" ON gallery_items FOR DELETE
  TO anon, authenticated USING (true);

-- gallery storage bucket: allow anon
DROP POLICY IF EXISTS "gallery_bucket_read" ON storage.objects;
CREATE POLICY "gallery_bucket_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_bucket_upload" ON storage.objects;
CREATE POLICY "gallery_bucket_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_bucket_delete" ON storage.objects;
CREATE POLICY "gallery_bucket_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gallery');
