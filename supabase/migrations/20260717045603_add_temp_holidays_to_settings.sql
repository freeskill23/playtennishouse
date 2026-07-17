/*
# Add temporary holidays column to settings table

1. Modified Tables
- `settings`
  - `temp_holidays` (jsonb, nullable) — array of date strings (YYYY-MM-DD) treated as holidays
2. Security
- No policy changes; existing settings RLS policies cover new columns.
3. Notes
- All nullable so existing single row (id=1) remains valid.
- Frontend will upsert alongside banner/logo/pension prices.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS temp_holidays jsonb;
