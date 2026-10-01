/*
# Add per-product shipping fee and free shipping threshold

1. Modified Tables
- `products`
  - `shipping_fee` (integer, nullable): per-product shipping fee. NULL means use the global default from settings.
  - `free_shipping_threshold` (integer, nullable): per-product free shipping threshold. NULL means use the global default from settings.

2. Notes
- Both columns are nullable so existing products default to the global shipping settings.
- The admin product editor will show a checkbox "기본 배송비 사용"; when unchecked, custom values can be entered.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee') THEN
    ALTER TABLE products ADD COLUMN shipping_fee integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'free_shipping_threshold') THEN
    ALTER TABLE products ADD COLUMN free_shipping_threshold integer;
  END IF;
END $$;
