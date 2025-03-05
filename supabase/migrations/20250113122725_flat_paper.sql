/*
  # Add ingredients column to menu_items table

  1. Changes
    - Add JSONB array column `ingredients` to `menu_items` table
    - Set default value as empty array
    - Update existing rows to have empty array
*/

-- Add ingredients column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'ingredients'
  ) THEN
    ALTER TABLE menu_items 
    ADD COLUMN ingredients text[] DEFAULT array[]::text[];
  END IF;
END $$;