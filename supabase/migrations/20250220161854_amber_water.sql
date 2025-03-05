-- Drop existing foreign key if it exists
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Add the correct foreign key relationship
ALTER TABLE orders
ADD CONSTRAINT orders_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create or replace the extended_orders view
CREATE OR REPLACE VIEW extended_orders AS
SELECT 
  orders.*,
  profiles.email as user_email,
  profiles.full_name as user_full_name,
  profiles.avatar_url as user_avatar_url
FROM orders
LEFT JOIN profiles ON orders.user_id = profiles.id;