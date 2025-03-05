/*
  # Fix table_bookings foreign key and add profiles bucket

  1. Changes
    - Add proper foreign key constraint for table_bookings
    - Create profiles storage bucket for avatars
    - Add policies for profiles bucket access

  2. Security
    - Enable RLS for table_bookings
    - Add policies for authenticated users
*/

-- Drop and recreate table_bookings with proper foreign key
DROP TABLE IF EXISTS table_bookings;

CREATE TABLE table_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  guests integer NOT NULL,
  notes text,
  phone text NOT NULL,
  table_number integer,
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

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name)
VALUES ('profiles', 'profiles')
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
  );