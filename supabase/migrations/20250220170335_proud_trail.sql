-- Create a new migration to fix order items and menu items relationship

-- First, ensure menu_items table has proper constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_pkey'
  ) THEN
    ALTER TABLE menu_items ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Fix order_items table constraints
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_menu_item_id_fkey 
  FOREIGN KEY (menu_item_id) 
  REFERENCES menu_items(id)
  ON DELETE RESTRICT; -- Prevent deletion of menu items that are referenced in orders

-- Create a view for order details that includes all necessary information
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id as order_id,
  o.status,
  o.total,
  o.delivery_time,
  o.delivery_address,
  o.created_at,
  o.user_id,
  oi.id as order_item_id,
  oi.quantity,
  oi.price as item_price,
  mi.id as menu_item_id,
  mi.name as menu_item_name,
  mi.price as menu_item_price,
  mi.image_url as menu_item_image,
  mi.preparation_time as menu_item_prep_time,
  p.email as user_email,
  p.full_name as user_full_name,
  p.avatar_url as user_avatar_url
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN profiles p ON o.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON order_details TO authenticated;