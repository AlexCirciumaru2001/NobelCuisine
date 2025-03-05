-- Create function to handle phone number verification
CREATE OR REPLACE FUNCTION handle_phone_verification()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm phone numbers for authenticated users
  IF NEW.phone IS NOT NULL AND NEW.phone != OLD.phone THEN
    UPDATE auth.users
    SET phone_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for phone verification
DROP TRIGGER IF EXISTS on_phone_verification ON auth.users;
CREATE TRIGGER on_phone_verification
  AFTER UPDATE OF phone ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_phone_verification();

-- Add phone number column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN phone text;
  END IF;
END $$;