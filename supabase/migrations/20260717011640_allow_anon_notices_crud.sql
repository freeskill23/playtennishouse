-- Notices are shared club-wide content; admin gating is enforced in the frontend.
-- The admin panel uses a mock session (no Supabase auth), so RLS must allow the
-- anon-key client to perform CRUD, not just the authenticated role.

DROP POLICY IF EXISTS "select_all_notices" ON notices;
CREATE POLICY "select_all_notices" ON notices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_all_notices" ON notices;
CREATE POLICY "insert_all_notices" ON notices FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_all_notices" ON notices;
CREATE POLICY "update_all_notices" ON notices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_all_notices" ON notices;
CREATE POLICY "delete_all_notices" ON notices FOR DELETE
  TO anon, authenticated USING (true);
