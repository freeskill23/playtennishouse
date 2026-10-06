/*
# Add link_url column to notices

1. Modified Tables
- `notices`: added `link_url` column (text, nullable) — optional URL that a notice can link to.
2. Security
- No RLS changes. Existing policies already allow anon CRUD on notices.
3. Notes
- The column is nullable so existing notices are unaffected.
- The frontend will use this to show a "링크 열기" button when a URL is present.
*/

ALTER TABLE notices ADD COLUMN IF NOT EXISTS link_url text;
