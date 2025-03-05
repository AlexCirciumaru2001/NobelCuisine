/*
  # Add preparation time column to menu_items table

  1. Changes
    - Add `preparation_time` column to `menu_items` table to store preparation time in minutes
    - Set default value as 15 minutes
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'preparation_time'
  ) THEN
    ALTER TABLE menu_items 
    ADD COLUMN preparation_time integer DEFAULT 15;
  END IF;
END $$;