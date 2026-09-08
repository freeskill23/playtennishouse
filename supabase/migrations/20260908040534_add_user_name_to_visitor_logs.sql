/*
# Add user_name column to visitor_logs

1. Changes
- Add `user_name` (text, nullable) to `visitor_logs` table.
  When a logged-in member visits a page, their display name is stored here
  so the admin analytics page can show WHICH member visited and which pages
  (services) they viewed. For guest visits, this remains null.
2. Security
- No policy changes needed — existing INSERT/SELECT policies already allow
  anon + authenticated to insert and read all visitor_logs rows.
3. Notes
- Column is nullable so existing rows and guest visits are unaffected.
- The frontend logVisit() function will be updated to pass the member's name.
*/

ALTER TABLE visitor_logs
  ADD COLUMN IF NOT EXISTS user_name text;
