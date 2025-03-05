/*
  # Fix Orders Schema

  1. Changes
    - Drop and recreate orders and order_items tables with proper schema
    - Ensure proper foreign key relationship with auth.users
    - Set up correct RLS policies
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with proper schema
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  delivery_time integer,
  delivery_address jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
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

-- Create policies for order_items
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