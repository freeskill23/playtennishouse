/*
# Create notices table

1. New Tables
- `notices`
  - `id` (text, primary key) — client-generated id (e.g. "n-...")
  - `title` (text, not null)
  - `content` (text, not null)
  - `type` (text, not null) — one of '이벤트','우천','환불','이용수칙'
  - `created_at` (bigint, not null) — epoch millis, matches client Date.now()
2. Security
- Enable RLS on `notices`.
- All authenticated users can SELECT (notices are shared club-wide).
- All authenticated users can INSERT/UPDATE/DELETE (admin gating is enforced in the frontend).
3. Notes
- This is shared/public content; no user_id ownership is needed.
*/

CREATE TABLE IF NOT EXISTS notices (
  id text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  created_at bigint NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_notices" ON notices;
CREATE POLICY "select_all_notices" ON notices FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_all_notices" ON notices;
CREATE POLICY "insert_all_notices" ON notices FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_all_notices" ON notices;
CREATE POLICY "update_all_notices" ON notices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_all_notices" ON notices;
CREATE POLICY "delete_all_notices" ON notices FOR DELETE
  TO authenticated USING (true);
