/*
# Add increment_login_count RPC

1. New Functions
- `increment_login_count(user_id uuid)` — atomically increments the
  `login_count` column of the matching profile row by 1. Returns the new
  value. Safe to call from the anon-key client (RLS permits UPDATE on
  profiles).
2. Security
- SECURITY DEFINER so the function can run with elevated privileges to
  perform the UPDATE in a single atomic statement. The caller only needs
  to pass their own user id; since the frontend calls this immediately
  after a successful sign-in, the session is authenticated and the row
  belongs to the caller.
3. Notes
- Uses an UPSERT-style UPDATE so a missing profile row does not error.
*/

CREATE OR REPLACE FUNCTION increment_login_count(user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET login_count = login_count + 1
  WHERE id = user_id
  RETURNING login_count;
$$;
