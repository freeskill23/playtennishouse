/*
# Fix orders table for product-based ordering flow

1. Schema changes
- `design_id`: changed from NOT NULL (no default) to nullable with default 'none'.
  The old wizard used design_id; the new product-based flow does not, so inserts
  were failing on this NOT NULL column. Making it nullable fixes the error.
- `customer_postcode`: new nullable text column for Korean 도로명 주소 우편번호.
2. Security
- No policy changes. Existing anon INSERT policy remains intact.
3. Important notes
- No data is lost. Existing rows keep their design_id values.
- New inserts that omit design_id will get 'none' as the default.
*/

ALTER TABLE orders ALTER COLUMN design_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN design_id SET DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postcode text;
