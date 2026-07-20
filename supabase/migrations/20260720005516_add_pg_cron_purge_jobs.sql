-- Enable pg_cron for server-side scheduled cleanup of expired records.
-- pg_cron runs as the postgres superuser, bypassing RLS, so it can delete
-- rows even though the anon-key client policies are the ones the app uses.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Mark the cron schema so the extension's helper functions resolve.
-- (pg_cron creates its own schema by default; this is a no-op if it exists.)
SELECT cron.schedule(
  'purge-expired-matching-posts',
  '0 * * * *',
  $$
    DELETE FROM matching_posts
    WHERE (
      (split_part(time, '-', 2) <> '' AND time <> '')
      AND (
        extract(epoch from (
          (date::timestamp + (split_part(time, '-', 2))::interval) - now())
        ) * 1000 < -24 * 60 * 60 * 1000
      )
    )
    OR time = ''
    OR time IS NULL;
  $$
);

SELECT cron.schedule(
  'purge-expired-court-reservations',
  '0 * * * *',
  $$
    DELETE FROM reservations
    WHERE type = 'court'
      AND time_slot IS NOT NULL
      AND time_slot <> ''
      AND (
        extract(epoch from (
          (date::timestamp + (split_part(time_slot, '-', 2))::interval) - now())
        ) * 1000 < -24 * 60 * 60 * 1000
      );
  $$
);

SELECT cron.schedule(
  'purge-cancelled-reservations',
  '0 * * * *',
  $$
    DELETE FROM reservations
    WHERE status = '취소'
      AND updated_at IS NOT NULL
      AND (extract(epoch from (now() - (updated_at / 1000)::timestamp)) * 1000 > 24 * 60 * 60 * 1000);
  $$
);
