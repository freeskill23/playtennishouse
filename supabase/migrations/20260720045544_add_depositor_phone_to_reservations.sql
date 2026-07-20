/*
# Add depositor_phone to reservations

1. Changes
- Add `depositor_phone` (text, nullable) column to `reservations`.
- Stores the contact phone number for a guest (non-member) reservation.
2. Security
- No RLS policy changes. Existing anon/authenticated CRUD policies still apply.
*/

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS depositor_phone text;
