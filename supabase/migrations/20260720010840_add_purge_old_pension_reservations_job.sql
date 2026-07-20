-- Purge pension reservations whose date is more than 1 month before now.
-- Runs hourly to keep both the admin dashboard and user my-page in sync.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-old-pension-reservations') THEN
    PERFORM cron.unschedule('purge-old-pension-reservations');
  END IF;
END $$;

SELECT cron.schedule(
  'purge-old-pension-reservations',
  '0 * * * *',
  $$
    DELETE FROM reservations
    WHERE type = 'pension'
      AND date < (now() - interval '1 month')::date;
  $$
);
