/*
# Create rooms table for admin-editable room info

Stores room capacity and description so admin edits persist across
sessions and are visible to regular users.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 8,
  description text NOT NULL DEFAULT '',
  price_per_night integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- No-auth read: any visitor (anon or authenticated) can read room info.
CREATE POLICY "read_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

-- Only authenticated users can update (admin edits in-app).
CREATE POLICY "update_rooms" ON rooms FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Seed the two default rooms so they exist immediately.
INSERT INTO rooms (id, name, max_capacity, description, price_per_night) VALUES
  ('roomA', 'A동', 8, '단층 펜션 / 테니스 코트 인접 · BBQ 석 available', 650000),
  ('roomB', 'B동', 8, '2층 펜션 / 넓은 거실 · 코트 전망 · 단체 선호', 850000)
ON CONFLICT (id) DO NOTHING;
