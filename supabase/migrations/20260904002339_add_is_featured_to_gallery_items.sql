/*
# Add is_featured column to gallery_items

1. Modified Tables
- `gallery_items`: add `is_featured` boolean column, default false.
  This column marks which gallery photos should appear in the
  homepage auto-sliding carousel.

2. Security
- No policy changes. Existing anon CRUD policies on gallery_items
  already allow reading and updating all columns, so the new column
  is accessible without additional policy work.

3. Notes
- The column is nullable-safe with a default of false so existing
  rows are unaffected.
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ to avoid
  duplicate column errors on re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE gallery_items ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;