-- Allow anon role to read profiles (read-only) so the admin page — which uses
-- the anon key without a Supabase Auth session — can resolve host names/phones
-- for matching and reservation approval. No write access granted.
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
