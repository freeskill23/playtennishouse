/*
# Fix orders.product_id foreign key delete rule

Problem: orders.product_id references products.id with ON DELETE NO ACTION.
When admin tries to delete a product that has orders, the foreign key
constraint blocks the deletion with "deletion failed" error.

Fix: Change the delete rule to SET NULL so that when a product is deleted,
orders referencing it have their product_id set to NULL instead of blocking.
The order record itself is preserved (product_name snapshot is already stored).
*/

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
