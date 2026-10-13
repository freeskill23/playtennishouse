/*
# Add fee_per_player column to game_day_events

1. Changes
- Add `fee_per_player` integer column to `game_day_events` (default 0)
  - Stores the per-person participation fee, displayed alongside the team fee as "1인 X원 / 팀 Y원"
2. Notes
- Existing rows will have fee_per_player = 0 (no per-person fee)
- The `fee` column continues to store the team-level fee
- The `court` column already stores text and can hold comma-separated values like "A코트,B코트"
*/
ALTER TABLE game_day_events ADD COLUMN IF NOT EXISTS fee_per_player integer NOT NULL DEFAULT 0;
