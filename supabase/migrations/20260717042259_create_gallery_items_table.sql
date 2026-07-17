/*
# Create gallery_items table

1. New Tables
- `gallery_items`
  - `id` (text, primary key) — client-generated id (e.g. "g-...")
  - `image_url` (text, not null) — public URL of the uploaded image (Supabase Storage)
  - `summary` (text, not null) — one-line summary/caption
  - `created_at` (bigint, not null) — epoch millis, matches client Date.now()
2. Security
- Enable RLS on `gallery_items`.
- All authenticated users can SELECT (gallery is shared club-wide, viewable by any logged-in member).
- All authenticated users can INSERT/UPDATE/DELETE (admin-only gating is enforced in the frontend, matching the notices pattern).
3. Notes
- This is shared/public content; no user_id ownership is needed.
- Images are stored in Supabase Storage and the public URL is saved in `image_url`.
*/

CREATE TABLE IF NOT EXISTS gallery_items (
  id text PRIMARY KEY,
  image_url text NOT NULL,
  summary text NOT NULL,
  created_at bigint NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_gallery_items" ON gallery_items;
CREATE POLICY "select_all_gallery_items" ON gallery_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_all_gallery_items" ON gallery_items;
CREATE POLICY "insert_all_gallery_items" ON gallery_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_all_gallery_items" ON gallery_items;
CREATE POLICY "update_all_gallery_items" ON gallery_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_all_gallery_items" ON gallery_items;
CREATE POLICY "delete_all_gallery_items" ON gallery_items FOR DELETE
  TO authenticated USING (true);
