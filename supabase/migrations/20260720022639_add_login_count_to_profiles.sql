/*
# Add login_count to profiles

1. Changes
- Add `login_count` (integer, not null, default 0) to `profiles`.
  - Tracks cumulative login count per member. Incremented on each successful
    sign-in via the auth flow.
2. Security
- No policy changes. Existing anon+authenticated CRUD policies already cover
    UPDATE on profiles, which the login-count increment uses.
3. Notes
- Backfill: existing rows start at 0 (default). No historical logins are
  inferred.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;
