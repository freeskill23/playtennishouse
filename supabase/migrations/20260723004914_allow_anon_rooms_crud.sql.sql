-- Room info (capacity, description) is global config edited by the admin
-- panel, which uses a mock session without Supabase auth — same situation as
-- the settings table. RLS must allow the anon-key client to insert and update,
-- not just the authenticated role, or admin edits silently affect 0 rows.

DROP POLICY IF EXISTS "read_rooms" ON rooms;
CREATE POLICY "anon_read_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
