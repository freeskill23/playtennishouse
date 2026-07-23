-- Add banner gradient colors column so admin can customize the default
-- banner gradient (used when no banner image URL is set). Stores a JSON
-- object with "from", "via", "to" hex color strings.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS banner_gradient_colors jsonb;
