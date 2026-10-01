/*
# Add shipping tracking columns to orders

## Changes
1. New columns on `orders`:
   - `shipping_company` (text, nullable) — 택배사 이름 (e.g. "CJ대한통운")
   - `tracking_number` (text, nullable) — 송장번호
   - `shipped_at` (timestamptz, nullable) — 배송 시작 시각 (auto-complete 기준 시점)

2. Index on `shipped_at` for the auto-complete query.

## Notes
- All three columns are nullable so existing orders are unaffected.
- No data is lost; existing rows simply have NULL for the new columns.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_company text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders (shipped_at) WHERE status = 'shipped';
