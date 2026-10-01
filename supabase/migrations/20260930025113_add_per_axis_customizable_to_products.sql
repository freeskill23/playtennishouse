/*
# Add per-axis size customization columns to products

1. Modified Tables
- `products`: add three boolean columns to control which dimensions (width/depth/height) can be customized:
  - `customizable_width` (bool, default true) — 가로 사이즈 조절 가능 여부
  - `customizable_depth` (bool, default true) — 세로 사이즈 조절 가능 여부
  - `customizable_height` (bool, default true) — 높이 사이즈 조절 가능 여부
  When `size_customizable` is true, only axes with their respective column set to true will show a slider.

2. Security
- No new tables or policy changes. Existing product policies remain unchanged.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable_width boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable_depth boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable_height boolean NOT NULL DEFAULT true;