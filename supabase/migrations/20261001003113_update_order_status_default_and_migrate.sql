/*
# Update orders status default and migrate old statuses

## Changes
1. Change column default on `orders.status` from 'received' to 'payment_pending'.
2. Migrate existing rows: 'received' -> 'payment_pending', 'in_review' -> 'payment_pending'.

## Notes
- No data is lost. Old status values are remapped to the new status flow.
- The new status flow is: payment_pending -> paid -> in_production -> shipped -> completed | cancelled
*/

UPDATE orders SET status = 'payment_pending' WHERE status IN ('received', 'in_review');

ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'payment_pending';
