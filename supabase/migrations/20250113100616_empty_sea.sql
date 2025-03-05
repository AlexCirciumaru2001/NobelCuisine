/*
  # Add admin policies for menu items management

  1. Security Changes
    - Add policy for admin users to manage menu items (CRUD operations)
    - Admin users are identified by email ending with @admin.com
*/

-- Policy for admin users to manage menu items
CREATE POLICY "Allow admin users to manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  );