/*
# Broadcast lightweight table-change signals instead of row-level realtime

1. What changes
- Adds one trigger function that sends a small "this table changed" message on the public `app_changes` broadcast topic.
- Attaches it to every app table the website reloads live (statement level, so bulk writes send one signal).
- The message contains only the table name, never row data. Browsers reload the data through the normal, security-checked queries.

2. Why
- Realtime row subscriptions made the database re-check access for every connected visitor on every change, which exhausted the connection pool.
- A broadcast signal costs one message per change regardless of visitor count.

3. Security
- The trigger function is SECURITY DEFINER with an empty search_path so it can call the realtime sender.
- EXECUTE is revoked from PUBLIC, anon and authenticated; triggers still fire for any writer.
- No personal or row data is included in the broadcast.

4. Notes
- Tables settings, reviews and date_memos were previously listened to but not in the realtime publication, so their live updates never fired. They now get signals too.
*/

CREATE OR REPLACE FUNCTION public.notify_table_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send(jsonb_build_object('table', TG_TABLE_NAME), TG_TABLE_NAME, 'app_changes', false);
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_table_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_change_profiles ON public.profiles;
CREATE TRIGGER notify_change_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_reservations ON public.reservations;
CREATE TRIGGER notify_change_reservations AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_rooms ON public.rooms;
CREATE TRIGGER notify_change_rooms AFTER INSERT OR UPDATE OR DELETE ON public.rooms
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_matching_posts ON public.matching_posts;
CREATE TRIGGER notify_change_matching_posts AFTER INSERT OR UPDATE OR DELETE ON public.matching_posts
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_gallery_items ON public.gallery_items;
CREATE TRIGGER notify_change_gallery_items AFTER INSERT OR UPDATE OR DELETE ON public.gallery_items
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_admin_memos ON public.admin_memos;
CREATE TRIGGER notify_change_admin_memos AFTER INSERT OR UPDATE OR DELETE ON public.admin_memos
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_game_day_events ON public.game_day_events;
CREATE TRIGGER notify_change_game_day_events AFTER INSERT OR UPDATE OR DELETE ON public.game_day_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_game_day_participants ON public.game_day_participants;
CREATE TRIGGER notify_change_game_day_participants AFTER INSERT OR UPDATE OR DELETE ON public.game_day_participants
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_game_day_matches ON public.game_day_matches;
CREATE TRIGGER notify_change_game_day_matches AFTER INSERT OR UPDATE OR DELETE ON public.game_day_matches
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_settings ON public.settings;
CREATE TRIGGER notify_change_settings AFTER INSERT OR UPDATE OR DELETE ON public.settings
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_reviews ON public.reviews;
CREATE TRIGGER notify_change_reviews AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();

DROP TRIGGER IF EXISTS notify_change_date_memos ON public.date_memos;
CREATE TRIGGER notify_change_date_memos AFTER INSERT OR UPDATE OR DELETE ON public.date_memos
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_table_changed();
