/*
# Add bank account fields to settings table

1. Modified Tables
- `settings`
  - `bank_name` (text, nullable) — deposit bank name (e.g. "농협 (NH)")
  - `bank_account_number` (text, nullable) — deposit account number
  - `bank_account_holder` (text, nullable) — deposit account holder name
2. Security
- No policy changes; existing settings RLS policies cover new columns.
3. Notes
- All nullable so existing single row (id=1) remains valid.
- Frontend upserts these alongside banner/logo/pension settings.
- When null, screens fall back to the hardcoded BANK_ACCOUNT mock defaults.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_account_holder text;
