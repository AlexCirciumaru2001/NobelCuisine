/*
  # Add phone number to table bookings

  1. Changes
    - Add required phone column to table_bookings table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_bookings' AND column_name = 'phone'
  ) THEN
    ALTER TABLE table_bookings
    ADD COLUMN phone text NOT NULL DEFAULT '';
    
    -- Remove the default after adding the column
    ALTER TABLE table_bookings
    ALTER COLUMN phone DROP DEFAULT;
  END IF;
END $$;