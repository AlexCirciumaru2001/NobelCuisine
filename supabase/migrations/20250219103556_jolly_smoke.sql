/*
  # Add table number to bookings

  1. Changes
    - Add table_number column to table_bookings if it doesn't exist
  
  2. Notes
    - Uses DO block to check for column existence before adding
    - Safe to run multiple times
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_bookings' AND column_name = 'table_number'
  ) THEN
    ALTER TABLE table_bookings
    ADD COLUMN table_number integer;
  END IF;
END $$;