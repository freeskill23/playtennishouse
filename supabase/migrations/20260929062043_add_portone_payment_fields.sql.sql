/*
# Add PortOne payment fields to orders

## Changes
1. Modified Tables
   - `orders`: Add `payment_method` (text, nullable) — 'card' | 'bank_transfer' | null
   - `orders`: Add `portone_payment_id` (text, nullable) — PortOne imp_uid for card payments
   - `orders`: Add `portone_merchant_id` (text, nullable) — PortOne merchant_uid sent to PG

2. Security
   - No RLS policy changes; existing policies remain intact.
   - New columns are nullable so existing rows and bank-transfer orders are unaffected.

3. Important Notes
   - These columns support dual payment modes: bank transfer (existing) and card payment via PortOne.
   - `portone_payment_id` stores the PG transaction ID returned after successful card payment.
   - `portone_merchant_id` stores the order-specific merchant_uid sent to PortOne for reconciliation.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portone_payment_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portone_merchant_id text DEFAULT NULL;
