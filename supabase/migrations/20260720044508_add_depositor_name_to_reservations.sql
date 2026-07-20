/*
# Add depositor_name to reservations

1. Changes
- Add `depositor_name` (text, nullable) column to `reservations`.
- Stores the depositor name (입금자명) for a reservation. For guest (non-member)
  reservations this is the name entered by the user; for member reservations
  it defaults to the member's name.
2. Security
- No RLS policy changes. Existing anon/authenticated CRUD policies still apply.
*/

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS depositor_name text;
