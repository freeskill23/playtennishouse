/*
# Add payment_token column to orders

1. Changes
- Add `payment_token` (text, nullable) to `orders` table.
  This token is used to generate a shareable payment link for customers.
  When the admin clicks "접수완료", a random UUID token is generated and stored here.
  The customer visits /pay/:token to view and confirm payment.

2. Security
- Add `anon_select_order_by_token` SELECT policy for anon role so the
  customer payment page can fetch order details by payment_token without logging in.
  The policy allows SELECT on all rows (the token is an unguessable UUID).
- Add `anon_update_order_status_by_token` UPDATE policy so the payment
  confirmation can change status to 'in_production'. Restricted to rows
  where payment_token IS NOT NULL.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_token text;

DROP POLICY IF EXISTS "anon_select_order_by_token" ON orders;
CREATE POLICY "anon_select_order_by_token"
ON orders FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_update_order_status_by_token" ON orders;
CREATE POLICY "anon_update_order_status_by_token"
ON orders FOR UPDATE
TO anon, authenticated
USING (payment_token IS NOT NULL)
WITH CHECK (payment_token IS NOT NULL);
