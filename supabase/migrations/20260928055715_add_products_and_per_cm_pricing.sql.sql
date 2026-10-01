-- Products table: 관리자가 등록하는 상품(강아지집 모델)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  base_width integer NOT NULL DEFAULT 750,
  base_depth integer NOT NULL DEFAULT 550,
  base_height integer NOT NULL DEFAULT 600,
  base_price integer NOT NULL DEFAULT 50000,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- Add product_id to orders (nullable so existing orders remain valid)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name text;

-- Seed default settings with per-cm pricing
INSERT INTO settings (key, value) VALUES
  ('pricing', '{"baseFee":30000,"areaRatePerSqmm":0.18,"sizeScaleRate":0.04,"packagingFee":4000,"shippingFee":15000,"freeShippingThreshold":200000,"perCmWidth":500,"perCmDepth":500,"perCmHeight":500}')
ON CONFLICT (key) DO UPDATE
  SET value = settings.value || '{"perCmWidth":500,"perCmDepth":500,"perCmHeight":500}'::jsonb;

-- Seed a default product
INSERT INTO products (name, description, base_width, base_depth, base_height, base_price, display_order)
SELECT '클래식 강아지집', '기본형 자작나무 강아지집. 가장 심플하고 보편적인 디자인.', 750, 550, 600, 50000, 1
WHERE NOT EXISTS (SELECT 1 FROM products);

CREATE INDEX IF NOT EXISTS idx_products_display_order ON products (display_order);
