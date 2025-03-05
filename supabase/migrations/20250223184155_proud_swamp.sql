-- Add NOT NULL constraint to menu_item_id in order_items
ALTER TABLE order_items 
ALTER COLUMN menu_item_id SET NOT NULL;

-- Create a trigger to validate menu_item_id before insert/update
CREATE OR REPLACE FUNCTION validate_order_item()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if menu_item_id exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM menu_items 
    WHERE id = NEW.menu_item_id 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid menu_item_id or item has been deleted';
  END IF;

  -- Set price from menu item if not provided
  IF NEW.price IS NULL OR NEW.price <= 0 THEN
    SELECT price INTO NEW.price
    FROM menu_items
    WHERE id = NEW.menu_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS order_item_validation ON order_items;

-- Create trigger
CREATE TRIGGER order_item_validation
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_item();

-- Add check constraint for positive quantity
ALTER TABLE order_items
ADD CONSTRAINT positive_quantity CHECK (quantity > 0);

-- Add check constraint for positive price
ALTER TABLE order_items
ADD CONSTRAINT positive_price CHECK (price > 0);

-- Create a function to safely delete menu items
CREATE OR REPLACE FUNCTION safe_delete_menu_item(item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the item is used in any active orders
  IF EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.menu_item_id = item_id
    AND o.status NOT IN ('completed', 'cancelled')
  ) THEN
    RETURN false;
  END IF;

  -- Soft delete the item
  UPDATE menu_items
  SET deleted_at = NOW()
  WHERE id = item_id;

  RETURN true;
END;
$$;