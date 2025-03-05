-- Drop the view first since it depends on the table
DROP VIEW IF EXISTS extended_bookings;

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

-- Create view for extended booking information
CREATE OR REPLACE VIEW extended_bookings AS
SELECT 
  table_bookings.*,
  profiles.email as user_email,
  profiles.full_name as user_full_name,
  profiles.avatar_url as user_avatar_url
FROM table_bookings
LEFT JOIN profiles ON table_bookings.user_id = profiles.id;