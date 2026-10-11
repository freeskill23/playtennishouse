/*
# Add YouTube URL column to gallery_items

## Changes
1. New column on `gallery_items`:
   - `youtube_url` (text, nullable) — stores a YouTube video URL or video ID.
     When non-null, the gallery item is treated as a video and displayed
     at the top of the gallery page with an embedded YouTube player.

## Notes
- This is an additive change; existing image gallery items are unaffected.
- RLS policies already on gallery_items cover the new column (column-level
  privileges are not restricted).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE gallery_items ADD COLUMN youtube_url text;
  END IF;
END $$;
