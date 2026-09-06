/*
# Create reviews storage bucket

1. Storage
- Create a public bucket named `reviews` for review images.
2. Security
- Allow anon + authenticated to SELECT (read), INSERT (upload), DELETE files.
3. Notes
- Same pattern as gallery bucket — anon access needed because admin
  authenticates via frontend password, not Supabase Auth.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reviews_bucket_read" ON storage.objects;
CREATE POLICY "reviews_bucket_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "reviews_bucket_upload" ON storage.objects;
CREATE POLICY "reviews_bucket_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'reviews');

DROP POLICY IF EXISTS "reviews_bucket_delete" ON storage.objects;
CREATE POLICY "reviews_bucket_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'reviews');
