/*
  # Add user profile fields

  1. Changes
    - Add avatar_url and full_name columns to profiles table
    - Update existing profiles with default values
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS full_name text;

-- Update existing profiles with default values
UPDATE profiles
SET 
  avatar_url = NULL,
  full_name = email
WHERE 
  avatar_url IS NULL OR
  full_name IS NULL;