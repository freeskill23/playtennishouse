-- Add updated_at column to reservations for auto-purge of cancelled reservations.
-- When a reservation status changes (e.g. to '취소'), updated_at is refreshed
-- so the client can purge cancelled rows older than 24 hours.

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows
UPDATE reservations SET updated_at = now() WHERE updated_at IS NULL;

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION reservations_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservations_updated_at_trigger ON reservations;
CREATE TRIGGER reservations_updated_at_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION reservations_set_updated_at();