/*
# Add sort_order to gallery_items

1. Modified Tables
- `gallery_items`: add `sort_order` integer column (default 0) to control display order in slideshows.
2. Notes
- Existing rows get sort_order = 0, which preserves their relative order when sorted by sort_order ASC, created_at ASC.
- The admin gallery screen will get up/down buttons to adjust sort_order per item.
*/

ALTER TABLE gallery_items
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
