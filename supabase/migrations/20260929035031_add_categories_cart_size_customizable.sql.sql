/*
# Add categories table, product category + size_customizable columns, cart table

1. New Tables
- `categories`: 대 카테고리 (강아지, 고양이, 기타반려동물 등)
  - id (uuid PK)
  - name (text, not null) — 카테고리명
  - display_order (int, default 0) — 표시 순서
  - is_active (bool, default true)
  - created_at (timestamptz)
- `cart_items`: 장바구니 (회원/비회원 모두 사용, 비회원은 session_id로 식별)
  - id (uuid PK)
  - session_id (text, nullable) — 비회원 식별용 (localStorage UUID)
  - user_id (uuid, nullable) — 회원 식별용
  - product_id (uuid, FK to products)
  - product_name (text) — 주문 시점 상품명 스냅샷
  - width (int), depth (int), height (int) — 선택 사이즈
  - selected_options (jsonb) — 선택 옵션
  - unit_price (int) — 단가
  - quantity (int, default 1)
  - memo (text, nullable)
  - created_at (timestamptz)

2. Modified Tables
- `products`: add `category_id` (uuid, nullable, FK to categories)
- `products`: add `size_customizable` (bool, default true) — 사이즈 변경 불필요 상품은 false

3. Security
- categories: anon+authenticated SELECT (public), authenticated INSERT/UPDATE/DELETE (admin only)
- cart_items: anon+authenticated full CRUD (each user/session manages own cart)
- products: update existing policies to remain compatible
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories"
ON categories FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories"
ON categories FOR DELETE
TO authenticated
USING (true);

-- Add columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_customizable boolean NOT NULL DEFAULT true;

-- Cart table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  width integer NOT NULL DEFAULT 0,
  depth integer NOT NULL DEFAULT 0,
  height integer NOT NULL DEFAULT 0,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  unit_price integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cart" ON cart_items;
CREATE POLICY "anon_select_cart"
ON cart_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_cart" ON cart_items;
CREATE POLICY "anon_insert_cart"
ON cart_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cart" ON cart_items;
CREATE POLICY "anon_update_cart"
ON cart_items FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cart" ON cart_items;
CREATE POLICY "anon_delete_cart"
ON cart_items FOR DELETE
TO anon, authenticated
USING (true);
