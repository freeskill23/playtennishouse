/*
# Add referral_source column to profiles

1. Changes
- Add `referral_source` text column to `profiles` table.
- Stores how a user first arrived at the site (e.g. "naver", "google", "direct", "instagram").
- Nullable so existing profiles are unaffected.
2. Security
- No RLS policy changes. The existing anon read policy on profiles already covers this column.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text;
