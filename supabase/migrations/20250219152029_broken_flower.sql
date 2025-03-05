-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
DROP FUNCTION IF EXISTS update_profile_avatar();

-- Create or replace function to update profile avatar_url with full URL
CREATE OR REPLACE FUNCTION update_profile_avatar()
RETURNS TRIGGER AS $$
DECLARE
  base_url text;
BEGIN
  -- Get the base URL from the current project URL
  base_url := current_setting('custom.project_url', true);
  IF base_url IS NULL THEN
    base_url := 'https://wnvjscdxrdqdxxmsryme.supabase.co';
  END IF;

  IF NEW.bucket_id = 'profiles' THEN
    UPDATE profiles
    SET avatar_url = base_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name
    WHERE id = (storage.foldername(NEW.name))[1]::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for avatar uploads
CREATE TRIGGER on_avatar_upload
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_avatar();

-- Update existing profile avatar URLs to use full URLs
UPDATE profiles
SET avatar_url = 'https://wnvjscdxrdqdxxmsryme.supabase.co/storage/v1/object/public/profiles/' || avatar_url
WHERE avatar_url IS NOT NULL 
  AND avatar_url NOT LIKE 'http%';