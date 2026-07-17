/*
# Add pension price columns to settings table

1. Modified Tables
- `settings`
  - `pension_weekday_price` (integer, nullable) — default weekday pension price
  - `pension_weekend_price` (integer, nullable) — default weekend/holiday pension price
  - `pension_price_overrides` (jsonb, nullable) — map of date string -> custom price
2. Security
- No policy changes; existing settings RLS policies cover new columns.
3. Notes
- All nullable so existing single row (id=1) remains valid.
- Frontend will upsert these alongside banner/logo URLs.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS pension_weekday_price integer,
  ADD COLUMN IF NOT EXISTS pension_weekend_price integer,
  ADD COLUMN IF NOT EXISTS pension_price_overrides jsonb;
