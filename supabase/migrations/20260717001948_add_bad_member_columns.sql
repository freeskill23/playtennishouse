/*
# Add bad-member columns to profiles

1. Schema Changes
- Add `is_bad_member` (boolean, default false) to `profiles`.
- Add `bad_member_reason` (text, nullable) to `profiles`.
  Admins can flag a user as a bad member and record a one-line reason.

2. Security
- Existing owner-scoped RLS policies on `profiles` remain unchanged.
- Admin access to all profiles is handled through the `admin-users` edge
  function which uses the service role key (bypasses RLS), so no new RLS
  policies are needed here.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bad_member boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bad_member_reason text;
