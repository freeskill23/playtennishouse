/*
# Add 4-tier pension base capacity columns

1. Modified Tables
- `settings`: adds three new integer columns for the pension base-capacity tier split:
  - `pension_fri_sat_base_capacity` — base capacity for a Friday check-in (금토 1박). Default 4.
  - `pension_sat_sun_base_capacity` — base capacity for a Saturday check-in (토일 1박). Default 4.
  - `pension_sun_mon_base_capacity` — base capacity for a Sunday check-in (일월 1박). Default 4.
- The existing `pension_weekday_base_capacity` and `pension_weekend_base_capacity` columns are unchanged.

2. Security
- No RLS or grant changes: `settings` already has RLS and grants for anon/authenticated CRUD; new columns inherit table-level privileges.

3. Notes
- Defaults are seeded at 4 (the previous weekend capacity) so existing behavior is preserved until the admin sets new values.
- Per-date price overrides continue to take precedence over tier-based pricing; capacity follows the same check-in day-of-week tiers as pricing.
*/
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS pension_fri_sat_base_capacity integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS pension_sat_sun_base_capacity integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS pension_sun_mon_base_capacity integer NOT NULL DEFAULT 4;