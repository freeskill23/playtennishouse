/*
# Add 필독공지 (must-read) support to notices

1. New Columns
- `notices.is_must_read` (boolean, default false) — marks a notice as 필독공지.

2. Trigger: enforce max 2 must-read notices (newest wins)
- After any INSERT or UPDATE on notices, if more than 2 rows have
  is_must_read = true, the older ones (by created_at ascending) are
  automatically set to false. This keeps only the 2 newest must-read
  notices active at any time.

3. Security
- No policy changes. Existing anon/authenticated CRUD policies on notices
  remain unchanged.
*/

ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_must_read boolean NOT NULL DEFAULT false;

DROP TRIGGER IF EXISTS enforce_max_must_read ON notices;
DROP FUNCTION IF EXISTS enforce_max_must_read();

CREATE FUNCTION enforce_max_must_read() RETURNS trigger AS $$
BEGIN
  -- If more than 2 must-read notices exist, unset the older ones
  UPDATE notices
  SET is_must_read = false
  WHERE id IN (
    SELECT id FROM notices
    WHERE is_must_read = true
    ORDER BY created_at DESC
    OFFSET 2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_max_must_read
  AFTER INSERT OR UPDATE OF is_must_read ON notices
  FOR EACH STATEMENT
  EXECUTE FUNCTION enforce_max_must_read();
