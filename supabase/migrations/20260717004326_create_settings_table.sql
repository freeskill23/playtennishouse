/*
# Create settings table for banner/logo images

1. New Tables
- `settings`
  - `id` (int, primary key, always 1 — single-row global config)
  - `banner_image_url` (text, nullable) — main banner image URL
  - `logo_image_url` (text, nullable) — app logo image URL
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `settings`.
- SELECT: allow anon + authenticated (banner/logo must render on public home screen).
- UPDATE/INSERT: authenticated only (admin-only config).
3. Notes
- Single-row design: id is always 1. Upsert by id=1.
*/

CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  banner_image_url text,
  logo_image_url text,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_settings" ON settings;
CREATE POLICY "anon_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON settings;
CREATE POLICY "auth_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

INSERT INTO settings (id, banner_image_url, logo_image_url)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
