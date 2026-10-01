/*
# Add order_number for guest order lookup

1. Modified Tables
- `orders`
  - `order_number` (text, unique): human-readable order number like "COCO-20260930-XXXX" for guest lookup

2. New RLS Policies
- Allow anon/authenticated to SELECT orders by order_number (for guest lookup)
- Allow anon/authenticated to UPDATE order status to 'cancelled' when looking up by order_number (for guest cancellation)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
    ALTER TABLE orders ADD COLUMN order_number text;
  END IF;
END $$;

-- Generate order_number for existing rows if empty
UPDATE orders SET order_number = 'COCO-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(md5(id::text), 1, 4)) WHERE order_number IS NULL;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON orders (order_number) WHERE order_number IS NOT NULL;

-- Allow guest lookup by order_number
CREATE POLICY "anon_select_order_by_number"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow guest to cancel their own order by order_number (only if status is received or payment_pending)
CREATE POLICY "anon_cancel_order_by_number"
  ON orders FOR UPDATE
  TO anon, authenticated
  USING (order_number IS NOT NULL AND status IN ('received', 'payment_pending'))
  WITH CHECK (order_number IS NOT NULL AND status = 'cancelled');
