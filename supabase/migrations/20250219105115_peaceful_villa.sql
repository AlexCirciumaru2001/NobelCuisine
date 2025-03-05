-- Create profiles for existing users
INSERT INTO profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Update table_bookings query to use profiles table
DROP POLICY IF EXISTS "Users can view their own bookings" ON table_bookings;
CREATE POLICY "Users can view their own bookings"
  ON table_bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  );