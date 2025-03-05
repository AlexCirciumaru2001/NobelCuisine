/*
  # Fix permissions for admin operations

  1. Changes
    - Add policy for admins to view user data
    - Fix menu items policy
    - Add policy for orders table

  2. Security
    - Maintain strict access control
    - Only allow admins to access necessary user data
*/

-- Allow admins to view user data
CREATE POLICY "Allow admins to view users"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

-- Fix menu items policy
DROP POLICY IF EXISTS "Allow admin users to manage menu items" ON menu_items;

CREATE POLICY "Allow admin users to manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

-- Add policy for orders
CREATE POLICY "Allow users to view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

CREATE POLICY "Allow users to create their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Allow admins to update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );