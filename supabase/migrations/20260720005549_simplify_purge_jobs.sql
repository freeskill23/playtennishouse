-- Simplify the purge jobs to use interval comparison directly instead of
-- epoch millisecond arithmetic. Cleaner and easier to audit.

SELECT cron.unschedule('purge-expired-matching-posts');
SELECT cron.unschedule('purge-expired-court-reservations');

SELECT cron.schedule(
  'purge-expired-matching-posts',
  '0 * * * *',
  $$
    DELETE FROM matching_posts
    WHERE time IS NOT NULL
      AND time <> ''
      AND split_part(time, '-', 2) <> ''
      AND (date::timestamp + (split_part(time, '-', 2))::interval) < now() - interval '24 hours';
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
      AND (date::timestamp + (split_part(time_slot, '-', 2))::interval) < now() - interval '24 hours';
  $$
);
