/* Date memos for admin calendar */
CREATE TABLE IF NOT EXISTS date_memos (
  id text PRIMARY KEY,
  date text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  created_at bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::bigint
);

ALTER TABLE date_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_date_memos" ON date_memos FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_date_memos" ON date_memos FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_date_memos" ON date_memos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_date_memos" ON date_memos FOR DELETE
  TO anon, authenticated USING (true);
