/*
  # Fix admin policy for menu items management

  1. Security Changes
    - Update policy to use auth.jwt() instead of querying users table
    - Simplify policy logic while maintaining security
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow admin users to manage menu items" ON menu_items;

-- Create new policy using auth.jwt()
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