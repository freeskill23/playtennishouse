/*
# Create admin_memos table

1. New Tables
- `admin_memos` — stores administrator memos with date, title, content, and timestamps.
  - `id` (uuid, primary key)
  - `date` (date, not null) — the date the memo is associated with (for date-based browsing)
  - `title` (text, not null) — short title for the memo
  - `content` (text, not null) — full memo content
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- Index on `date` descending for efficient date-based browsing.
- Index on `title` and `content` for search performance.

3. Security
- Enable RLS on `admin_memos`.
- Allow anon + authenticated CRUD (single-tenant admin app with password-based access control).
*/

CREATE TABLE IF NOT EXISTS admin_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_admin_memos" ON admin_memos;
CREATE POLICY "anon_select_admin_memos"
ON admin_memos FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admin_memos" ON admin_memos;
CREATE POLICY "anon_insert_admin_memos"
ON admin_memos FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admin_memos" ON admin_memos;
CREATE POLICY "anon_update_admin_memos"
ON admin_memos FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_admin_memos" ON admin_memos;
CREATE POLICY "anon_delete_admin_memos"
ON admin_memos FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_admin_memos_date_desc ON admin_memos (date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_memos_title ON admin_memos (title);
CREATE INDEX IF NOT EXISTS idx_admin_memos_content ON admin_memos (content);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_memos;
