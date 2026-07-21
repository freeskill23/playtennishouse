/*
# Add parent_id to notice_comments for threaded admin replies

1. Changes to `notice_comments`
- Add `parent_id` (text, nullable, self-references notice_comments(id) ON DELETE CASCADE)
  — when NULL the row is a top-level comment; when set it is a reply to that
  parent comment (used by the admin to reply to a member's comment).

2. Security
- No policy changes. Admin replies are still inserted server-side via the
  `admin-notice-reply` edge function using the service role key (bypasses RLS
  after password verification). Member comments remain owner-scoped via the
  existing INSERT policy.

3. Notes
- The self-FK with ON DELETE CASCADE means deleting a parent comment also
  removes its replies, keeping the thread consistent.
*/

ALTER TABLE notice_comments
  ADD COLUMN IF NOT EXISTS parent_id text REFERENCES notice_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notice_comments_parent_id_idx
  ON notice_comments (parent_id);
