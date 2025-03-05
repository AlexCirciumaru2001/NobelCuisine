/*
  # Fix user permissions and access policies

  1. Changes
    - Add proper user data access policies
    - Update orders and order items policies
    - Ensure proper cascading permissions

  2. Security
    - Maintain strict access control
    - Allow users to access their own data
    - Allow admins to view necessary data
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Orders access policy" ON orders;
DROP POLICY IF EXISTS "Order items access policy" ON order_items;

-- Create comprehensive user data access policy
CREATE POLICY "Users can view own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin.com'
    )
  );

-- Update orders policy to ensure proper access
CREATE POLICY "Orders access policy"
  ON orders
  FOR ALL 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin.com'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin.com'
    )
  );

-- Update order items policy for consistency
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
        EXISTS (
          SELECT 1
          FROM auth.users
          WHERE id = auth.uid()
          AND email LIKE '%@admin.com'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users
          WHERE id = auth.uid()
          AND email LIKE '%@admin.com'
        )
      )
    )
  );

-- Ensure proper cascading permissions
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;