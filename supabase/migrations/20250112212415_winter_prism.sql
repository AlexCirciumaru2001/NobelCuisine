/*
  # Restaurant Database Schema

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `category` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
    - `carts`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `status` (text)
      - `created_at` (timestamp)
    - `cart_items`
      - `id` (uuid, primary key)
      - `cart_id` (uuid, references carts)
      - `menu_item_id` (uuid, references menu_items)
      - `quantity` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to carts and cart_items
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, menu_item_id)
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_items
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

-- Create policies for carts
CREATE POLICY "Allow public read access to carts"
  ON carts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to carts"
  ON carts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to carts"
  ON carts
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for cart_items
CREATE POLICY "Allow public read access to cart_items"
  ON cart_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to cart_items"
  ON cart_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to cart_items"
  ON cart_items
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to cart_items"
  ON cart_items
  FOR DELETE
  TO public
  USING (true);