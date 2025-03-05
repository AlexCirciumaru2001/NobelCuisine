/*
  # Table Bookings System

  1. Changes
    - Add table_number column to table_bookings
    - Add phone column if not exists
    - Update RLS policies

  2. Security
    - Enable RLS
    - Add policies for user and admin access
*/

-- Add table_number column if it doesn't exist
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

-- Add phone column if it doesn't exist
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

-- Update or create policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON table_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON table_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON table_bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON table_bookings;

CREATE POLICY "Users can view their own bookings"
  ON table_bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

CREATE POLICY "Users can create their own bookings"
  ON table_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own bookings"
  ON table_bookings
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

CREATE POLICY "Users can delete their own bookings"
  ON table_bookings
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );