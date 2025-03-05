/*
  # Add soft delete to menu items

  1. Changes
    - Add `deleted_at` timestamp column to menu_items table
    - Update RLS policies to handle soft deleted items
    - Add function to soft delete menu items

  2. Security
    - Maintain existing RLS policies
    - Add condition to exclude soft deleted items from public view
*/

-- Add deleted_at column to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Update menu items policy to exclude soft deleted items for public view
DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- Update admin policy to allow viewing all items including deleted ones
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

-- Create function to soft delete menu items
CREATE OR REPLACE FUNCTION soft_delete_menu_item(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE menu_items
  SET deleted_at = NOW()
  WHERE id = item_id;
END;
$$;