/*
# Add matching_post_id to reservations

1. Purpose
- Distinguish reservations created from matching posts (vs regular court
  reservations) so the admin approval screen can label them.

2. Modified Tables
- `reservations`
  - `matching_post_id` (text, nullable) — foreign-key-like reference to
    matching_posts.id; null for regular court/pension reservations.

3. Security
- No policy changes; existing policies cover the new column.
*/

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS matching_post_id text;
