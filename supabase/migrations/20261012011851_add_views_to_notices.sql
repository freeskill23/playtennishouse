/*
# Add view count to notices

1. Changes
- Add `views` integer column to `notices` table, default 0.
- Create `increment_notice_views(notice_id)` RPC that atomically increments views by 1.
2. Security
- The RPC is callable by anon + authenticated (public notices, no auth required to view).
- No new RLS policy needed — the column is read-only for users.
*/

ALTER TABLE notices ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS increment_notice_views(p_notice_id uuid);
CREATE FUNCTION increment_notice_views(p_notice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notices SET views = views + 1 WHERE id = p_notice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_notice_views(uuid) TO anon, authenticated;