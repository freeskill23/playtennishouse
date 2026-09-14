/*
# Add show_on_court and show_on_pension to gallery_items

1. Modified Tables
- `gallery_items`
  - `show_on_court` (boolean, default false): when true, this gallery image appears in the rolling slideshow on the court reservation page.
  - `show_on_pension` (boolean, default false): when true, this gallery image appears in the rolling slideshow on the pension reservation page.
2. Security
- No RLS changes. Existing anon+authenticated CRUD policies on gallery_items already cover these columns.
3. Notes
- Both columns are optional (nullable: false, default: false) so existing rows are unaffected.
- The admin gallery page will get toggle buttons to independently control which images appear on each reservation screen.
*/

ALTER TABLE gallery_items
  ADD COLUMN IF NOT EXISTS show_on_court boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_pension boolean NOT NULL DEFAULT false;