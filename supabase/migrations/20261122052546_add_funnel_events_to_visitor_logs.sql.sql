/*
# Add funnel event tracking to visitor_logs

1. Modified Tables
- `visitor_logs`
  - `event_name` (text, nullable): name of an in-page action event (e.g. pension funnel steps like
    "pension_date_selected", "pension_room_selected", "pension_price_shown", "pension_depositor_filled",
    "pension_reserve_clicked"). Null for regular page-visit logs.
  - `event_detail` (text, nullable): free-form detail for the event (e.g. selected date, room name, total price).

2. Security
- No policy changes: existing RLS policies and table-level grants on `visitor_logs` already cover
  the new nullable columns (anon insert is already granted and policy-checked).

3. Notes
- Both columns are nullable so all existing page-visit rows remain unchanged.
- Partial index on event_name for fast funnel aggregation.
*/

ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS event_name text;
ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS event_detail text;

CREATE INDEX IF NOT EXISTS idx_visitor_logs_event_name
  ON visitor_logs (event_name, created_at)
  WHERE event_name IS NOT NULL;