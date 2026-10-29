/*
# Create suggestions table for 플테하에 바라는 점

1. New Table
- `suggestions`
  - `id` uuid PRIMARY KEY — auto-generated
  - `author_name` text NOT NULL — 작성자 이름 (회원 또는 비회원이 입력)
  - `content` text NOT NULL — 건의 내용
  - `created_at` timestamptz NOT NULL — 작성 시각

2. Security
- Enable RLS on `suggestions`.
- anon + authenticated can SELECT, INSERT, DELETE (same no-login pattern as reviews).
- Admin-only gating for deletion is enforced in the admin screen, matching the rest of the app.

3. Notes
- Table is intentionally not updatable from the client.
*/

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON suggestions TO anon, authenticated;

DROP POLICY IF EXISTS "select_suggestions" ON suggestions;
CREATE POLICY "select_suggestions" ON suggestions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_suggestions" ON suggestions;
CREATE POLICY "insert_suggestions" ON suggestions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_suggestions" ON suggestions;
CREATE POLICY "delete_suggestions" ON suggestions FOR DELETE
  TO anon, authenticated USING (true);
