/*
# Add BBQ open weekday schedules to settings

1. Changes
- Adds `bbq_open_weekday_schedules` jsonb column to the `settings` table.
- Stores per-weekday schedule: { enabled, startHour, endHour } for each of 7 days.
- Defaults to NULL; app falls back to all-day (5~24) for all weekdays until configured.

2. Security
- No new tables. The settings table already has anon/authenticated CRUD policies.
*/

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS bbq_open_weekday_schedules jsonb;
