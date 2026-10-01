ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS base_capacity integer NOT NULL DEFAULT 4;

UPDATE rooms SET base_capacity = 4 WHERE base_capacity IS NULL OR base_capacity = 0;