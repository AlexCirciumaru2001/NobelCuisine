/*
  # Fix orders table foreign key relationship

  1. Changes
    - Add proper foreign key relationship between orders and auth.users
    - Update RLS policies to use proper user authentication
  
  2. Security
    - Maintain existing RLS policies with improved checks
    - Ensure proper access control for orders and order items
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Orders access policy" ON orders;
DROP POLICY IF EXISTS "Order items access policy" ON order_items;

-- Update orders table to use proper auth.users reference
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Recreate orders policy with proper auth checks
CREATE POLICY "Orders access policy"
  ON orders
  FOR ALL 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  );

-- Recreate order items policy with proper auth checks
CREATE POLICY "Order items access policy"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.email LIKE '%@admin.com'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.email LIKE '%@admin.com'
        )
      )
    )
  );