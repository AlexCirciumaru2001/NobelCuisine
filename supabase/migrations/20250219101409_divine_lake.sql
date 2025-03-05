/*
  # Add table bookings functionality

  1. New Tables
    - `table_bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `booking_date` (date)
      - `booking_time` (time)
      - `guests` (integer)
      - `notes` (text)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `table_bookings` table
    - Add policies for authenticated users to manage their bookings
    - Add policies for admin users to manage all bookings
*/

-- Create table_bookings table
CREATE TABLE table_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  guests integer NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for table_bookings
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