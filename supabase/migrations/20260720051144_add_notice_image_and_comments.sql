/*
# Add image_url to notices + create notice_comments table

1. Changes to `notices`
- Add `image_url` (text, nullable) — optional banner image for event notices.

2. New Tables
- `notice_comments`
  - `id` (text, primary key) — client-generated id
  - `notice_id` (text, not null, references notices(id) ON DELETE CASCADE)
  - `user_id` (uuid, not null) — the commenting member's auth id
  - `user_name` (text, not null) — denormalized display name
  - `content` (text, not null) — one-line comment body
  - `created_at` (bigint, not null) — epoch millis

3. Security
- `notice_comments` RLS enabled.
- SELECT: anyone (anon + authenticated) can read comments (shared club-wide).
- INSERT: only authenticated members, and only for their own row (auth.uid() = user_id).
  Guests have no authenticated session so they cannot insert — member-only is
  enforced both in the frontend and at the database layer.
- DELETE: only the comment owner.

4. Notes
- Image uploads for event notices are stored in the existing `gallery` storage
  bucket and referenced via `image_url`; no new storage bucket is needed.
*/

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS notice_comments (
  id text PRIMARY KEY,
  notice_id text NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at bigint NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);

ALTER TABLE notice_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notice_comments" ON notice_comments;
CREATE POLICY "read_notice_comments" ON notice_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_notice_comment" ON notice_comments;
CREATE POLICY "insert_own_notice_comment" ON notice_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notice_comment" ON notice_comments;
CREATE POLICY "delete_own_notice_comment" ON notice_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notice_comments_notice_id_idx
  ON notice_comments (notice_id);
