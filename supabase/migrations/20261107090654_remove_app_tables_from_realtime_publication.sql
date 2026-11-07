/*
# Stop row-level realtime replication for app tables

1. What changes
- Removes the app tables from the built-in realtime replication publication.
- Live updates now come from the broadcast signals added in the previous migration.

2. Why
- Row-level replication made the database decode and authorize every change for every connected visitor, which was the main source of connection exhaustion.

3. Security
- No access rules are changed. Data is still read only through the normal, policy-checked queries.

4. Notes
- Re-adding a table to the publication restores the old behaviour if ever needed.
- Each drop is guarded so it is a no-op if the table is already removed.
*/

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'reservations', 'rooms', 'matching_posts', 'gallery_items',
    'admin_memos', 'visitor_logs', 'game_day_events', 'game_day_participants', 'game_day_matches'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
