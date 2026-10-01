/*
# Switch from single category_id to multi-category via junction table

1. New Tables
- `product_categories`: junction table for many-to-many product↔category
  - id (uuid PK)
  - product_id (uuid, FK to products, ON DELETE CASCADE)
  - category_id (uuid, FK to categories, ON DELETE CASCADE)
  - UNIQUE(product_id, category_id) to prevent duplicates

2. Data Migration
- Copy existing products.category_id values into product_categories rows

3. Security
- product_categories: anon+authenticated SELECT (public), authenticated INSERT/UPDATE/DELETE (admin)
*/

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_product_categories" ON product_categories;
CREATE POLICY "anon_select_product_categories"
ON product_categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_product_categories" ON product_categories;
CREATE POLICY "auth_insert_product_categories"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_product_categories" ON product_categories;
CREATE POLICY "auth_delete_product_categories"
ON product_categories FOR DELETE
TO authenticated
USING (true);

-- Migrate existing category_id data
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
