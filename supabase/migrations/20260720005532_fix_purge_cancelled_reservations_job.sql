-- Fix the cancelled-reservations purge job: updated_at is timestamptz,
-- not bigint, so use interval arithmetic instead of epoch math.

SELECT cron.unschedule('purge-cancelled-reservations');

SELECT cron.schedule(
  'purge-cancelled-reservations',
  '0 * * * *',
  $$
    DELETE FROM reservations
    WHERE status = '취소'
      AND updated_at < now() - interval '24 hours';
  $$
);
