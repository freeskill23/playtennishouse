/*
# Add detail_content to products + create product-images storage bucket

1. Schema changes
- Adds `detail_content` (text) column to `products` table for rich product detail pages.
2. Storage
- Creates `product-images` bucket (public) for product thumbnail/detail image uploads.
3. Security
- RLS policies on storage.objects for product-images bucket:
  - SELECT (read) public for anon + authenticated
  - INSERT/UPDATE/DELETE for authenticated only
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_content text NOT NULL DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
CREATE POLICY "product_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
CREATE POLICY "product_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
CREATE POLICY "product_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
