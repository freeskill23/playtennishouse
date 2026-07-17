/*
# Add court_approved and reservation_ids to matching_posts

1. Purpose
- Matching posts require admin court-reservation approval before applicants
  can apply. This adds a boolean `court_approved` (default false) and a
  `reservation_ids` jsonb array to track all linked court reservations so
  that approving any one of them activates the matching post.

2. Modified Tables
- `matching_posts`
  - `court_approved` (boolean, not null, default false)
  - `reservation_ids` (jsonb, not null, default '[]') — array of reservation id strings

3. Security
- No policy changes; existing policies cover the new columns.
*/

ALTER TABLE matching_posts
  ADD COLUMN IF NOT EXISTS court_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
