/*
# Make gallery_items.image_url nullable

## Changes
1. Modified column on `gallery_items`:
   - `image_url` changed from `NOT NULL` to nullable.
   - This allows YouTube-only gallery items (which have no image) to be
     inserted with a null `image_url` and a non-null `youtube_url`.

## Notes
- Existing image gallery items are unaffected — they all have non-null
  `image_url` values.
- The frontend treats items with a non-null `youtube_url` as video items
  and renders an embedded YouTube player instead of an image.
*/

ALTER TABLE gallery_items ALTER COLUMN image_url DROP NOT NULL;
