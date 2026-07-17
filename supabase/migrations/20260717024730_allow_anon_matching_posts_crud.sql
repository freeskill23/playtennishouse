-- Allow anon role to read and write matching_posts so the admin page
-- (which uses the anon key without a Supabase Auth session) can load
-- matching posts and update their status when reservations are approved.
-- Matching posts are shared community content; this matches the existing
-- reservations table policy pattern (TO anon, authenticated).

DROP POLICY IF EXISTS "select_matching_posts" ON matching_posts;
CREATE POLICY "select_matching_posts" ON matching_posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_matching_posts" ON matching_posts;
CREATE POLICY "insert_matching_posts" ON matching_posts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_matching_posts" ON matching_posts;
CREATE POLICY "update_matching_posts" ON matching_posts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_matching_posts" ON matching_posts;
CREATE POLICY "delete_matching_posts" ON matching_posts FOR DELETE
  TO anon, authenticated USING (true);
