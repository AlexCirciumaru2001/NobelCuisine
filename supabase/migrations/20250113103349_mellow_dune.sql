/*
  # Fix User Policies and Table Relationships

  1. Changes
    - Remove recursive user policies
    - Fix orders table foreign key relationship
    - Update access policies for better performance

  2. Security
    - Maintain strict access control
    - Prevent infinite recursion
    - Ensure proper data access patterns
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Orders access policy" ON orders;
DROP POLICY IF EXISTS "Order items access policy" ON order_items;

-- Create non-recursive user data access policy
CREATE POLICY "Users can view own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

-- Update orders policy with direct user check
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

-- Update order items policy with simplified check
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

-- Fix foreign key relationship
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;