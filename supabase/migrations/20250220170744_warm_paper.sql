-- Drop and recreate order_items table with proper relationships
DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view their order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        auth.jwt() ->> 'email' LIKE '%@admin.com'
      )
    )
  );

CREATE POLICY "Users can create their order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create a function to ensure menu_item_id is never null
CREATE OR REPLACE FUNCTION check_menu_item_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.menu_item_id IS NULL THEN
    RAISE EXCEPTION 'menu_item_id cannot be null';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce menu_item_id not null
CREATE TRIGGER ensure_menu_item_id
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION check_menu_item_id();

-- Create view for order details
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