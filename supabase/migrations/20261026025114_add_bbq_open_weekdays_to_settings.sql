/*
# Add BBQ open weekdays to settings

1. Changes
- Adds `bbq_open_weekdays` integer array column to the `settings` table.
- Stores which weekdays (0=Sun, 1=Mon, ..., 6=Sat) BBQ reservations are open.
- Defaults to NULL so the app falls back to all days (0-6) until configured.

2. Security
- No new tables. The settings table already has anon/authenticated CRUD policies.
*/

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS bbq_open_weekdays integer[];
