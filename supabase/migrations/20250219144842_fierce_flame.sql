/*
  # Fix database relationships

  1. Changes
    - Update orders table to reference profiles instead of auth.users
    - Update table_bookings to reference auth.users instead of profiles
    - Add missing foreign key relationships

  2. Security
    - Maintain existing RLS policies
    - Ensure proper cascading on delete
*/

-- Fix orders table foreign key
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Fix table_bookings foreign key
ALTER TABLE table_bookings
  DROP CONSTRAINT IF EXISTS table_bookings_user_id_fkey,
  ADD CONSTRAINT table_bookings_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Add missing join relationships
CREATE OR REPLACE VIEW extended_orders AS
SELECT 
  orders.*,
  profiles.email as user_email,
  profiles.full_name as user_full_name,
  profiles.avatar_url as user_avatar_url
FROM orders
LEFT JOIN profiles ON orders.user_id = profiles.id;

CREATE OR REPLACE VIEW extended_bookings AS
SELECT 
  table_bookings.*,
  profiles.email as user_email,
  profiles.full_name as user_full_name,
  profiles.avatar_url as user_avatar_url
FROM table_bookings
LEFT JOIN profiles ON table_bookings.user_id = profiles.id;