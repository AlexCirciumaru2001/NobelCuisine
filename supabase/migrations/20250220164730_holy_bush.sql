-- Create a view that includes the products summary
CREATE OR REPLACE VIEW orders_with_summary AS
SELECT 
  orders.*,
  (
    SELECT string_agg(
      order_items.quantity || 'x ' || menu_items.name,
      ', '
    )
    FROM order_items
    JOIN menu_items ON menu_items.id = order_items.menu_item_id
    WHERE order_items.order_id = orders.id
  ) as products_summary
FROM orders;

-- Grant access to the view
GRANT SELECT ON orders_with_summary TO authenticated;