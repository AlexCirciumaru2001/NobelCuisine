/*
  # Fix orders table foreign key relationship

  1. Changes
    - Drop and recreate orders table with proper foreign key relationship to auth.users
    - Ensure all existing policies are preserved
    - Add proper foreign key constraint with ON DELETE CASCADE
*/

-- Recreate orders table with proper foreign key relationship
CREATE TABLE IF NOT EXISTS orders_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  delivery_time integer,
  delivery_address jsonb,
  created_at timestamptz DEFAULT now()
);

-- Copy data if old table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    INSERT INTO orders_new (id, user_id, status, total, delivery_time, delivery_address, created_at)
    SELECT id, user_id, status, total, delivery_time, delivery_address, created_at
    FROM orders;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS orders CASCADE;
ALTER TABLE orders_new RENAME TO orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Orders access policy"
  ON orders
  FOR ALL 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

-- Recreate order_items table to ensure proper referential integrity
CREATE TABLE IF NOT EXISTS order_items_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Copy data if old table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
    INSERT INTO order_items_new (id, order_id, menu_item_id, quantity, price, created_at)
    SELECT id, order_id, menu_item_id, quantity, price, created_at
    FROM order_items;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS order_items CASCADE;
ALTER TABLE order_items_new RENAME TO order_items;

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Recreate order items policy
CREATE POLICY "Order items access policy"
  ON order_items
  FOR ALL
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        auth.jwt() ->> 'email' LIKE '%@admin.com'
      )
    )
  );