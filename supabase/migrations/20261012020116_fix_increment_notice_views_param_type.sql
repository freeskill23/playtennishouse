/*
# Fix increment_notice_views parameter type

The notices table uses `text` IDs (e.g. 'n_kpez6no'), not uuid.
The original RPC declared the parameter as uuid, causing a type mismatch
error every time the frontend called it. This migration drops and recreates
the function with a `text` parameter so it matches the table schema.
*/

DROP FUNCTION IF EXISTS increment_notice_views(p_notice_id uuid);
DROP FUNCTION IF EXISTS increment_notice_views(p_notice_id text);

CREATE FUNCTION increment_notice_views(p_notice_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notices SET views = views + 1 WHERE id = p_notice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_notice_views(text) TO anon, authenticated;