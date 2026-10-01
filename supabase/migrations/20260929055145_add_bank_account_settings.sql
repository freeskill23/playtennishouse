/*
# Add bank account settings for manual deposit payment

1. Changes
- The `settings` table already stores key/value pairs (pricing, sizes).
- This migration inserts a default `bank_accounts` key into the settings table
  so the admin can configure bank account info for 무통장입금 (manual bank transfer).
- The value is a JSON array of { bank, accountHolder, accountNumber } objects.
- No new tables or columns needed — reuses the existing settings key/value structure.

2. Security
- No RLS changes. The settings table already has appropriate policies in place.

3. Notes
- The default value is an empty array — the admin will fill in real account info
  via the Settings tab in the admin dashboard.
*/

INSERT INTO settings (key, value, updated_at)
SELECT 'bank_accounts', '[]'::jsonb, now()
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE key = 'bank_accounts'
);