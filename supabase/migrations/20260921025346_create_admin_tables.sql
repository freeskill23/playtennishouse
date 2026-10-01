/*
# Create admin tables for COCOS FURNITURE

1. New Tables
- `orders` — 맞춤 주문 정보 저장 (강아지 정보, 사이즈, 디자인, 옵션, 견적, 고객 정보, 상태)
- `portfolio_items` — "오늘의 코코스핏" 제작 사례 카드 데이터
- `reviews` — 고객 후기 데이터 (강아지 이름, 견종, 몸무게, 사이즈, 후기, 작성자)
- `settings` — 가격 설정 및 사이즈 범위 등 관리자 설정 (key-value 구조)
2. Security
- 모든 테이블에 RLS 활성화
- orders: 비인증(anon) 사용자는 주문 생성만 가능, 조회/수정/삭제는 인증된 관리자만
- portfolio_items, reviews: 비인증 사용자는 조회만 가능, 생성/수정/삭제는 인증된 관리자만
- settings: 비인증 사용자는 조회만 가능, 생성/수정/삭제는 인증된 관리자만
3. Important Notes
- 주문은 고객이 비인증 상태로 제출하므로 INSERT만 anon 허용
- 관리자 기능은 Supabase Auth 인증된 사용자만 접근
- settings는 key-value 구조로 유연하게 확장 가능
*/

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_name text,
  breed text,
  weight text,
  body_length text,
  memo text,
  width integer NOT NULL,
  depth integer NOT NULL,
  height integer NOT NULL,
  design_id text NOT NULL,
  door_position text NOT NULL DEFAULT 'front',
  door_size_mode text NOT NULL DEFAULT 'recommended',
  door_custom_width integer NOT NULL DEFAULT 300,
  door_custom_height integer NOT NULL DEFAULT 400,
  engraving text NOT NULL DEFAULT 'none',
  engraving_text text NOT NULL DEFAULT '',
  floor_type text NOT NULL DEFAULT 'standard',
  cushion text NOT NULL DEFAULT 'none',
  top_type text NOT NULL DEFAULT 'standard',
  total_price integer NOT NULL DEFAULT 0,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_address text NOT NULL,
  customer_detail_address text,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_orders" ON orders;
CREATE POLICY "auth_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- Portfolio items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_name text NOT NULL,
  breed text NOT NULL,
  weight text NOT NULL,
  size text NOT NULL,
  note text NOT NULL,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_portfolio" ON portfolio_items;
CREATE POLICY "anon_select_portfolio" ON portfolio_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_portfolio" ON portfolio_items;
CREATE POLICY "auth_insert_portfolio" ON portfolio_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_portfolio" ON portfolio_items;
CREATE POLICY "auth_update_portfolio" ON portfolio_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_portfolio" ON portfolio_items;
CREATE POLICY "auth_delete_portfolio" ON portfolio_items FOR DELETE
  TO authenticated USING (true);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_name text NOT NULL,
  breed text NOT NULL,
  weight text NOT NULL,
  size text NOT NULL,
  review text NOT NULL,
  author text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reviews" ON reviews;
CREATE POLICY "anon_select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_reviews" ON reviews;
CREATE POLICY "auth_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_reviews" ON reviews;
CREATE POLICY "auth_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (true);

-- Settings table (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON settings;
CREATE POLICY "auth_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_settings" ON settings;
CREATE POLICY "auth_delete_settings" ON settings FOR DELETE
  TO authenticated USING (true);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('pricing', '{"baseFee":30000,"areaRatePerSqmm":0.18,"sizeScaleRate":0.04,"packagingFee":4000,"shippingFee":15000,"freeShippingThreshold":200000}'),
  ('sizes', '{"minWidth":400,"maxWidth":1200,"minDepth":350,"maxDepth":900,"minHeight":400,"maxHeight":1000}')
ON CONFLICT (key) DO NOTHING;

-- Seed sample portfolio items
INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '몽이', '비숑', '6.8kg', '720 × 520 × 580mm', '거실 소파 옆 공간에 맞춰 제작했습니다.', 1
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '몽이');

INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '콩이', '말티즈', '4.2kg', '600 × 450 × 500mm', '침실 협탁 공간에 자연스럽게 어울리도록 만들었습니다.', 2
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '콩이');

INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '보리', '푸들', '7.5kg', '740 × 540 × 620mm', '베란다 옆 햇살 좋은 자리에 맞춰 제작했습니다.', 3
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '보리');

INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '초코', '닥스훈트', '5.1kg', '680 × 400 × 480mm', '긴 몸통에 맞춰 가로를 넉넉히 설계했습니다.', 4
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '초코');

INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '하니', '포메라니안', '3.5kg', '520 × 400 × 460mm', '아파트 현관 앞 작은 공간에 딱 맞는 사이즈로 제작했습니다.', 5
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '하니');

INSERT INTO portfolio_items (dog_name, breed, weight, size, note, display_order)
SELECT '대한', '시바견', '9.2kg', '820 × 580 × 640mm', '거실 벽면 공간을 활용해 넓고 편안하게 만들었습니다.', 6
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE dog_name = '대한');

-- Seed sample reviews
INSERT INTO reviews (dog_name, breed, weight, size, review, author, display_order)
SELECT '몽이', '비숑', '6.8kg', '720 × 520 × 580mm', '소파 옆 빈 공간이 730mm밖에 안 됐는데, 720mm로 맞춰 제작해주셔서 정말 딱 맞아요. 집에 들어오는 사람마다 어디서 샀냐고 물어봅니다.', '서울 송파구 · 김OO', 1
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE dog_name = '몽이' AND author LIKE '서울 송파구%');

INSERT INTO reviews (dog_name, breed, weight, size, review, author, display_order)
SELECT '콩이', '말티즈', '4.2kg', '600 × 450 × 500mm', '기성품은 항상 너무 크거나 작았는데, 드디어 콩이 사이즈에 맞는 집을 구했어요. 원목 느낌이 인테리어랑 너무 잘 어울립니다.', '경기 고양시 · 이OO', 2
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE dog_name = '콩이' AND author LIKE '경기 고양시%');

INSERT INTO reviews (dog_name, breed, weight, size, review, author, display_order)
SELECT '보리', '푸들', '7.5kg', '740 × 540 × 620mm', '상판을 협탁처럼 쓸 수 있게 요청했는데, 진짜 사이드테이블처럼 자연스러워요. 보리도 첫날부터 금방 들어가서 잠들었어요.', '서울 마포구 · 박OO', 3
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE dog_name = '보리' AND author LIKE '서울 마포구%');

-- Index for created_at on orders
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);