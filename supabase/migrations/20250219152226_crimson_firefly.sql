/*
  # Fix Profile Storage Configuration

  1. Changes
    - Recreates profiles bucket with proper configuration
    - Updates storage policies for proper access control
    - Fixes URL construction for avatars

  2. Security
    - Ensures public read access for profile pictures
    - Restricts write access to authenticated users for their own folders
*/

-- Recreate profiles bucket with proper configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Public read access for profile pictures
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
DROP FUNCTION IF EXISTS update_profile_avatar();

-- Create function to update profile avatar_url
CREATE OR REPLACE FUNCTION update_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'profiles' THEN
    UPDATE profiles
    SET avatar_url = '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name
    WHERE id = (storage.foldername(NEW.name))[1]::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for avatar uploads
CREATE TRIGGER on_avatar_upload
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_avatar();