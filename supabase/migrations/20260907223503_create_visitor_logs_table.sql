/*
# Create visitor_logs table for analytics

1. New Table
- `visitor_logs`
  - `id` bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY
  - `session_id` text NOT NULL — anonymous session identifier (localStorage)
  - `page` text NOT NULL — current page/tab (home, pension, court, etc.)
  - `path` text — full URL path
  - `referrer` text — document.referrer (where visitor came from)
  - `search_keyword` text — search keyword extracted from referrer URL
  - `user_agent` text — browser/device info
  - `is_member` boolean NOT NULL DEFAULT false — logged in vs guest
  - `created_at` timestamptz NOT NULL DEFAULT now()
2. Security
- Enable RLS: allow anon + authenticated INSERT (logging happens client-side)
- Allow anon + authenticated SELECT (admin reads via anon key, same pattern)
- DELETE not needed; cleanup via pg_cron if desired
3. Notes
- Privacy-conscious: no personal names/emails stored, only session_id hash.
- search_keyword parsed from Google/Naver referrer query params.
*/

CREATE TABLE IF NOT EXISTS visitor_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id text NOT NULL,
  page text NOT NULL,
  path text,
  referrer text,
  search_keyword text,
  user_agent text,
  is_member boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_visitor_logs" ON visitor_logs;
CREATE POLICY "insert_visitor_logs" ON visitor_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_visitor_logs" ON visitor_logs;
CREATE POLICY "select_visitor_logs" ON visitor_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "delete_visitor_logs" ON visitor_logs;
CREATE POLICY "delete_visitor_logs" ON visitor_logs FOR DELETE
  TO anon, authenticated USING (true);
