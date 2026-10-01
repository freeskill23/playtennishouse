/*
# Add product options and selected options to orders

1. Schema changes
- `products.options` (jsonb, nullable, default '[]'): array of option definitions.
  Each option: { id: string, name: string, values: [{ id: string, label: string, price: number }] }
  Example: [{ "id": "opt1", "name": "바닥재", "values": [{"id":"v1","label":"기본 합판","price":0},{"id":"v2","label":"소프트 쿠션","price":15000}] }]
- `orders.selected_options` (jsonb, nullable, default '[]'): array of selected option values.
  Each: { optionName: string, valueLabel: string, price: number }
2. Security
- No policy changes. Existing policies on products and orders remain intact.
3. Important notes
- No data is lost. Existing products get an empty options array by default.
- Existing orders keep null selected_options.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_options jsonb;
