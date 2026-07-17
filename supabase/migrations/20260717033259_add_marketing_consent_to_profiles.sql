/*
# Add marketing consent column to profiles

1. Schema Changes
- Add `marketing_consent` boolean column to `profiles` table.
  - Default `true` (users see a pre-checked checkbox at signup).
  - Records whether the user agreed to receive 플테하 event/promotion messages.

2. Security
- No RLS policy changes. Existing policies remain in effect.
  - INSERT still requires `auth.uid() = id`.
  - SELECT is open to anon, authenticated (already allowed).
  - UPDATE is owner-scoped only.

3. Important Notes
- Existing rows backfill to `true` so current members are treated as
  having consented (matches the pre-checked signup default).
- The admin-users edge function and AuthScreen will read/write this column.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT true;

-- Backfill existing rows
UPDATE profiles SET marketing_consent = true WHERE marketing_consent IS NULL;
