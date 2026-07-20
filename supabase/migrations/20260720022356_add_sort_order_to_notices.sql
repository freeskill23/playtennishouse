/*
# Add sort_order to notices

1. Changes
- Add `sort_order` (double precision, nullable) to `notices`.
  - When present, the admin notice list is ordered by sort_order ascending
    (smaller = higher/top). When null, falls back to created_at desc.
2. Security
- No policy changes. Existing anon+authenticated CRUD policies already
  cover UPDATE, which is what the reorder action uses.
3. Notes
- Backfill: existing rows get sort_order = their created_at epoch so the
  current order (created_at desc) is preserved on first load.
*/

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS sort_order double precision;

UPDATE notices
  SET sort_order = created_at
  WHERE sort_order IS NULL;

CREATE INDEX IF NOT EXISTS notices_sort_order_idx
  ON notices (sort_order);
