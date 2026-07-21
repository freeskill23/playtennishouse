/*
# Admin replies on notice comments

1. Changes to `notice_comments`
- Add `is_admin` (boolean, default false) — marks a row as an official admin reply.
- Make `user_id` nullable — admin replies have no auth user (admin logs in via
  a password gate, not Supabase Auth), so there is no `auth.uid()` to store.
  Regular member comments still always carry a non-null `user_id`.

2. Security
- No change to existing SELECT/INSERT/DELETE policies for members.
- Admin replies are inserted server-side by the `admin-notice-reply` edge
  function using the service role key, which bypasses RLS. The edge function
  validates the admin password before inserting, so only the real admin can
  create admin replies. No new client-facing INSERT policy is added, so the
  anon/authenticated client still cannot forge an admin reply.

3. Notes
- Admin reply rows use `user_id = NULL`, `user_name = '관리자'`,
  `is_admin = true`.
- The frontend reads `is_admin` to render an official-reply badge.
*/

ALTER TABLE notice_comments
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

ALTER TABLE notice_comments
  ALTER COLUMN user_id DROP NOT NULL;
