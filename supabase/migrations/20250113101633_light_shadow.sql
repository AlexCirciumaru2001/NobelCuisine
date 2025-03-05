/*
  # Add delivery information to orders

  1. Changes
    - Add delivery_time column to orders table
    - Add delivery_address JSONB column to orders table with structure:
      - street (text)
      - city (text)
      - county (text)
      - phone (text)
      - notes (text, optional)

  2. Security
    - Maintain existing RLS policies
*/

-- Add delivery information columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_time integer,
ADD COLUMN IF NOT EXISTS delivery_address jsonb;