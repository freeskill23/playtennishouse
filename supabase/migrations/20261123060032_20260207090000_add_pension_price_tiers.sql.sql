/*
# Add 4-tier pension pricing columns

1. Modified Tables
- `settings`: adds three new integer columns for the pension price tier split:
  - `pension_fri_sat_price` — price for a Friday check-in (금토 1박). Default 850000 (previous weekend price).
  - `pension_sat_sun_price` — price for a Saturday check-in (토일 1박). Default 850000 (previous weekend price).
  - `pension_sun_mon_price` — price for a Sunday check-in (일월 1박). Default 850000 (previous weekend price).
- The existing `pension_weekday_price` (평일, Mon-Thu check-in) and `pension_weekend_price` (legacy weekend price, kept for compatibility) columns are unchanged.

2. Security
- No RLS or grant changes: `settings` already has RLS and grants for anon/authenticated CRUD; new columns inherit table-level privileges.

3. Notes
- Defaults are seeded from the previous single weekend price (850,000원) so existing behavior is preserved until the admin sets new values.
- Per-date price overrides continue to take precedence over all tier prices.
*/
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS pension_fri_sat_price integer NOT NULL DEFAULT 850000,
  ADD COLUMN IF NOT EXISTS pension_sat_sun_price integer NOT NULL DEFAULT 850000,
  ADD COLUMN IF NOT EXISTS pension_sun_mon_price integer NOT NULL DEFAULT 850000;