-- Add court_pricing jsonb column to settings for configurable court rental fees.
-- Structure: { weekdayDayStart, weekdayDayEnd, weekdayDayPrice,
--              weekdayNightStart, weekdayNightEnd, weekdayNightPrice,
--              weekendDayStart, weekendDayEnd, weekendDayPrice,
--              weekendNightStart, weekendNightEnd, weekendNightPrice }
-- Times are 24h "HH:MM" strings.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS court_pricing jsonb;
